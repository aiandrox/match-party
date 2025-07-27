// ファシリテーション機能の型定義

export const FacilitationSuggestionType = {
  INDIVIDUAL: "individual",
  GROUP: "group",
  COMPARISON: "comparison",
} as const;
export type FacilitationSuggestionType =
  (typeof FacilitationSuggestionType)[keyof typeof FacilitationSuggestionType];

export const FacilitationSuggestionCategory = {
  COMMON: "common",
  UNIQUE: "unique",
  INTERESTING: "interesting",
  FOLLOW_UP: "follow_up",
} as const;
export type FacilitationSuggestionCategory =
  (typeof FacilitationSuggestionCategory)[keyof typeof FacilitationSuggestionCategory];

export interface FacilitationSuggestion {
  id: string;
  type: FacilitationSuggestionType;
  target?: string; // 参加者名（individual の場合）
  message: string;
  priority: number; // 1-5 (5が最高優先度)
  category: FacilitationSuggestionCategory;
}

export interface FacilitationAnalysisInput {
  answers: Array<{
    content: string;
    userName: string;
    hasAnswered: boolean;
  }>;
  topicContent: string;
}

export interface FacilitationAnalysisResult {
  suggestions: FacilitationSuggestion[];
  analysisTimestamp: Date;
  totalAnswers: number;
  uniqueAnswers: number;
  commonPatterns: string[];
}

// Gemini API レスポンス用の型
export interface GeminiFacilitationResponse {
  suggestions: Array<{
    type: FacilitationSuggestionType;
    target?: string;
    message: string;
    priority: number;
    category: FacilitationSuggestionCategory;
  }>;
}
