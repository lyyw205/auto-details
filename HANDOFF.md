# HANDOFF

## Current [1770876228]
- **Task**: 레퍼런스 충실도(Fidelity) 개선 — analyze-ref-v2 / extract-widgets-v2 스킬 수정 및 테스트
- **Completed**:
  - `skills/analyze-ref-v2.skill.md`에 "핵심 원칙: 레퍼런스 충실도" 블록 추가 (섹션 날조/내용 재해석/용어 변경/반복 섹션 누락 금지)
  - `skills/analyze-ref-v2.skill.md`에 섹션 검증 체크리스트 + taxonomy 매핑 주의사항 추가
  - `skills/extract-widgets-v2.skill.md`에 "핵심 원칙: 레퍼런스 구조 트레이싱" + content_hint 기반 placeholder 생성 규칙 추가
  - cassunut 재분석: Part→Point 용어 복원, 날조 섹션(ProductSpec/CTA) 제거, Point.4 추가 (12→10 섹션)
  - test-sample 신규 분석: 레퍼런스 이미지에 보이는 2개 섹션만 충실하게 분석, 날조 없음 확인
  - 두 테스트 모두 프리뷰 HTML만 생성 (라이브러리/레지스트리 미등록)
- **Next Steps**:
  - test-sample 프리뷰 브라우저 검수
  - 실제 새 레퍼런스로 `/ref-to-widgets` 에이전트 E2E 테스트 (충실도 규칙 실전 검증)
  - cassunut v2 위젯 정식 등록 여부 결정
- **Blockers**: None
- **Related Files**:
  - `skills/analyze-ref-v2.skill.md` (충실도 원칙 추가)
  - `skills/extract-widgets-v2.skill.md` (트레이싱 원칙 + placeholder 규칙 추가)
  - `output/analysis-v2-cassunut.json` (재분석 결과)
  - `output/widgets-preview--ref-cassunut--v2.html` (cassunut 프리뷰)
  - `output/analysis-v2-test-sample.json` (test-sample 분석)
  - `output/widgets-preview--ref-test-sample--v2.html` (test-sample 프리뷰)

## Past 1 [1770871884]
- **Task**: 위젯 갤러리 UI 대폭 개선 (모달, 카드 썸네일, 중복 비교)
- **Completed**: 모달 반응형, 카드 썸네일 fit 스케일, 중복 비교 모달 개선, 레퍼런스 필터링 드롭다운
- **Note**: tools/gallery/index.html 업데이트

## Past 2 [1770870360]
- **Task**: analyze-ref-v2 + extract-widgets-v2 스킬 구현 및 ref-cassunut E2E 테스트
- **Completed**: v2 좌표 기반 분석/위젯 생성 스킬 신규 생성, ref-cassunut E2E 테스트 완료 (v2 위젯 10개)
- **Note**: skills/analyze-ref-v2.skill.md, skills/extract-widgets-v2.skill.md 신규
