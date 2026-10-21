import { GameMode, JudgmentResult } from "@/types";

// モードごとの性質（文言・判定値・集計ラベル・AI ヒントの可否）を一箇所に定義する。
// 各画面の Presenter はここを参照し、View にモードの知識を持たせない。
export interface GameModeDefinition {
  mode: GameMode;
  // ルーム作成時の選択肢ラベル
  label: string;
  // 待機ルームなどに表示する短いバッジ
  badgeLabel: string;
  // ルーム作成時の補足説明
  description: string;
  // 回答入力画面のヒント
  answerHint: string;
  // 判定ボタンの上に出す案内
  judgmentPrompt: string;
  // 成功・失敗として扱う判定値
  successJudgment: JudgmentResult;
  failureJudgment: JudgmentResult;
  // 判定ボタンのラベル
  successButtonLabel: string;
  failureButtonLabel: string;
  // 判定後の見出し
  successHeading: string;
  failureHeading: string;
  // ゲーム終了画面の集計ラベル
  successCountLabel: string;
  successRateLabel: string;
  // AI の会話のヒントを使うか
  isFacilitationAvailable: boolean;
  // AI ヒントの代わりに表示する固定文（使わないモードのみ）
  facilitationFallbackText: string | null;
}

export const DEFAULT_GAME_MODE: GameMode = GameMode.MATCH;

const GAME_MODE_DEFINITIONS: Record<GameMode, GameModeDefinition> = {
  [GameMode.MATCH]: {
    mode: GameMode.MATCH,
    label: "みんなで一致を目指す",
    badgeLabel: "一致モード",
    description: "全員が同じ回答になるように読み合うモードです",
    answerHint: "他の参加者と同じ回答を目指しましょう！",
    judgmentPrompt: "回答の一致を判定してください",
    successJudgment: JudgmentResult.MATCH,
    failureJudgment: JudgmentResult.NO_MATCH,
    successButtonLabel: "全員一致",
    failureButtonLabel: "全員一致ならず",
    successHeading: "🎉✨ 全員一致 ✨🎉",
    failureHeading: "💥 全員一致ならず 💥",
    successCountLabel: "一致回数",
    successRateLabel: "一致率",
    isFacilitationAvailable: true,
    facilitationFallbackText: null,
  },
  [GameMode.MISMATCH]: {
    mode: GameMode.MISMATCH,
    label: "みんなとズラす",
    badgeLabel: "不一致モード",
    description: "誰とも被らない、あなたらしい回答を出し合うモードです",
    answerHint: "他の人と被らない、あなたらしい回答を入力しましょう！",
    judgmentPrompt: "回答の被りを判定してください",
    successJudgment: JudgmentResult.NO_DUPLICATE,
    failureJudgment: JudgmentResult.HAS_DUPLICATE,
    successButtonLabel: "被りなし",
    failureButtonLabel: "被りあり",
    successHeading: "🎉✨ 被りなし ✨🎉",
    failureHeading: "💥 被りあり 💥",
    successCountLabel: "被りなし回数",
    successRateLabel: "被りなし率",
    isFacilitationAvailable: false,
    facilitationFallbackText: "気になる回答の人に理由を聞いてみましょう",
  },
};

// 選択肢として並べる順序
export const GAME_MODE_OPTIONS: readonly GameModeDefinition[] = [
  GAME_MODE_DEFINITIONS[GameMode.MATCH],
  GAME_MODE_DEFINITIONS[GameMode.MISMATCH],
];

// 値が GameMode として有効か
export function isGameMode(value: unknown): value is GameMode {
  return typeof value === "string" && Object.values<string>(GameMode).includes(value);
}

// 未設定・不正値はデフォルト（一致モード）として扱う（既存ルームとの後方互換）
export function resolveGameMode(mode: unknown): GameMode {
  return isGameMode(mode) ? mode : DEFAULT_GAME_MODE;
}

export function getGameModeDefinition(mode: unknown): GameModeDefinition {
  return GAME_MODE_DEFINITIONS[resolveGameMode(mode)];
}
