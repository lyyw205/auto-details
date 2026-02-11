# /generate-page — 레이아웃 JSON 생성

## Purpose
선택된 템플릿과 섹션 플랜을 기반으로, 제품 콘텐츠를 채워 넣어
**Figma 플러그인에 바로 적용 가능한 레이아웃 JSON**을 생성합니다.

## Context
- 선택된 템플릿: `templates/[선택].template.json`
- 섹션 플랜: `output/{product}-section-plan.json`
- `skills/section-taxonomy.json`에서 **플랜 포함 섹션의 `copywriting_guide` + `required_elements`만** selective 로딩
- 미리보기: `tools/preview.html`

## Input
1. **선택된 템플릿**: `/match-template`에서 유저가 선택한 템플릿
2. **섹션 플랜**: 수정 사항 반영된 최종 플랜
3. **제품 정보**:
   - 제품명, 브랜드명
   - 제품 설명 텍스트
   - 핵심 기능 목록
   - 가격 정보 (선택)
   - 브랜드 컬러 (선택, 없으면 템플릿 기본값)
4. **수정 요청**: (선택) 추천된 템플릿에서 변경할 사항

## Processing

### 1. JSON 전체 구조

```json
{
  "name": "[제품명] 상세페이지",
  "width": 860,
  "fontFamily": "Inter",
  "template": "[사용된 템플릿 ID]",
  "brand_color": "#HEX",
  "children": []
}
```

### 2. 섹션 생성 (composition별)

#### `stack` composition (기본값)

```json
{
  "name": "Section_XX_[taxonomy_id]",
  "height": "템플릿 layout.height",
  "background": "#hex (시맨틱 → hex 변환)",
  "padding": { "top": 0, "bottom": 0, "left": 0, "right": 0 },
  "itemSpacing": 24,
  "layoutMode": "VERTICAL",
  "primaryAxisAlign": "CENTER",
  "counterAxisAlign": "CENTER",
  "children": []
}
```

#### `composed` composition (9분할 자유 배치)

```json
{
  "name": "Section_XX_[taxonomy_id]",
  "composition": "composed",
  "height": 600,
  "background": "#hex",
  "layers": [
    {
      "zIndex": 0,
      "region": "TL:BR",
      "element": {
        "type": "IMAGE_AREA",
        "name": "Background_Image",
        "label": "구체적 한글 설명",
        "ai_prompt": { "prompt": "...", "style": "...", "aspect_ratio": "..." },
        "placeholderColor": "#2A2A2A"
      }
    },
    {
      "zIndex": 1,
      "region": "BL:BC",
      "element": {
        "type": "TEXT",
        "name": "Main_Copy",
        "content": "실제 카피",
        "fontSize": 42,
        "fontWeight": 700,
        "color": "#FFFFFF"
      }
    }
  ]
}
```

#### `split` composition (2분할 레이아웃)

```json
{
  "name": "Section_XX_[taxonomy_id]",
  "composition": "split",
  "height": 500,
  "background": "#hex",
  "direction": "horizontal",
  "ratio": [1, 1],
  "left": {
    "valign": "MC",
    "children": [
      { "type": "TEXT", "name": "Title", "content": "실제 카피", "fontSize": 32, "fontWeight": 700, "color": "#111" }
    ]
  },
  "right": {
    "valign": "MC",
    "children": [
      { "type": "IMAGE_AREA", "name": "Feature_Image", "label": "기능 이미지 설명", "width": 360, "height": 270 }
    ]
  }
}
```

#### 섹션명 규칙
- 기본: `Section_XX_[taxonomy_id]` (XX = 2자리 순서)
- FeatureDetail 반복: `Section_XX_Feature[N]_Detail`

### 3. 콘텐츠 채우기 규칙

#### 텍스트 요소

```json
{
  "type": "TEXT",
  "name": "Main_Copy",
  "content": "실제 제품 카피라이팅 텍스트",
  "fontSize": 56,
  "fontWeight": 700,
  "color": "#FFFFFF",
  "textAlign": "CENTER"
}
```

- **fontSize, fontWeight**: taxonomy의 required_elements 값 사용
- **color**: 시맨틱 이름은 hex로 변환 (`brand_main` → 실제 hex, `accent` → 실제 hex)
- **textAlign**: 기본 `CENTER`, 나열형만 `LEFT`
- **width**: 긴 텍스트(30자 이상)는 `760` 추가
- **줄바꿈**: `\n`으로 자연스러운 위치에서 분리, **들여쓰기 금지**

#### 이미지 요소

```json
{
  "type": "IMAGE_AREA",
  "name": "Main_Product_Image",
  "label": "이미지 설명 (한글, 구체적으로)",
  "ai_prompt": {
    "prompt": "Professional product photography of [제품명 영문], front view, white background, studio lighting, 8k",
    "negative": "text, watermark, logo, blurry, low quality",
    "style": "product_hero",
    "aspect_ratio": "4:3"
  },
  "width": 760,
  "height": 500,
  "placeholderColor": "#2A2A2A"
}
```

- **label**: 구체적 한글 설명
- **ai_prompt**: 템플릿의 `[product]`를 실제 제품명으로 치환
- **placeholderColor**: 다크 배경 → `#2A2A2A`, 밝은 배경 → `#E8E8E8`

#### ai_prompt 커스터마이징

1. `[product]` → 실제 제품명 (영문)
2. 제품 특성 반영 추가 (전동공구 → `"power tool, rugged design"`)
3. `style`, `aspect_ratio` 템플릿 값 유지

스타일별 프롬프트 핵심:
| style | 핵심 요소 |
|-------|---------|
| `product_hero` | front/45-degree view, white background, studio lighting |
| `product_lifestyle` | in-use scenario, natural lighting, real environment |
| `product_detail` | macro closeup, texture detail, extreme detail |
| `product_flat` | top-down flat lay, organized arrangement |
| `infographic` | clean design, icons, data visualization |
| `mood` | atmospheric, brand mood, cinematic |
| `comparison` | side-by-side, before/after |
| `background_only` | simple background, gradient, space for text overlay |

#### 버튼 요소

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
  "items": [{ "q": "질문 텍스트", "a": "답변 텍스트" }],
  "itemBackground": "#1A1A1A",
  "itemCornerRadius": 12,
  "itemPadding": 24,
  "gap": 16
}
```

### 4. 배경색 규칙

- 시맨틱 컬러 → **실제 hex 값으로 변환**
- 그라데이션: `gradient:#COLOR1-#COLOR2`
- 인접 섹션은 다른 배경색 (시각적 구분)
- 일반 교차 패턴: `#111111` → `#1A1A1A` → `brand_main` → 반복

### 5. 카피라이팅 규칙

taxonomy의 `copywriting_guide`를 참고:
- **Hook**: 강렬하고 짧은 카피
- **PainPoint**: 공감형 질문 (`"혹시 이런 경험 있으신가요?"`)
- **Solution**: 자신감 있는 선언
- **FeatureDetail**: Q&A 형식 (`"Q. 왜 [기능]인가요?"` / `"A. [혜택]"`)
- **CTA**: Hook의 메인 카피를 반복/변형

## Output
- 파일: `output/{product}-layout.json`
- 미리보기 안내: `tools/preview.html에서 확인 가능`

## Validation
→ `/validate-layout` 스킬로 분리되었습니다. generate-page 실행 후 자동으로 validate-layout이 실행됩니다.
