import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function validateUserName(name: string): boolean {
  // 2-20文字、日本語・英語・数字のみ
  const regex = /^[a-zA-Z0-9ひらがなカタカナ漢字]+$/;
  return name.length >= 2 && name.length <= 20 && regex.test(name);
}

export function validateRoomCode(code: string): boolean {
  // 6文字の英数字
  const regex = /^[A-Z0-9]{6}$/;
  return regex.test(code);
}

export function formatTimeRemaining(expiresAt: Date): string {
  const now = new Date();
  const diff = expiresAt.getTime() - now.getTime();
  
  if (diff <= 0) return '期限切れ';
  
  const minutes = Math.floor(diff / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function createExpirationTime(): Date {
  const now = new Date();
  return new Date(now.getTime() + 30 * 60 * 1000); // 30分後
}