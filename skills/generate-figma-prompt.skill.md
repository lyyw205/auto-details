# /generate-figma-prompt — JSON → Figma Make 프롬프트 생성

## Purpose

`.widget.json` 파일의 `elements` 배열과 `figma_hints`를 직접 읽어 **Figma Make에 바로 입력할 수 있는 최종 프롬프트**를 생성합니다.

v1/v2 대비 핵심 개선:
- **v1**: generate-html 결과 HTML 파싱 → CSS 클래스명으로 레이아웃 추론 (4회 변환, 손실 발생)
- **v2**: v4 와이어프레임 위젯의 WIDGET_META `figma_make_hints` 직접 활용
- **이 버전**: `.widget.json`을 직접 읽어 `elements[]` 위치/크기/스타일, `figma_hints.layout_structure` 활용 → HTML 역파싱 불필요, 1회 직접 변환, 정확도 대폭 향상

---

## Context

- 입력: `.widget.json` 파일들 (매핑 파이프라인 결과물)
- 스타일 프리셋: `widgets/_presets/preset--ref-{name}.json`
- 섹션 분류 체계: `skills/section-taxonomy.json` (필요 시 참조)

---

## Input

1. **위젯 JSON 파일** (택일):
   - 개별 `.widget.json` 파일들
   - 또는 `output/{product}-widget-selection.json` (select-widgets 결과물)에서 참조하는 `.widget.json` 경로들
2. **제품 정보**:
   - 제품명 (한글 + 영문)
   - 브랜드명
   - 제품 카테고리 (가전, 뷰티, 식품 등)
   - 핵심 셀링 포인트 3~5개
3. **스타일 프리셋**: `widgets/_presets/preset--ref-{name}.json` (컬러, 타이포, 스타일 태그)
4. (선택) **디자인 톤 선호**: 프리미엄/미니멀/내추럴/테크 등 (프리셋 style_tags 우선)
5. (선택) **제품 이미지**: 유저가 함께 첨부할 실제 제품 사진 (Figma Make에 같이 입력)

---

## Processing

### 1단계: 메타데이터 수집 (JSON 직접 읽기, HTML 파싱 없음)

각 `.widget.json`을 `JSON.parse`로 읽어 다음 필드를 추출합니다:

```
widget.figma_hints.layout_structure   → 섹션 전체 레이아웃 설명 (자연어)
widget.figma_hints.key_elements       → 핵심 요소 목록 (role, description)
widget.elements[]                     → 요소별 정확한 위치/크기/스타일 정보
widget.sample_data                    → 콘텐츠 placeholder 예시
widget.taxonomy_id                    → 섹션 분류 (Hook, FeaturesOverview 등)
widget.widget_id                      → 위젯 식별자
```

프리셋에서 디자인 시스템 정보 추출:
```
preset.color_system.brand_main        → 메인 브랜드 컬러 hex
preset.color_system.accent            → 액센트 컬러 hex
preset.color_system.dark_1            → 다크 배경 컬러 hex
preset.typography.main_copy           → 제목 폰트 크기/굵기
preset.typography.body                → 본문 폰트 크기/굵기
preset.typography.small               → 캡션 폰트 크기
preset.style_tags                     → 전체 스타일 방향성
```

### 2단계: elements[] → 자연어 디자인 지시 변환

`elements[]` 배열의 각 요소를 타입별로 변환합니다.

**좌표 표현 방식**: `bounds` 값을 "섹션 상단 X%, 좌측 Y% 위치" 형태로 기술합니다.

#### 타입별 변환 규칙

| elements[].type | 변환 방식 |
|-----------------|----------|
| `text` (role: heading) | "{content} 제목 텍스트 — {bounds 기반 위치 설명}, {fontSize}px Bold, {textAlign} 정렬" |
| `text` (role: subheading) | "{content} 부제목 — {위치}, {fontSize}px Medium" |
| `text` (role: body) | "{lines}줄 본문 설명 텍스트 — {위치}" |
| `text` (role: badge/tag) | "'{content}' 배지 레이블 — {위치}, 브랜드 컬러 배경의 둥근 태그" |
| `text` (role: button) | "'{content}' CTA 버튼 — {위치}, 브랜드 메인 컬러, {width}px 너비" |
| `image` | "이미지 영역 — {위치 및 크기}, {placeholder.ai_prompt}로 AI 생성" |
| `background` | "배경: {style 필드 기반 설명}" |
| `card` | "{card 내부 elements 요약} 카드 — 글래스모피즘 처리" |
| `icon` | "{role} 아이콘 — {위치}" |
| `divider` | "가로 구분선 — {위치}" |

#### 이미지 요소 변환 (상세)

`type: "image"` 요소는 두 종류로 분기합니다:

**AI 생성 이미지** (`placeholder.type: "ai-generated"`):
```
📸 AI 이미지 영역: {placeholder.label 또는 role}
   위치: {bounds 기반 섹션 내 위치 설명}
   크기: {bounds.width} × {bounds.height}px (섹션 대비 {비율}%)
   스타일: {placeholder.style}
   AI 이미지 프롬프트: "{placeholder.ai_prompt}"
```

**실제 제품 이미지** (`placeholder.type: "product-image"`):
```
🖼️ 제품 이미지: {placeholder.label}
   위치: {bounds 기반 위치 설명}
   크기: {bounds.width} × {bounds.height}px
   → 이 위치에 첨부한 제품 이미지를 배치하세요
```

### 3단계: 제품 정보 주입

`sample_data.texts`의 placeholder를 실제 제품 정보로 치환하여 프롬프트 내 텍스트 예시를 구체화합니다:

| Placeholder 패턴 | 치환 소스 |
|-----------------|----------|
| `[브랜드명]` | 입력받은 브랜드명 |
| `[메인 카피]` | 핵심 셀링 포인트 1 |
| `[서브 카피]` | 핵심 셀링 포인트 2 또는 부가 설명 |
| `[포인트 N 설명]` | 핵심 셀링 포인트 N |
| `[버튼 텍스트]` | "지금 구매하기" 또는 상황에 맞는 CTA |
| `[제품명]` | 입력받은 제품명 |

치환 후에도 placeholder 패턴이 남아 있으면 그대로 유지합니다 (Figma Make가 맥락상 채워 넣도록).

### 4단계: 프롬프트 조립

아래 구조로 최종 프롬프트를 조립합니다:

```markdown
# [제품명] 상세페이지 디자인

## 디자인 개요
(전체 톤, 스타일, 분위기, 타겟 — preset.style_tags 기반 3~5줄)

## 디자인 시스템

### 컬러
- 메인 컬러: {brand_main} — 주요 강조, 버튼, 배지 배경
- 액센트: {accent} — 보조 강조, 아이콘, 포인트 텍스트
- 다크 배경: {dark_1} — 다크 섹션 배경
- neutral 팔레트: 흰색·연회색·중간회색·진한회색 (고정)

### 타이포그래피
- 제목: {main_copy.fontSize}px, Bold (한국어 Pretendard)
- 부제목: {sub_copy.fontSize}px, SemiBold
- 본문: {body.fontSize}px, Regular
- 캡션: {small.fontSize}px, Regular

### 시각 효과
(프리셋 및 레퍼런스 분석 기반: 글래스모피즘/그라데이션/그림자 등)

---

## 섹션별 디자인 지시

### 섹션 N: {taxonomy_id} — {figma_hints.layout_structure 요약}

**레이아웃**: {figma_hints.layout_structure 전문}

**구성 요소**:
{elements[] 변환 결과 나열}

**텍스트 콘텐츠 예시**:
{sample_data.texts — 제품 정보로 치환된 결과}

**이미지 영역**:
{image 타입 elements 변환 결과}

(섹션 반복)

---

## 이미지 가이드

전체 섹션에 걸쳐 사용되는 이미지 영역을 총정리합니다:

{AI 이미지 목록 — 섹션명, 위치, AI 프롬프트}
{제품 이미지 목록 — 섹션명, 위치, "제품 이미지 배치" 안내}

---

## 디자인 품질 지침
- 860px 고정 너비 (모바일 상세페이지 기준)
- 모든 섹션 배경에 subtle gradient 적용 (단색 금지)
- 카드 요소에 글래스모피즘 (반투명 배경 + backdrop-blur)
- 텍스트-이미지 오버레이 시 반드시 그라데이션 오버레이 + 텍스트 섀도우 적용
- 타이포그래피: 한국어 Pretendard 폰트, tracking-tight
- 전체적으로 {style_tags} 느낌 유지
- 이미지 플레이스홀더: 실제 이미지가 들어갈 영역을 명확히 표시
```

---

## Output

- 파일: `output/{product}-figma-prompt.md`
- 형식: Markdown (Figma Make에 복사-붙여넣기 가능)
- 인코딩: UTF-8

---

## 프롬프트 길이 가이드

| 섹션 | 분량 |
|------|------|
| 디자인 개요 | 3~5줄 |
| 디자인 시스템 | 10~15줄 |
| 섹션별 지시 (합계) | 총 분량의 70%, 섹션당 8~15줄 |
| 이미지 가이드 | 이미지당 4~5줄 |
| 품질 지침 | 5~8줄 |
| **전체** | **1,500~3,000자 (한국어 기준)** |

---

## v1/v2 대비 차이점

| 영역 | v1 (generate-figma-make-prompt) | v2 (generate-figma-make-prompt-v2) | 이 버전 |
|------|--------------------------------|-------------------------------------|---------|
| **입력** | generate-html 결과 HTML | v4 와이어프레임 WIDGET_META | `.widget.json` 직접 |
| **레이아웃 기술** | HTML 클래스명에서 추론 | `wireframe_info` 직접 활용 | `figma_hints.layout_structure` 직접 활용 |
| **요소 위치/크기** | CSS 클래스에서 추론 (부정확) | `key_elements` 개략 설명 | `elements[].bounds` 수치 좌표 (정확) |
| **이미지 프롬프트** | `data-ai-prompt` HTML 속성 파싱 | `figma_make_hints.ai_images` 직접 활용 | `elements[type=image].placeholder.ai_prompt` 직접 |
| **변환 횟수** | HTML → 파싱 → 분석 → 자연어 (4회) | WIDGET_META → 자연어 (2회) | JSON → 자연어 (1회) |
| **구조 정확도** | 손실 있음 | 준정확 | 정확 |

---

## 주의사항

- Figma Make는 자연어 지시를 이해하므로 CSS 클래스명 그대로 사용 금지
- 디자인 의도를 "결과 지향적"으로 기술 (방법이 아닌 결과물 묘사)
- `elements[].bounds` 좌표는 `%` 비율로 환산하여 "섹션 상단 30% 지점" 형식으로 기술
- 제품 이미지 영역은 항상 "이 위치에 첨부 제품 이미지 배치" 형태로 명시
- 한국어로 작성 (AI 이미지 프롬프트만 영문 유지)
- `.widget.json`이 없는 위젯의 경우 `.widget.html` WIDGET_META를 fallback으로 사용 가능 (v2 방식)
