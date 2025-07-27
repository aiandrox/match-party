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

export const JudgmentResult = {
  MATCH: "match",
  NO_MATCH: "no-match",
} as const;
export type JudgmentResult = (typeof JudgmentResult)[keyof typeof JudgmentResult];

// Game types
export interface Room {
  id: string;
  code: string;
  status: RoomStatus;
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
  isReady: boolean;
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

export interface GameRound {
  id: string;
  roomId: string;
  topicContent: string;
  roundNumber: number;
  status: GameRoundStatus;
  judgment?: JudgmentResult;
  facilitationSuggestions?: Array<{
    id: string;
    type: string;
    target?: string;
    message: string;
    priority: number;
    category: string;
  }>;
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

