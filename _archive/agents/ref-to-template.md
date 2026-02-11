# /ref-to-template — 레퍼런스 → 템플릿 에이전트

## 역할
레퍼런스 이미지를 분석하여 재사용 가능한 템플릿을 생성하고 레지스트리에 등록하는
3단계 파이프라인을 오케스트레이션합니다.

## 워크플로우

```
레퍼런스 이미지 제공 (references/ 폴더)
       ↓
[Step 1] /analyze-ref
  → skills/analyze-ref.skill.md 실행
  → output/analysis-{name}.json 저장
  → 유저에게 요약 표시:
    • 감지된 섹션 수
    • taxonomy 매핑률 (%)
    • 미분류 섹션 목록 (있으면)
  → 미분류 섹션 있으면 skills/unmapped-sections/에 리포트 저장
       ↓
[Step 2] /generate-template
  → skills/generate-template.skill.md 실행
  → templates/ref-{name}.template.json 저장
  → 유저에게 템플릿 요약 표시:
    • 섹션 구조 (순서 + ID)
    • 컬러 시스템
    • 타이포그래피 스케일
    • composition 분포 (stack/composed/split 각 몇 개)
       ↓
★ [Step 2.5] 시각적 검수 (Template Editor)
  → tools/template-editor.html을 브라우저에서 열기
  → 생성된 templates/ref-{name}.template.json 로드
  → 유저가 와이어프레임으로 구조 확인:
    • 섹션 배치 순서, 높이, 색상
    • composed/split/stack 레이아웃 확인
    • 요소 구성 (TEXT, IMAGE_AREA, BUTTON 배치)
  → 필요 시 미세 조정:
    • 섹션 높이/배경색/패딩/간격 수정
    • 섹션 순서 변경 또는 삭제
    • 글로벌 컬러 시스템/타이포 스케일 수정
  → 수정 완료 후 Export JSON으로 다운로드
  → 수정된 파일을 templates/ref-{name}.template.json에 저장
  → 유저 확인: "등록을 진행할까요?"
       ↓
[Step 3] /register-template
  → skills/register-template.skill.md 실행
  → templates/_registry.json 업데이트
  → 완료: "ref-{name} 템플릿이 레지스트리에 등록되었습니다"
```

## 입력 요구사항
- **레퍼런스 이미지**: `references/` 폴더에 저장된 스크린샷 (1장 또는 여러 장)
- **레퍼런스 이름**: 영문 소문자 + 하이픈 (예: `apple-airpods`, `dyson-v15`)

## 생성되는 파일들
| 단계 | 파일 | 설명 |
|------|------|------|
| Step 1 | `output/analysis-{name}.json` | 분석 결과 (global + sections + pattern) |
| Step 1 | `skills/unmapped-sections/unmapped-{name}.json` | 미분류 리포트 (있을 경우) |
| Step 2 | `templates/ref-{name}.template.json` | v3.0 템플릿 |
| Step 3 | `templates/_registry.json` | 레지스트리 업데이트 |

## 에러 처리
- **Step 1 실패**: 이미지 품질/크기 문제 → 다른 스크린샷 요청
- **Step 2 실패**: analysis JSON 검증 후 재시도
- **Step 3 실패**: 수동 등록 안내 (`templates/_registry.json` 직접 편집)

## 참조 스킬
- `skills/analyze-ref.skill.md`
- `skills/generate-template.skill.md`
- `skills/register-template.skill.md`
