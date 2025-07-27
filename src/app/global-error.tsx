'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // グローバルエラーをSentryに報告
    Sentry.captureException(error, {
      tags: {
        component: 'global-error-boundary',
        errorType: 'react-error'
      },
      extra: {
        digest: error.digest,
        timestamp: new Date().toISOString()
      }
    });
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                エラーが発生しました
              </h2>
              <p className="text-gray-600 mb-6">
                申し訳ございません。予期しないエラーが発生しました。
              </p>
              <button
                onClick={reset}
                className="w-full px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors"
              >
                再試行
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}