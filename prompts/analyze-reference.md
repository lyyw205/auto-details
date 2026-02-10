# 레퍼런스 상세페이지 이미지 분석 프롬프트 (v2.0 - Taxonomy 기반)

## 목적

레퍼런스 상세페이지 이미지(스크린샷)를 분석하여 구조화된 레이아웃 데이터를 추출하고,
**섹션 분류 체계(taxonomy)에 기반하여 각 섹션을 표준 ID에 매핑**합니다.
매핑 불가능한 섹션은 미분류 리포트로 별도 출력합니다.

### 참조 파일

- 섹션 분류 체계: `skills/section-taxonomy.json`
- 미분류 리포트 저장 위치: `skills/unmapped-sections/`

---

## 분석 지시문

아래 이미지는 이커머스 상세페이지 스크린샷입니다.
4단계로 분석하여 구조화된 JSON 형태로 결과를 출력해 주세요.

---

## 1단계: 글로벌 분석

전체 페이지의 시각적 특성을 파악합니다.

### 분석 항목

```json
{
  "global_analysis": {
    "estimated_width": "페이지 추정 너비 (px 단위, 일반적으로 860 또는 750)",
    "color_palette": {
      "primary": "#hex - 가장 많이 사용된 강조색",
      "secondary": "#hex - 두 번째 강조색",
      "background_colors": ["#hex - 배경에 사용된 색상들"],
      "text_primary": "#hex - 주요 텍스트 색상",
      "text_secondary": "#hex - 보조 텍스트 색상"
    },
    "typography_scale": {
      "largest_heading": "추정 px 크기",
      "section_heading": "추정 px 크기",
      "sub_heading": "추정 px 크기",
      "body_text": "추정 px 크기",
      "small_text": "추정 px 크기"
    },
    "visual_rhythm": "배경색 교차 패턴 설명 (예: 다크-라이트 교차, 단일 배경 등)",
    "overall_style": "전반적인 스타일 (예: 미니멀, 다크모드, 화려한 컬러풀, 내추럴 등)",
    "content_alignment": "주요 콘텐츠 정렬 (CENTER / LEFT / MIXED)"
  }
}
```

---

## 2단계: 섹션별 분석 + Taxonomy 매핑

이미지를 위에서 아래로 스크롤하며, 시각적으로 구분되는 각 섹션을 식별합니다.
**각 섹션을 `skills/section-taxonomy.json`의 표준 섹션 ID에 매핑합니다.**

### 매핑 판단 기준 (우선순위 순)

1. **purpose 일치**: 섹션의 목적이 taxonomy 정의와 부합하는가?
2. **keywords 매칭**: 섹션 내 텍스트에 taxonomy의 keywords가 포함되는가?
3. **visual_cues 매칭**: 시각적 특징이 taxonomy의 visual_cues와 유사한가?
4. **required_elements 구조**: 포함된 요소 타입이 taxonomy의 required_elements와 유사한가?

### 매핑 확신도 기준

| 확신도 | 기준 |
|--------|------|
| 0.9~1.0 | purpose + keywords + visual_cues 모두 일치 |
| 0.7~0.8 | purpose 일치 + keywords 또는 visual_cues 부분 일치 |
| 0.5~0.6 | purpose 유사하지만 구조가 다름 |
| 0.3~0.4 | 일부 요소만 유사, 전체적으로는 다른 목적 |
| 0.0~0.2 | 기존 taxonomy에 해당하는 섹션 없음 → **미분류** |

### 각 섹션 분석 형식

```json
{
  "sections": [
    {
      "order": 1,
      "detected_purpose": "이 섹션이 하는 역할",
      "taxonomy_mapping": {
        "section_id": "taxonomy의 섹션 ID (예: Hook, WhatIsThis, FeatureDetail 등)",
        "confidence": 0.9,
        "mapping_reason": "매핑 근거 설명 (어떤 keywords, visual_cues가 매칭되었는지)"
      },
      "layout": {
        "estimated_height": "추정 높이 (px)",
        "background": "#hex 또는 gradient 설명",
        "padding": {
          "top": "추정 px",
          "bottom": "추정 px",
          "left": "추정 px",
          "right": "추정 px"
        },
        "itemSpacing": "요소 간 추정 간격 (px)",
        "layoutMode": "VERTICAL 또는 HORIZONTAL",
        "contentAlignment": "CENTER / LEFT / RIGHT"
      },
      "elements": [
        {
          "type": "TEXT / IMAGE / FRAME / BUTTON / etc",
          "role": "이 요소의 역할 설명",
          "estimated_fontSize": "추정 px (텍스트인 경우)",
          "estimated_fontWeight": "추정 굵기 (텍스트인 경우)",
          "color": "#hex (감지된 경우)",
          "estimated_size": "추정 너비 x 높이 (이미지/프레임인 경우)"
        }
      ],
      "visual_notes": "특이한 레이아웃, 장식 요소, 아이콘 사용 등 참고 사항"
    }
  ]
}
```

### 매핑 불가능한 섹션 처리

confidence가 0.3 미만이면 `taxonomy_mapping`을 다음과 같이 작성:

```json
{
  "taxonomy_mapping": {
    "section_id": null,
    "confidence": 0.1,
    "mapping_reason": "기존 taxonomy에 해당하는 섹션 없음",
    "unmapped": true,
    "suggested_id": "제안하는 새 섹션 ID (영문, PascalCase)",
    "suggested_category": "intro | problem | features | trust | conversion",
    "suggested_name": "제안하는 섹션 한글명"
  }
}
```

### FeatureDetail 반복 처리

기능 상세 설명이 반복 패턴으로 나타나는 경우:
- 각각을 별도 섹션으로 분리
- `section_id`는 모두 `"FeatureDetail"`로 매핑
- `feature_index` 필드를 추가하여 순번 표시 (1, 2, 3...)

```json
{
  "taxonomy_mapping": {
    "section_id": "FeatureDetail",
    "confidence": 0.9,
    "feature_index": 3,
    "mapping_reason": "Q&A 형식의 기능 상세 설명, 3번째 반복"
  }
}
```

### 섹션 식별 기준

- 배경색이 변하는 지점
- 명확한 여백(공백)으로 분리되는 영역
- 시각적으로 다른 목적을 가진 콘텐츠 블록
- 제목 + 내용으로 구성된 독립 블록

---

## 3단계: 패턴 요약

전체 분석을 종합하여 패턴을 정리합니다.

```json
{
  "pattern_summary": {
    "total_sections": "감지된 총 섹션 수",
    "section_flow": ["Hook", "WhatIsThis", "FeatureDetail", "..."],
    "background_pattern": "배경색 교차 패턴",
    "category_distribution": {
      "intro": 3,
      "problem": 2,
      "features": 6,
      "trust": 4,
      "conversion": 1
    },
    "mapping_stats": {
      "total": "전체 섹션 수",
      "mapped": "매핑 성공 수",
      "unmapped": "미분류 수",
      "coverage": "매핑률 (예: 85%)"
    },
    "feature_detail_count": "FeatureDetail 반복 횟수",
    "unique_patterns": [
      "이 레퍼런스만의 독특한 레이아웃 패턴이나 시각 요소"
    ]
  }
}
```

---

## 4단계: 미분류 섹션 리포트

매핑 불가능한 섹션이 있을 경우, 별도 리포트를 생성합니다.
이 리포트는 `skills/unmapped-sections/unmapped-[레퍼런스명].json`으로 저장됩니다.

```json
{
  "reference": "레퍼런스 파일명/출처",
  "report_date": "YYYY-MM-DD",
  "total_sections": "전체 섹션 수",
  "unmapped_count": "미분류 수",
  "unmapped_sections": [
    {
      "position": 5,
      "description": "이 섹션의 역할 상세 설명",
      "visual_type": "시각적 특징 요약 (예: 테이블 중심, 밝은 배경)",
      "content_summary": "포함된 콘텐츠 요약",
      "suggested_id": "IngredientsDetail",
      "suggested_category": "features",
      "suggested_name": "성분 상세",
      "suggested_keywords": ["성분", "원료", "함량", "효능"],
      "suggested_visual_cues": ["테이블 레이아웃", "성분 나열", "함량 수치"],
      "confidence": 0.2
    }
  ]
}
```

미분류 섹션이 없으면 이 단계를 건너뜁니다.

---

## 주의사항

1. **taxonomy 매핑 우선**: 모든 섹션은 반드시 taxonomy 매핑을 시도합니다. 매핑 불가 시에만 unmapped 처리합니다.
2. **정확한 수치보다 비율이 중요합니다**: 정확한 px를 맞추기보다, 전체적인 비율과 시각적 리듬을 잘 포착하세요.
3. **섹션 수를 제한하지 마세요**: 이미지에서 보이는 모든 섹션을 분석합니다 (12개~30개 이상 가능).
4. **그라데이션, 오버레이 감지**: 배경에 그라데이션이나 반투명 오버레이가 있으면 명시하세요.
5. **아이콘/일러스트 참고**: 아이콘, 일러스트, 인포그래픽이 사용된 경우 위치와 스타일을 기록하세요.
6. **텍스트 정렬 패턴**: 가운데 정렬, 왼쪽 정렬, 또는 혼합인지 각 섹션별로 기록하세요.
7. **여러 장의 이미지**: 레퍼런스가 여러 장으로 나뉜 경우, 순서대로 연결하여 하나의 페이지로 분석하세요.
8. **FeatureDetail 패턴**: 유사한 구조가 반복되면 각각 FeatureDetail로 매핑하고 feature_index를 부여하세요.
