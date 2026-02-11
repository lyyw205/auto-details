# HANDOFF

## Current [1770788779]
- **Task**: JSON 위젯 → HTML/CSS 위젯 리팩토링
- **Completed**:
  - 기존 54개 `.widget.json` + `_registry.json` → `_archive/widgets-v1/`로 아카이브
  - `tools/decompose-templates.js` → `_archive/tools/`로 이동
  - `widgets/_registry.json` v2.0 초기화 (빈 레지스트리)
  - `skills/extract-widgets.skill.md` 대폭 개편 — JSON 스키마 → HTML 위젯 포맷 (`<!--WIDGET_META --> + <section>`)
    - `templates/html-section-patterns.md` 패턴 참조하여 실제 HTML/CSS 생성
    - `data-ai-*` HTML 속성 매핑, placeholder 텍스트, 이미지 플레이스홀더 규칙
  - `skills/register-widgets.skill.md` 수정 — `.widget.json` → `.widget.html`, WIDGET_META 주석 파싱
  - `skills/select-widgets.skill.md` 수정 — 파일 확장자 변경, 폴백 위젯 HTML 생성
  - `skills/generate-html.skill.md` 대폭 간소화 — JSON→HTML 변환 삭제 → HTML 조합+커스터마이징
    - 새 워크플로: 위젯 로딩 → 컬러 리매핑 (hex→CSS변수) → 콘텐츠 치환 → 순서 조합
  - `agents/ref-to-widgets.md` 업데이트 — HTML 위젯 참조
  - `agents/product-to-html.md` 업데이트 — 조합 스킬 설명
  - `CLAUDE.md` 전체 재작성 — HTML 위젯 포맷, v2.0 레지스트리, 파이프라인 설명
- **Next Steps**:
  - 새 레퍼런스로 `/ref-to-widgets` E2E 테스트 (analyze → extract-widgets → register)
  - `/product-to-html` E2E 테스트 (plan → select-widgets → generate-html 조합)
  - 위젯 라이브러리 재구축 (기존 레퍼런스로 HTML 위젯 재추출)
- **Blockers**: None
- **Related Files**:
  - `widgets/_registry.json` (v2.0, 빈 레지스트리)
  - `widgets/_presets/` (4개 스타일 프리셋, JSON 유지)
  - `skills/extract-widgets.skill.md` (핵심 변경 — HTML 위젯 생성)
  - `skills/generate-html.skill.md` (핵심 변경 — 조합 스킬)
  - `_archive/widgets-v1/` (기존 JSON 위젯 54개 보관)

## Past 1 [1770789600]
- **Task**: 페이지 템플릿 → 섹션 위젯 시스템 리팩토링
- **Completed**: widgets/ 디렉토리 구조, 54개 JSON 위젯 + 4개 프리셋, extract/register/select-widgets 스킬, generate-html 수정, ref-to-widgets/product-to-html 에이전트
- **Note**: v1 JSON 위젯 시스템 완성. 현재 _archive/widgets-v1/로 이동됨.

## Past 2 [1770784084]
- **Task**: v2 HTML/CSS 파이프라인 구축 + Figma Make 프롬프트 생성 스킬
- **Completed**: html-base.html, html-section-patterns.md, generate-html.skill.md, product-to-html.md, generate-figma-make-prompt.skill.md
- **Note**: v2 HTML 파이프라인 완성. 클린에어 A1으로 검증 완료.
