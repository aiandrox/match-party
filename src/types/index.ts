// Type definitions
export type RoomStatus = "waiting" | "playing" | "revealing" | "ended";
export type GameRoundStatus = "active" | "completed";
export type JudgmentResult = "match" | "no-match";

// Game types
export interface Room {
  id: string;
  code: string;
  hostId: string;
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

export interface GameState {
  room: Room | null;
  currentUser: User | null;
  isLoading: boolean;
  error: string | null;
}

// Firebase types
export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

// API types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface CreateRoomRequest {
  hostName: string;
}

export interface CreateRoomResponse {
  roomId: string;
  roomCode: string;
  hostId: string;
}

export interface JoinRoomRequest {
  roomCode: string;
  userName: string;
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

export interface GameAnswer {
  id: string;
  gameRoundId: string;
  userName: string;
  content: string;
  submittedAt: Date;
  createdAt: Date;
}
