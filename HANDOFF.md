# HANDOFF

## Current [1770704130]
- **Task**: 섹션 분류 체계(taxonomy) 스킬 시스템 구축 + HTML 미리보기 도구 추가
- **Completed**:
  - `tools/preview.html` 생성 — JSON → HTML 미리보기 렌더러 (단일 파일, 의존성 없음)
  - `skills/section-taxonomy.json` 생성 — 19개 섹션, 5개 카테고리, keywords/visual_cues/required_elements/copywriting_guide 포함
  - `skills/unmapped-sections/` 디렉토리 생성 — 미분류 섹션 리포트 저장소
  - `prompts/analyze-reference.md` v2.0 갱신 — taxonomy 기반 매핑 로직, 4단계 분석(미분류 리포트 포함)
  - `prompts/recommend-template.md` 신규 — 섹션 설계 + 매칭 점수 기반 템플릿 추천
  - `prompts/generate-page.md` 신규 — 선택된 템플릿으로 레이아웃 JSON 생성
  - `CLAUDE.md` 갱신 — 워크플로우 C(스킬 기반), 스킬 요약표, taxonomy 설명 추가
  - `templates/ref-logitech-k120.template.json` v3.1 갱신 — taxonomy_id 매핑, FeatureDetail 3→5개, 섹션 재분류(BrandName/Differentiator), taxonomy_profile 추가
  - `/analyze-ref` 테스트 완료 — 로지텍 K120 레퍼런스(12섹션, 100% 매핑, FeatureDetail 5개)
- **Next Steps**:
  - `/recommend-template` 테스트 — 새 제품으로 템플릿 추천 테스트
  - `/generate-page` 테스트 — 추천된 템플릿으로 실제 상세페이지 JSON 생성
  - 레퍼런스 추가 분석 — 다른 레퍼런스 이미지로 taxonomy 매핑 검증 + 미분류 섹션 발굴
  - taxonomy 확장 — 미분류 섹션 리뷰 후 19개 → 목표 50개로 점진 확장
- **Blockers**: None
- **Related Files**:
  - `skills/section-taxonomy.json`
  - `prompts/analyze-reference.md`
  - `prompts/recommend-template.md`
  - `prompts/generate-page.md`
  - `templates/ref-logitech-k120.template.json`
  - `tools/preview.html`
  - `CLAUDE.md`
