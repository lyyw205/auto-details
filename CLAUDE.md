# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

AI 기반 상세페이지 자동 제작 시스템. 레퍼런스 이미지를 분석하여 HTML 섹션 위젯을 추출하고, 제품 정보를 기반으로 위젯들을 조합하여 상세페이지 HTML을 생성합니다.

**핵심 개념**: 상세페이지를 페이지 단위 템플릿이 아닌 **섹션 단위 HTML 위젯**으로 관리. 위젯 라이브러리에서 섹션별 최적 위젯을 선택하여 조합합니다.

---

## 실행 명령어

```bash
# 위젯 갤러리 서버 (검수/관리 UI)
node tools/gallery/server.js          # http://localhost:3333

# Behance 레퍼런스 이미지 스크래핑
node tools/scraper/scrape-behance.js <behance-url> --name <ref-name>
# 예: node tools/scraper/scrape-behance.js "https://www.behance.net/gallery/123/project" --name ref-terive

# scraper 의존성 설치 (최초 1회)
cd tools/scraper && npm install
```

프리뷰: `output/{product}-detail.html` 또는 개별 `.widget.html`을 브라우저에서 직접 열기.

---

## 에이전트/스킬 시스템

이 프로젝트는 빌드/테스트가 없는 **프롬프트 기반 AI 에이전트 시스템**입니다. `agents/` 파일이 워크플로우를 오케스트레이션하고, `skills/` 파일이 개별 단계를 정의합니다.

### 에이전트

| 에이전트 | 파일 | 용도 | 스킬 체인 |
|---------|------|------|----------|
| `/ref-to-widgets` | `agents/ref-to-widgets.md` | 레퍼런스 → HTML 위젯 추출 | analyze-ref → extract-widgets → [유저 검수] → register-widgets |
| `/product-to-html` | `agents/product-to-html.md` | 제품 → HTML 상세페이지 | plan-sections → [유저 확인] → select-widgets → [유저 선택] → generate-html |

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
| `/extract-widgets-v4` | `skills/extract-widgets-v4.skill.md` | v3 analysis JSON | 와이어프레임 `.widget.html` + preset |
| `/generate-figma-make-prompt-v2` | `skills/generate-figma-make-prompt-v2.skill.md` | v4 위젯 메타데이터 | `output/{name}-figma-make-prompt.md` |

### 워크플로우

```
# 새 레퍼런스 분석 (기본)
/ref-to-widgets → (analyze-ref → extract-widgets → [유저 검수] → register-widgets)

# 새 레퍼런스 분석 (v4 와이어프레임 — Figma Make 최적화)
/ref-to-widgets v4 → (analyze-ref-v3 → extract-widgets-v4 → [유저 검수] → register-widgets)
                      → (선택) generate-figma-make-prompt-v2

# 새 상세페이지 생성
/product-to-html → (plan-sections → [유저 확인] → select-widgets → [유저 선택] → generate-html)
```

각 스킬은 독립적으로도 실행 가능합니다.

---

## 핵심 아키텍처

### 위젯 시스템

- **위젯 파일**: `.widget.html` = `<!--WIDGET_META {...} -->` 주석 + `<section>` HTML
- **레지스트리**: `widgets/_registry.json` (v2.0) — taxonomy_id별로 위젯 인덱싱
- **프리셋**: `widgets/_presets/preset--ref-{name}.json` — 레퍼런스별 컬러/타이포 설정
- **taxonomy 폴더**: `widgets/{taxonomy_id_lower}/` (22개 + `_custom/`)
- **위젯 ID 규칙**: `{taxonomy_id_lower}--ref-{name}[--variant].widget.html`

### generate-html은 "조합" 스킬

위젯이 이미 HTML이므로 변환 없이 직접 조합합니다:
위젯 로딩 → 컬러 리매핑(소스 프리셋 hex → CSS 변수) → 콘텐츠 치환(placeholder → 실제 제품 정보) → 순서 조합

### Taxonomy 슬라이싱

각 스킬은 `skills/section-taxonomy.json` 전체를 로딩하지 않고 필요한 필드만 추출합니다:
- **Slim** (분석/플래닝용): `id, name, category, purpose, is_required, frequency, keywords, visual_cues, typical_compositions`
- **Selective** (생성용): 플랜 포함 섹션의 `required_elements, copywriting_guide`만

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

**핵심 요약:**
- **캔버스**: 860px / 콘텐츠: 760px
- **색상**: CSS 변수 `--brand-main`, `--accent` + 고정 neutral 팔레트
- **배경**: 인접 섹션 톤 교차 (같은 톤 연속 금지), 항상 subtle gradient
- **텍스트**: 가운데 정렬 기본, 나열형만 LEFT. `<br>` 줄바꿈. 들여쓰기 금지
- **카드**: glassmorphism (`glass-card`, `glass-card-strong`)

### 주요 리소스

| 파일 | 용도 |
|------|------|
| `templates/style-guide.md` | 통합 스타일 가이드 (토큰, 색상, 타이포, 시각 효과, 호환성 규칙) |
| `templates/html-base.html` | HTML 골격 + Tailwind config + 유틸리티 CSS 구현체 |
| `templates/wireframe-base.html` | 와이어프레임 전용 HTML 골격 + `.wf-*` CSS (v4용) |
| `templates/html-section-patterns.md` | 섹션별 HTML/CSS 패턴 라이브러리 (extract-widgets에서 참조) |

---

## 위젯 포맷

### HTML 섹션 위젯 (`.widget.html`)

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
  <!-- Tailwind + html-base.html 유틸리티 클래스 사용 -->
  <!-- 텍스트: [브랜드명], [메인 카피] 등 placeholder -->
  <!-- 이미지: img-placeholder + data-ai-* 속성 -->
  <!-- 컬러: 소스 레퍼런스의 실제 색상 (generate-html에서 CSS 변수로 리매핑) -->
</section>

**composition 값**: `stack` | `split` | `composed` | `trace` | `wireframe`
- `wireframe` (v4): `.wf-*` CSS, auto-layout, 무채색, `wireframe-base.html` 사용
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

## 주요 폴더 구조

```
widgets/                    # 섹션 위젯 라이브러리
├── _registry.json          # 위젯 레지스트리 v2.0
├── _presets/               # 스타일 프리셋 (레퍼런스별 JSON)
├── {taxonomy_id_lower}/    # taxonomy별 위젯 폴더 (22개+)
└── _custom/                # taxonomy 미매핑 섹션

skills/                     # 스킬 시스템 (개별 단계 정의)
├── section-taxonomy.json   # 섹션 분류 체계 (마스터 데이터)
└── *.skill.md              # 각 스킬 정의

agents/                     # 에이전트 오케스트레이터
├── ref-to-widgets.md       # 레퍼런스 → HTML 위젯 추출
└── product-to-html.md      # 제품 → HTML 상세페이지

templates/                  # HTML 생성용 리소스
├── style-guide.md          # 통합 스타일 가이드 (Single Source of Truth)
├── html-base.html          # HTML 골격 + Tailwind config + 유틸리티 CSS
└── html-section-patterns.md

tools/
├── gallery/                # 위젯 갤러리 웹 (server.js + index.html)
├── scraper/                # Behance 상세페이지 이미지 추출 CLI (Puppeteer + Sharp)
├── preview.html            # JSON → HTML 미리보기
└── template-editor.html    # 템플릿 와이어프레임 에디터

output/                     # 결과물 (분석, 플랜, 위젯 셀렉션, HTML)
references/                 # 레퍼런스 이미지 저장소
_archive/                   # 미사용 파일 보관 (v1 JSON 위젯, 이전 스킬/에이전트)
figma-plugin/               # Figma 플러그인 (v1 JSON 방식용)
```
