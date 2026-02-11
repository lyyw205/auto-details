# 피그마 에이전트 프로젝트 컨텍스트

## 프로젝트 개요
AI 기반 상세페이지 자동 제작 시스템. 텍스트 초안 → 레이아웃 JSON 생성 → Figma 적용까지 자동화.

---

## 중요: 템플릿 시스템

### 기본 템플릿 (기준)

**기본 상세페이지는 크래프트볼트 상세페이지를 기준으로 진행합니다.**

- 기준 파일: `크래프트볼트/craftvolt-chainsaw-v3-final.json`
- 레거시 템플릿: `templates/detail-page-structure.json` (v2.0)
- **v3.0 템플릿**: `templates/default-24section.template.json`
- 템플릿 목록: `templates/_registry.json`

### 다중 템플릿 지원

템플릿을 선택하여 다양한 레이아웃으로 상세페이지를 생성할 수 있습니다.

- 템플릿은 `templates/_registry.json`에서 관리
- 기본값: `default-24section` (24섹션 구조)
- 레퍼런스 기반 템플릿: `ref-[이름].template.json` 형식
- 모든 템플릿은 v3.0 형식 (섹션별 layout 속성 포함)

---

## 상세페이지 기본 구조 - 24섹션 (기본 템플릿)

**기본 템플릿은 아래 24개 섹션 구조를 따릅니다.**
레퍼런스 기반 템플릿을 사용할 경우 섹션 수가 유동적(12개~30개)일 수 있습니다.
(기본 템플릿에서는 핵심 기능 6개를 각각 개별 섹션으로 상세 설명)

### 섹션 구성

| 순서 | 섹션 ID | 섹션명 | 목적 |
|------|---------|--------|------|
| 01 | Hook | 후킹 | 강렬한 메인 카피로 시선 사로잡기 |
| 02 | WhatIsThis | 이게 뭔가요? | 제품을 한마디로 정의 |
| 03 | BrandName | 브랜드 의미 | 브랜드명의 의미와 철학 |
| 04 | SetContents | 세트 구성품 | 구매 시 받는 구성품 안내 |
| 05 | WhyCore | 핵심 기능 중요성 | 핵심 차별점이 왜 중요한지 |
| 06 | PainPoint | 페인포인트 공감 | 고객 불편함에 공감 |
| 07 | Solution | 해결책 제시 | 우리 제품의 해결 방법 |
| 08 | **FeaturesOverview** | **핵심 기능 개요** | **6가지 핵심 기능 한눈에 보기** |
| 09 | **Feature1_Detail** | **기능 1 상세** | **첫 번째 기능 Q&A 상세 설명** |
| 10 | **Feature2_Detail** | **기능 2 상세** | **두 번째 기능 Q&A 상세 설명** |
| 11 | **Feature3_Detail** | **기능 3 상세** | **세 번째 기능 Q&A 상세 설명** |
| 12 | **Feature4_Detail** | **기능 4 상세** | **네 번째 기능 Q&A 상세 설명** |
| 13 | **Feature5_Detail** | **기능 5 상세** | **다섯 번째 기능 Q&A 상세 설명** |
| 14 | **Feature6_Detail** | **기능 6 상세** | **여섯 번째 기능 Q&A 상세 설명** |
| 15 | Tips | 사용 꿀팁 | 활용 노하우 제공 |
| 16 | Differentiator | 핵심 차별화 | 경쟁사와 다른 우리만의 강점 |
| 17 | Comparison | 경쟁사 비교 | 직접 비교표 |
| 18 | Safety | 안전/신뢰 | 안전성, 인증, 품질 보증 |
| 19 | Target | 추천 대상 | 어떤 고객에게 적합한지 |
| 20 | Reviews | 고객 후기 | 실사용자 후기 |
| 21 | ProductSpec | 제품 스펙 | 상세 사양 정보 |
| 22 | FAQ | 자주 묻는 질문 | 구매 전 궁금증 해소 |
| 23 | Warranty | 보증/정책 | A/S, 보증, 환불 정책 |
| 24 | CTA | 구매 유도 | 최종 구매 전환 |

### 기능 상세 섹션 (09~14) 구조

각 기능 상세 섹션은 Q&A 형식을 따릅니다:

```
Feature_Num: 기능 번호 (01~06) - 큰 숫자로 시각적 구분
Question: "Q. 왜 [기능명]인가요?"
Answer: "A. [핵심 혜택 설명]"
IMAGE_AREA: 기능 시연/설명 이미지
Benefit_Title: 이 기능의 혜택 요약
Benefit_1~3: 구체적인 혜택 3가지 나열
Spec_Highlight: 관련 스펙 수치 강조 (선택)
```

---

## 색상 시스템

```json
{
  "brand_main": "브랜드 메인 컬러 (예: #FF6B00)",
  "accent": "강조 컬러 (예: #FFD700)",
  "dark_1": "#111111",
  "dark_2": "#1A1A1A",
  "image_placeholder": "#2A2A2A",
  "sub_text": "#888888",
  "muted_text": "#666666"
}
```

---

## 타이포그래피

| 용도 | 폰트 크기 | 굵기 |
|------|----------|------|
| 메인 카피 | 56px | 700 |
| 섹션 제목 | 40-48px | 700 |
| 기능 번호 | 72px | 700 |
| 서브 제목 | 26-32px | 500 |
| 질문 (Q) | 24-32px | 600 |
| 답변 (A) | 36px | 700 |
| 항목 제목 | 24-26px | 600 |
| 본문/설명 | 22px | 400 |
| 작은 글씨 | 20px | 400 |

---

## 텍스트 스타일 가이드라인 (중요)

### 1. 텍스트 정렬
- **기본 정렬: 가운데 정렬 (CENTER)**
- 모든 설명 텍스트, FAQ 답변, 팁 설명 등은 `textAlign: "CENTER"` 사용
- 스펙 목록, 비교표 등 나열형 콘텐츠만 `textAlign: "LEFT"` 사용

### 2. 긴 텍스트 처리
- **너비 제한**: 긴 텍스트는 반드시 `width: 760` 속성 추가
- **줄바꿈**: `\n`을 사용하여 자연스러운 위치에서 문장 분리
- **들여쓰기 금지**: 줄바꿈 후 공백 들여쓰기 사용하지 않음

### 3. 문장 분리 기준
```
✓ 좋은 예시 (자연스러운 문장 길이)
"체인이 너무 헐거우면 이탈 위험,\n너무 팽팽하면 마모가 빨라요.\n손으로 당겼을 때 3mm 정도 들리면 적당합니다."

✗ 나쁜 예시 (불필요한 들여쓰기)
"체인이 너무 헐거우면 이탈 위험,\n    너무 팽팽하면 마모가 빨라요."
```

### 4. JSON 텍스트 요소 예시
```json
{
  "type": "TEXT",
  "name": "Tip1_Desc",
  "content": "체인이 너무 헐거우면 이탈 위험,\n너무 팽팽하면 마모가 빨라요.\n손으로 당겼을 때 3mm 정도 들리면 적당합니다.",
  "fontSize": 22,
  "fontWeight": 400,
  "color": "#888888",
  "textAlign": "CENTER",
  "width": 760
}
```

### 5. 섹션별 텍스트 스타일

| 섹션 | 정렬 | 줄바꿈 | 비고 |
|------|------|--------|------|
| Tips | CENTER | O | 팁 설명은 2-3줄로 분리 |
| Safety | CENTER | O | 안전 기능 설명 분리 |
| Target | CENTER | X | 한 줄로 깔끔하게 |
| Reviews | CENTER | O | 후기 내용 3줄 내외 |
| FAQ | CENTER | O | 답변은 2-3줄로 분리 |
| Warranty | CENTER | O | 보증 설명 분리 |

---

## 레이아웃 기본값

- **캔버스 너비**: 860px
- **이미지 영역 너비**: 760px
- **섹션 배경**: dark_1, dark_2, brand_main 교차 사용

---

## 작업 시 참고사항

1. **새 상세페이지 생성 시**: 기본 템플릿 또는 레퍼런스 기반 템플릿 선택
2. **기준 파일**: `크래프트볼트/craftvolt-chainsaw-v3-final.json`
3. **기본 템플릿**: `templates/default-24section.template.json` (v3.0)
4. **레거시 템플릿**: `templates/detail-page-structure.json` (v2.0, 하위 호환)
5. **핵심 기능**: 기본 템플릿 사용 시 6가지 핵심 기능을 개별 섹션으로 상세 설명
6. **레퍼런스 기반**: 레퍼런스 이미지 제공 시 섹션 수와 구조는 레퍼런스를 따름
7. **v2 HTML 파이프라인**: 시각 효과가 필요한 경우 `/product-to-html` 에이전트 사용

---

## v2 HTML/CSS 파이프라인

### 개요
v1(JSON → Figma 플러그인) 파이프라인과 **병행**하는 v2 파이프라인.
HTML/CSS를 직접 생성하여 그라데이션, 글래스모피즘, 텍스트 섀도우 등 시각 효과를 포함합니다.

### 파이프라인 비교
```
[v1] 제품정보 → plan-sections → match-template → generate-page(JSON) → validate-layout → Figma Plugin
[v2] 제품정보 → plan-sections → match-template → generate-html(HTML/CSS) → 브라우저 프리뷰 → html.to.design → Figma
                ↑ 재사용 ↑                          ↑ 새로 구현 ↑
```

### v2 전용 파일
| 파일 | 용도 |
|------|------|
| `templates/html-base.html` | HTML 골격 + Tailwind config + 유틸리티 CSS |
| `templates/html-section-patterns.md` | 섹션별 HTML/CSS 패턴 라이브러리 (20+) |
| `skills/generate-html.skill.md` | HTML/CSS 상세페이지 생성 스킬 |
| `agents/product-to-html.md` | v2 에이전트 오케스트레이터 |

### v2 시각 효과
- 섹션 배경: 항상 subtle gradient (단색 금지)
- 카드: glassmorphism (`glass-card`, `glass-card-strong`)
- 타이포: `tracking-tight`, `text-shadow-hero`
- 섹션 전환: 장식 분리선, 배경 교차
- 브랜드 컬러: accent border, 그라데이션 텍스트, 글로우 효과

### v2 프리뷰 방법
1. `output/{product}-detail.html`을 브라우저에서 열기
2. Figma 변환: html.to.design 플러그인 사용

---

## 주요 폴더 구조

```
figma-detail-page-agent/
├── agents/                 # 에이전트 오케스트레이터
│   ├── ref-to-template.md     # Agent 1: 레퍼런스 → 템플릿
│   ├── product-to-page.md     # Agent 2: 제품 → 상세페이지 (v1 JSON)
│   └── product-to-html.md     # Agent 3: 제품 → 상세페이지 (v2 HTML/CSS)
├── skills/                 # 스킬 시스템
│   ├── section-taxonomy.json  # 섹션 분류 체계 (마스터 데이터)
│   ├── unmapped-sections/     # 미분류 섹션 리포트 저장소
│   ├── analyze-ref.skill.md       # 레퍼런스 분석
│   ├── generate-template.skill.md # 분석 → 템플릿 변환
│   ├── register-template.skill.md # 레지스트리 등록
│   ├── plan-sections.skill.md     # 섹션 플랜 설계
│   ├── match-template.skill.md    # 템플릿 매칭/추천
│   ├── generate-page.skill.md     # 레이아웃 JSON 생성 (v1)
│   ├── generate-html.skill.md     # HTML/CSS 생성 (v2)
│   └── validate-layout.skill.md   # 구조 검증 (v1용)
├── templates/              # 상세페이지 템플릿 (v3.0)
│   ├── _registry.json      # 템플릿 레지스트리 (목록 관리)
│   ├── default-24section.template.json  # 기본 24섹션 템플릿 (v3.0)
│   ├── detail-page-structure.json       # 레거시 템플릿 (v2.0)
│   ├── html-base.html       # v2 HTML 골격 + Tailwind config
│   └── html-section-patterns.md  # v2 섹션별 HTML 패턴 라이브러리
├── prompts/                # deprecated (참조용 보존)
├── references/             # 레퍼런스 이미지 저장소
├── 크래프트볼트/            # 크래프트볼트 상세페이지 결과물 (기준)
│   └── craftvolt-chainsaw-v3-final.json  # 최신 기준 파일 (24섹션)
├── output/                 # 에이전트/스킬 중간 + 최종 결과물
├── tools/                  # 개발 도구
│   ├── preview.html        # JSON → HTML 미리보기 (브라우저에서 열기)
│   └── template-editor.html # 템플릿 와이어프레임 프리뷰어/에디터
└── figma-plugin/           # Figma 플러그인
    ├── manifest.json       # 플러그인 설정
    ├── code.js             # 플러그인 메인 코드 (레이아웃 유연 지원)
    └── ui.html             # 플러그인 UI
```

---

## 에이전트/스킬 시스템

### 에이전트 (워크플로우 오케스트레이터)

| 에이전트 | 파일 | 용도 | 스킬 체인 |
|---------|------|------|----------|
| `/ref-to-template` | `agents/ref-to-template.md` | 레퍼런스 → 템플릿 | analyze-ref → generate-template → **template-editor 검수** → register-template |
| `/product-to-page` | `agents/product-to-page.md` | 제품 → 상세페이지 (v1) | plan-sections → match-template → generate-page → validate-layout |
| `/product-to-html` | `agents/product-to-html.md` | 제품 → 상세페이지 (v2) | plan-sections → match-template → **generate-html** |

### 스킬 (개별 단계)

| 스킬 | 파일 | Input | Output |
|------|------|-------|--------|
| `/analyze-ref` | `skills/analyze-ref.skill.md` | 레퍼런스 이미지 | `output/analysis-{name}.json` |
| `/generate-template` | `skills/generate-template.skill.md` | analysis JSON | `templates/ref-{name}.template.json` |
| `/register-template` | `skills/register-template.skill.md` | template JSON | `_registry.json` 업데이트 |
| `/plan-sections` | `skills/plan-sections.skill.md` | 제품 정보 | `output/{product}-section-plan.json` |
| `/match-template` | `skills/match-template.skill.md` | section plan | `output/{product}-template-match.json` |
| `/generate-page` | `skills/generate-page.skill.md` | template + plan | `output/{product}-layout.json` |
| `/generate-html` | `skills/generate-html.skill.md` | template + plan | `output/{product}-detail.html` |
| `/generate-figma-make-prompt` | `skills/generate-figma-make-prompt.skill.md` | detail HTML | `output/{product}-figma-make-prompt.md` |
| `/validate-layout` | `skills/validate-layout.skill.md` | layout JSON | `output/{product}-validation.json` |

### Taxonomy 슬라이싱

각 스킬은 `skills/section-taxonomy.json` 전체를 로딩하지 않고 **필요한 필드만** 추출합니다:

- **Slim** (분석/플래닝용): `id, name, category, purpose, is_required, frequency, keywords, visual_cues, typical_compositions` → ~3,000 토큰
- **Selective** (생성용): 플랜 포함 섹션의 `required_elements, copywriting_guide`만 → ~3,600 토큰
- **Match Config**: `matching_config` 블록만 → ~200 토큰

### 워크플로우

#### 새 레퍼런스 분석 시
```
/ref-to-template → (analyze-ref → generate-template → [유저 검수: template-editor] → register-template)
```

#### 새 상세페이지 생성 시 (v1 — JSON)
```
/product-to-page → (plan-sections → [유저 확인] → match-template → [유저 선택] → generate-page → validate-layout)
```

#### 새 상세페이지 생성 시 (v2 — HTML/CSS, 시각 효과 포함)
```
/product-to-html → (plan-sections → [유저 확인] → match-template → [유저 선택] → generate-html)
```

#### 개별 스킬 직접 실행
각 스킬은 독립적으로도 실행 가능합니다.

### 섹션 분류 체계 (Taxonomy)

- 정의 파일: `skills/section-taxonomy.json`
- 5개 카테고리: `intro` / `problem` / `features` / `trust` / `conversion`
- 현재 20개 표준 섹션 (FeatureDetail은 반복 가능)
- 미분류 섹션 발견 시 → 리포트 검토 → taxonomy에 추가하여 확장 (목표: 50+)

### 템플릿 명명 규칙

- 기본 템플릿: `default-[설명].template.json`
- 레퍼런스 기반: `ref-[레퍼런스명].template.json`
- 레지스트리: `templates/_registry.json`에 모든 템플릿 등록
