// Type definitions
export type RoomStatus = "waiting" | "playing" | "revealing" | "ended";
export type GameRoundStatus = "active" | "completed";
export type JudgmentResult = "match" | "no-match";

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
  createdAt: Date;
}

