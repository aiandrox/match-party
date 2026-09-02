import { useState, useEffect, useCallback, useMemo } from 'react';
import { validateUserName } from '@/lib/utils';

interface CreateRoomPresenterProps {
  initialHostName?: string;
  onSubmit: (_hostName: string) => Promise<void>;
  onBack: () => void;
  globalError: string | null;
  isGlobalLoading: boolean;
}

export function useCreateRoomPresenter({
  initialHostName = '',
  onSubmit,
  onBack,
  globalError,
  isGlobalLoading
}: CreateRoomPresenterProps) {
  const [hostName, setHostName] = useState(initialHostName);
  const [isHostNameDirty, setIsHostNameDirty] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // 前回入力した名前が非同期で復元された場合に反映（ユーザー未編集時のみ）
  useEffect(() => {
    if (!isHostNameDirty) {
      setHostName(initialHostName);
    }
  }, [initialHostName, isHostNameDirty]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!hostName.trim()) {
      setValidationError('名前を入力してください');
      return;
    }

    if (!validateUserName(hostName)) {
      setValidationError('名前は2文字以上20文字以内で、日本語・英数字のみ使用できます');
      return;
    }

    setValidationError(null);
    await onSubmit(hostName);
  }, [hostName, onSubmit]);

  const handleHostNameChange = useCallback((name: string) => {
    setHostName(name);
    setIsHostNameDirty(true);
    if (validationError) {
      setValidationError(null); // バリデーションエラーをクリア
    }
  }, [validationError]);

  // グローバルエラーまたはバリデーションエラーを表示（メモ化）
  const displayError = useMemo(() => 
    globalError || validationError, 
    [globalError, validationError]
  );

  return {
    hostName,
    isLoading: isGlobalLoading,
    error: displayError,
    handleSubmit,
    handleBack: onBack,
    handleHostNameChange,
  };
}