import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// ルーム有効期限の定数（分）
export const ROOM_EXPIRY_MINUTES = 30 as const;

// ルーム最大参加者数
export const MAX_PARTICIPANTS = 20 as const;

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateRoomCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 20; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function validateUserName(name: string): boolean {
  // 2-20文字、日本語・英語・数字のみ
  const regex = /^[a-zA-Z0-9ぁ-んァ-ヶｱ-ﾝﾞﾟ一-龠ー]+$/;
  return name.length >= 2 && name.length <= 20 && regex.test(name);
}

export function validateRoomCode(code: string): boolean {
  // 20文字の英数字
  const regex = /^[A-Z0-9]{20}$/;
  return regex.test(code);
}

export function createExpirationTime(): Date {
  const now = new Date();
  return new Date(now.getTime() + ROOM_EXPIRY_MINUTES * 60 * 1000);
}
