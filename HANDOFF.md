# HANDOFF

## Current [1770964058]
- **Task**: Hybrid 2-Pass Detection System 구현 (Gemini box_2d + HuggingFace OWL-ViT)
- **Completed**:
  - `mapping/package.json`에 `sharp`, `@huggingface/inference` 의존성 추가
  - `mapping/next.config.ts`에 `serverExternalPackages: ["sharp"]` 설정
  - `mapping/src/lib/types.ts`에 파이프라인 타입 추가 (GeminiRawElement, ImageTile, PreprocessedImage, DetectionBox, AnalyzeResponse.pipeline)
  - `mapping/src/lib/constants.ts`에 파이프라인 상수 추가 (CANVAS_WIDTH, TILE_HEIGHT, BOX2D_SCALE, HF_MODEL, IoU 임계값)
  - `mapping/src/lib/image-preprocess.ts` 새 파일 — Sharp 860px 리사이즈 + 긴 이미지 타일링 (1200px 타일, 200px 오버랩, PNG 강제)
  - `mapping/src/lib/gemini-prompt.ts` 전면 교체 — box_2d 네이티브 포맷 (0-1000) + box2dToBound() 변환 함수 (타일 오프셋 보정)
  - `mapping/src/lib/detection-pass.ts` 새 파일 — HuggingFace zero-shot detection (raw fetch API)
  - `mapping/src/lib/merge-bounds.ts` 새 파일 — IoU 매칭 + 좌표 정제 + 타일 중복 제거
  - `mapping/src/app/api/analyze/route.ts` 전면 교체 — 3단계 파이프라인 (preprocess → Gemini → HF → merge) + maxDuration=120
  - `mapping/src/components/toolbar.tsx` — 뱃지/라벨 "2-Pass Pipeline"으로 업데이트
  - `mapping/src/components/app-shell.tsx` — pipelineInfo 상태 + 파이프라인 메타데이터 배너 추가
  - HF API 엔드포인트 마이그레이션: api-inference.huggingface.co → router.huggingface.co/hf-inference
  - HF 모델 교체: owlv2-base-patch16 → owlvit-base-patch32 (Inference Providers 미배포 이슈)
- **Next Steps**:
  - `google/owlvit-base-patch32` 모델로 Pass 2 동작 테스트 (404/403 해결 확인)
  - Pass 2 정상 작동 시 실제 바운딩 박스 품질 비교 (Pass 1 only vs 2-Pass)
  - 기존 fallback(색상 클러스터링) + manual 모드 정상 동작 확인
  - Widget 다운로드가 새 파이프라인 결과로 정상 생성되는지 확인
  - Pass 2 모델이 여전히 안 되면 대안 탐색 (Serverless Inference Endpoint 또는 다른 모델)
- **Blockers**: HF Inference Providers에서 OWLv2 미배포 → owlvit-base-patch32로 교체함, 아직 테스트 미완
- **Related Files**:
  - `mapping/src/lib/image-preprocess.ts` (Sharp 리사이즈 + 타일링)
  - `mapping/src/lib/gemini-prompt.ts` (box_2d 프롬프트 + 변환)
  - `mapping/src/lib/detection-pass.ts` (HF 감지)
  - `mapping/src/lib/merge-bounds.ts` (IoU 병합)
  - `mapping/src/app/api/analyze/route.ts` (2-pass 파이프라인)
  - `mapping/src/lib/types.ts` (파이프라인 타입)
  - `mapping/src/lib/constants.ts` (파이프라인 상수)
  - `mapping/src/components/toolbar.tsx` (UI 뱃지)
  - `mapping/src/components/app-shell.tsx` (파이프라인 info 배너)
  - `mapping/.env.local` (HF_TOKEN)

## Past 1 [1770957841]
- **Task**: Agent1 분석/추출 스킬 → Mapping 시스템 교체 + 프로젝트 클린업 + Gemini 프롬프트 강화
- **Completed**: 기존 분석/추출 스킬 7개 삭제, mapping/ 웹앱 통합, /map-reference 스킬 생성, bounds-to-widget 변환 + Widget 다운로드 기능 추가, BoundStyle UI, CLAUDE.md 업데이트
- **Note**: ref-to-widgets 에이전트가 새 파이프라인(map-reference → register-widgets)으로 동작
