# HANDOFF

## Current [1770790885]
- **Task**: reference4 분석 + 위젯 추출 E2E 테스트 + 루미에어 상세페이지 생성
- **Completed**:
  - `/ref-to-widgets` E2E 완료 — reference4.png (우드 수납 정리함, 라이트 테마)
    - `output/analysis-reference4.json` 생성 (11개 섹션, 매핑률 100%)
    - `output/widgets-preview--ref-reference4.html` 통합 프리뷰 생성 (검수용)
    - 10개 HTML 위젯 → 8개 taxonomy 폴더에 분리 저장
    - `widgets/_presets/preset--ref-reference4.json` 프리셋 생성
    - `widgets/_registry.json` 업데이트 (10개 위젯 등록)
  - 워크플로우 개선 — extract-widgets 검수 프로세스 변경
    - **변경 전**: 위젯 → 바로 개별 폴더 저장 → 검수
    - **변경 후**: 위젯 → `output/widgets-preview--ref-{name}.html` 통합 프리뷰 → 유저 검수 → 승인 후 개별 폴더 저장
    - `skills/extract-widgets.skill.md` 업데이트 (Step A 프리뷰 / Step B 분리저장)
    - `agents/ref-to-widgets.md` 업데이트 (파이프라인 흐름 변경)
  - `/product-to-html` E2E 완료 — 루미에어 스마트 수면등
    - `output/lumiair-section-plan.json` (18개 섹션 플랜)
    - `output/lumiair-widget-selection.json` (위젯 선택 + 8개 폴백)
    - `output/lumiair-detail.html` (896줄, 18섹션, 딥 네이비+웜 앰버 다크 테마)
- **Next Steps**:
  - 루미에어 Figma Make 프롬프트 생성 (`/generate-figma-make-prompt`)
  - 다른 레퍼런스(reference3, maru 등)로 HTML 위젯 재추출하여 라이브러리 확충
  - 다크 테마 위젯 라이브러리 구축 (현재 라이트 테마만 있음)
  - 다양한 제품으로 product-to-html 추가 테스트
- **Blockers**: None
- **Related Files**:
  - `output/lumiair-detail.html` (최종 상세페이지)
  - `output/widgets-preview--ref-reference4.html` (위젯 프리뷰)
  - `widgets/_registry.json` (10개 위젯 등록)
  - `skills/extract-widgets.skill.md` (프리뷰 워크플로우 반영)
  - `agents/ref-to-widgets.md` (프리뷰 워크플로우 반영)

## Past 1 [1770788779]
- **Task**: JSON 위젯 → HTML/CSS 위젯 리팩토링
- **Completed**: 54개 JSON 위젯 아카이브, extract/register/select/generate 스킬 HTML 포맷 개편, 에이전트 2개 업데이트, CLAUDE.md 재작성
- **Note**: v2 HTML 위젯 시스템 기반 완성. widgets/_registry.json v2.0 초기화.

## Past 2 [1770789600]
- **Task**: 페이지 템플릿 → 섹션 위젯 시스템 리팩토링
- **Completed**: widgets/ 디렉토리 구조, 54개 JSON 위젯 + 4개 프리셋, extract/register/select-widgets 스킬, ref-to-widgets/product-to-html 에이전트
- **Note**: v1 JSON 위젯 시스템 완성. _archive/widgets-v1/로 이동됨.
