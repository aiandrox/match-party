import { signInAnonymously, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';

/**
 * Firebase匿名認証を実行
 * ファシリテーション機能のJWT認証に必要
 */
export async function ensureAnonymousAuth(): Promise<User> {
  // 既にサインイン済みの場合はそのまま返す
  if (auth.currentUser) {
    return auth.currentUser;
  }

  try {
    const result = await signInAnonymously(auth);
    console.log('Anonymous authentication successful:', result.user.uid);
    return result.user;
  } catch (error) {
    console.error('Anonymous authentication failed:', error);
    throw new Error('認証に失敗しました');
  }
}

/**
 * 現在の認証ユーザーのUIDを取得
 */
export function getCurrentUserUid(): string | null {
  return auth.currentUser?.uid || null;
}

/**
 * 認証状態を監視
 */
export function onAuthStateChanged(callback: (user: User | null) => void) {
  return auth.onAuthStateChanged(callback);
}