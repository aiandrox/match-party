import { useState, useCallback } from 'react';
import { FacilitationSuggestion, FacilitationAnalysisInput } from '@/types';
import { generateFacilitationSuggestions } from '@/lib/facilitationService';

interface UseFacilitationReturn {
  suggestions: FacilitationSuggestion[];
  isLoading: boolean;
  error: string | null;
  generateSuggestions: (input: FacilitationAnalysisInput & { roomCode: string }) => Promise<void>;
  clearSuggestions: () => void;
}

export function useFacilitation(): UseFacilitationReturn {
  const [suggestions, setSuggestions] = useState<FacilitationSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateSuggestions = useCallback(async (
    input: FacilitationAnalysisInput & { roomCode: string }
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await generateFacilitationSuggestions(input);
      setSuggestions(result.suggestions);
    } catch (err) {
      console.error('Facilitation generation failed:', err);
      setError(
        err instanceof Error 
          ? err.message 
          : 'ファシリテーション提案の生成に失敗しました'
      );
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setError(null);
  }, []);

  return {
    suggestions,
    isLoading,
    error,
    generateSuggestions,
    clearSuggestions
  };
}