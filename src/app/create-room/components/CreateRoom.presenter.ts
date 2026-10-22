import { useState, useEffect, useCallback, useMemo } from 'react';
import { GameMode } from '@/types';
import { validateUserName } from '@/lib/utils';
import { DEFAULT_GAME_MODE, GAME_MODE_OPTIONS, GameModeDefinition } from '@/lib/gameMode';

interface CreateRoomPresenterProps {
  initialHostName?: string;
  onSubmit: (_hostName: string, _mode: GameMode) => Promise<void>;
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
  const [mode, setMode] = useState<GameMode>(DEFAULT_GAME_MODE);
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
    await onSubmit(hostName, mode);
  }, [hostName, mode, onSubmit]);

  const handleModeChange = useCallback((nextMode: GameMode) => {
    setMode(nextMode);
  }, []);

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

  const modeOptions: readonly GameModeDefinition[] = GAME_MODE_OPTIONS;

  return {
    hostName,
    mode,
    modeOptions,
    isLoading: isGlobalLoading,
    error: displayError,
    handleSubmit,
    handleBack: onBack,
    handleHostNameChange,
    handleModeChange,
  };
}