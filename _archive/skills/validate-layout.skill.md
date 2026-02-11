# /validate-layout — 레이아웃 JSON 구조 검증

## Purpose
생성된 레이아웃 JSON이 Figma 플러그인에서 정상 렌더링될 수 있는지 구조를 검증합니다.

## Context
- `output/{product}-layout.json` (generate-page 출력)
- 검증만 수행하므로 taxonomy 로딩 불필요

## Input
- layout JSON 파일 경로

## Processing

### 검증 항목

#### 1. 필수 구조 (Error)
- [ ] 루트에 `width: 860` 존재
- [ ] 루트에 `children` 배열 존재하고 비어있지 않음
- [ ] 모든 색상이 hex 값 (`#`으로 시작, 시맨틱 이름 잔재 없음)

#### 2. 섹션 구조 (Error)
- [ ] 모든 섹션에 `name`이 `Section_XX_[ID]` 형식
- [ ] `stack` 섹션: `layoutMode`, `primaryAxisAlign`, `counterAxisAlign` 존재
- [ ] `composed` 섹션: `layers` 배열, 각 layer에 `zIndex`, `region`, `element` 존재
- [ ] `split` 섹션: `direction`, `ratio`, 양쪽 패널(`left`/`right` 또는 `top`/`bottom`) 존재

#### 3. 텍스트 요소 (Error/Warning)
- [ ] 모든 TEXT에 `type`, `name`, `content`, `fontSize`, `fontWeight`, `color` (Error)
- [ ] `\n` 줄바꿈 후 공백 들여쓰기 없음 (Error)
- [ ] 긴 텍스트(30자 이상)에 `width: 760` (Warning)

#### 4. 이미지 요소 (Error/Warning)
- [ ] 모든 IMAGE_AREA에 `label`, `width`, `height`, `placeholderColor` (Error)
- [ ] 모든 IMAGE_AREA에 `ai_prompt` 객체 존재 (Warning)
- [ ] `ai_prompt.prompt`에 `[product]` 플레이스홀더 잔재 없음 (Error)

#### 5. 연속성 (Warning)
- [ ] FeatureDetail의 `feature_index`가 1부터 연속적
- [ ] 섹션 순서 번호가 연속적 (01, 02, 03...)

#### 6. CTA (Error)
- [ ] CTA 섹션에 BUTTON 요소 존재

### 결과 형식

```json
{
  "status": "PASS | FAIL",
  "total_checks": 15,
  "passed": 15,
  "failed": 0,
  "errors": [
    {
      "severity": "error",
      "check": "hex_color",
      "location": "Section_03_BrandName > Slogan",
      "message": "색상값 'brand_main'이 hex로 변환되지 않음"
    }
  ],
  "warnings": [
    {
      "severity": "warning",
      "check": "long_text_width",
      "location": "Section_05_PainPoint > Check_3",
      "message": "40자 텍스트에 width 속성 없음"
    }
  ]
}
```

### 판정 기준
- **PASS**: error 0개 (warning은 허용)
- **FAIL**: error 1개 이상

## Output
- 파일: `output/{product}-validation.json`
- **PASS** → `"Figma 플러그인 적용 가능합니다. tools/preview.html에서 미리보기를 확인하세요."`
- **FAIL** → 에러 목록 표시 + `/generate-page` 재실행 권장

## Validation
- [ ] 모든 체크 항목을 빠짐없이 검사했는가?
- [ ] error와 warning을 올바르게 구분했는가?
  - error = 렌더링 실패 유발
  - warning = 품질 이슈 (렌더링은 가능)
