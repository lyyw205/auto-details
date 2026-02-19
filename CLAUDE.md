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

# 매핑 서버 (Gemini Vision 기반 레퍼런스 분석)
cd mapping && npm install && npm run dev   # http://localhost:3000
# 사전 조건: mapping/.env.local에 GEMINI_API_KEY 설정

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

| 에이전트 | 파일 | 용도 | 담당 스킬 |
|---------|------|------|----------|
| `/analyzer` | `agents/analyzer.md` | 레퍼런스 분석 (스크래핑 + Gemini 매핑) | scrape-reference, map-reference |
| `/builder` | `agents/builder.md` | JSON 위젯 생성/등록 + 라이브러리 확장 | build-widgets, expand-library |
| `/planner` | `agents/planner.md` | 섹션 설계 + 위젯 선택 | plan-sections, select-widgets |
| `/composer` | `agents/composer.md` | JSON 조합 → HTML/Figma 출력 | compose-page, generate-figma-prompt, patch-section |
| `/validator` | `agents/validator.md` | 파이프라인 전 단계 품질 게이트 | validate-mapping, validate-widgets, validate-output, coverage-report |

### 스킬

| 스킬 | 파일 | Input | Output |
|------|------|-------|--------|
| `/scrape-reference` | `skills/scrape-reference.skill.md` | Behance URL | `references/{name}/` 이미지 |
| `/map-reference` | `skills/map-reference.skill.md` | 레퍼런스 이미지 | `output/mapping-{name}.json` |
| `/build-widgets` | `skills/build-widgets.skill.md` | 매핑 JSON | `.widget.json` 파일 + `_registry.json` |
| `/plan-sections` | `skills/plan-sections.skill.md` | 제품 정보 | `output/{product}-section-plan.json` |
| `/select-widgets` | `skills/select-widgets.skill.md` | section plan + 스타일 선호 | `output/{product}-widget-selection.json` |
| `/compose-page` | `skills/compose-page.skill.md` | widget selection + 제품 정보 | `output/{product}-detail.html` |
| `/generate-figma-prompt` | `skills/generate-figma-prompt.skill.md` | .widget.json | `output/{name}-figma-make-prompt.md` |
| `/patch-section` | `skills/patch-section.skill.md` | 섹션 ID + 패치 객체 | 수정된 detail HTML |
| `/expand-library` | `skills/expand-library.skill.md` | 커버리지 리포트 | 신규 `.widget.json` 파일들 |
| `/validate-mapping` | `skills/validate-mapping.skill.md` | 매핑 JSON + 레퍼런스 이미지 | 정확도 리포트 |
| `/validate-widgets` | `skills/validate-widgets.skill.md` | .widget.json 파일들 | 검증 리포트 |
| `/validate-output` | `skills/validate-output.skill.md` | detail HTML | 17개 체크리스트 결과 |
| `/coverage-report` | `skills/coverage-report.skill.md` | _registry.json | 커버리지 리포트 |

### 워크플로우

```
# Pipeline A: 레퍼런스 → 위젯 라이브러리
/analyzer → (scrape-reference → map-reference → [Validator] → [유저 편집/검수] → /builder → [Validator])

# Pipeline B: 제품 → HTML 상세페이지
/planner → (plan-sections → [유저 확인] → select-widgets → [유저 선택]) → /composer → (compose-page → generate-figma-prompt → [Validator])

# Pipeline C: 위젯 라이브러리 확장
/validator → (coverage-report) → /builder → (expand-library → [Validator])
```

각 스킬은 독립적으로도 실행 가능합니다.

---

## 핵심 아키텍처

### 위젯 시스템

- **위젯 파일**: `.widget.json` = JSON 포맷 (좌표 %, elements 배열, 메타데이터)
- **레지스트리**: `widgets/_registry.json` (v2.0) — taxonomy_id별로 위젯 인덱싱
- **프리셋**: `widgets/_presets/preset--ref-{name}.json` — 레퍼런스별 컬러/타이포 설정
- **taxonomy 폴더**: `widgets/{taxonomy_id_lower}/` (22개 + `_custom/`)
- **위젯 ID 규칙**: `{taxonomy_id_lower}--ref-{name}[--variant].widget.json`
- **공유 렌더러**: `lib/widget-renderer/` — JSON → HTML 순수 함수 (갤러리와 최종 출력 동일 로직)

### generate-html은 "조합" 스킬

위젯이 이미 HTML이므로 변환 없이 직접 조합합니다:
위젯 로딩 → 컬러 리매핑(소스 프리셋 hex → CSS 변수) → 콘텐츠 치환(placeholder → 실제 제품 정보) → 순서 조합

### Taxonomy 슬라이싱

각 스킬은 `skills/section-taxonomy.json` 전체를 로딩하지 않고 필요한 필드만 추출합니다:
- **Slim** (분석/플래닝용): `id, name, category, purpose, is_required, frequency, keywords, visual_cues`
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
- **텍스트**: 가운데 정렬 기본, 나열형만 LEFT. `<br>` 줄바꿈. 들여쓰기 금지
- **카드**: glassmorphism (`glass-card`, `glass-card-strong`)

### 주요 리소스

| 파일 | 용도 |
|------|------|
| `templates/style-guide.md` | 통합 스타일 가이드 (토큰, 색상, 타이포, 시각 효과, 호환성 규칙) |
| `templates/html-base.html` | HTML 골격 + Tailwind config + 유틸리티 CSS 구현체 |
| `templates/wireframe-base.html` | 와이어프레임 전용 HTML 골격 + `.wf-*` CSS |

---

## 위젯 포맷

### JSON 위젯 (`.widget.json`) — Single Source of Truth

```json
{
  "widget_id": "hook--ref-reference3",
  "taxonomy_id": "Hook",
  "category": "intro",
  "style_tags": ["내추럴", "우드톤", "따뜻한"],
  "theme": "dark",
  "composition": "stack",
  "provenance": { "source_ref": "ref-reference3", "extracted_date": "2026-02-11" },
  "status": "new",
  "copywriting_guide": "강렬한 첫인상...",

  "canvas": { "width": 860, "height": 700 },

  "elements": [
    {
      "id": "bg-1", "type": "background", "label": "배경",
      "x": 0, "y": 0, "w": 100, "h": 100, "zIndex": 0,
      "style": { "bgColor": "#1A1410" }
    },
    {
      "id": "text-1", "type": "text", "label": "메인 카피",
      "x": 15.5, "y": 8.2, "w": 69.0, "h": 5.3, "zIndex": 2,
      "content": "[메인 카피]",
      "style": { "fontSize": "40px", "fontWeight": "bold", "color": "#C8A87C" }
    }
  ],

  "figma_hints": { "layout_structure": "...", "key_elements": [] },
  "sample_data": { "texts": { "[메인 카피]": "자연의 온기를 담다" }, "images": [] }
}
```

**핵심 원칙:**
- JSON이 Single Source of Truth — 모든 좌표는 % (0-100)
- HTML은 프리뷰 전용 — `lib/widget-renderer/renderer.ts`로 실시간 렌더링
- Figma 변환 최소화 — JSON → 프롬프트 직접 변환 (1회)
- 매핑 좌표 무변형 — padding/gap 추가 금지

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
lib/
├── widget-renderer/            # 공유 렌더러 모듈
│   ├── renderer.ts             # JSON → HTML 순수 함수
│   ├── types.ts                # WidgetJSON TypeScript 타입
│   ├── widget-schema.json      # JSON Schema
│   └── index.ts                # export

widgets/                    # 섹션 위젯 라이브러리
├── _registry.json          # 위젯 레지스트리 v2.0
├── _presets/               # 스타일 프리셋 (레퍼런스별 JSON)
├── {taxonomy_id_lower}/    # taxonomy별 위젯 폴더 (22개+, .widget.json 파일)
└── _custom/                # taxonomy 미매핑 섹션

skills/                     # 스킬 시스템 (개별 단계 정의)
├── section-taxonomy.json   # 섹션 분류 체계 (마스터 데이터)
└── *.skill.md              # 각 스킬 정의

agents/                     # 에이전트 오케스트레이터 (5개)
├── analyzer.md             # 분석가 — 레퍼런스 분석
├── builder.md              # 빌더 — JSON 위젯 생성/등록
├── planner.md              # 설계자 — 섹션 설계/위젯 선택
├── composer.md             # 조합기 — JSON 조합/출력
├── validator.md            # 검증기 — 품질 보증
└── _archive/               # 기존 에이전트 보존

templates/                  # HTML 생성용 리소스
├── style-guide.md          # 통합 스타일 가이드 (Single Source of Truth)
├── html-base.html          # HTML 골격 + Tailwind config + 유틸리티 CSS
└── wireframe-base.html     # 와이어프레임 전용 HTML 골격 + .wf-* CSS

mapping/                    # Gemini Vision 매핑 시스템 (Next.js 웹앱)
├── src/                    # 소스코드 (React 컴포넌트, API, hooks)
├── package.json            # 의존성
└── .env.local              # GEMINI_API_KEY (gitignore 처리)

tools/
├── gallery/                # 위젯 갤러리 웹 (server.js + index.html)
├── scraper/                # Behance 상세페이지 이미지 추출 CLI (Puppeteer + Sharp)
├── preview.html            # JSON → HTML 미리보기
└── template-editor.html    # 템플릿 와이어프레임 에디터

output/                     # 결과물 (매핑, 플랜, 위젯 셀렉션, HTML)
references/                 # 레퍼런스 이미지 저장소
```
