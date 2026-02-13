# Design Style Guide

> 상세페이지 HTML 위젯 시스템의 **단일 스타일 참조 문서 (Single Source of Truth)**.
> 모든 스킬(extract-widgets, generate-html 등)은 이 문서를 참조합니다.
>
> **표준 기반**: W3C Design Tokens (DTCG), Style Dictionary CTI, Material Design 3, Open Props

---

## 1. Design Token Hierarchy

3-tier 토큰 구조를 따릅니다 (W3C DTCG / Style Dictionary 표준).

### 1.1 Primitive Tokens (원시 토큰)

맥락 없는 원시 값. "무엇인가"를 설명합니다.

```
color.neutral.0      = #000000
color.neutral.50     = #0A0A0A
color.neutral.100    = #111111
color.neutral.150    = #1A1A1A
color.neutral.200    = #2A2A2A
color.neutral.400    = #666666
color.neutral.500    = #888888
color.neutral.900    = #F5F5F5
color.neutral.1000   = #FFFFFF

spacing.unit         = 4px      (base-4 시스템)
spacing.2            = 8px
spacing.3            = 12px
spacing.4            = 16px
spacing.5            = 20px
spacing.6            = 24px
spacing.8            = 32px
spacing.10           = 40px
spacing.12           = 48px
spacing.16           = 64px
spacing.20           = 80px
spacing.25           = 100px

radius.0             = 0px
radius.1             = 4px
radius.2             = 8px
radius.3             = 12px
radius.4             = 16px
radius.5             = 20px
radius.round         = 9999px
```

### 1.2 Semantic Tokens (시맨틱 토큰)

용도와 의미를 설명합니다. 프리셋에 의해 실제 값이 결정됩니다.

```
── Color ──
color.brand.primary        → CSS: var(--brand-main)
color.brand.secondary      → CSS: var(--accent)

color.surface.base         = #0A0A0A      (body 배경)
color.surface.dark-1       = #111111      (섹션 배경 A)
color.surface.dark-2       = #1A1A1A      (섹션 배경 B)
color.surface.elevated     = #2A2A2A      (카드/플레이스홀더)
color.surface.brand        → linear-gradient(135deg, var(--brand-main), darker 20%)
color.surface.accent       → linear-gradient(135deg, var(--accent), darker 15%)

color.text.primary         = #FFFFFF
color.text.secondary       = rgba(255,255,255, 0.8)
color.text.tertiary        = rgba(255,255,255, 0.6)
color.text.muted           = #666666
color.text.sub             = #888888
color.text.brand           → var(--brand-main)
color.text.accent          → var(--accent)

color.border.subtle        = rgba(255,255,255, 0.08)
color.border.default       = rgba(255,255,255, 0.12)
color.border.brand         → var(--brand-main)

── Spacing ──
spacing.section.padding    = 80px 50px    (section-padding)
spacing.section.padding-lg = 100px 50px   (section-padding-lg)
spacing.content.gap        = 24px         (콘텐츠 기본 간격)
spacing.element.gap        = 16px         (요소 간 간격)
spacing.card.padding       = 24px         (glass-card 내부)

── Typography ──
font.family.primary        = Pretendard, system-ui, -apple-system, sans-serif
font.family.fallback       = Inter, system-ui, sans-serif

── Layout ──
size.canvas.width          = 860px
size.content.width         = 760px
size.content.max-width     = 760px
```

### 1.3 Component Tokens (컴포넌트 토큰)

특정 UI 컴포넌트에 귀속된 토큰.

```
── Glass Card ──
card.glass.background      = rgba(255, 255, 255, 0.05)
card.glass.blur            = 12px
card.glass.border          = 1px solid rgba(255, 255, 255, 0.08)
card.glass.radius          = 16px

card.glass-strong.background = rgba(255, 255, 255, 0.08)
card.glass-strong.blur     = 16px
card.glass-strong.border   = 1px solid rgba(255, 255, 255, 0.12)
card.glass-strong.radius   = 20px

── Number Badge ──
badge.num.size             = 48px
badge.num.radius           = 12px
badge.num.background       = rgba(255, 255, 255, 0.05)
badge.num.border           = 1px solid rgba(255, 255, 255, 0.1)
badge.num.font-size        = 20px
badge.num.color            → var(--brand-main)

── CTA Button ──
button.cta.padding         = 20px 48px
button.cta.radius          = 9999px (pill)
button.cta.font-size       = 18px
button.cta.font-weight     = 700
button.cta.background      → linear-gradient(135deg, var(--brand-main), var(--accent))
button.cta.text-color      = #FFFFFF

── Image Placeholder ──
placeholder.background     = #2A2A2A (dark theme) / #E8E8E8 (light theme)
placeholder.label.color    = #666666
placeholder.label.size     = 14px
placeholder.ai-badge.bg    = rgba(79, 143, 247, 0.15)
placeholder.ai-badge.color = rgba(79, 143, 247, 0.6)

── Divider ──
divider.gradient           = linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)
divider.brand              = linear-gradient(90deg, transparent, var(--brand-main), transparent)
divider.brand.width        = 60%
divider.brand.height       = 2px
```

---

## 2. Color System

### 2.1 CSS Custom Properties (런타임 변수)

```css
:root {
  --brand-main: {{BRAND_MAIN}};   /* 프리셋 또는 제품 지정 */
  --accent: {{ACCENT}};           /* 프리셋 또는 제품 지정 */
}
```

이 2개의 CSS 변수만 동적입니다. 나머지 색상은 고정입니다.

### 2.2 Tailwind Color Map

```js
colors: {
  brand:       'var(--brand-main)',
  accent:      'var(--accent)',
  dark: {
    1: '#111111',    // surface.dark-1
    2: '#1A1A1A',    // surface.dark-2
  },
  sub:         '#888888',    // text.sub
  muted:       '#666666',    // text.muted
  placeholder: '#2A2A2A',   // surface.elevated
}
```

### 2.3 Color Remapping (컬러 리매핑)

위젯 추출 시 소스 레퍼런스의 실제 hex를 사용하고,
`generate-html` 조합 시 CSS 변수로 치환합니다.

| 위젯 HTML 내 색상 | 치환 대상 |
|-------------------|----------|
| 소스 프리셋 `brand_main` hex | `var(--brand-main)` |
| 소스 프리셋 `accent` hex | `var(--accent)` |
| 중립색 (#FFFFFF, #888888 등) | 그대로 유지 |
| 소스 프리셋 `dark_1` / `dark_2` | 밝기 유지하며 다크 배경으로 사용 |

### 2.4 Dark Theme Contrast Requirements

W3C WCAG 2.1 기준:
- **일반 텍스트**: 최소 4.5:1 대비율
- **큰 텍스트** (24px+ 또는 19px+ bold): 최소 3:1 대비율
- **장식/비필수 요소**: 대비 제한 없음

실용 가이드:
- 순수 검정 (#000000) 사용 금지 → `#0A0A0A` 이상
- 다크 그레이 사용: `#111111`, `#1A1A1A`, `#2A2A2A`
- 보조 텍스트 최소 밝기: `#888888` (dark-1 위에서 약 5.5:1)

---

## 3. Typography System

### 3.1 Type Scale (Material Design 3 기반 커스텀)

| Semantic Name | Tailwind Class | Size | Line Height | Letter Spacing | Weight | 용도 |
|---|---|---|---|---|---|---|
| `display.hero` | `text-hero` | 56px | 1.2 | -0.02em | 700 | Hook/CTA 메인 카피 |
| `display.section` | `text-section` | 40px | 1.3 | -0.02em | 700 | 섹션 제목 |
| `display.feature-num` | `text-feature-num` | 72px | 1.0 | -0.04em | 700 | 기능 번호 (01, 02) |
| `heading.answer` | `text-answer` | 36px | 1.3 | -0.02em | 700 | Q&A 답변 제목 |
| `heading.sub` | `text-sub` | 28px | 1.4 | -0.01em | 500 | 서브 타이틀 |
| `heading.question` | `text-question` | 28px | 1.4 | -0.01em | 600 | Q&A 질문 |
| `heading.item` | `text-item` | 24px | 1.4 | -0.01em | 600 | 항목 제목 |
| `body.default` | `text-body` | 22px | 1.6 | 0 | 400 | 본문 텍스트 |
| `body.small` | `text-small` | 20px | 1.6 | 0 | 400 | 보조 텍스트 |
| `label.caption` | `text-caption` | 14px | 1.5 | 0 | 400 | 캡션, 라벨 |

### 3.2 Typography Rules

- **기본 정렬**: `text-center` (가운데 정렬)
- **예외**: 나열형 콘텐츠(체크리스트, 스펙 테이블)만 `text-left`
- **긴 텍스트**: `max-w-[760px]` 또는 `content-narrow` 클래스 적용
- **줄바꿈**: HTML에서 `<br>` 사용. 들여쓰기 금지.
- **타이틀 장식**: `tracking-tight` 적용 (hero, section, answer 레벨)
- **CTA/Hero 텍스트**: `text-shadow-hero` 적용

### 3.3 Font Weight Mapping

| Preset Value | CSS Weight | Tailwind Class |
|---|---|---|
| 400 | normal | `font-normal` |
| 500 | medium | `font-medium` |
| 600 | semibold | `font-semibold` |
| 700 | bold | `font-bold` |

### 3.4 Font Size → Tailwind Mapping

프리셋의 `typography.fontSize` 값을 Tailwind로 매핑:

| Preset fontSize | Tailwind 변환 |
|---|---|
| 시맨틱 일치 (56, 40, 36 등) | `text-hero`, `text-section` 등 |
| 비표준 크기 | `text-[{size}px]` (임의 값) |

---

## 4. Layout System

### 4.1 Canvas & Content

```
┌──────────── 860px (Canvas) ────────────┐
│  ┌──────── 760px (Content) ────────┐   │
│  │                                 │   │
│  │   section-padding: 80px 50px    │   │
│  │                                 │   │
│  └─────────────────────────────────┘   │
└────────────────────────────────────────┘
```

| Token | Value | CSS Class |
|-------|-------|-----------|
| Canvas width | 860px | `.page-canvas` |
| Content width | 760px | `.content-narrow` / `w-content` |
| Section padding | 80px 50px | `.section-padding` |
| Section padding (large) | 100px 50px | `.section-padding-lg` |
| Body background | #0A0A0A | `body` 기본 |

---

## 5. Visual Effects

### 5.1 Section Backgrounds

| Effect | CSS Class | Value | 사용 조건 |
|--------|-----------|-------|----------|
| Dark Gradient A | `bg-dark-gradient-1` | `linear-gradient(180deg, #111111, #0D0D0D)` | 일반 섹션 (교차 A) |
| Dark Gradient B | `bg-dark-gradient-2` | `linear-gradient(180deg, #1A1A1A, #141414)` | 일반 섹션 (교차 B) |
| Brand Gradient | `bg-brand-gradient` | `linear-gradient(135deg, brand, brand-dark)` | Solution, BrandName, Target, Warranty |
| Accent Gradient | `bg-accent-gradient` | `linear-gradient(135deg, accent, accent-dark)` | Differentiator |
| Dark Brand Glow | `bg-dark-brand-glow` | `linear-gradient(180deg, #111 0%, #111 60%, brand 8%)` | FeatureDetail 이미지 패널 |
| Radial Glow | `bg-radial-glow` | `radial-gradient(ellipse at 50% 0%, brand 15%, transparent 70%)` | CTA 브랜드 글로우 |


### 5.2 Glassmorphism

| Level | CSS Class | Background | Blur | Border |
|-------|-----------|------------|------|--------|
| Standard | `glass-card` | `rgba(255,255,255, 0.05)` | 12px | `rgba(255,255,255, 0.08)` |
| Strong | `glass-card-strong` | `rgba(255,255,255, 0.08)` | 16px | `rgba(255,255,255, 0.12)` |

사용처: FAQ 아이템, 리뷰 카드, 팁 카드, 스펙 테이블, 기능 요약 카드 등

### 5.3 Gradient Text

| Effect | CSS Class | Gradient |
|--------|-----------|----------|
| Brand Gradient | `text-gradient-brand` | `linear-gradient(135deg, brand, accent)` |
| White Fade | `text-gradient-white` | `linear-gradient(180deg, #FFF, rgba(255,255,255,0.7))` |

사용처: 기능 번호(`text-feature-num`), 핵심 수치, 강조 텍스트

### 5.4 Text Shadows

| Effect | CSS Class | Value |
|--------|-----------|-------|
| Hero Shadow | `text-shadow-hero` | `0 2px 20px rgba(0,0,0,0.5), 0 0 40px rgba(0,0,0,0.3)` |
| Subtle Shadow | `text-shadow-subtle` | `0 1px 8px rgba(0,0,0,0.3)` |

사용처:
- `text-shadow-hero` → composed 섹션 (Hook, PainPoint, CTA) 텍스트
- `text-shadow-subtle` → brand-gradient 배경 위 텍스트

### 5.5 Overlays

| Effect | CSS Class | Gradient |
|--------|-----------|----------|
| Hero Overlay (하단→상단) | `hero-overlay` | `linear-gradient(180deg, transparent, rgba(0,0,0,0.7))` |
| Hero Overlay Top (상단→하단) | `hero-overlay-top` | `linear-gradient(180deg, rgba(0,0,0,0.6), transparent)` |
| Custom Overlay | Tailwind | `bg-gradient-to-t from-black/90 via-black/50 to-transparent` 등 |

### 5.6 Decorative Dividers

| Type | CSS Class | 사용처 |
|------|-----------|--------|
| Gradient Line | `divider-gradient` | 섹션 내 콘텐츠 구분 |
| Brand Line | `divider-brand` | 브랜드 강조 구분선 |
| Dot Divider | `divider-dot` | 장식적 3-dot 분리 |

### 5.7 Brand Accent Borders

| Type | CSS Class | Value |
|------|-----------|-------|
| Left Border | `border-brand-left` | `border-left: 3px solid var(--brand-main)` + `padding-left: 16px` |
| Bottom Border | `border-brand-bottom` | `border-bottom: 2px solid var(--brand-main)` + `padding-bottom: 8px` |

사용처: 구성품 카드, 포인트 카드, 인용 스타일

---

## 6. Image System

### 6.1 Image Placeholder

```html
<div class="img-placeholder w-[760px] h-[500px] rounded-xl"
     data-ai-prompt="descriptive prompt in English, [product] as placeholder"
     data-ai-style="product_hero"
     data-ai-ratio="4:3">
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" stroke-width="1.5">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
  <span class="img-label">구체적 한글 설명</span>
</div>
```

### 6.2 AI Image Style Types

| `data-ai-style` | 설명 | 일반 사용처 |
|---|---|---|
| `product_hero` | 스튜디오 촬영, 제품 전체 | Hook, Solution |
| `product_lifestyle` | 실사용 환경, 생활 장면 | FeatureDetail, Target |
| `product_detail` | 클로즈업, 부분 확대 | FeatureDetail |
| `product_flat` | 탑뷰, 구성품 나열 | SetContents |
| `infographic` | 다이어그램, 데이터 시각화 | WhyCore, FeaturesOverview, Comparison, ProductSpec |
| `mood` | 분위기, 감성, 배경용 | PainPoint, CTA |
| `comparison` | 비교, 전후 | Differentiator |
| `background_only` | 텍스처, 오버레이용 | composed 배경 |

### 6.3 Aspect Ratios

| Ratio | 용도 |
|-------|------|
| `4:3` | 일반 제품 이미지 |
| `16:9` | 와이드 배너, 시네마틱 |
| `1:1` | 정방형 카드 |
| `3:4` | 세로 이미지 |

### 6.4 Real Image Replacement

플레이스홀더 → 실제 이미지 치환 시:

```html
<!-- stack/split 섹션 -->
<img src="image.jpg" alt="설명"
     class="real-image w-[760px] h-[500px] rounded-xl object-cover"
     data-original-style="product_hero" />

<!-- composed 섹션 (전체 배경) -->
<img src="image.jpg" alt="배경"
     class="real-image w-full h-full object-cover"
     data-original-style="mood" />
```

---

---

## 8. Style Preset Format

레퍼런스에서 추출한 스타일 인스턴스. W3C DTCG 구조 참조.

```json
{
  "type": "STYLE_PRESET",
  "id": "preset--ref-{name}",
  "name": "프리셋 설명 (한글)",
  "source_ref": "ref-{name}",
  "style_tags": ["키워드1", "키워드2", "키워드3"],

  "global_layout": {
    "width": 860,
    "image_area_width": 760,
    "default_padding": { "top": 80, "bottom": 80, "left": 50, "right": 50 },
    "default_item_spacing": 24,
    "default_content_alignment": "CENTER",
    "font_family": "Pretendard"
  },

  "color_system": {
    "brand_main": "#HEX",
    "accent": "#HEX",
    "dark_1": "#HEX",
    "dark_2": "#HEX",
    "light_1": "#FFFFFF",
    "light_2": "#HEX",
    "sub_text": "#888888",
    "muted_text": "#666666"
  },

  "typography": {
    "main_copy": { "fontSize": 56, "fontWeight": 700 },
    "section_title": { "fontSize": 40, "fontWeight": 700 },
    "sub_title": { "fontSize": 28, "fontWeight": 500 },
    "body": { "fontSize": 22, "fontWeight": 400 },
    "small": { "fontSize": 20, "fontWeight": 400 }
  }
}
```

### Preset Field Mapping to Design Tokens

| Preset Field | Design Token | CSS Output |
|---|---|---|
| `color_system.brand_main` | `color.brand.primary` | `var(--brand-main)` |
| `color_system.accent` | `color.brand.secondary` | `var(--accent)` |
| `color_system.dark_1` | `color.surface.dark-1` | Tailwind `dark-1` |
| `color_system.dark_2` | `color.surface.dark-2` | Tailwind `dark-2` |
| `typography.main_copy.fontSize` | `display.hero.size` | `text-hero` |
| `typography.section_title.fontSize` | `display.section.size` | `text-section` |
| `global_layout.width` | `size.canvas.width` | `.page-canvas` 860px |

---

## 9. Theme Detection

위젯 추출 시 배경색 밝기로 자동 판별:

```
brightness = (R × 299 + G × 587 + B × 114) / 1000
```

| Brightness | Theme | Placeholder BG |
|---|---|---|
| > 128 | `light` | #E8E8E8 |
| ≤ 128 | `dark` | #2A2A2A |

---

## 10. Platform Compatibility

### html.to.design (Figma 변환) 제약

| 금지 항목 | 이유 |
|----------|------|
| JavaScript 의존 레이아웃 | html.to.design은 CSS만 해석 |
| `position: fixed/sticky` | Figma에 해당 개념 없음 |
| CSS 애니메이션/트랜지션 | Figma에 해당 개념 없음 |
| SVG/canvas 텍스트 | Figma에서 편집 불가 |
| `%` 기반 크기 (composed 외) | 절대값 크기 선호 (`w-[760px]`, `h-[500px]`) |

### 허용

| 항목 | 지원 여부 |
|------|----------|
| Tailwind CDN | 지원 |
| CSS Custom Properties | 지원 |
| Flexbox / Grid | 지원 |
| `overflow: hidden` | 권장 (원치 않는 영역 노출 방지) |
| `backdrop-filter` | 부분 지원 |

---

## 11. Utility Class Reference

### CSS → Tailwind → Token 매핑

| Utility Class | CSS Value | Design Token |
|---|---|---|
| `.section-padding` | `padding: 80px 50px` | `spacing.section.padding` |
| `.section-padding-lg` | `padding: 100px 50px` | `spacing.section.padding-lg` |
| `.content-narrow` | `max-width: 760px; margin: 0 auto` | `size.content.max-width` |
| `.page-canvas` | `width: 860px` | `size.canvas.width` |
| `.glass-card` | See Section 5.2 | `card.glass.*` |
| `.glass-card-strong` | See Section 5.2 | `card.glass-strong.*` |
| `.text-gradient-brand` | See Section 5.3 | `color.brand.primary/secondary` |
| `.text-gradient-white` | See Section 5.3 | — |
| `.text-shadow-hero` | See Section 5.4 | — |
| `.text-shadow-subtle` | See Section 5.4 | — |
| `.bg-dark-gradient-1` | See Section 5.1 | `color.surface.dark-1` |
| `.bg-dark-gradient-2` | See Section 5.1 | `color.surface.dark-2` |
| `.bg-brand-gradient` | See Section 5.1 | `color.surface.brand` |
| `.bg-accent-gradient` | See Section 5.1 | `color.surface.accent` |
| `.bg-dark-brand-glow` | See Section 5.1 | — |
| `.bg-radial-glow` | See Section 5.1 | — |
| `.divider-gradient` | See Section 5.6 | `divider.gradient` |
| `.divider-brand` | See Section 5.6 | `divider.brand` |
| `.divider-dot` | See Section 5.6 | — |
| `.border-brand-left` | See Section 5.7 | — |
| `.border-brand-bottom` | See Section 5.7 | — |
| `.hero-overlay` | See Section 5.5 | — |
| `.hero-overlay-top` | See Section 5.5 | — |
| `.num-badge` | See Section 1.3 | `badge.num.*` |
| `.check-item` | `::before { content: '✓' }` | — |
| `.composed-section` | `position: relative; overflow: hidden` | — |
| `.composed-layer` | `position: absolute` | — |
| `.img-placeholder` | See Section 6.1 | `placeholder.*` |
| `.real-image` | `display: block; object-fit: cover` | — |
| `.pos-{position}` | See Section 4.2 (composed) | — |

---

## 12. Standards & References

이 문서에서 참조한 외부 표준:

| Standard | 적용 영역 |
|----------|----------|
| [W3C Design Tokens (DTCG)](https://www.designtokens.org/) | 토큰 계층 구조, 네이밍 컨벤션, 타입 시스템 |
| [Style Dictionary (Amazon)](https://styledictionary.com/) | CTI 프레임워크 (Category/Type/Item), 토큰 변환 파이프라인 |
| [Material Design 3](https://m3.material.io/) | Type scale 구조, Color role 시스템, Elevation 레벨 |
| [Open Props](https://open-props.style/) | CSS Custom Properties 네이밍, Scale 패턴 (0-based) |
| [Tailwind CSS](https://tailwindcss.com/) | 유틸리티 클래스 시스템, 테마 설정 |
| [Tokens Studio](https://docs.tokens.studio/) | Figma 변수 연동, DTCG 포맷 지원 |
| [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/) | 색상 대비율 접근성 기준 |
