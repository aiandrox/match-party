// Type definitions with const objects for enum-like usage
export const RoomStatus = {
  WAITING: "waiting",
  PLAYING: "playing",
  REVEALING: "revealing",
  ENDED: "ended",
} as const;
export type RoomStatus = (typeof RoomStatus)[keyof typeof RoomStatus];

export const GameRoundStatus = {
  ACTIVE: "active",
  COMPLETED: "completed",
} as const;
export type GameRoundStatus = (typeof GameRoundStatus)[keyof typeof GameRoundStatus];

// ゲームモード（未設定は match として扱う）
export const GameMode = {
  MATCH: "match", // みんなで一致を目指す
  MISMATCH: "mismatch", // みんなとズラす（被らない回答を目指す）
} as const;
export type GameMode = (typeof GameMode)[keyof typeof GameMode];

export const JudgmentResult = {
  // 一致モードの判定
  MATCH: "match",
  NO_MATCH: "no-match",
  // 不一致モードの判定
  NO_DUPLICATE: "no-duplicate",
  HAS_DUPLICATE: "has-duplicate",
} as const;
export type JudgmentResult = (typeof JudgmentResult)[keyof typeof JudgmentResult];

export const TopicFeedbackRating = {
  GOOD: "good",
  BAD: "bad",
} as const;
export type TopicFeedbackRating = (typeof TopicFeedbackRating)[keyof typeof TopicFeedbackRating];

// Game types
export interface Room {
  id: string;
  code: string;
  status: RoomStatus;
  mode?: GameMode; // 未設定は GameMode.MATCH として扱う（既存ルームとの後方互換）
  participants: User[];
  currentGameRoundId?: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface User {
  id: string;
  name: string;
  isHost: boolean;
  roomId: string;
  joinedAt: Date;
  hasAnswered: boolean;
  firebaseUserId: string; // 匿名認証用のUID
}

export type Topic = string;

export interface CreateRoomResponse {
  roomId: string;
  roomCode: string;
  hostUserId: string;
}

export interface JoinRoomResponse {
  roomId: string;
  userId: string;
}

// Game History types

// ラウンドの回答（未回答者も含む）
export interface RoundAnswer {
  content: string;
  userName: string;
  submittedAt: Date | null;
  hasAnswered: boolean;
}

export interface GameRound {
  id: string;
  roomId: string;
  topicContent: string;
  roundNumber: number;
  status: GameRoundStatus;
  judgment?: JudgmentResult;
  createdAt: Date;
}

// Reaction types
export interface Reaction {
  id: string;
  emoji: string;
  fromUserId: string;
  fromUserName: string;
  createdAt: Date;
}

export interface DisplayReaction {
  displayId: string;
  emoji: string;
  fromUserName: string;
  x: number; // 10〜90の表示位置（%）
}

// Topic feedback types
export interface TopicFeedback {
  id: string;
  topicContent: string;
  userId: string;
  userName: string;
  rating: TopicFeedbackRating;
  createdAt: Date;
}

// Facilitation types
export type { 
  FacilitationSuggestion, 
  FacilitationAnalysisInput, 
  FacilitationAnalysisResult,
  GeminiFacilitationResponse,
  FacilitationSuggestionType,
  FacilitationSuggestionCategory
} from './facilitation';
export { 
  FacilitationSuggestionType as FacilitationType,
  FacilitationSuggestionCategory as FacilitationCategory
} from './facilitation';

