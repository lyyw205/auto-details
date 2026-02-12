# HANDOFF

## Current [1770896525]
- **Task**: 와이어프레임 위젯 시스템 재설계 — auto-layout → bounds 기반 절대배치
- **Completed**:
  - `templates/wireframe-base.html` 단순화: 레이아웃 유틸 CSS 제거 (~290줄→~150줄), `.wf-section`/`.wf-card`를 position:relative 컨테이너로 변경, `.wf-reference-bg` 추가
  - `skills/extract-widgets-v4.skill.md` 전면 재작성: 레이아웃 추론 로직 제거, bounds 좌표 → position:absolute 직접 매핑, WIDGET_META wireframe_info 포맷 변경
  - `skills/analyze-ref-v3.skill.md` 정리: alternating/vertical/horizontal-list role 제거, layout 필드 섹션 + 레이아웃 판별 가이드 전체 제거
  - `output/analysis-v3-test-sample.json` 복원: alternating-list → grid-row x2, 2×2 좌표로 복원, g3 그룹 추가
  - `widgets/featuredetail/featuredetail--ref-test-sample--v4-stack-light.widget.html` 절대배치로 재생성
  - `output/widgets-preview--ref-test-sample--v4.html` 프리뷰 재생성 (FeatureDetail + Differentiator, bounds-based)
- **Next Steps**:
  - 브라우저에서 프리뷰 확인 (`output/widgets-preview--ref-test-sample--v4.html`)
  - `node tools/gallery/server.js` → wireframe 위젯 정상 렌더/demo 모드 확인
  - `widgets/differentiator/differentiator--ref-test-sample--v4.widget.html` 도 bounds-based로 업데이트 필요 (이번 범위에서 제외됨)
  - 실제 레퍼런스로 `/ref-to-widgets v4` E2E 테스트
- **Blockers**: None
- **Related Files**:
  - `templates/wireframe-base.html` (CSS 단순화)
  - `skills/extract-widgets-v4.skill.md` (bounds 기반 재작성)
  - `skills/analyze-ref-v3.skill.md` (layout 관련 제거)
  - `output/analysis-v3-test-sample.json` (2×2 그리드 복원)
  - `widgets/featuredetail/featuredetail--ref-test-sample--v4-stack-light.widget.html`
  - `output/widgets-preview--ref-test-sample--v4.html`

## Past 1 [1770876228]
- **Task**: 레퍼런스 충실도(Fidelity) 개선 — analyze-ref-v2 / extract-widgets-v2 스킬 수정 및 테스트
- **Completed**: 충실도 원칙 추가 (섹션 날조/내용 재해석 금지), cassunut 재분석 (12→10 섹션), test-sample 신규 분석
- **Note**: skills/analyze-ref-v2.skill.md, skills/extract-widgets-v2.skill.md 수정

## Past 2 [1770871884]
- **Task**: 위젯 갤러리 UI 대폭 개선 (모달, 카드 썸네일, 중복 비교)
- **Completed**: 모달 반응형, 카드 썸네일 fit 스케일, 중복 비교 모달 개선, 레퍼런스 필터링 드롭다운
- **Note**: tools/gallery/index.html 업데이트
