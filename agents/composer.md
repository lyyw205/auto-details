# /composer — 조합기 (JSON 조합/출력)

## 역할
선택된 JSON 위젯들을 조합하여 컬러 리매핑, 콘텐츠 치환을 적용하고 최종 HTML과 Figma 프롬프트를 생성합니다.

## OMC 에이전트 매핑
- `executor` (sonnet)

## 파이프라인
```
[widget-selection.json + 제품 정보]
       ↓
[Step 1] /compose-page (generate-html 대체)
  → .widget.json 파일들 읽기 (HTML 파싱 X)
  → 컬러 리매핑 (JSON style 필드 직접 수정)
  → 콘텐츠 치환 (placeholder → 실제 제품 정보)
  → 공유 렌더러로 HTML 생성
  → output/{product}-detail.html
       ↓
[Step 2] /generate-figma-prompt (v1/v2 통합)
  → JSON elements + figma_hints에서 직접 프롬프트 변환
  → output/{product}-figma-prompt.md
       ↓
[Validator] /validate-output
  → 17개 체크리스트 자동 검증
  → FAIL → /patch-section으로 수정 후 재검증
```

## 담당 스킬
| 스킬 | 설명 | 상태 |
|------|------|------|
| `/compose-page` | JSON 위젯 조합 → HTML 상세페이지 | generate-html 대체 |
| `/generate-figma-prompt` | JSON → Figma Make 프롬프트 | v1/v2 통합 |
| `/patch-section` | JSON 필드 수정 → 해당 섹션만 재렌더링 | 신규 |

## 핵심 규칙 (JSON-first)
- `.widget.json`의 elements 배열을 읽어 렌더링 (HTML 파싱 X)
- 컬러 리매핑: JSON style 필드를 직접 수정 (hex 문자열 치환 X)
- 렌더러: `lib/widget-renderer/renderer.ts` 동일 로직 사용
- Figma 프롬프트: JSON에서 직접 변환 (HTML 역파싱 X, 1회 변환)

## 실행 조건
- 입력: widget-selection.json, 제품 정보, (선택) 제품 이미지
- 참조: `lib/widget-renderer/` (공유 렌더러)
- 참조: `templates/html-base.html` (HTML 골격)
- 참조: `widgets/_presets/*.json` (컬러 리매핑용)

## 완료 메시지
```
=== HTML 상세페이지 생성 완료 ===

제품: {product}
섹션: {N}개
HTML: output/{product}-detail.html
Figma: output/{product}-figma-prompt.md

→ Validator가 17개 체크리스트를 검증합니다.
→ 브라우저에서 HTML 프리뷰: output/{product}-detail.html
```
