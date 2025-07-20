import { useState, useCallback, useMemo } from 'react';
import { validateUserName } from '@/lib/utils';

interface CreateRoomPresenterProps {
  onSubmit: (_hostName: string) => Promise<void>;
  onBack: () => void;
  globalError: string | null;
  isGlobalLoading: boolean;
}

export function useCreateRoomPresenter({ 
  onSubmit, 
  onBack, 
  globalError,
  isGlobalLoading 
}: CreateRoomPresenterProps) {
  const [hostName, setHostName] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

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