# HANDOFF

## Current [1770711710]
- **Task**: 공간 레이아웃 분석 + AI 이미지 프롬프트 생성 시스템 구현
- **Completed**:
  - `figma-plugin/code.js` — 9-Grid 시스템 추가 (GRID_COORDS, regionToRect), composition별 렌더러 분기 (createStackSection/createComposedSection/createSplitSection), ai_prompt 메타데이터 저장
  - `tools/preview.html` — composed(absolute positioning)/split(flex) CSS 렌더링, ai_prompt 호버 툴팁, AI Prompts 사이드 패널, regionToRect 그리드 시스템
  - `prompts/analyze-reference.md` v3.0 — composition 타입 판단(stack/composed/split), 9분할 그리드 region 분석, ai_prompt 생성 규칙 + 스타일 프리셋 8종
  - `prompts/generate-template.md` — composition 보존 규칙(layers/split_detail), ai_prompt [product] 플레이스홀더 치환 규칙
  - `prompts/generate-page.md` — composition별 JSON 구조 분기, ai_prompt 커스터마이징 규칙 + 스타일별 프롬프트 가이드
  - `skills/section-taxonomy.json` v1.1 — 전체 20개 섹션에 typical_compositions + composition_examples 추가
  - MARU 레퍼런스 분석 완료 — 7섹션 (composed 3 + split 2 + stack 2), 57% 매핑률, 미분류 3개
  - `templates/ref-maru.template.json` 생성 — v3.0 템플릿, composition 정보 + ai_prompt 포함
  - `skills/unmapped-sections/unmapped-maru.json` 생성 — StatsHighlight, CTABanner, EventPromo
  - `templates/_registry.json` — ref-maru 등록
  - `output/maru-landing-layout.json` 생성 + preview.html 렌더링 테스트 통과 (7섹션, 12 composed layers, 4 split panels, 5 ai_prompt tooltips)
- **Next Steps**:
  - 추가 레퍼런스 분석으로 composition 판단 정확도 검증
  - Figma 플러그인에서 composed/split 섹션 실제 렌더링 테스트
  - taxonomy 확장 — 미분류 섹션(StatsHighlight, CTABanner, EventPromo) 정식 편입 검토
  - ai_prompt → 실제 AI 이미지 생성 API 연동 파이프라인
- **Blockers**: None
- **Related Files**:
  - `figma-plugin/code.js`
  - `tools/preview.html`
  - `prompts/analyze-reference.md`
  - `prompts/generate-template.md`
  - `prompts/generate-page.md`
  - `skills/section-taxonomy.json`
  - `templates/ref-maru.template.json`
  - `skills/unmapped-sections/unmapped-maru.json`
  - `output/maru-landing-layout.json`

## Past 1 [1770704130]
- **Task**: 섹션 분류 체계(taxonomy) 스킬 시스템 구축 + HTML 미리보기 도구 추가
- **Completed**: taxonomy 19섹션 생성, analyze-reference v2.0, recommend-template/generate-page 프롬프트, preview.html, ref-logitech-k120 v3.1 갱신, 로지텍 K120 분석 테스트 완료
- **Note**: taxonomy 기반 워크플로우 C 확립. 12섹션 100% 매핑.
