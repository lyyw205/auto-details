# 상세페이지 JSON 생성 프롬프트

## 목적

선택된 템플릿과 섹션 플랜을 기반으로, 제품 콘텐츠를 채워 넣어
**Figma 플러그인에 바로 적용 가능한 레이아웃 JSON**을 생성합니다.

### 참조 파일

- 섹션 분류 체계: `skills/section-taxonomy.json`
- 선택된 템플릿: `templates/[선택된 템플릿].template.json`
- 기준 결과물: `크래프트볼트/craftvolt-chainsaw-v3-final.json`
- 미리보기 도구: `tools/preview.html`

---

## 입력

1. **선택된 템플릿**: `/recommend-template` 결과에서 사용자가 선택한 템플릿
2. **섹션 플랜**: 사용할 섹션 목록과 순서 (수정 사항 반영)
3. **제품 정보**:
   - 제품명, 브랜드명
   - 제품 설명 텍스트
   - 핵심 기능 목록
   - 가격 정보 (선택)
   - 브랜드 컬러 (선택, 없으면 템플릿 기본값)
4. **수정 요청**: (선택) 추천된 템플릿에서 변경할 사항

---

## 생성 규칙

### 1. JSON 전체 구조

```json
{
  "name": "[제품명] 상세페이지",
  "width": 860,
  "fontFamily": "Inter",
  "template": "[사용된 템플릿 ID]",
  "brand_color": "#HEX",
  "children": [
    { "섹션 1" },
    { "섹션 2" },
    "..."
  ]
}
```

### 2. 섹션 생성 규칙

각 섹션은 템플릿의 `composition` 타입에 따라 구조가 달라집니다.

#### 2-1. `stack` composition (기본값)

```json
{
  "name": "Section_[순서번호]_[taxonomy_id]",
  "height": "템플릿 layout.height",
  "background": "템플릿 layout.background (hex로 변환)",
  "padding": "템플릿 layout.padding",
  "itemSpacing": "템플릿 layout.itemSpacing",
  "layoutMode": "템플릿 layout.layoutMode",
  "primaryAxisAlign": "템플릿 layout.primaryAxisAlign",
  "counterAxisAlign": "템플릿 layout.counterAxisAlign",
  "children": [ "...요소들..." ]
}
```

#### 2-2. `composed` composition (9분할 자유 배치)

```json
{
  "name": "Section_[순서번호]_[taxonomy_id]",
  "composition": "composed",
  "height": "템플릿 layout.height",
  "background": "hex로 변환",
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

- `children` 대신 `layers` 배열 사용
- 각 layer에 `zIndex`, `region`, `element` 포함
- region은 9분할 그리드 코드 (TL~BR, 스팬: "TL:BR")

#### 2-3. `split` composition (2분할 레이아웃)

```json
{
  "name": "Section_[순서번호]_[taxonomy_id]",
  "composition": "split",
  "height": "템플릿 layout.height",
  "background": "hex로 변환",
  "direction": "horizontal",
  "ratio": [1, 1],
  "left": {
    "valign": "MC",
    "children": [
      { "type": "TEXT", "name": "Title", "content": "실제 카피", "fontSize": 32, "fontWeight": 700, "color": "#111" },
      { "type": "TEXT", "name": "Desc", "content": "설명 텍스트", "fontSize": 16, "fontWeight": 400, "color": "#666" }
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

- `children` 대신 `left`/`right` (horizontal) 또는 `top`/`bottom` (vertical) 사용
- 각 패널은 `valign` + `children` 구조

#### 섹션명 규칙

- 기본: `Section_[순서(2자리)]_[taxonomy_id]`
  - 예: `Section_01_Hook`, `Section_09_FeatureDetail`
- FeatureDetail 반복 시: `Section_[순서]_Feature[N]_Detail`
  - 예: `Section_09_Feature1_Detail`, `Section_10_Feature2_Detail`

### 3. 콘텐츠 채우기 규칙

#### 텍스트 요소

taxonomy의 `required_elements`를 참고하여 실제 콘텐츠를 채웁니다:

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
- **color**: 템플릿의 color_system 참조, 시맨틱 이름은 hex로 변환
  - `brand_main` → 실제 hex 값
  - `accent` → 실제 hex 값
  - `dark` → `#111111`
- **textAlign**: 기본 `CENTER`, 나열형만 `LEFT`
- **width**: 긴 텍스트는 `760` 추가
- **줄바꿈**: `\n`으로 자연스러운 위치에서 분리, 들여쓰기 금지

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

- **label**: 어떤 이미지가 들어갈지 구체적으로 한글 설명
- **ai_prompt**: AI 이미지 생성을 위한 프롬프트 (아래 규칙 참조)
- **placeholderColor**: 다크 배경 → `#2A2A2A`, 밝은 배경 → `#E8E8E8`
- **cornerRadius**: 필요 시 추가

#### ai_prompt 커스터마이징 규칙

템플릿의 `ai_prompt`를 실제 제품 정보에 맞게 수정합니다:

1. **`[product]` 플레이스홀더 치환**: 실제 제품명(영문)으로 교체
   - 예: `"[product]"` → `"CraftVolt 20V Chainsaw"`
2. **제품 특성 반영**: 제품의 핵심 특성을 프롬프트에 추가
   - 예: 전동공구 → `"power tool, rugged design"`
   - 예: 화장품 → `"luxury cosmetics, elegant packaging"`
3. **스타일 프리셋 유지**: 템플릿의 `style` 값을 그대로 사용
4. **비율 유지**: 템플릿의 `aspect_ratio`를 그대로 사용

**스타일별 프롬프트 가이드:**

| style | 프롬프트 핵심 요소 |
|-------|-----------------|
| `product_hero` | front/45-degree view, white/transparent background, studio lighting |
| `product_lifestyle` | in-use scenario, natural lighting, real environment |
| `product_detail` | macro closeup, texture detail, extreme detail |
| `product_flat` | top-down flat lay, organized arrangement, white background |
| `infographic` | clean design, icons, data visualization, minimal |
| `mood` | atmospheric, brand mood, dark/warm tones, cinematic |
| `comparison` | side-by-side, before/after, split view |
| `background_only` | simple background, gradient, texture, space for text overlay |

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

#### 복합 요소 (GRID, FAQ, COMPARISON 등)

```json
{
  "type": "FAQ",
  "name": "FAQ_List",
  "items": [
    { "q": "질문 텍스트", "a": "답변 텍스트" }
  ],
  "itemBackground": "#1A1A1A",
  "itemCornerRadius": 12,
  "itemPadding": 24,
  "gap": 16
}
```

### 4. 배경색 규칙

- 시맨틱 컬러(`brand_main`, `accent`)는 **실제 hex 값으로 변환**
- 그라데이션: `gradient:#COLOR1-#COLOR2` 형식
- 인접 섹션은 다른 배경색 사용 (시각적 구분)
- 일반적인 교차 패턴: `#111111` → `#1A1A1A` → `brand_main` → 반복

### 5. 카피라이팅 규칙

- taxonomy의 `copywriting_guide`를 참고하여 각 섹션의 톤 결정
- Hook: 강렬하고 짧은 카피
- PainPoint: 공감형 질문
- Solution: 자신감 있는 선언
- FeatureDetail: Q&A 형식 (`Q. ...` / `A. ...`)
- CTA: Hook의 메인 카피를 반복/변형

---

## 출력

### 파일 저장

- 경로: `output/[제품명-영문]-layout.json`
- 예: `output/cleanair-a1-layout.json`

### 검증 체크리스트

생성된 JSON이 다음을 충족하는지 확인:

- [ ] `width`가 860인가?
- [ ] 모든 색상이 hex 값인가? (시맨틱 이름 아닌 실제 값)
- [ ] `stack` 섹션에 `layoutMode`, `primaryAxisAlign`, `counterAxisAlign`이 있는가?
- [ ] `composed` 섹션에 `layers` 배열, 각 layer에 `zIndex`, `region`, `element`가 있는가?
- [ ] `split` 섹션에 `direction`, `ratio`, 양쪽 패널(`left`/`right` 또는 `top`/`bottom`)이 있는가?
- [ ] 모든 TEXT 요소에 `type`, `name`, `content`, `fontSize`, `fontWeight`, `color`가 있는가?
- [ ] 모든 IMAGE_AREA에 `label`, `ai_prompt`, `width`, `height`, `placeholderColor`가 있는가?
- [ ] `ai_prompt.prompt` 내 `[product]`가 실제 제품명으로 치환되었는가?
- [ ] 긴 텍스트에 `width: 760`이 설정되었는가?
- [ ] `\n` 줄바꿈 후 들여쓰기가 없는가?
- [ ] 섹션 name이 `Section_XX_[ID]` 형식인가?
- [ ] FeatureDetail의 feature_index가 연속적인가?
- [ ] CTA 섹션에 BUTTON 요소가 있는가?

### 미리보기 안내

생성 완료 후 사용자에게 안내:

```
생성된 JSON을 tools/preview.html에서 미리보기할 수 있습니다.
1. 브라우저에서 tools/preview.html 열기
2. output/[파일명].json 파일 로드 또는 JSON 붙여넣기
3. 렌더링 버튼 클릭
4. 수정이 필요하면 알려주세요 → JSON 수정 후 재렌더링
```
