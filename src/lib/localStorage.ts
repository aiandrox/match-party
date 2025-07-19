/**
 * localStorage管理ユーティリティ
 * ユーザーIDの保存・取得・削除を管理
 */

const USER_ID_PREFIX = 'userId_';

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
 * 全てのユーザーIDをlocalStorageから削除（クリーンアップ用）
 */
export function clearAllUserIds(): void {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(USER_ID_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Failed to clear all userIds from localStorage:', error);
  }
}

/**
 * localStorageに保存されている全てのルームコードを取得
 * @returns ルームコードの配列
 */
export function getAllStoredRoomCodes(): string[] {
  try {
    const keys = Object.keys(localStorage);
    return keys
      .filter(key => key.startsWith(USER_ID_PREFIX))
      .map(key => key.substring(USER_ID_PREFIX.length));
  } catch (error) {
    console.error('Failed to get stored room codes:', error);
    return [];
  }
}