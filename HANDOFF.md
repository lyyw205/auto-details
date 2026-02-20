# HANDOFF

## Current [1771552497]
- **Task**: 2-Phase Analysis Pipeline 리팩터 시도 + 실패 분석 + 롤백
- **Completed**:
  - 2-Phase 파이프라인 구현 (섹션 분할 → 요소 매핑) — 전체 코드 작성 완료, tsc 통과
  - 테스트 결과 371개 바운드 과잉 감지 확인 (기대 30-50개)
  - 근본 원인 분석: Gemini Phase 2 프롬프트가 너무 관대 (EVERY element), N/A 스타일 미필터, 후처리 없음
  - 3에이전트 합의 플랜 (Planner→Architect→Critic) 수행 — 유저 reject
  - 전체 롤백: 커밋 662513a 상태로 복원
  - 현재 파이프라인 구조 전체 분석 및 문서화 완료
- **Next Steps**:
  - 2-Phase 재설계: 프롬프트 전략 근본 변경 필요 (단순 "모든 요소 감지" → 섹션별 맥락 기반 디자인 요소만)
  - N/A 필터 추가 (cleanStyleValue 함수)
  - 후처리 필터 모듈 (post-process.ts): 최소 크기, 패키지 텍스트 제거, 섹션당 캡
  - HF Pass 제거 여부 결정 (현재 HF_TOKEN 없으면 미사용)
- **Blockers**: 프롬프트 전략 재설계 필요 — 유저와 방향 합의 후 진행
- **Related Files**:
  - `mapping/src/app/api/analyze/route.ts` (현재 2-pass 파이프라인)
  - `mapping/src/lib/gemini-prompt.ts` (ANALYZE_PROMPT + box2dToBound)
  - `mapping/src/lib/detection-pass.ts` (HF Pass 2)
  - `mapping/src/lib/merge-bounds.ts` (IoU 병합 + 타일 중복 제거)
  - `mapping/src/lib/image-preprocess.ts` (860px 리사이즈 + 타일링)
  - `mapping/src/components/app-shell.tsx` (Vision → Fallback → Manual 캐스케이드)
  - `.omc/plans/fix-2phase-pipeline.md` (3에이전트 합의 플랜 — rejected)

## Past 1 [1770964058]
- **Task**: Hybrid 2-Pass Detection System 구현 (Gemini box_2d + HuggingFace OWL-ViT)
- **Completed**: Sharp 리사이즈+타일링, Gemini box_2d 프롬프트, HF zero-shot detection, IoU 병합, 2-pass 파이프라인 route.ts 전면 교체
- **Note**: HF Inference Providers에서 OWLv2 미배포 → owlvit-base-patch32 교체, 테스트 미완

## Past 2 [1770957841]
- **Task**: Agent1 분석/추출 스킬 → Mapping 시스템 교체 + 프로젝트 클린업
- **Completed**: 기존 분석/추출 스킬 7개 삭제, mapping/ 웹앱 통합, bounds-to-widget 변환 + Widget 다운로드 기능 추가
- **Note**: ref-to-widgets 에이전트가 새 파이프라인(map-reference → register-widgets)으로 동작
