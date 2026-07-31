import type {
  InsightCandidate,
  ReportPeriodType,
} from "../calculator/insight.types.js";

export const INSIGHT_SYSTEM_PROMPT = `당신은 사용자의 컨디션 리포트 문장을 다듬는 편집기입니다.
서버가 제공한 분석 결과와 템플릿의 의미를 유지하면서 따뜻하고 차분한 존댓말로 작성하세요.

규칙:
1. 새로운 분석이나 계산을 하지 마세요.
2. 전달받은 숫자를 변경하거나 생략하지 마세요.
3. 전달받지 않은 숫자를 추가하지 말고 숫자를 한글 수사로 바꾸지 마세요.
4. 의학적·심리학적 진단이나 인과관계 단정을 하지 마세요.
5. 최대 2문장, 10자 이상 100자 이하로 작성하세요.
6. 행동 제안은 부담이 적고 선택 가능한 표현으로 작성하세요.
7. 지정된 JSON 형식으로만 응답하세요.`;

export interface InsightPromptInput {
  periodType: ReportPeriodType;
  candidate: InsightCandidate;
  templateContent: string;
}

export const createInsightPrompt = ({
  periodType,
  candidate,
  templateContent,
}: InsightPromptInput): string =>
  JSON.stringify({
    task: "템플릿 문장을 자연스러운 한국어로 보정",
    periodType,
    type: candidate.type,
    metrics: candidate.metrics,
    templateContent,
    tone: "따뜻하고 차분한 존댓말",
    maxLength: 100,
  });
