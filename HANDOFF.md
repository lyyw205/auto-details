# HANDOFF

## Current [1770796704]
- **Task**: 위젯 샘플 데이터 + 갤러리 관리 기능 구현
- **Completed**:
  - 10개 ref-reference4 위젯 WIDGET_META에 `sample_data` 필드 추가
    - `texts`: 플레이스홀더 → 샘플 텍스트 매핑 (WOODMUSE 우드 오거나이저 제품)
    - `images`: img-label 매칭용 Unsplash 이미지 URL (API 검증 완료)
  - `tools/gallery/server.js` 업데이트
    - `parseWidgetMeta()` — HTML에서 WIDGET_META JSON 파싱
    - `applyDemoMode()` — 텍스트 치환 + img-placeholder→`<img>` 교체 (`?mode=demo`)
    - `DELETE /api/widget/:id` — 레지스트리 제거 + 파일 삭제 + total_widgets 갱신
  - `tools/gallery/index.html` 업데이트
    - Demo/Raw 토글 (툴바, 기본값 Demo)
    - 모달: 파일 경로 표시 + 복사 버튼 + 위젯 삭제 버튼 + 확인 다이얼로그
    - 모달 iframe scale-to-fit (스크롤 없이 한눈에 보기)
    - Demo/Raw 전환 시 모달 iframe 자동 갱신
- **Next Steps**:
  - 루미에어 Figma Make 프롬프트 생성 (`/generate-figma-make-prompt`)
  - 다른 레퍼런스(reference3, maru 등)로 HTML 위젯 재추출하여 라이브러리 확충
  - 다크 테마 위젯 라이브러리 구축 (현재 라이트 테마만 있음)
  - 추가 위젯에 sample_data 확장 (현재 ref-reference4만 적용)
- **Blockers**: None
- **Related Files**:
  - `tools/gallery/server.js` (demo 모드 + DELETE API)
  - `tools/gallery/index.html` (Demo/Raw 토글 + 관리 UI)
  - `widgets/**/*ref-reference4*.widget.html` (10개, sample_data 추가)

## Past 1 [1770790885]
- **Task**: reference4 분석 + 위젯 추출 E2E 테스트 + 루미에어 상세페이지 생성
- **Completed**: /ref-to-widgets E2E (reference4, 10개 위젯), extract-widgets 프리뷰 워크플로우 개선, /product-to-html E2E (루미에어, 18섹션 HTML)
- **Note**: output/lumiair-detail.html 생성. widgets/_registry.json 10개 등록.

## Past 2 [1770788779]
- **Task**: JSON 위젯 → HTML/CSS 위젯 리팩토링
- **Completed**: 54개 JSON 위젯 아카이브, extract/register/select/generate 스킬 HTML 포맷 개편, 에이전트 2개 업데이트, CLAUDE.md 재작성
- **Note**: v2 HTML 위젯 시스템 기반 완성. widgets/_registry.json v2.0 초기화.
