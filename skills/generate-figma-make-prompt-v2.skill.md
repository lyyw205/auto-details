# /generate-figma-make-prompt-v2 — v4 와이어프레임 기반 Figma Make 프롬프트 생성

## Purpose
v4 와이어프레임 위젯(`composition: "wireframe"`)의 WIDGET_META에 포함된 `figma_make_hints`를 활용하여 **Figma Make에 바로 입력할 수 있는 최종 프롬프트**를 생성합니다.

v1 대비 개선점:
- HTML 파싱 대신 **구조화된 메타데이터**(wireframe_info, figma_make_hints) 직접 활용
- 와이어프레임 HTML을 시각적 레이아웃 참조로 첨부
- 더 정확한 레이아웃 구조 기술

## Context
- 입력: v4 와이어프레임 위젯 파일들 (`widgets/**/*--v4.widget.html`)
- 또는: 통합 프리뷰 HTML (`output/widgets-preview--ref-{name}--v4.html`)
- 스타일 프리셋: `widgets/_presets/preset--ref-{name}.json`
- 섹션 분류 체계: `skills/section-taxonomy.json`

## Input
1. **레퍼런스 이름**: `ref-{name}` (v4 위젯이 추출된 레퍼런스)
2. **제품 정보**:
   - 제품명 (한글 + 영문)
   - 브랜드명
   - 제품 카테고리 (가전, 뷰티, 식품 등)
   - 핵심 셀링 포인트 3~5개
3. (선택) **디자인 톤 선호**: 프리미엄/미니멀/내추럴/테크 등
4. (선택) **제품 이미지**: 유저가 함께 첨부할 실제 제품 사진

## Processing

### 1단계: 메타데이터 수집

레퍼런스에서 추출된 v4 위젯들의 WIDGET_META를 수집합니다:

```
widgets/_registry.json에서 source_ref = "ref-{name}" && composition = "wireframe" 필터
→ 각 위젯 파일에서 WIDGET_META 파싱
→ figma_make_hints, wireframe_info 추출
```

프리셋에서 색상/타이포 정보 추출:
```
widgets/_presets/preset--ref-{name}.json
→ color_system, typography, style_tags
```

### 2단계: 프롬프트 구조 작성

```markdown
# [제품명] 상세페이지 디자인

## 디자인 개요
(전체 톤, 스타일, 분위기, 타겟 — 프리셋 style_tags 기반)

## 디자인 시스템
### 컬러
- 메인 컬러: {brand_main} (용도 설명)
- 액센트: {accent} (용도 설명)

### 타이포그래피
- 제목: {main_copy.fontSize}px, Bold
- 본문: {body.fontSize}px, Regular
- 캡션: {small.fontSize}px, Regular
- 폰트: Pretendard (한국어)

### 시각 효과
(프리셋과 레퍼런스 분석 기반)

## 섹션별 디자인 지시

### 섹션 1: {taxonomy_id} — {section_description}
**레이아웃**: {layout_structure}
**구성 요소**:
{key_elements를 자연어로 변환}

**텍스트 콘텐츠**:
{실제 제품 정보로 치환된 카피}

**이미지 영역**:
{ai_images 목록}

### 섹션 2: ...
(반복)

## 이미지 가이드
(전체 이미지 영역 총정리)

## 디자인 품질 지침
(공통 규칙)
```

### 3단계: figma_make_hints → 자연어 변환

#### key_elements 변환 규칙

| role | 프롬프트 표현 |
|------|-------------|
| `badge` | "'{label}' 배지 ({position})" |
| `heading` | "{lines}줄 제목 텍스트 ({alignment} 정렬)" |
| `body-text` | "{lines}줄 본문 텍스트" |
| `card-grid` | "{columns}×{rows} 카드 그리드 (각 카드: {card_content})" |
| `image` | "이미지 영역 ({ratio} 비율)" |
| `button` | "CTA 버튼" |
| `badge-row` | "배지 가로 나열 ({count}개)" |

#### ai_images 변환 규칙

```markdown
📸 **{role}**
   - 위치: {섹션 내 위치}
   - 비율: {ratio}
   - 스타일: {style}
   - AI 프롬프트: "{prompt}"
```

### 4단계: 제품 정보 주입

위젯의 `sample_data.texts` placeholder를 실제 제품 정보로 치환합니다:

| Placeholder 패턴 | 치환 소스 |
|-----------------|----------|
| `[브랜드명]` | 제품 정보의 브랜드명 |
| `[메인 카피]` | 핵심 셀링 포인트 1 |
| `[서브 카피]` | 부가 설명 |
| `[포인트 N 설명]` | 셀링 포인트 N |
| `[버튼 텍스트]` | "지금 구매하기" 등 |

### 5단계: 디자인 품질 지침 추가

프롬프트 말미에 항상 포함:

```markdown
## 디자인 품질 지침
- 860px 고정 너비 (모바일 상세페이지 기준)
- 모든 섹션 배경에 subtle gradient 적용 (단색 금지)
- 타이포그래피: 한국어 Pretendard 폰트
- 이미지 영역: 위 이미지 가이드 참고
- 전체적으로 {style_tags} 느낌 유지
```

## Output
- 파일: `output/{name}-figma-make-prompt.md`
- 형식: Markdown (Figma Make에 복사-붙여넣기 가능)

## 프롬프트 길이 가이드
- **디자인 개요**: 3~5줄
- **디자인 시스템**: 10~15줄
- **섹션별 지시**: 섹션당 8~15줄 (총 분량의 70%)
- **이미지 가이드**: 이미지당 3~4줄
- **품질 지침**: 5~8줄
- **전체 길이**: 1,500~3,000자 (한국어 기준)

## v1 대비 차이점

| 영역 | v1 (generate-figma-make-prompt) | v2 (generate-figma-make-prompt-v2) |
|------|--------------------------------|-------------------------------------|
| **입력** | generate-html 결과 HTML | v4 위젯 WIDGET_META |
| **레이아웃 기술** | HTML 클래스명에서 추론 | `wireframe_info` 직접 활용 |
| **이미지 프롬프트** | `data-ai-prompt` 파싱 | `figma_make_hints.ai_images` 직접 활용 |
| **구조 정확도** | CSS 클래스 → 자연어 (손실 있음) | 구조화된 메타데이터 → 자연어 (정확) |
| **와이어프레임 첨부** | 없음 | v4 HTML을 시각 레퍼런스로 함께 제공 가능 |

## 주의사항
- Figma Make는 자연어 지시를 이해하므로 CSS 클래스명을 그대로 쓰지 않음
- 디자인 의도를 "결과 지향적"으로 기술 (방법이 아닌 결과물 묘사)
- 한국어로 작성 (AI 이미지 프롬프트만 영문)
- 와이어프레임 HTML은 레이아웃 참조용이며, 최종 디자인은 브랜드 컬러/이미지가 적용되어야 함
