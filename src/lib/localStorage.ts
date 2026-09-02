/**
 * localStorage管理ユーティリティ
 * ユーザーIDの保存・取得・削除を管理
 */

const USER_ID_PREFIX = 'userId_';
const USER_NAME_KEY = 'userName';

/**
 * 特定のルームに対するユーザーIDをlocalStorageに保存
 * @param roomCode ルームコード
 * @param userId ユーザーID
 */
export function saveUserIdForRoom(roomCode: string, userId: string): void {
  try {
    localStorage.setItem(`${USER_ID_PREFIX}${roomCode}`, userId);
  } catch (error) {
    console.error('Failed to save userId to localStorage:', error);
  }
}

/**
 * 特定のルームのユーザーIDをlocalStorageから取得
 * @param roomCode ルームコード
 * @returns ユーザーIDまたはnull
 */
export function getUserIdForRoom(roomCode: string): string | null {
  try {
    return localStorage.getItem(`${USER_ID_PREFIX}${roomCode}`);
  } catch (error) {
    console.error('Failed to get userId from localStorage:', error);
    return null;
  }
}

/**
 * 特定のルームのユーザーIDをlocalStorageから削除
 * @param roomCode ルームコード
 */
export function removeUserIdForRoom(roomCode: string): void {
  try {
    localStorage.removeItem(`${USER_ID_PREFIX}${roomCode}`);
  } catch (error) {
    console.error('Failed to remove userId from localStorage:', error);
  }
}

/**
 * 前回入力した名前をlocalStorageに保存
 * @param userName ユーザー名
 */
export function saveUserName(userName: string): void {
  try {
    localStorage.setItem(USER_NAME_KEY, userName);
  } catch (error) {
    console.error('Failed to save userName to localStorage:', error);
  }
}

/**
 * 前回入力した名前をlocalStorageから取得
 * @returns ユーザー名または空文字
 */
export function getUserName(): string {
  try {
    return localStorage.getItem(USER_NAME_KEY) ?? '';
  } catch (error) {
    console.error('Failed to get userName from localStorage:', error);
    return '';
  }
}

