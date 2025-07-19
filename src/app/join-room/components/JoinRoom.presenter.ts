import React, { useState } from 'react';
import { validateUserName, validateRoomCode } from '@/lib/utils';

interface JoinRoomPresenterProps {
  initialRoomCode: string;
  onSubmit: (_roomCode: string, _userName: string) => Promise<void>;
  onBack: () => void;
  globalError: string | null;
  isGlobalLoading: boolean;
}

export function useJoinRoomPresenter({
  initialRoomCode,
  onSubmit,
  onBack,
  globalError,
  isGlobalLoading
}: JoinRoomPresenterProps) {
  const [roomCode, setRoomCode] = useState(initialRoomCode);
  const [userName, setUserName] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // initialRoomCodeが変更された場合に更新
  React.useEffect(() => {
    setRoomCode(initialRoomCode);
  }, [initialRoomCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!roomCode.trim()) {
      setValidationError('ルームコードを入力してください');
      return;
    }

    if (!userName.trim()) {
      setValidationError('名前を入力してください');
      return;
    }

    if (!validateUserName(userName)) {
      setValidationError('名前は2文字以上20文字以内で、日本語・英数字のみ使用できます');
      return;
    }

    if (!validateRoomCode(roomCode)) {
      setValidationError('ルームコードは20文字の英数字で入力してください');
      return;
    }

    setValidationError(null);
    await onSubmit(roomCode, userName);
  };

  const handleRoomCodeChange = (code: string) => {
    setRoomCode(code);
    if (validationError) {
      setValidationError(null); // バリデーションエラーをクリア
    }
  };

  const handleUserNameChange = (name: string) => {
    setUserName(name);
    if (validationError) {
      setValidationError(null); // バリデーションエラーをクリア
    }
  };

  // グローバルエラーまたはバリデーションエラーを表示
  const displayError = globalError || validationError;

  return {
    roomCode,
    userName,
    isLoading: isGlobalLoading,
    error: displayError,
    handleSubmit,
    handleBack: onBack,
    handleRoomCodeChange,
    handleUserNameChange,
  };
}