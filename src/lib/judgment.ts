import { JudgmentResult } from "@/types";

export interface JudgmentStyle {
  bgColor: string;
  textColor: string;
}

// 「成功」として扱う判定値
const SUCCESS_JUDGMENTS: ReadonlySet<JudgmentResult> = new Set<JudgmentResult>([
  JudgmentResult.MATCH,
  JudgmentResult.NO_DUPLICATE,
]);

// 「失敗」として扱う判定値
const FAILURE_JUDGMENTS: ReadonlySet<JudgmentResult> = new Set<JudgmentResult>([
  JudgmentResult.NO_MATCH,
  JudgmentResult.HAS_DUPLICATE,
]);

// 判定値ごとの履歴表示用ラベル
const JUDGMENT_LABELS: Record<JudgmentResult, string> = {
  [JudgmentResult.MATCH]: "一致",
  [JudgmentResult.NO_MATCH]: "不一致",
  [JudgmentResult.NO_DUPLICATE]: "被りなし",
  [JudgmentResult.HAS_DUPLICATE]: "被りあり",
};

const NO_JUDGMENT_LABEL = "判定なし";

const SUCCESS_STYLE: JudgmentStyle = {
  bgColor: "bg-emerald-100 border-emerald-300",
  textColor: "text-emerald-900",
};

const FAILURE_STYLE: JudgmentStyle = {
  bgColor: "bg-rose-100 border-rose-300",
  textColor: "text-rose-900",
};

const NEUTRAL_STYLE: JudgmentStyle = {
  bgColor: "bg-gray-50 border-gray-200",
  textColor: "text-gray-900",
};

// 判定が「成功」かどうか
export function isSuccessJudgment(judgment: JudgmentResult | null | undefined): boolean {
  return judgment != null && SUCCESS_JUDGMENTS.has(judgment);
}

// 判定が「失敗」かどうか
export function isFailureJudgment(judgment: JudgmentResult | null | undefined): boolean {
  return judgment != null && FAILURE_JUDGMENTS.has(judgment);
}

// 履歴一覧などに表示する判定ラベル
export function getJudgmentLabel(judgment: JudgmentResult | null | undefined): string {
  return judgment != null ? JUDGMENT_LABELS[judgment] : NO_JUDGMENT_LABEL;
}

// 回答カードの配色
export function getJudgmentStyle(judgment: JudgmentResult | null | undefined): JudgmentStyle {
  if (isSuccessJudgment(judgment)) {
    return SUCCESS_STYLE;
  }
  if (isFailureJudgment(judgment)) {
    return FAILURE_STYLE;
  }
  return NEUTRAL_STYLE;
}

// 履歴一覧のバッジの配色
export function getJudgmentBadgeStyle(judgment: JudgmentResult | null | undefined): string {
  if (isSuccessJudgment(judgment)) {
    return "bg-emerald-100 text-emerald-800";
  }
  if (isFailureJudgment(judgment)) {
    return "bg-rose-100 text-rose-800";
  }
  return "bg-gray-100 text-gray-800";
}
