# HANDOFF

## Current [1770784084]
- **Task**: v2 HTML/CSS 파이프라인 구축 + Figma Make 프롬프트 생성 스킬
- **Completed**:
  - `templates/html-base.html` 신규 — Tailwind CDN + Pretendard 폰트 + 인라인 config + 유틸리티 CSS (glass-card, text-gradient, bg-gradient, 9-grid, 장식 분리선, 이미지 플레이스홀더)
  - `templates/html-section-patterns.md` 신규 — 22개 섹션 HTML/CSS 스니펫 라이브러리 (composition별 매핑, 시각 효과 요약)
  - `skills/generate-html.skill.md` 신규 — HTML/CSS 상세페이지 생성 스킬 (Distilled Aesthetics 가이드라인, html.to.design 호환, 인라인 검증)
  - `agents/product-to-html.md` 신규 — v2 에이전트 오케스트레이터 (plan-sections/match-template 재사용 + generate-html)
  - `skills/generate-figma-make-prompt.skill.md` 신규 — HTML → Figma Make 프롬프트 변환 스킬
  - `output/cleanair-a1-detail.html` — 클린에어 A1 v2 HTML 상세페이지 (11섹션, 15/15 검증 PASS)
  - `output/cleanair-a1-figma-make-prompt.md` — Figma Make 입력용 최종 프롬프트 (11섹션 + 12개 이미지 AI 프롬프트)
  - `CLAUDE.md` 업데이트 — v2 파이프라인 섹션, 스킬/에이전트 테이블, 폴더 구조, 워크플로우 반영
- **Next Steps**:
  - Figma Make에 프롬프트 + 제품 이미지 입력 → 결과 비교
  - html.to.design으로 cleanair-a1-detail.html → Figma 변환 테스트
  - generate-figma-make-prompt 스킬의 product-to-html 에이전트 통합 (Step 4 추가)
  - 다른 제품으로 v2 파이프라인 E2E 테스트
- **Blockers**: None
- **Related Files**:
  - `templates/html-base.html` (v2 HTML 골격)
  - `templates/html-section-patterns.md` (v2 섹션 패턴 라이브러리)
  - `skills/generate-html.skill.md` (v2 핵심 스킬)
  - `skills/generate-figma-make-prompt.skill.md` (Figma Make 프롬프트 생성)
  - `agents/product-to-html.md` (v2 에이전트)
  - `output/cleanair-a1-detail.html` (검증 완료 HTML)
  - `output/cleanair-a1-figma-make-prompt.md` (Figma Make 프롬프트)

## Past 1 [1770774733]
- **Task**: 템플릿 에디터 구현 + reference3 전체 파이프라인 테스트 + 클린에어 A1 상세페이지 생성
- **Completed**: template-editor.html 신규, ref-to-template 플로우 (reference3 → 11섹션 템플릿), product-to-page 실행 (cleanair-a1-layout.json)
- **Note**: v1 JSON 파이프라인 완성. ref-reference3 기반 11섹션, 블루 브랜드(#2E7DF7)

## Past 2 [1770770852]
- **Task**: 에이전트/스킬 아키텍처 리팩토링 — 4개 모놀리식 프롬프트 → 2 에이전트 + 7 스킬 모듈화
- **Completed**: REFACTOR-PLAN.md 수립, 기존 프롬프트 4개 분석, skills 7개 + agents 2개 구조 설계
- **Note**: 리팩토링 플랜만 수립, 구현은 다음 세션에서 진행
