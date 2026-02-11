# 피그마 에이전트 프로젝트 컨텍스트

## 프로젝트 개요
AI 기반 상세페이지 자동 제작 시스템. 레퍼런스 분석 → HTML 섹션 위젯 추출 → 제품 정보 기반 상세페이지 HTML 조합.

---

## 핵심: 섹션 위젯 시스템

### 개념

상세페이지를 **페이지 단위 템플릿** 대신 **섹션 단위 HTML 위젯**으로 관리합니다.

- 레퍼런스 1개 → N개 개별 위젯 추출 (HERO 위젯, FAQ 위젯, CTA 위젯 등)
- 위젯은 **HTML/CSS 파일** (`.widget.html`) — 브라우저에서 바로 확인 가능
- 위젯들이 라이브러리에 축적됨 (다양한 레퍼런스에서)
- 제품 정보 제공 시 → 12~16개 섹션 플랜 → 각 섹션에 최적 위젯 선택 → HTML 조합
- 각 위젯은 독립적인 "레이아웃 컴포넌트"처럼 작동

### 위젯 라이브러리 현황

- **위젯 포맷**: `.widget.html` (메타데이터 주석 + `<section>` HTML)
- **프리셋**: JSON 유지 (`_presets/*.json`)
- **레지스트리**: `widgets/_registry.json` (v2.0)
- **taxonomy 그룹**: 22개 + _custom

---

## 섹션 분류 체계 (Taxonomy)

- 정의 파일: `skills/section-taxonomy.json`
- 5개 카테고리: `intro` / `problem` / `features` / `trust` / `conversion`
- 22개 표준 섹션 (FeatureDetail은 반복 가능)

| 카테고리 | 섹션 ID |
|----------|---------|
| intro | Hook, WhatIsThis, BrandName, SetContents |
| problem | WhyCore, PainPoint, Solution |
| features | FeaturesOverview, FeatureDetail, Tips, Differentiator, StatsHighlight |
| trust | Comparison, Safety, Target, Reviews, ProductSpec, FAQ, Warranty |
| conversion | CTABanner, EventPromo, CTA |

---

## 스타일 가이드

> **모든 스타일 규칙은 `templates/style-guide.md`에 통합 관리됩니다.**
> 색상 시스템, 레이아웃, 타이포그래피, 시각 효과 등은 해당 문서를 참조하세요.
> (W3C Design Tokens, Style Dictionary, Material Design 3 표준 기반)

**핵심 요약:**
- **캔버스**: 860px / 콘텐츠: 760px
- **색상**: CSS 변수 `--brand-main`, `--accent` + 고정 neutral 팔레트
- **배경**: 인접 섹션 톤 교차 (같은 톤 연속 금지), 항상 subtle gradient
- **텍스트**: 가운데 정렬 기본, 나열형만 LEFT. `<br>` 줄바꿈. 들여쓰기 금지.
- **카드**: glassmorphism (`glass-card`, `glass-card-strong`)

---

## 주요 폴더 구조

```
figma-detail-page-agent/
├── widgets/                    # 섹션 위젯 라이브러리
│   ├── _registry.json          # 위젯 레지스트리 v2.0 (전체 인덱스)
│   ├── _presets/               # 스타일 프리셋 (레퍼런스별 컬러/타이포, JSON)
│   │   ├── preset--ref-reference3.json
│   │   ├── preset--ref-maru.json
│   │   ├── preset--ref-logitech-k120.json
│   │   └── preset--default.json
│   ├── hook/                   # taxonomy_id별 폴더 (22개+)
│   │   └── hook--ref-{name}.widget.html
│   ├── whatisthis/
│   ├── featuredetail/          # 반복 가능 — 변형 다수 (split-lr, split-rl 등)
│   ├── cta/
│   ├── ...                     # (나머지 taxonomy 폴더)
│   └── _custom/                # taxonomy 미매핑 섹션
│
├── skills/                     # 스킬 시스템
│   ├── section-taxonomy.json   # 섹션 분류 체계 (마스터 데이터)
│   ├── unmapped-sections/      # 미분류 섹션 리포트
│   ├── analyze-ref.skill.md    # 레퍼런스 분석
│   ├── extract-widgets.skill.md    # 분석 → HTML 위젯 추출
│   ├── register-widgets.skill.md   # 위젯 레지스트리 등록
│   ├── plan-sections.skill.md      # 섹션 플랜 설계
│   ├── select-widgets.skill.md     # 섹션별 위젯 선택
│   ├── generate-html.skill.md      # HTML 위젯 조합 → 최종 HTML
│   └── generate-figma-make-prompt.skill.md  # Figma Make 프롬프트 생성
│
├── agents/                     # 에이전트 오케스트레이터
│   ├── ref-to-widgets.md       # 레퍼런스 → HTML 위젯 추출
│   └── product-to-html.md      # 제품 → HTML 상세페이지 (위젯 조합)
│
├── templates/                  # HTML 생성용 리소스
│   ├── style-guide.md          # 통합 스타일 가이드 (Single Source of Truth)
│   ├── html-base.html          # HTML 골격 + Tailwind config + 유틸리티 CSS
│   └── html-section-patterns.md    # 섹션별 HTML/CSS 패턴 라이브러리
│
├── _archive/                   # 미사용 파일 보관
│   ├── skills/                 # v1 스킬 (generate-template, match-template 등)
│   ├── agents/                 # v1 에이전트 (ref-to-template, product-to-page)
│   ├── templates/              # 기존 페이지 단위 템플릿 파일
│   ├── widgets-v1/             # v1 JSON 위젯 (.widget.json) + 레지스트리
│   └── tools/                  # decompose-templates.js 등
│
├── references/                 # 레퍼런스 이미지 저장소
├── output/                     # 결과물 (분석, 플랜, 위젯 셀렉션, HTML)
├── tools/                      # 개발 도구
│   ├── preview.html            # JSON → HTML 미리보기
│   ├── template-editor.html    # 템플릿 와이어프레임 에디터
│   └── scraper/                # Behance 상세페이지 이미지 추출 CLI
│       ├── package.json
│       └── scrape-behance.js
└── figma-plugin/               # Figma 플러그인 (v1용)
```

---

## 에이전트/스킬 시스템

### 에이전트

| 에이전트 | 파일 | 용도 | 스킬 체인 |
|---------|------|------|----------|
| `/ref-to-widgets` | `agents/ref-to-widgets.md` | 레퍼런스 → HTML 위젯 | analyze-ref → extract-widgets → [유저 검수] → register-widgets |
| `/product-to-html` | `agents/product-to-html.md` | 제품 → HTML 상세페이지 | plan-sections → select-widgets → generate-html (조합) |

### 스킬

| 스킬 | 파일 | Input | Output |
|------|------|-------|--------|
| `/analyze-ref` | `skills/analyze-ref.skill.md` | 레퍼런스 이미지 | `output/analysis-{name}.json` |
| `/extract-widgets` | `skills/extract-widgets.skill.md` | analysis JSON | `widgets/**/*.widget.html` + preset |
| `/register-widgets` | `skills/register-widgets.skill.md` | 위젯 파일 목록 | `widgets/_registry.json` 업데이트 |
| `/plan-sections` | `skills/plan-sections.skill.md` | 제품 정보 | `output/{product}-section-plan.json` |
| `/select-widgets` | `skills/select-widgets.skill.md` | section plan + 스타일 선호 | `output/{product}-widget-selection.json` |
| `/generate-html` | `skills/generate-html.skill.md` | widget selection + 제품 정보 | `output/{product}-detail.html` (위젯 조합) |
| `/generate-figma-make-prompt` | `skills/generate-figma-make-prompt.skill.md` | detail HTML | `output/{product}-figma-make-prompt.md` |

### 워크플로우

#### 새 레퍼런스 분석 시
```
/ref-to-widgets → (analyze-ref → extract-widgets → [유저 검수] → register-widgets)
```

#### 새 상세페이지 생성 시
```
/product-to-html → (plan-sections → [유저 확인] → select-widgets → [유저 선택] → generate-html)
```

#### 개별 스킬 직접 실행
각 스킬은 독립적으로도 실행 가능합니다.

### Taxonomy 슬라이싱

각 스킬은 `skills/section-taxonomy.json` 전체를 로딩하지 않고 **필요한 필드만** 추출합니다:

- **Slim** (분석/플래닝용): `id, name, category, purpose, is_required, frequency, keywords, visual_cues, typical_compositions`
- **Selective** (생성용): 플랜 포함 섹션의 `required_elements, copywriting_guide`만

---

## 위젯 포맷

### HTML 섹션 위젯 (`.widget.html`)

위젯은 **메타데이터 주석 + `<section>` HTML**로 구성됩니다:

```html
<!--WIDGET_META
{
  "widget_id": "hook--ref-reference3",
  "taxonomy_id": "Hook",
  "category": "intro",
  "style_tags": ["내추럴", "우드톤", "따뜻한"],
  "theme": "dark",
  "composition": "composed",
  "provenance": { "source_ref": "ref-reference3", "extracted_date": "2026-02-11" },
  "copywriting_guide": "강렬한 첫인상..."
}
-->
<section id="hook" class="composed-section relative overflow-hidden" style="min-height: 700px;">
  <!-- 실제 HTML/CSS — Tailwind + html-base.html 유틸리티 클래스 사용 -->
  <!-- 텍스트: [브랜드명], [메인 카피] 등 placeholder -->
  <!-- 이미지: img-placeholder + data-ai-* 속성 -->
  <!-- 컬러: 소스 레퍼런스의 실제 색상 사용 (generate-html에서 CSS 변수로 리매핑) -->
</section>
```

### 스타일 프리셋 (`_presets/preset--*.json`)
```json
{
  "type": "STYLE_PRESET",
  "id": "preset--ref-reference3",
  "name": "내추럴 우드톤",
  "style_tags": ["내추럴", "우드톤", "따뜻한"],
  "color_system": { "brand_main": "#C8A87C", "accent": "#8B6F4E", "dark_1": "#1A1410" },
  "typography": { "main_copy": { "fontSize": 36, "fontWeight": 700 } }
}
```

---

## v2 HTML/CSS 파이프라인

### 핵심 변경: generate-html은 "변환"이 아닌 "조합" 스킬
- 위젯이 이미 HTML → JSON→HTML 변환 불필요
- generate-html은 위젯 로딩 → 컬러 리매핑 → 콘텐츠 치환 → 순서 조합

### 시각 효과
> 상세 정의: `templates/style-guide.md` Section 5 참조

### 프리뷰 방법
1. `output/{product}-detail.html`을 브라우저에서 열기
2. 개별 위젯도 `.widget.html`을 브라우저에서 직접 확인 가능
3. Figma 변환: html.to.design 플러그인 사용

### 주요 리소스
| 파일 | 용도 |
|------|------|
| `templates/style-guide.md` | 통합 스타일 가이드 — 토큰, 색상, 타이포, 시각 효과, 호환성 규칙 |
| `templates/html-base.html` | HTML 골격 + Tailwind config + 유틸리티 CSS 구현체 |
| `templates/html-section-patterns.md` | 섹션별 HTML/CSS 패턴 라이브러리 (extract-widgets에서 참조) |
