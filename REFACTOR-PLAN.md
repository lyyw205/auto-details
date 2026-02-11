# 에이전트/스킬 아키텍처 리팩토링 구현 가이드

> **이 파일은 세션 간 핸드오프용 작업 지시서입니다.**
> 새 세션에서 이 파일을 읽고 그대로 구현하면 됩니다.

---

## 1. 현재 상태 요약

### 기존 구조
```
prompts/
├── analyze-reference.md    (379줄) → 레퍼런스 이미지 분석
├── generate-template.md    (336줄) → 분석 → 템플릿 변환 + 레지스트리 등록
├── recommend-template.md   (206줄) → 섹션 설계 + 템플릿 매칭/추천
└── generate-page.md        (307줄) → 레이아웃 JSON 생성
```

### 문제점
- 매 실행마다 taxonomy 전체(~8,600 토큰) 반복 로딩
- 하나의 프롬프트가 여러 역할 (recommend = plan + match)
- 검증 로직이 generate-page에 혼재
- 레지스트리 등록이 generate-template에 포함

### 목표 구조
```
agents/                          # 오케스트레이터 (2개)
├── ref-to-template.md           # Agent 1: 레퍼런스 → 템플릿
└── product-to-page.md           # Agent 2: 제품 → 상세페이지

skills/                          # 개별 스킬 (7개 신규)
├── section-taxonomy.json        # 유지
├── unmapped-sections/           # 유지
├── analyze-ref.skill.md         # ← analyze-reference.md
├── generate-template.skill.md   # ← generate-template.md (레지스트리 분리)
├── register-template.skill.md   # 신규
├── plan-sections.skill.md       # ← recommend-template.md 전반부
├── match-template.skill.md      # ← recommend-template.md 후반부
├── generate-page.skill.md       # ← generate-page.md (검증 분리)
└── validate-layout.skill.md     # 신규

prompts/                         # deprecated 표시
├── _DEPRECATED.md
└── (기존 4개 파일 유지)
```

---

## 2. 구현 순서 (Phase 1~4)

### Phase 1: 스킬 파일 7개 생성

아래 순서로 `skills/` 폴더에 생성합니다.

---

### 2.1 `skills/analyze-ref.skill.md`

**원본**: `prompts/analyze-reference.md` (379줄)
**변경**: taxonomy 참조를 slim 지시로 교체, 출력 포맷 유지

```markdown
# /analyze-ref — 레퍼런스 이미지 분석

## Purpose
레퍼런스 상세페이지 이미지를 분석하여 구조화된 레이아웃 데이터를 추출하고,
섹션 분류 체계(taxonomy)에 기반하여 각 섹션을 표준 ID에 매핑합니다.

## Context
- `skills/section-taxonomy.json`에서 **slim 필드만** 로딩:
  `id, name, category, purpose, is_required, frequency, keywords, visual_cues, typical_compositions`
- 미분류 리포트 저장: `skills/unmapped-sections/`

## Input
- 레퍼런스 이미지 (1장 또는 여러 장의 상세페이지 스크린샷)
- 레퍼런스 이름 (파일명 또는 브랜드명)

## Processing

### 1단계: 글로벌 분석

전체 페이지의 시각적 특성을 파악합니다.

```json
{
  "global_analysis": {
    "estimated_width": "페이지 추정 너비 (px, 일반적으로 860 또는 750)",
    "color_palette": {
      "primary": "#hex",
      "secondary": "#hex",
      "background_colors": ["#hex"],
      "text_primary": "#hex",
      "text_secondary": "#hex"
    },
    "typography_scale": {
      "largest_heading": "추정 px",
      "section_heading": "추정 px",
      "sub_heading": "추정 px",
      "body_text": "추정 px",
      "small_text": "추정 px"
    },
    "visual_rhythm": "배경색 교차 패턴 설명",
    "overall_style": "전반적인 스타일",
    "content_alignment": "CENTER / LEFT / MIXED"
  }
}
```

### 2단계: 섹션별 분석 + Taxonomy 매핑

이미지를 위에서 아래로 스크롤하며, 시각적으로 구분되는 각 섹션을 식별합니다.

#### 매핑 판단 기준 (우선순위)
1. **purpose 일치**: 섹션의 목적이 taxonomy 정의와 부합하는가?
2. **keywords 매칭**: 섹션 내 텍스트에 taxonomy의 keywords가 포함되는가?
3. **visual_cues 매칭**: 시각적 특징이 taxonomy의 visual_cues와 유사한가?
4. **required_elements 구조**: 포함된 요소 타입이 유사한가?

#### 매핑 확신도 기준
| 확신도 | 기준 |
|--------|------|
| 0.9~1.0 | purpose + keywords + visual_cues 모두 일치 |
| 0.7~0.8 | purpose 일치 + 부분 매칭 |
| 0.5~0.6 | purpose 유사하지만 구조가 다름 |
| 0.3~0.4 | 일부 요소만 유사 |
| 0.0~0.2 | taxonomy에 해당 없음 → 미분류 |

#### 섹션 분석 형식

```json
{
  "sections": [
    {
      "order": 1,
      "detected_purpose": "이 섹션이 하는 역할",
      "taxonomy_mapping": {
        "section_id": "Hook",
        "confidence": 0.9,
        "mapping_reason": "매핑 근거"
      },
      "layout": {
        "estimated_height": "px",
        "background": "#hex",
        "padding": { "top": 0, "bottom": 0, "left": 0, "right": 0 },
        "itemSpacing": "px",
        "layoutMode": "VERTICAL",
        "contentAlignment": "CENTER"
      },
      "composition": {
        "type": "stack | composed | split",
        "reason": "선택 근거"
      },
      "elements": [
        {
          "type": "TEXT / IMAGE_AREA / FRAME / BUTTON",
          "role": "역할 설명",
          "estimated_fontSize": "px",
          "estimated_fontWeight": "굵기",
          "color": "#hex",
          "estimated_size": "너비 x 높이"
        }
      ],
      "visual_notes": "특이 사항"
    }
  ]
}
```

#### Composition 타입 판단

**`stack`** (기본): 모든 요소가 순서대로 나열, 겹침 없음
**`composed`** (9분할 자유 배치): 오버레이/겹침 존재

composed 추가 분석:
```json
{
  "composition": { "type": "composed", "reason": "..." },
  "layers": [
    {
      "zIndex": 0,
      "region": "TL:BR",
      "element": {
        "type": "IMAGE_AREA",
        "name": "Background_Image",
        "label": "설명",
        "ai_prompt": { "prompt": "...", "negative": "...", "style": "mood", "aspect_ratio": "16:9" }
      }
    }
  ]
}
```

9분할 그리드:
```
┌─────┬─────┬─────┐
│ TL  │ TC  │ TR  │
├─────┼─────┼─────┤
│ ML  │ MC  │ MR  │
├─────┼─────┼─────┤
│ BL  │ BC  │ BR  │
└─────┴─────┴─────┘
```
스팬: `"TL:BR"` = 전체

**`split`** (2분할): 좌우 또는 상하 명확히 분할

split 추가 분석:
```json
{
  "composition": { "type": "split", "reason": "..." },
  "split_detail": {
    "direction": "horizontal",
    "ratio": [1, 1],
    "left_content": "텍스트",
    "right_content": "이미지"
  }
}
```

#### AI 이미지 프롬프트 (`ai_prompt`)

모든 IMAGE_AREA에 생성:
```json
{
  "ai_prompt": {
    "prompt": "영문 프롬프트",
    "negative": "제외할 요소",
    "style": "프리셋 코드",
    "aspect_ratio": "가로:세로"
  }
}
```

스타일 프리셋:
| style | 용도 |
|-------|------|
| `product_hero` | 메인컷 (배경 없음, 스튜디오) |
| `product_lifestyle` | 사용 환경 (자연광) |
| `product_detail` | 클로즈업 (마크로) |
| `product_flat` | 구성품 나열 (탑뷰) |
| `infographic` | 인포그래픽 |
| `mood` | 감성/분위기 |
| `comparison` | 비교/대조 |
| `background_only` | 배경 전용 |

#### 미분류 섹션 (confidence < 0.3)
```json
{
  "taxonomy_mapping": {
    "section_id": null,
    "confidence": 0.1,
    "mapping_reason": "기존 taxonomy에 해당 없음",
    "unmapped": true,
    "suggested_id": "PascalCase ID",
    "suggested_category": "intro | problem | features | trust | conversion",
    "suggested_name": "한글명"
  }
}
```

#### FeatureDetail 반복 처리
```json
{
  "taxonomy_mapping": {
    "section_id": "FeatureDetail",
    "confidence": 0.9,
    "feature_index": 3,
    "mapping_reason": "Q&A 형식의 기능 상세 설명, 3번째 반복"
  }
}
```

### 3단계: 패턴 요약

```json
{
  "pattern_summary": {
    "total_sections": "총 섹션 수",
    "section_flow": ["Hook", "WhatIsThis", "..."],
    "background_pattern": "배경색 교차 패턴",
    "category_distribution": { "intro": 3, "problem": 2, "features": 6, "trust": 4, "conversion": 1 },
    "mapping_stats": { "total": 16, "mapped": 14, "unmapped": 2, "coverage": "87%" },
    "feature_detail_count": "FeatureDetail 반복 횟수",
    "unique_patterns": ["독특한 패턴 설명"]
  }
}
```

### 4단계: 미분류 섹션 리포트

미분류 섹션이 있을 경우 `skills/unmapped-sections/unmapped-[레퍼런스명].json`으로 저장:

```json
{
  "reference": "레퍼런스명",
  "report_date": "YYYY-MM-DD",
  "total_sections": 16,
  "unmapped_count": 2,
  "unmapped_sections": [
    {
      "position": 5,
      "description": "역할 설명",
      "visual_type": "시각적 특징",
      "content_summary": "콘텐츠 요약",
      "suggested_id": "IngredientsDetail",
      "suggested_category": "features",
      "suggested_name": "성분 상세",
      "suggested_keywords": ["성분", "원료"],
      "suggested_visual_cues": ["테이블", "수치"],
      "confidence": 0.2
    }
  ]
}
```

## Output
- 분석 결과: `output/analysis-{name}.json` (global_analysis + sections + pattern_summary)
- 미분류 리포트: `skills/unmapped-sections/unmapped-{name}.json` (있을 경우)
- 유저에게 요약 표시: 섹션 수, 매핑률, 미분류 섹션

## Validation
- [ ] 모든 섹션에 taxonomy 매핑 시도했는가?
- [ ] 비율 중심 분석인가 (px 정확도보다 시각적 리듬)?
- [ ] 이미지의 모든 섹션을 빠짐없이 분석했는가?
- [ ] 모든 IMAGE_AREA에 ai_prompt가 있는가?
- [ ] composed 섹션에 layers + region이 있는가?
- [ ] FeatureDetail 반복에 feature_index가 있는가?
- [ ] taxonomy의 typical_compositions를 참고했는가?
```

---

### 2.2 `skills/generate-template.skill.md`

**원본**: `prompts/generate-template.md` 중 변환 로직 (레지스트리 등록 분리)

```markdown
# /generate-template — 분석 결과 → 템플릿 JSON 변환

## Purpose
`/analyze-ref` 출력(analysis JSON)을 v3.0 템플릿 JSON 파일로 변환합니다.

## Context
- `output/analysis-{name}.json` (analyze-ref 출력)
- `skills/section-taxonomy.json`에서 **매칭된 섹션의 required_elements만** selective 로딩

## Input
- analysis JSON (global_analysis + sections + pattern_summary)
- 레퍼런스 이름

## Processing

### 1. 메타데이터 생성
```json
{
  "type": "DETAIL_PAGE_TEMPLATE",
  "version": "3.0",
  "name": "[레퍼런스명] 기반 템플릿",
  "description": "레퍼런스 이미지 분석 기반 자동 생성 템플릿",
  "created": "YYYY-MM-DD",
  "source": {
    "type": "reference_analysis",
    "based_on": "레퍼런스 파일명",
    "analysis_date": "YYYY-MM-DD"
  }
}
```

### 2. global_layout 매핑
분석의 `global_analysis`에서:
```json
{
  "global_layout": {
    "width": "estimated_width",
    "image_area_width": "width - padding",
    "default_padding": "빈번한 padding",
    "default_item_spacing": "빈번한 itemSpacing",
    "default_content_alignment": "content_alignment",
    "font_family": "감지된 폰트 또는 Inter"
  }
}
```

### 3. color_system 매핑
```json
{
  "color_system": {
    "brand_main": "primary",
    "accent": "secondary",
    "dark_1": "가장 어두운 배경",
    "dark_2": "두 번째 어두운 배경",
    "light_text": "#FFFFFF",
    "sub_text": "text_secondary",
    "image_placeholder": "#2A2A2A"
  }
}
```
- 모든 색상은 hex 값으로 표기
- 밝은 테마는 light_1, light_2 사용 가능

### 4. typography 매핑
```json
{
  "typography": {
    "main_copy": { "fontSize": "largest_heading", "fontWeight": 700 },
    "section_title": { "fontSize": "section_heading", "fontWeight": 700 },
    "sub_title": { "fontSize": "sub_heading", "fontWeight": 500 },
    "body": { "fontSize": "body_text", "fontWeight": 400 },
    "small": { "fontSize": "small_text", "fontWeight": 400 }
  }
}
```
- 최소 크기 14px 이상

### 5. 섹션 변환

#### 5-1. ID 매핑 규칙
- `Section_XX_[taxonomy_id]` (XX = 순서 번호)
- 매핑 불가 섹션: `Section_XX_Custom_[설명적ID]` + `"custom": true`
- FeatureDetail 반복: `Section_XX_FeatureN_Detail`

#### 5-2. 레이아웃 속성
```json
{
  "layout": {
    "height": "50px 단위 반올림",
    "background": "#hex (시맨틱 허용 - color_system 키)",
    "padding": { "top": 0, "bottom": 0, "left": 0, "right": 0 },
    "itemSpacing": "4px 단위 반올림",
    "layoutMode": "VERTICAL / HORIZONTAL",
    "primaryAxisAlign": "CENTER / MIN / MAX",
    "counterAxisAlign": "CENTER / MIN / MAX"
  }
}
```

#### 5-3. required_elements 변환
```json
{
  "required_elements": [
    {
      "type": "TEXT",
      "name": "설명적_이름",
      "role": "역할 설명",
      "fontSize": "추정값",
      "fontWeight": "추정값",
      "color": "#hex 또는 시맨틱"
    }
  ]
}
```

### 6. Composition 보존

#### `stack` (기본)
```json
{ "composition": "stack", "layout": {}, "required_elements": [] }
```

#### `composed` (9분할)
```json
{
  "composition": "composed",
  "layout": { "height": 600, "background": "#hex" },
  "layers": [
    { "zIndex": 0, "region": "TL:BR", "element": { "type": "IMAGE_AREA", "name": "...", "ai_prompt": {} } },
    { "zIndex": 1, "region": "BL:BC", "element": { "type": "TEXT", "name": "..." } }
  ]
}
```

#### `split` (2분할)
```json
{
  "composition": "split",
  "direction": "horizontal",
  "ratio": [1, 1],
  "left": { "valign": "MC", "required_elements": [] },
  "right": { "valign": "MC", "required_elements": [] }
}
```

### 7. ai_prompt 보존
- 분석의 ai_prompt를 그대로 보존
- 구체적 제품명은 `[product]` 플레이스홀더로 치환
- style, negative, aspect_ratio 유지

## Output
- 템플릿 파일: `templates/ref-{name}.template.json`
- 유저에게 템플릿 요약 표시

## Validation
- [ ] version "3.0"
- [ ] source.type "reference_analysis"
- [ ] 모든 색상 hex
- [ ] 모든 섹션에 layout 속성
- [ ] 매핑 불가 섹션에 "custom": true
- [ ] global_layout 정의됨
- [ ] 섹션 order 연속적
- [ ] 폰트 14px 이상
- [ ] 높이 50px 단위
- [ ] composed → layers + region
- [ ] split → direction, ratio, 양쪽 패널
- [ ] 모든 IMAGE_AREA에 ai_prompt
- [ ] ai_prompt 내 제품명 → [product]
```

---

### 2.3 `skills/register-template.skill.md`

**원본**: `prompts/generate-template.md`의 레지스트리 등록 부분
**신규 분리**

```markdown
# /register-template — 템플릿 레지스트리 등록

## Purpose
생성된 템플릿을 `templates/_registry.json`에 등록합니다.

## Context
- `templates/_registry.json` (기존 레지스트리)
- 생성된 템플릿 파일의 메타데이터 (상위 60줄)

## Input
- 템플릿 파일 경로: `templates/ref-{name}.template.json`

## Processing

1. 템플릿 파일에서 메타데이터 추출 (name, description, section 수)
2. `_registry.json`의 `templates` 배열에 엔트리 추가
3. 중복 ID 체크 → 이미 존재하면 업데이트

### 레지스트리 엔트리 형식
```json
{
  "id": "ref-{name}",
  "file": "ref-{name}.template.json",
  "name": "{name} 기반 템플릿",
  "description": "레퍼런스 이미지 분석 기반 자동 생성",
  "section_count": 16,
  "category": "레퍼런스",
  "source": "reference_analysis",
  "created": "YYYY-MM-DD"
}
```

## Output
- `templates/_registry.json` 업데이트
- 완료 메시지: "ref-{name} 템플릿이 레지스트리에 등록되었습니다."

## Validation
- [ ] _registry.json이 유효한 JSON인가?
- [ ] 중복 ID가 없는가?
- [ ] 템플릿 파일이 실제 존재하는가?
```

---

### 2.4 `skills/plan-sections.skill.md`

**원본**: `prompts/recommend-template.md` 1단계 (섹션 설계)

```markdown
# /plan-sections — 섹션 플랜 설계

## Purpose
제품 정보를 분석하여 상세페이지에 필요한 섹션 목록과 배치 순서를 설계합니다.

## Context
- `skills/section-taxonomy.json`에서 **slim 필드만** 로딩:
  `id, name, category, purpose, is_required, frequency, keywords, visual_cues, typical_compositions`

## Input
1. **제품명**: 상세페이지를 만들 제품
2. **제품 설명**: 핵심 특징, 기능, 차별점
3. **핵심 기능 수**: 강조할 기능 개수 (기본: 6)
4. **선호 스타일**: (선택) 다크모드, 미니멀 등
5. **필수 포함 섹션**: (선택)
6. **제외 섹션**: (선택)

## Processing

### 설계 원칙
- `is_required: true` 섹션(Hook, CTA)은 항상 포함
- 제품 특성에 따라 적합한 섹션 선택
- 핵심 기능 수에 따라 FeatureDetail 반복 횟수 결정
- 카테고리별 균형: intro → problem → features → trust → conversion

### 출력 형식
```json
{
  "section_plan": {
    "product_name": "제품명",
    "total_sections": 18,
    "feature_count": 6,
    "sections": [
      {
        "order": 1,
        "section_id": "Hook",
        "category": "intro",
        "reason": "필수 섹션 - 메인 후킹"
      },
      {
        "order": 9,
        "section_id": "FeatureDetail",
        "category": "features",
        "feature_index": 1,
        "reason": "첫 번째 핵심 기능 상세"
      }
    ],
    "category_distribution": {
      "intro": 4,
      "problem": 2,
      "features": 8,
      "trust": 3,
      "conversion": 1
    }
  }
}
```

## Output
- `output/{product}-section-plan.json`
- 유저에게 섹션 플랜 표시 → 수정 요청 수렴

## Validation
- [ ] Hook, CTA 필수 섹션 포함?
- [ ] FeatureDetail 수가 핵심 기능 수와 일치?
- [ ] 카테고리 순서가 자연스러운가? (intro → problem → features → trust → conversion)
- [ ] 사용자 지정 섹션이 반영되었는가?
```

---

### 2.5 `skills/match-template.skill.md`

**원본**: `prompts/recommend-template.md` 2~3단계 (매칭 + 추천)

```markdown
# /match-template — 템플릿 매칭/추천

## Purpose
섹션 플랜을 기존 템플릿들과 비교하여 매칭 점수를 계산하고 상위 3개를 추천합니다.

## Context
- `output/{product}-section-plan.json` (plan-sections 출력)
- `templates/_registry.json` (템플릿 목록)
- 각 템플릿에서 `taxonomy_profile` (섹션 ID 목록 + 카테고리 비율)만 로딩
- `skills/section-taxonomy.json`에서 `matching_config` 블록만 (~200 토큰)

## Input
- section plan JSON

## Processing

### 매칭 점수 계산
```
최종 점수 = section_overlap × 1.0
           + order_similarity × 0.5
           + category_ratio × 0.3
           - missing_required_penalty × 2.0
```

#### section_overlap_score
```
겹치는 섹션 수 / max(플랜 섹션 수, 템플릿 섹션 수)
```
- FeatureDetail은 개수까지 비교

#### order_similarity_score
```
1 - (순서 역전 쌍 수 / 전체 비교 가능한 쌍 수)
```

#### category_ratio_score
```
1 - 평균(|플랜 카테고리 비율 - 템플릿 카테고리 비율|)
```

#### missing_required_penalty
플랜의 `is_required: true` 섹션이 템플릿에 없으면 감점.

### 출력 형식
```json
{
  "template_ranking": [
    {
      "rank": 1,
      "template_id": "ref-apple-airpods",
      "template_name": "Apple AirPods 기반 템플릿",
      "file": "ref-apple-airpods.template.json",
      "scores": {
        "section_overlap": 0.85,
        "order_similarity": 0.72,
        "category_ratio": 0.91,
        "missing_required_penalty": 0,
        "total": 1.48
      },
      "matched_sections": ["Hook", "WhatIsThis", "..."],
      "missing_in_template": ["BrandName", "Tips"],
      "extra_in_template": ["Warranty"],
      "recommendation": "변경 필요 사항 설명"
    }
  ]
}
```

### 특수 케이스
- 모든 템플릿 total_score < 0.5 → default-24section 기반 커스텀 추천
- 사용자 지정 섹션은 매칭 점수와 관계없이 반영

## Output
- `output/{product}-template-match.json`
- 상위 3개 템플릿 추천 표시
- **[BLOCKING] 유저 선택 대기**

## Validation
- [ ] 모든 등록 템플릿과 비교했는가?
- [ ] 점수 계산이 matching_config 가중치를 따르는가?
- [ ] 추천 사유가 명확한가?
```

---

### 2.6 `skills/generate-page.skill.md`

**원본**: `prompts/generate-page.md` (검증 분리)

```markdown
# /generate-page — 레이아웃 JSON 생성

## Purpose
선택된 템플릿과 섹션 플랜 기반으로, 제품 콘텐츠를 채워
Figma 플러그인에 바로 적용 가능한 레이아웃 JSON을 생성합니다.

## Context
- 선택된 템플릿: `templates/[선택].template.json`
- 섹션 플랜: `output/{product}-section-plan.json`
- `skills/section-taxonomy.json`에서 **플랜 포함 섹션의 copywriting_guide + required_elements만** selective 로딩
- 미리보기: `tools/preview.html`

## Input
1. **선택된 템플릿** (match-template에서 유저가 선택)
2. **섹션 플랜** (수정 사항 반영된 최종 플랜)
3. **제품 정보**: 제품명, 브랜드, 설명, 핵심 기능, 가격(선택), 브랜드 컬러(선택)
4. **수정 요청** (선택)

## Processing

### 1. JSON 전체 구조
```json
{
  "name": "[제품명] 상세페이지",
  "width": 860,
  "fontFamily": "Inter",
  "template": "[템플릿 ID]",
  "brand_color": "#HEX",
  "children": []
}
```

### 2. 섹션 생성 (composition별)

#### stack (기본)
```json
{
  "name": "Section_XX_[taxonomy_id]",
  "height": "from template",
  "background": "#hex",
  "padding": {},
  "itemSpacing": 0,
  "layoutMode": "VERTICAL",
  "primaryAxisAlign": "CENTER",
  "counterAxisAlign": "CENTER",
  "children": []
}
```

#### composed (9분할)
```json
{
  "name": "Section_XX_[taxonomy_id]",
  "composition": "composed",
  "height": 600,
  "background": "#hex",
  "layers": [
    { "zIndex": 0, "region": "TL:BR", "element": {} }
  ]
}
```

#### split (2분할)
```json
{
  "name": "Section_XX_[taxonomy_id]",
  "composition": "split",
  "height": 500,
  "background": "#hex",
  "direction": "horizontal",
  "ratio": [1, 1],
  "left": { "valign": "MC", "children": [] },
  "right": { "valign": "MC", "children": [] }
}
```

### 3. 콘텐츠 채우기

#### 텍스트
```json
{
  "type": "TEXT",
  "name": "Main_Copy",
  "content": "실제 카피",
  "fontSize": 56,
  "fontWeight": 700,
  "color": "#FFFFFF",
  "textAlign": "CENTER"
}
```
- 시맨틱 컬러 → hex 변환
- 기본 textAlign: CENTER (나열형만 LEFT)
- 긴 텍스트: width: 760
- 줄바꿈: \n (들여쓰기 금지)

#### 이미지
```json
{
  "type": "IMAGE_AREA",
  "name": "Main_Product_Image",
  "label": "이미지 설명 (한글)",
  "ai_prompt": {
    "prompt": "영문 프롬프트 ([product] → 실제 제품명)",
    "negative": "text, watermark, logo, blurry",
    "style": "product_hero",
    "aspect_ratio": "4:3"
  },
  "width": 760,
  "height": 500,
  "placeholderColor": "#2A2A2A"
}
```

#### 버튼
```json
{
  "type": "BUTTON",
  "name": "CTA_Button",
  "text": "지금 구매하기",
  "backgroundColor": "#brand_hex",
  "color": "#FFFFFF",
  "fontSize": 18,
  "padding": { "top": 20, "bottom": 20, "left": 48, "right": 48 },
  "cornerRadius": 100
}
```

#### 복합 요소 (FAQ, GRID 등)
```json
{
  "type": "FAQ",
  "name": "FAQ_List",
  "items": [{ "q": "질문", "a": "답변" }],
  "itemBackground": "#1A1A1A",
  "itemCornerRadius": 12,
  "itemPadding": 24,
  "gap": 16
}
```

### 4. 배경색 규칙
- 시맨틱 → hex 변환
- 그라데이션: `gradient:#COLOR1-#COLOR2`
- 인접 섹션 다른 배경 (시각적 구분)
- 교차 패턴: #111111 → #1A1A1A → brand_main → 반복

### 5. 카피라이팅 규칙
- taxonomy의 `copywriting_guide` 참고
- Hook: 강렬하고 짧은 카피
- PainPoint: 공감형 질문
- Solution: 자신감 있는 선언
- FeatureDetail: Q&A 형식
- CTA: Hook 메인 카피 반복/변형

## Output
- `output/{product}-layout.json`
- 미리보기 안내: `tools/preview.html에서 확인 가능`

## Validation
→ /validate-layout 스킬로 분리됨
```

---

### 2.7 `skills/validate-layout.skill.md`

**원본**: `prompts/generate-page.md`의 검증 체크리스트 + `generate-template.md` 체크리스트 통합

```markdown
# /validate-layout — 레이아웃 JSON 구조 검증

## Purpose
생성된 레이아웃 JSON이 Figma 플러그인에서 정상 렌더링될 수 있는지 구조를 검증합니다.

## Context
- `output/{product}-layout.json` (generate-page 출력)
- 검증만 수행하므로 taxonomy 로딩 불필요

## Input
- layout JSON 파일 경로

## Processing

### 검증 항목

#### 필수 구조
- [ ] 루트에 `width: 860` 존재
- [ ] 루트에 `children` 배열 존재
- [ ] 모든 색상이 hex 값 (#으로 시작, 시맨틱 이름 아님)

#### 섹션 구조
- [ ] 모든 섹션에 `name`이 `Section_XX_[ID]` 형식
- [ ] stack 섹션: `layoutMode`, `primaryAxisAlign`, `counterAxisAlign` 존재
- [ ] composed 섹션: `layers` 배열, 각 layer에 `zIndex`, `region`, `element`
- [ ] split 섹션: `direction`, `ratio`, 양쪽 패널 존재

#### 텍스트 요소
- [ ] 모든 TEXT에 `type`, `name`, `content`, `fontSize`, `fontWeight`, `color`
- [ ] 긴 텍스트(30자 이상)에 `width: 760`
- [ ] `\n` 줄바꿈 후 공백 들여쓰기 없음

#### 이미지 요소
- [ ] 모든 IMAGE_AREA에 `label`, `width`, `height`, `placeholderColor`
- [ ] 모든 IMAGE_AREA에 `ai_prompt` (prompt, style, aspect_ratio)
- [ ] ai_prompt.prompt에 `[product]` 플레이스홀더 잔재 없음

#### 기능 상세
- [ ] FeatureDetail의 feature_index가 1부터 연속적
- [ ] 섹션 order가 연속적 (01, 02, 03...)

#### CTA
- [ ] CTA 섹션에 BUTTON 요소 존재

### 결과 형식
```json
{
  "status": "PASS | FAIL",
  "total_checks": 15,
  "passed": 15,
  "failed": 0,
  "errors": [],
  "warnings": [
    {
      "check": "long_text_width",
      "location": "Section_05_PainPoint > Check_3",
      "message": "40자 텍스트에 width 속성 없음"
    }
  ]
}
```

## Output
- `output/{product}-validation.json`
- PASS → "Figma 플러그인 적용 가능"
- FAIL → 에러 목록 표시 + /generate-page 재실행 권장

## Validation
- [ ] 모든 체크 항목을 빠짐없이 검사했는가?
- [ ] error와 warning을 구분했는가? (error = 렌더링 실패, warning = 품질 이슈)
```

---

### Phase 2: 에이전트 파일 2개 생성

---

### 2.8 `agents/ref-to-template.md`

```markdown
# /ref-to-template — 레퍼런스 → 템플릿 에이전트

## 역할
레퍼런스 이미지를 분석하여 재사용 가능한 템플릿을 생성하고 레지스트리에 등록하는
3단계 파이프라인을 오케스트레이션합니다.

## 워크플로우

```
레퍼런스 이미지 제공
       ↓
[Step 1] /analyze-ref
  → output/analysis-{name}.json
  → 유저에게 요약 (섹션 수, 매핑률, 미분류 섹션)
  → 미분류 섹션 있으면 skills/unmapped-sections/에 리포트 저장
       ↓
[Step 2] /generate-template
  → templates/ref-{name}.template.json
  → 유저에게 템플릿 요약 (섹션 구조, 컬러, 타이포)
       ↓
[Step 3] /register-template
  → templates/_registry.json 업데이트
  → 완료: "ref-{name} 템플릿이 등록되었습니다"
```

## 입력 요구사항
- 레퍼런스 이미지: `references/` 폴더에 저장된 스크린샷
- 레퍼런스 이름: 영문 소문자 + 하이픈 (예: `apple-airpods`)

## 에러 처리
- Step 1 실패 → 이미지 품질/크기 문제 안내
- Step 2 실패 → analysis JSON 검증 후 재시도
- Step 3 실패 → 수동 등록 안내

## 참조 스킬
- `skills/analyze-ref.skill.md`
- `skills/generate-template.skill.md`
- `skills/register-template.skill.md`
```

---

### 2.9 `agents/product-to-page.md`

```markdown
# /product-to-page — 제품 → 상세페이지 에이전트

## 역할
제품 정보를 받아 섹션 설계 → 템플릿 매칭 → 레이아웃 생성 → 검증까지의
4단계 파이프라인을 오케스트레이션합니다.

## 워크플로우

```
제품 정보 제공
       ↓
[Step 1] /plan-sections
  → output/{product}-section-plan.json
  → 유저에게 섹션 플랜 표시
  → [OPTIONAL] 수정 요청 수렴 → 플랜 업데이트
       ↓
[Step 2] /match-template
  → output/{product}-template-match.json
  → 상위 3개 템플릿 추천 표시
  → [BLOCKING] 유저 선택 대기
       ↓
[Step 3] /generate-page
  → output/{product}-layout.json
  → 미리보기 안내 (tools/preview.html)
       ↓
[Step 4] /validate-layout
  → output/{product}-validation.json
  → PASS: "Figma 플러그인 적용 가능합니다"
  → FAIL: 에러 표시 + Step 3 재실행 (자동 1회)
```

## 입력 요구사항
- 제품명 (한글 + 영문)
- 제품 설명 (특징, 기능, 차별점)
- 핵심 기능 수 (기본: 6)
- (선택) 선호 스타일, 브랜드 컬러, 가격, 필수/제외 섹션

## 블로킹 포인트
- **Step 2 완료 후**: 유저가 템플릿을 선택할 때까지 대기
- **Step 1 완료 후**: 유저 수정 요청 없으면 자동 진행

## 에러 처리
- Step 4 FAIL → Step 3 자동 재실행 (1회)
- 2회 연속 FAIL → 에러 상세 표시, 수동 수정 안내

## 참조 스킬
- `skills/plan-sections.skill.md`
- `skills/match-template.skill.md`
- `skills/generate-page.skill.md`
- `skills/validate-layout.skill.md`
```

---

### Phase 3: CLAUDE.md 업데이트

#### 제거할 내용
- `## 워크플로우` 섹션 전체 (워크플로우 A/B/C)
- `### 스킬 요약` 테이블 (3개 스킬)
- `### 섹션 분류 체계 (Taxonomy)` 일부 (에이전트에서 관리)

#### 추가할 내용 (워크플로우 섹션 대체)

```markdown
## 에이전트/스킬 시스템

### 에이전트 (워크플로우 오케스트레이터)

| 에이전트 | 파일 | 용도 | 스킬 체인 |
|---------|------|------|----------|
| `/ref-to-template` | `agents/ref-to-template.md` | 레퍼런스 → 템플릿 | analyze-ref → generate-template → register-template |
| `/product-to-page` | `agents/product-to-page.md` | 제품 → 상세페이지 | plan-sections → match-template → generate-page → validate-layout |

### 스킬 (개별 단계)

| 스킬 | 파일 | Input | Output |
|------|------|-------|--------|
| `/analyze-ref` | `skills/analyze-ref.skill.md` | 레퍼런스 이미지 | `output/analysis-{name}.json` |
| `/generate-template` | `skills/generate-template.skill.md` | analysis JSON | `templates/ref-{name}.template.json` |
| `/register-template` | `skills/register-template.skill.md` | template JSON | `_registry.json` 업데이트 |
| `/plan-sections` | `skills/plan-sections.skill.md` | 제품 정보 | `output/{product}-section-plan.json` |
| `/match-template` | `skills/match-template.skill.md` | section plan | `output/{product}-template-match.json` |
| `/generate-page` | `skills/generate-page.skill.md` | template + plan | `output/{product}-layout.json` |
| `/validate-layout` | `skills/validate-layout.skill.md` | layout JSON | `output/{product}-validation.json` |

### Taxonomy 슬라이싱

각 스킬은 taxonomy 전체를 로딩하지 않고 필요한 필드만 추출합니다:

- **Slim** (분석/플래닝용): `id, name, category, purpose, is_required, frequency, keywords, visual_cues, typical_compositions` → ~3,000 토큰
- **Selective** (생성용): 플랜 포함 섹션의 `required_elements, copywriting_guide`만 → ~3,600 토큰
- **Match Config**: `matching_config` 블록만 → ~200 토큰

### 워크플로우

#### 새 레퍼런스 분석 시
```
/ref-to-template → (자동: analyze-ref → generate-template → register-template)
```

#### 새 상세페이지 생성 시
```
/product-to-page → (plan-sections → [유저 확인] → match-template → [유저 선택] → generate-page → validate-layout)
```

#### 개별 스킬 직접 실행
각 스킬은 독립적으로도 실행 가능합니다.
```
```

---

### Phase 4: 기존 prompts/ 정리

### 2.10 `prompts/_DEPRECATED.md`

```markdown
# ⚠️ DEPRECATED — 이 폴더의 프롬프트는 더 이상 사용되지 않습니다

## 마이그레이션 안내

이 폴더의 프롬프트들은 `skills/` 폴더의 스킬 파일로 리팩토링되었습니다.

| 기존 프롬프트 | 신규 스킬 |
|--------------|----------|
| `analyze-reference.md` | `skills/analyze-ref.skill.md` |
| `generate-template.md` | `skills/generate-template.skill.md` + `skills/register-template.skill.md` |
| `recommend-template.md` | `skills/plan-sections.skill.md` + `skills/match-template.skill.md` |
| `generate-page.md` | `skills/generate-page.skill.md` + `skills/validate-layout.skill.md` |

## 에이전트 오케스트레이터

워크플로우 실행은 에이전트 파일을 참조하세요:
- `agents/ref-to-template.md` — 레퍼런스 → 템플릿
- `agents/product-to-page.md` — 제품 → 상세페이지

## 기존 파일은 참조용으로 보존됩니다.
삭제하지 마세요 — 원본 로직 확인 시 유용합니다.
```

---

## 3. 주요 폴더 구조 (업데이트 후)

```
figma-detail-page-agent-main/
├── agents/                              # 에이전트 오케스트레이터
│   ├── ref-to-template.md               # Agent 1
│   └── product-to-page.md               # Agent 2
├── skills/                              # 스킬 시스템
│   ├── section-taxonomy.json            # 마스터 데이터 (유지)
│   ├── unmapped-sections/               # 미분류 리포트 (유지)
│   ├── analyze-ref.skill.md             # 스킬 1
│   ├── generate-template.skill.md       # 스킬 2
│   ├── register-template.skill.md       # 스킬 3
│   ├── plan-sections.skill.md           # 스킬 4
│   ├── match-template.skill.md          # 스킬 5
│   ├── generate-page.skill.md           # 스킬 6
│   └── validate-layout.skill.md         # 스킬 7
├── prompts/                             # deprecated (참조용 보존)
│   ├── _DEPRECATED.md
│   ├── analyze-reference.md
│   ├── generate-template.md
│   ├── recommend-template.md
│   └── generate-page.md
├── templates/                           # 템플릿 (유지)
├── output/                              # 중간/최종 결과물
├── tools/                               # 개발 도구 (유지)
├── figma-plugin/                        # Figma 플러그인 (유지)
├── 크래프트볼트/                          # 기준 결과물 (유지)
├── references/                          # 레퍼런스 이미지 (유지)
└── CLAUDE.md                            # 업데이트됨
```

---

## 4. 구현 체크리스트

- [ ] `agents/` 디렉토리 생성
- [ ] `skills/analyze-ref.skill.md` 생성
- [ ] `skills/generate-template.skill.md` 생성
- [ ] `skills/register-template.skill.md` 생성
- [ ] `skills/plan-sections.skill.md` 생성
- [ ] `skills/match-template.skill.md` 생성
- [ ] `skills/generate-page.skill.md` 생성
- [ ] `skills/validate-layout.skill.md` 생성
- [ ] `agents/ref-to-template.md` 생성
- [ ] `agents/product-to-page.md` 생성
- [ ] `CLAUDE.md` 워크플로우 섹션 리팩토링
- [ ] `prompts/_DEPRECATED.md` 생성

---

## 5. 참고: 현재 소스 파일 위치 및 줄 수

| 파일 | 줄 수 | 역할 |
|------|------|------|
| `prompts/analyze-reference.md` | 379 | 4단계 이미지 분석 (글로벌→섹션→패턴→미분류) |
| `prompts/generate-template.md` | 336 | 분석→v3.0 템플릿 변환 + 레지스트리 등록 |
| `prompts/recommend-template.md` | 206 | 섹션 설계(1단계) + 매칭(2단계) + 추천(3단계) |
| `prompts/generate-page.md` | 307 | 레이아웃 JSON 생성 + 검증 체크리스트 |
| `skills/section-taxonomy.json` | 598 | 5카테고리, 20+섹션, matching_config |
| `templates/_registry.json` | 35 | 3개 템플릿 등록 |
| `CLAUDE.md` | ~300 | 프로젝트 컨텍스트 |
