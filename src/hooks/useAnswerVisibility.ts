import { useState, useEffect } from 'react';

const ANSWER_HIDING_KEY = 'match-party-hide-answers';

export function useAnswerVisibility() {
  const [isAnswerHidden, setIsAnswerHidden] = useState<boolean>(false);

  useEffect(() => {
    const saved = localStorage.getItem(ANSWER_HIDING_KEY);
    if (saved !== null) {
      try {
        setIsAnswerHidden(JSON.parse(saved));
      } catch {
        // 無効なJSONの場合はデフォルト値（false）を使用
        setIsAnswerHidden(false);
      }
    }
  }, []);

  const toggleAnswerVisibility = () => {
    const newValue = !isAnswerHidden;
    setIsAnswerHidden(newValue);
    localStorage.setItem(ANSWER_HIDING_KEY, JSON.stringify(newValue));
  };

  return {
    isAnswerHidden,
    toggleAnswerVisibility,
  };
}