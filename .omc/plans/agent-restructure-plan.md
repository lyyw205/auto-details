# 에이전트 시스템 전면 재설계 계획 (v2)

> 최종 수정: 2026-02-19
> 변경 이력: v1 → v2 → v3
>   v2: JSON-first 위젯 아키텍처 + 클라이언트 렌더러 + Figma 변환 최소화
>   v3: Validator 전면 재설계 — 매핑 정확도 검증 + 파이프라인 전 단계 검증

---

## 1. 현재 구조 진단

### AS-IS: 2 에이전트 + 7 스킬 (모놀리식)

```
/ref-to-widgets (에이전트)
  └── map-reference → [유저 편집] → register-widgets

/product-to-html (에이전트)
  └── plan-sections → [유저 확인] → select-widgets → [유저 선택] → generate-html
                                                                      ↓ (선택)
                                                            generate-figma-make-prompt (v1/v2)
```

### 핵심 문제점

| # | 문제 | 영향 |
|---|------|------|
| 1 | **역할 과적재** — 에이전트 2개가 모든 책임을 짊어짐 | 디버깅 어려움, 개별 단계 재실행 불가 |
| 2 | **검증 부재** — generate-html의 17개 체크리스트가 수동 | 품질 불일치, 에러 누적 |
| 3 | **위젯 커버리지 39%** — 23개 taxonomy 중 9개만 위젯 보유 | 14개 섹션이 폴백 의존, 품질 저하 |
| 4 | **유사도 공식 불일치** — register-widgets vs gallery 서버 | 중복 판정 결과 다름 |
| 5 | **레거시 참조** — `/extract-widgets` 등 존재하지 않는 스킬 참조 | 혼란 유발 |
| 6 | **수동 단계 과다** — mapping 결과 복사, Figma v1/v2 선택 등 | 워크플로우 단절 |
| 7 | **부분 재생성 불가** — 개별 위젯 교체 시 전체 재조합 필요 | 반복 작업 낭비 |
| 8 | **위젯 포맷이 HTML** — Figma 프롬프트 생성 시 HTML 역파싱 필요 (4회 변환) | 매핑 정확도 손실 |
| 9 | **렌더링 시 미세 변형** — bounds-to-widget.ts에서 padding/gap 추가로 2-5px 드리프트 | 95%+ 오버레이 정확도 미달 |

---

## 2. 핵심 아키텍처 변경: JSON-first 위젯 시스템

### 설계 원칙

1. **JSON이 Single Source of Truth** — 모든 위젯 데이터는 `.widget.json`에 저장
2. **HTML은 프리뷰 전용** — JSON에서 실시간 렌더링, HTML에서 데이터를 역추출하지 않음
3. **Figma 변환 최소화** — JSON → 프롬프트 직접 변환 (4회 → 1회)
4. **매핑 좌표 무변형** — 정렬/스냅/패딩 없이 원본 % 좌표 그대로 보존

### 포맷 전환: `.widget.html` → `.widget.json`

AS-IS (HTML-first):
```
Gemini [0-1000] → Bound JSON [0-100%] → .widget.html (px 변환+padding) → HTML 조합 → Figma 역파싱
                                                                            4회 변환, 매 단계 손실
```

TO-BE (JSON-first):
```
Gemini [0-1000] → .widget.json [0-100% 원본 보존]
                        │
                        ├→ 갤러리 웹 UI (클라이언트 렌더러로 실시간 프리뷰)
                        ├→ 최종 HTML 생성 (클라이언트 렌더러 동일 로직)
                        └→ Figma 프롬프트 (JSON에서 직접 변환, 1회)
```

### `.widget.json` 포맷 정의

```json
{
  "widget_id": "hook--ref-reference3",
  "taxonomy_id": "Hook",
  "category": "intro",
  "theme": "dark",
  "style_tags": ["내추럴", "우드톤", "따뜻한"],
  "provenance": {
    "source_ref": "ref-reference3",
    "extracted_date": "2026-02-11"
  },
  "status": "new",

  "canvas": {
    "width": 860,
    "height": 700
  },

  "elements": [
    {
      "id": "bg-1",
      "type": "background",
      "label": "배경",
      "x": 0, "y": 0, "w": 100, "h": 100,
      "zIndex": 0,
      "style": { "bgColor": "#1A1410" }
    },
    {
      "id": "text-1",
      "type": "text",
      "label": "메인 카피",
      "x": 15.5, "y": 8.2, "w": 69.0, "h": 5.3,
      "zIndex": 2,
      "content": "[메인 카피]",
      "style": {
        "fontSize": "40px",
        "fontWeight": "bold",
        "color": "#C8A87C",
        "textAlign": "center"
      }
    },
    {
      "id": "img-1",
      "type": "image",
      "label": "제품 이미지",
      "x": 10, "y": 25, "w": 80, "h": 60,
      "zIndex": 1,
      "placeholder": {
        "ai_prompt": "제품 히어로샷, 정면",
        "ai_style": "product_hero"
      }
    }
  ],

  "figma_hints": {
    "layout_structure": "풀블리드 배경 위 중앙 정렬 텍스트 + 하단 제품 이미지",
    "key_elements": ["풀블리드 배경 이미지", "메인 카피", "서브 카피", "제품 히어로"]
  },

  "sample_data": {
    "[메인 카피]": "자연의 온기를 담다",
    "[제품 이미지]": "product-hero.jpg"
  }
}
```

### 클라이언트 사이드 렌더러 (옵션 B)

```
갤러리 웹 UI (React 컴포넌트)
  ├── WidgetRenderer.tsx     — JSON → Canvas/DOM 실시간 렌더링
  │   ├── 원본 % 좌표 그대로 position: absolute 배치
  │   ├── padding/gap 추가하지 않음 (매핑 정확도 95%+ 보장)
  │   └── sample_data 적용 모드 (데모 프리뷰)
  │
  ├── WidgetEditor.tsx       — 인터랙티브 편집 (이동/리사이즈/속성)
  └── WidgetExporter.tsx     — JSON → 최종 HTML 생성 (동일 렌더 로직)
```

**핵심**: 갤러리 프리뷰와 최종 HTML 생성이 **동일한 렌더링 로직**을 사용하므로 "미리보기 ≠ 결과물" 문제가 발생하지 않음.

기존 `mapping/` 웹앱이 이미 React + 캔버스 기반 인터랙션을 구현하고 있으므로, 렌더러 컴포넌트를 공유 모듈로 분리하여 갤러리에서도 재사용.

---

## 3. TO-BE: 5 에이전트 + 재설계된 스킬 체계

### 에이전트 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│                    /team auto-details                            │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐│
│  │ Analyzer │→│ Builder  │→│ Planner  │→│   Composer       ││
│  │ (분석가)  │  │ (빌더)   │  │ (설계자)  │  │   (조합기)       ││
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └───────┬──────────┘│
│       │             │             │                 │           │
│       └─────────────┴─────────────┴─────────────────┘           │
│                           │                                     │
│                    ┌──────┴──────┐                               │
│                    │  Validator  │                               │
│                    │  (검증기)    │                               │
│                    └─────────────┘                               │
└─────────────────────────────────────────────────────────────────┘
```

### 에이전트별 역할 정의

#### 1. Analyzer (분석가) — 레퍼런스 분석 전문

| 항목 | 내용 |
|------|------|
| **역할** | 레퍼런스 이미지를 분석하여 원본 좌표 그대로의 매핑 데이터 생성 |
| **OMC 에이전트 타입** | `explorer` (haiku) + `analyst` (opus) |
| **담당 스킬** | `/map-reference` (개선), `/scrape-reference` (신규) |
| **입력** | Behance URL 또는 레퍼런스 이미지 |
| **출력** | `output/mapping-{name}.json` (Bound 배열 + 스타일 정보) |

**개선사항:**
- Behance 스크래핑을 스킬로 승격 (현재 tools/ CLI → 에이전트에서 직접 호출)
- HF_TOKEN 없을 때 명시적 경고 + Pass 1 결과만으로 진행 확인
- 매핑 결과 → output/ 자동 저장 (수동 복사 제거)
- ~~output/mapping-{name}.html~~ 오버레이 HTML은 매핑 웹앱에서 실시간 렌더링 (파일 생성 불필요)

#### 2. Builder (빌더) — 위젯 생성/등록 전문

| 항목 | 내용 |
|------|------|
| **역할** | 매핑 데이터에서 **JSON 위젯**을 생성하고 레지스트리에 등록 |
| **OMC 에이전트 타입** | `executor` (sonnet) |
| **담당 스킬** | `/build-widgets` (개선), `/expand-library` (신규) |
| **입력** | 매핑 JSON, taxonomy, 스타일 프리셋 |
| **출력** | **`.widget.json`** 파일들, `_registry.json` 업데이트, 프리셋 JSON |

**개선사항:**
- **`.widget.html` → `.widget.json` 전환** — 매핑 좌표(%)를 그대로 보존, HTML 변환 없음
- 유사도 공식 통일: gallery 서버와 동일한 `(Jaccard×0.5) + (composition×0.3) + (theme×0.2)`
- `/expand-library` 신규 스킬: 커버리지 낮은 taxonomy 식별 → 기존 위젯 변형으로 자동 확장
- 레거시 참조 `/extract-widgets` 제거, `/build-widgets`로 명칭 통일
- 위젯 생성 시 `sample_data` + `figma_hints` 자동 포함

#### 3. Planner (설계자) — 섹션 설계/위젯 선택 전문

| 항목 | 내용 |
|------|------|
| **역할** | 제품 정보 분석 → 섹션 구조 설계 → 최적 위젯 매칭 |
| **OMC 에이전트 타입** | `planner` (opus) |
| **담당 스킬** | `/plan-sections` (개선), `/select-widgets` (개선) |
| **입력** | 제품 정보, 스타일 선호, 위젯 레지스트리 |
| **출력** | `section-plan.json`, `widget-selection.json` |

**개선사항:**
- 제품 카테고리별 추천 섹션 자동 매핑 로직 추가 (현재 테이블만 존재)
- FeatureDetail 반복 횟수를 핵심 기능 수에서 자동 산출 (`min(기능수, 8)`)
- select-widgets: 인접 섹션 theme 중복 방지 검증 추가
- 소스 일관성 보너스를 순서 독립적으로 개선 (전체 후보 사전 스캔)
- 커버리지 리포트 출력: "위젯 있는 섹션 N개 / 폴백 섹션 M개"

#### 4. Composer (조합기) — 조합/출력 전문

| 항목 | 내용 |
|------|------|
| **역할** | 선택된 JSON 위젯 조합 → 컬러 리매핑 → 콘텐츠 치환 → HTML/Figma 출력 |
| **OMC 에이전트 타입** | `executor` (sonnet) |
| **담당 스킬** | `/compose-page` (generate-html 대체), `/generate-figma-prompt` (v1/v2 통합), `/patch-section` (신규) |
| **입력** | widget-selection.json (`.widget.json` 참조), 제품 정보, 제품 이미지 |
| **출력** | `{product}-detail.html`, `{product}-figma-prompt.md` |

**개선사항:**
- **JSON 위젯에서 직접 조합** — `.widget.json`의 elements 배열을 읽어 렌더링 (HTML 파싱 불필요)
- 컬러 리매핑: JSON의 style 필드를 직접 수정 → 렌더링 (hex 문자열 치환 위험 제거)
- **Figma 프롬프트 직접 생성**: `.widget.json`의 elements + figma_hints에서 바로 프롬프트 변환 (HTML 역파싱 제거)
- `/patch-section` 신규 스킬: JSON 필드 수정 → 해당 섹션만 재렌더링
- 이미지 매핑에 정량적 기준 추가 (라벨 유사도 + 이미지 종류 매칭)

#### 5. Validator (검증기) — 파이프라인 전 단계 품질 게이트

| 항목 | 내용 |
|------|------|
| **역할** | **모든 에이전트 산출물의 즉시 검증** — 매핑 정확도부터 최종 HTML까지 |
| **OMC 에이전트 타입** | `verifier` (sonnet), Vision AI 대조 시 `vision` (sonnet) 병행 |
| **담당 스킬** | `/validate-mapping` (신규, 최우선), `/validate-widgets` (신규), `/validate-output` (신규), `/coverage-report` (신규) |
| **입력** | 각 단계의 산출물 + 원본 레퍼런스 이미지 (매핑 검증 시) |
| **출력** | 검증 리포트 (pass/fail + 요소별 점수 + 수정 제안) |

**검증 위치 — 끝이 아닌 매 단계:**
```
Analyzer → [Validator] → Builder → [Validator] → Planner → Composer → [Validator]
             매핑 정확도    위젯 품질                         최종 산출물
             (가장 중요)
```

##### 스킬 1: `/validate-mapping` (신규, 최우선)

매핑 JSON이 레퍼런스 이미지와 얼마나 일치하는지 정량적 검증.

**실행 시점**: Analyzer 완료 직후, 유저 편집 전
**통과 기준**: 전체 정확도 95%+ 이고 `mismatch` 0개

**검증 3단계:**

```
Step 1: 구조 검증 (자동, 즉시)
  - 모든 바운드가 캔버스 범위 내 (x+w ≤ 100, y+h ≤ 100)
  - 바운드 간 비정상 겹침 감지 (같은 zIndex에서 90%+ 겹침 = 중복 의심)
  - 최소 크기 검증 (w < 1% 또는 h < 0.5% = 노이즈 의심)
  - 타입별 비율 검증 (text인데 w > 90%이면 container 의심)

Step 2: Vision AI 대조 검증 (핵심)
  - 매핑 JSON을 레퍼런스 이미지 위에 오버레이한 이미지 생성
  - 원본 레퍼런스 + 오버레이 이미지를 Vision AI에 전달
  - 요소별 정확도 판정:
    ✅ 정확 (95%+): 바운드가 요소를 정밀하게 감싸고 있음
    ⚠️ 부분 일치 (70-95%): 방향은 맞지만 크기/위치 오차
    ❌ 불일치 (<70%): 영역이 크게 벗어나거나 빈 공간을 포함
    ❓ 누락: 이미지에 보이는데 바운드가 없는 요소

Step 3: 요소별 리포트 출력
  - 전체 정확도 점수 (0-100%)
  - 요소별 판정 + 수정 제안 (좌표 보정 방향 포함)
  - 95% 미달 시 유저에게 수동 보정 필요 영역 안내
```

**출력 포맷:**
```json
{
  "overall_accuracy": 87,
  "total_elements": 15,
  "accurate": 11,
  "partial": 2,
  "mismatch": 1,
  "missed": 1,
  "details": [
    { "id": "text-1", "label": "메인 카피", "verdict": "accurate", "score": 98 },
    { "id": "img-2", "label": "제품 이미지", "verdict": "partial", "score": 82,
      "suggestion": "하단 경계를 3% 아래로 확장 필요" },
    { "id": "btn-1", "label": "CTA 버튼", "verdict": "mismatch", "score": 45,
      "suggestion": "버튼이 아닌 텍스트 영역으로 재분류 필요" },
    { "missed": true, "description": "좌측 하단 아이콘 3개 미감지" }
  ],
  "pass": false,
  "threshold": 95
}
```

##### 스킬 2: `/validate-widgets`

JSON 위젯의 구조적 정합성 검증.

**실행 시점**: Builder 완료 직후

```
JSON 스키마 검증:
  - 필수 필드 존재 (widget_id, taxonomy_id, category, elements, canvas)
  - elements 배열 비어있지 않음
  - 모든 element에 id, type, x, y, w, h 존재

좌표 무결성:
  - 모든 좌표가 0-100% 범위 내
  - 원본 매핑 JSON의 좌표와 .widget.json의 좌표 100% 일치 (변형 없음 확인)
  - canvas.width = 860 확인

메타데이터 정합성:
  - taxonomy_id가 section-taxonomy.json에 존재
  - source_ref에 해당하는 프리셋 존재
  - figma_hints 필드가 비어있지 않음
  - sample_data의 키가 elements의 content placeholder와 매칭

중복 감지:
  - 통일된 유사도 공식 (Jaccard×0.5 + composition×0.3 + theme×0.2)
  - 임계값 0.7 이상이면 중복 후보로 플래그
```

##### 스킬 3: `/validate-output`

최종 HTML의 17개 체크리스트 프로그래매틱 검증.

**실행 시점**: Composer 완료 직후

```
구조 검증:
  - 860px page-canvas 존재
  - 섹션 수가 widget-selection.json과 일치
  - 각 섹션에 id 속성 존재

스타일 검증:
  - CSS 변수 (--brand-main, --accent) 정의 + 실제 사용
  - Tailwind CDN 포함
  - Pretendard 폰트 로드

콘텐츠 검증:
  - [placeholder] 패턴이 남아있지 않음 (모두 실제 텍스트로 치환)
  - img-placeholder에 data-ai-prompt 속성 존재
  - 빈 섹션 없음

호환성 검증:
  - 인라인 스타일만 사용 (외부 CSS 참조 없음, CDN 제외)
  - position: fixed/sticky 미사용
  - html.to.design 호환 구조
```

##### 스킬 4: `/coverage-report`

taxonomy별 위젯 커버리지, 스타일 다양성, 소스 분포 리포트.

**실행 시점**: 온디맨드 또는 Pipeline C 시작 시

---

## 4. 재설계된 파이프라인

### Pipeline A: 레퍼런스 → 위젯 라이브러리

```
[Behance URL / 이미지]
        │
        ▼
  ┌─ Analyzer ─────────────────────────┐
  │  /scrape-reference (신규)           │
  │    → references/{name}.png         │
  │  /map-reference (개선)              │
  │    → output/mapping-{name}.json    │
  │    (오버레이 프리뷰는 웹앱에서 실시간)│
  └────────────┬───────────────────────┘
               │
               ▼
  ┌─ Validator ────────────────────────┐  ★ 매핑 직후 검증 (신규)
  │  /validate-mapping                  │
  │    → 구조 검증 (좌표 범위, 겹침, 노이즈)│
  │    → Vision AI 대조 (오버레이 정확도) │
  │    → 요소별 리포트 + 전체 정확도 점수 │
  │                                     │
  │  95%+ & mismatch=0 → PASS           │
  │  미달 → 문제 요소 리포트             │
  │         → Analyzer 재실행            │
  │         또는 유저 수동 보정 안내       │
  └────────────┬───────────────────────┘
               │ PASS
               ▼
         [유저 편집/검수] (매핑 웹앱)
               │
               ▼
  ┌─ Builder ──────────────────────────┐
  │  /build-widgets (register 통합)     │
  │    → widgets/**/*.widget.json  ★   │
  │    → widgets/_presets/*.json        │
  │    → widgets/_registry.json        │
  └────────────┬───────────────────────┘
               │
               ▼
  ┌─ Validator ────────────────────────┐  ★ 위젯 품질 검증
  │  /validate-widgets                  │
  │    → JSON 스키마 검증               │
  │    → 좌표 무변형 확인 (원본 매핑 대조)│
  │    → 메타데이터 정합성               │
  │    → 중복 감지 리포트               │
  │  /coverage-report                   │
  │    → taxonomy 커버리지 현황          │
  └────────────────────────────────────┘
```

### Pipeline B: 제품 → 상세페이지

```
[제품 정보]
     │
     ▼
  ┌─ Planner ──────────────────────────┐
  │  /plan-sections (개선)              │
  │    → {product}-section-plan.json   │
  │  [유저 확인]                        │
  │  /select-widgets (개선)             │
  │    → {product}-widget-selection.json│
  │  [유저 선택 — BLOCKING]             │
  └────────────┬───────────────────────┘
               │
               ▼
  ┌─ Composer ─────────────────────────┐
  │  /compose-page  ★                  │
  │    → .widget.json 읽기 (HTML 파싱 X)│
  │    → 컬러 리매핑 (JSON 필드 직접 수정)│
  │    → 콘텐츠 치환 (placeholder 교체) │
  │    → 클라이언트 렌더러로 HTML 생성  │
  │    → {product}-detail.html         │
  │  /generate-figma-prompt  ★          │
  │    → JSON에서 직접 프롬프트 변환    │
  │    → {product}-figma-prompt.md     │
  └────────────┬───────────────────────┘
               │
               ▼
  ┌─ Validator ────────────────────────┐
  │  /validate-output                   │
  │    → 17개 체크리스트 자동 검증      │
  │    → FAIL 시 Composer에 수정 요청   │
  └────────────────────────────────────┘
```

### Pipeline C: 위젯 라이브러리 확장 (신규)

```
  ┌─ Validator ────────────────────────┐
  │  /coverage-report                   │
  │    → 미커버 14개 섹션 식별          │
  │    → 스타일 다양성 부족 영역 식별   │
  └────────────┬───────────────────────┘
               │
               ▼
  ┌─ Builder ──────────────────────────┐
  │  /expand-library (신규)             │
  │    → 기존 위젯 변형으로 갭 메우기   │
  │    → 테마 변형 (light↔dark)        │
  │    → composition 변형              │
  │    → .widget.json으로 생성          │
  └────────────┬───────────────────────┘
               │
               ▼
  ┌─ Validator ────────────────────────┐
  │  /validate-widgets + /coverage-report│
  │    → 확장 결과 검증                 │
  └────────────────────────────────────┘
```

---

## 5. 파일 구조 변경

### AS-IS
```
widgets/
  _registry.json
  _presets/*.json
  {taxonomy_id}/*.widget.html    ← HTML 파일

agents/
  ref-to-widgets.md
  product-to-html.md

skills/
  map-reference.skill.md
  register-widgets.skill.md
  plan-sections.skill.md
  select-widgets.skill.md
  generate-html.skill.md
  generate-figma-make-prompt.skill.md
  generate-figma-make-prompt-v2.skill.md
```

### TO-BE
```
widgets/
  _registry.json                     (스키마 업데이트: file 필드 .json으로)
  _presets/*.json                    (유지)
  {taxonomy_id}/*.widget.json    ★  JSON 위젯 파일

lib/
  widget-renderer/                ★  공유 렌더러 모듈 (신규)
    renderer.ts                      JSON → HTML 변환 순수 함수
    types.ts                         WidgetJSON 타입 정의
    index.ts                         export

agents/
  analyzer.md                        (분석가 — 레퍼런스 분석)
  builder.md                         (빌더 — JSON 위젯 생성/등록)
  planner.md                         (설계자 — 섹션 설계/위젯 선택)
  composer.md                        (조합기 — JSON 조합/출력)
  validator.md                       (검증기 — 품질 보증)
  _archive/                          기존 에이전트 보존
    ref-to-widgets.md
    product-to-html.md

skills/
  # 개선
  map-reference.skill.md             (개선: 자동 저장, HF 경고, 오버레이 HTML 파일 생성 제거)
  build-widgets.skill.md             (register-widgets 대체: .widget.json 생성)
  plan-sections.skill.md             (개선: 자동 매핑, FeatureDetail 산출)
  select-widgets.skill.md            (개선: theme 중복 방지, 순서 독립)
  compose-page.skill.md          ★  (generate-html 대체: JSON에서 직접 렌더링)
  generate-figma-prompt.skill.md ★  (v1/v2 통합: JSON에서 직접 프롬프트)

  # 신규
  scrape-reference.skill.md          (Behance 스크래핑 스킬화)
  expand-library.skill.md            (위젯 라이브러리 자동 확장)
  patch-section.skill.md             (JSON 필드 수정 → 부분 재렌더링)
  validate-mapping.skill.md      ★  (매핑 정확도 검증 — Vision AI 대조, 최우선)
  validate-output.skill.md           (최종 HTML 자동 검증)
  validate-widgets.skill.md          (JSON 위젯 스키마/좌표 검증)
  coverage-report.skill.md           (커버리지 리포트)

  # 삭제
  (삭제) register-widgets.skill.md             → build-widgets로 대체
  (삭제) generate-html.skill.md                → compose-page로 대체
  (삭제) generate-figma-make-prompt.skill.md   → generate-figma-prompt로 통합
  (삭제) generate-figma-make-prompt-v2.skill.md → generate-figma-prompt로 통합

  # 유지
  section-taxonomy.json              (변경 없음)
```

---

## 6. 갤러리 웹 UI 개편

### AS-IS
```
tools/gallery/
  server.js    — .widget.html 파일을 직접 읽어 iframe으로 미리보기
  index.html   — 단일 HTML UI
```

### TO-BE
```
tools/gallery/
  server.js    — .widget.json 파일 서빙 API (JSON 그대로 전달)
  src/
    App.tsx              — React 앱 (Vite 또는 inline)
    WidgetRenderer.tsx   — JSON → DOM 실시간 렌더링 (lib/widget-renderer 사용)
    WidgetPreview.tsx    — 프리뷰 컨테이너 (데모 모드, 오버레이 모드)
    WidgetList.tsx       — 위젯 목록/검수/중복 해결
```

**갤러리 렌더러 핵심 규칙:**
- `position: absolute` + `%` 좌표 그대로 배치 (padding/gap 추가 금지)
- 렌더링 결과가 레퍼런스 이미지 위에 95%+ 겹쳐야 함
- 동일 렌더러를 `compose-page` 스킬에서도 사용 (HTML 생성 시)

---

## 7. /team 실행 구성

### Team 생성 스펙

```
Team Name: auto-details
Team Size: 5 에이전트 (동시 실행은 파이프라인별 2-3개)

에이전트 매핑:
  analyzer  → Task(subagent_type="oh-my-claudecode:executor", model="sonnet")
  builder   → Task(subagent_type="oh-my-claudecode:executor", model="sonnet")
  planner   → Task(subagent_type="oh-my-claudecode:planner", model="opus")
  composer  → Task(subagent_type="oh-my-claudecode:executor", model="sonnet")
  validator → Task(subagent_type="oh-my-claudecode:verifier", model="sonnet")
```

### 파이프라인별 동시 실행 패턴

```
Pipeline A (레퍼런스 → 위젯):
  Stage 1: [analyzer]                    (직렬)
  Stage 2: [validator] validate-mapping  (직렬, analyzer 완료 후) ★
  Stage 3: [유저 편집/검수]              (Stage 2 PASS 후)
  Stage 4: [builder]                     (직렬, 유저 편집 완료 후)
  Stage 5: [validator] validate-widgets  (직렬, builder 완료 후)

Pipeline B (제품 → 상세페이지):
  Stage 1: [planner]                     (직렬)
  Stage 2: [composer]                    (직렬, planner 완료 후)
  Stage 3: [validator]                   (직렬, composer 완료 후)
  Stage 4: [composer] (수정)             (validator FAIL 시 루프)

Pipeline C (라이브러리 확장):
  Stage 1: [validator] coverage-report   (직렬)
  Stage 2: [builder] expand-library      (직렬)
  Stage 3: [validator] validate          (직렬)

병렬 가능 조합:
  Pipeline A + Pipeline B 동시 실행 가능 (독립)
  Pipeline C는 A 완료 후 실행 권장
```

---

## 8. 구현 순서 (5단계)

### Phase 0: JSON-first 기반 구축 (신규 — 가장 먼저)
1. `.widget.json` 스키마 정의 (TypeScript 타입 + JSON Schema)
2. `lib/widget-renderer/` 공유 렌더러 모듈 개발
   - `renderer.ts`: JSON → HTML 순수 함수 (padding/gap 없는 faithful 렌더링)
   - 기존 `bounds-to-widget.ts` 로직 리팩터링 (HTML 직접 생성 → JSON 생성으로)
3. 기존 `.widget.html` 21개 → `.widget.json` 마이그레이션 스크립트
   - WIDGET_META 주석 파싱 + HTML 구조 분석 → JSON 변환
4. `_registry.json` 스키마 업데이트 (file 필드: `.widget.html` → `.widget.json`)
5. 갤러리 서버 API 업데이트 (JSON 서빙 + 클라이언트 렌더러 통합)

### Phase 1: 기반 정리 (레거시 제거 + 에이전트 구조)
6. `register-widgets.skill.md`에서 `/extract-widgets` 레거시 참조 제거
7. 유사도 공식 통일 (`gallery/server.js` 기준으로)
8. 새 파일 구조 생성 (`agents/` 5개 에이전트 파일)
9. CLAUDE.md 에이전트/스킬 테이블 업데이트

### Phase 2: 핵심 스킬 개선
10. `register-widgets` → `build-widgets` 리네이밍 (출력을 .widget.json으로)
11. `generate-html` → `compose-page` 전환 (JSON 위젯에서 직접 렌더링)
12. `generate-figma-make-prompt` v1/v2 → `generate-figma-prompt` 통합 (JSON 직접 변환)
13. `map-reference` 자동 저장 + HF 경고 + 오버레이 HTML 파일 생성 제거
14. `plan-sections` 자동 매핑 로직 + FeatureDetail 산출
15. `select-widgets` theme 중복 방지 + 순서 독립 스코어링

### Phase 3: 신규 스킬 추가
16. `/scrape-reference` 스킬 생성 (tools/scraper CLI → 스킬)
17. `/validate-mapping` 스킬 생성 ★ (매핑 정확도 검증 — 구조 검증 + Vision AI 대조)
18. `/validate-widgets` 스킬 생성 (JSON 스키마/좌표 무변형 검증)
19. `/validate-output` 스킬 생성 (17개 체크리스트 자동화)
20. `/coverage-report` 스킬 생성 (커버리지 리포팅)
21. `/patch-section` 스킬 생성 (JSON 필드 수정 → 부분 재렌더링)
22. `/expand-library` 스킬 생성 (위젯 자동 확장)

### Phase 4: 통합 + 검증
23. `/team` 파이프라인 테스트 (Pipeline A — validate-mapping 포함)
24. `/team` 파이프라인 테스트 (Pipeline B — validate-output 포함)
25. `/team` Pipeline C로 위젯 커버리지 39% → 70%+ 확장
26. 기존 에이전트를 `agents/_archive/`로 이동
27. 기존 `.widget.html` 파일 삭제 (JSON 마이그레이션 검증 후)

---

## 9. Figma 변환 파이프라인 비교

### AS-IS (4회 변환)
```
Gemini box_2d [0-1000]
  → ① Bound JSON [0-100%]
    → ② .widget.html (px 변환 + padding/gap 추가)
      → ③ detail.html (문자열 연결 + 컬러 치환)
        → ④ Figma 프롬프트 (HTML 역파싱 → 자연어)
```

### TO-BE (1회 변환)
```
Gemini box_2d [0-1000]
  → .widget.json [0-100% 원본 보존]
    → ① Figma 프롬프트 (elements + figma_hints → 자연어)
```

**정확도 이득**: 변환 3회 제거 → px 반올림, padding 드리프트, HTML 역파싱 모호성 전부 제거

---

## 10. 마이그레이션 전략

### 점진적 전환
- **Phase 0 완료**까지 기존 `.widget.html` + 에이전트 유지 (병행 운영)
- Phase 0 완료 후 JSON 위젯으로 전환, Phase 1-2에서 새 에이전트 도입
- Phase 4에서 기존 에이전트/HTML 위젯 아카이브

### 기존 위젯 마이그레이션
- 21개 `.widget.html` → `.widget.json` 자동 변환 스크립트 (Phase 0-③)
- 변환 후 갤러리에서 렌더링 결과를 기존 HTML과 시각 비교 검증
- 검증 통과 후 `.widget.html` 삭제

### 호환성
- 기존 output/ 파일 포맷 유지 (section-plan.json, widget-selection.json, detail.html)
- `_registry.json` 버전 3.0으로 업그레이드 (file 필드 확장자 변경)
- CLAUDE.md의 스킬 테이블은 Phase 1에서 즉시 업데이트

### 롤백 계획
- 각 Phase는 독립적 커밋
- Phase N 실패 시 Phase N-1로 롤백 가능
- 기존 에이전트/HTML 위젯은 `_archive/`에 보존 (삭제하지 않음)
