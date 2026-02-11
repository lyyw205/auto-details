# /register-template — 템플릿 레지스트리 등록

## Purpose
생성된 템플릿을 `templates/_registry.json`에 등록합니다.

## Context
- `templates/_registry.json` (기존 레지스트리)
- 생성된 템플릿 파일의 메타데이터 (상위 ~60줄)

## Input
- 템플릿 파일 경로: `templates/ref-{name}.template.json`

## Processing

1. 템플릿 파일에서 메타데이터 추출 (`name`, `description`, 섹션 수)
2. `_registry.json`의 `templates` 배열에 엔트리 추가
3. 중복 ID 체크 → 이미 존재하면 업데이트 (덮어쓰기)

### 레지스트리 엔트리 형식

```json
{
  "id": "ref-{name}",
  "file": "ref-{name}.template.json",
  "name": "{name} 기반 템플릿",
  "description": "레퍼런스 이미지 분석 기반 자동 생성",
  "section_count": 16,
  "category": "레퍼런스",
  "source": "reference_analysis",
  "created": "YYYY-MM-DD"
}
```

## Output
- `templates/_registry.json` 업데이트
- 완료 메시지: `"ref-{name} 템플릿이 레지스트리에 등록되었습니다."`

## Validation
- [ ] `_registry.json`이 유효한 JSON인가?
- [ ] 중복 ID가 없는가? (있으면 업데이트 처리)
- [ ] 템플릿 파일이 실제 존재하는가?
- [ ] `section_count`가 실제 섹션 수와 일치하는가?
