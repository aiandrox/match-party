import { useState } from 'react';
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

  const handleSubmit = async (e: React.FormEvent) => {
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
  };

  const handleHostNameChange = (name: string) => {
    setHostName(name);
    if (validationError) {
      setValidationError(null); // バリデーションエラーをクリア
    }
  };

  // グローバルエラーまたはバリデーションエラーを表示
  const displayError = globalError || validationError;

  return {
    hostName,
    isLoading: isGlobalLoading,
    error: displayError,
    handleSubmit,
    handleBack: onBack,
    handleHostNameChange,
  };
}