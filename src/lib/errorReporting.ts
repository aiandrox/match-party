import * as Sentry from '@sentry/nextjs';

export interface ErrorContext {
  feature: string;
  action: string;
  userId?: string;
  roomCode?: string;
  [key: string]: any;
}

/**
 * 共通エラー報告関数
 * @param error - 発生したエラー
 * @param context - エラーのコンテキスト情報
 */
export function reportError(error: unknown, context: ErrorContext): void {
  // コンソールにもログ出力（開発時の確認用）
  console.error(`[${context.feature}] ${context.action}:`, error);

  // Sentryにエラーを報告
  Sentry.captureException(error, {
    tags: {
      feature: context.feature,
      action: context.action,
    },
    extra: {
      ...context,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
    },
    user: context.userId ? { id: context.userId } : undefined,
  });
}

/**
 * 非同期関数をラップしてエラーを自動報告
 * @param fn - ラップする非同期関数
 * @param context - エラーコンテキスト
 * @returns ラップされた関数
 */
export function withErrorReporting<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context: ErrorContext
) {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      reportError(error, context);
      throw error; // 元のエラーを再スロー
    }
  };
}

/**
 * 重要でないエラーをフィルタリング
 */
export function shouldReportError(error: unknown): boolean {
  if (error instanceof Error) {
    // チャンクロードエラーなど、ユーザー操作で解決可能なエラーは除外
    if (error.name === 'ChunkLoadError') return false;
    if (error.message.includes('Loading chunk')) return false;
    if (error.message.includes('Loading CSS chunk')) return false;
  }
  
  return true;
}