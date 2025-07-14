// Game types
export interface Room {
  id: string;
  code: string;
  hostId: string;
  status: 'waiting' | 'playing' | 'revealing' | 'ended';
  participants: User[];
  currentTopicId?: string;
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

export interface Topic {
  id: string;
  content: string;
  roomId: string;
  round: number;
  createdAt: Date;
}

export interface TopicData {
  id: string;
  content: string;
  category: string;
}

export interface Answer {
  id: string;
  userId: string;
  topicId: string;
  content: string;
  submittedAt: Date;
}

export interface GameState {
  room: Room | null;
  currentUser: User | null;
  answers: Answer[];
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