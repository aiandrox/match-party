import { 
  FacilitationAnalysisInput, 
  FacilitationAnalysisResult,
  FacilitationSuggestion
} from '@/types';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getAuth } from 'firebase/auth';
import app from '@/lib/firebase';

// Firebase Functions初期化
const functions = getFunctions(app, 'asia-northeast1');
const auth = getAuth(app);

/**
 * Firebase Functions経由でファシリテーション提案を生成
 * JWT認証により、このプロダクトからのアクセスのみ許可
 */
export async function generateFacilitationSuggestions(
  input: FacilitationAnalysisInput & { roomCode: string; roundNumber?: number }
): Promise<FacilitationAnalysisResult> {
  const { answers, roomCode } = input;
  
  // 回答がない場合は空の結果を返す
  if (answers.length === 0) {
    return createEmptyResult();
  }

  try {
    // 認証チェック
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('認証が必要です');
    }

    // Firebase Functions呼び出し
    const generateSuggestions = httpsCallable(functions, 'generateFacilitationSuggestions');
    const result = await generateSuggestions({
      answers: input.answers,
      topicContent: input.topicContent,
      roundNumber: input.roundNumber,
      roomCode: roomCode
    });

    return result.data as FacilitationAnalysisResult;
  } catch (error: any) {
    console.error('Facilitation service error:', error);
    
    // Firebase Functions特有のエラーハンドリング
    if (error.code === 'functions/unauthenticated') {
      throw new Error('認証が必要です。再ログインしてください。');
    } else if (error.code === 'functions/permission-denied') {
      throw new Error('この機能は主催者のみ利用できます。');
    } else if (error.code === 'functions/not-found') {
      throw new Error('指定されたルームが見つかりません。');
    }
    
    // ネットワークエラー等の場合はローカルフォールバック
    return createLocalFallbackAnalysis(input);
  }
}


/**
 * 空の結果を作成
 */
function createEmptyResult(): FacilitationAnalysisResult {
  return {
    suggestions: [],
    analysisTimestamp: new Date(),
    totalAnswers: 0,
    uniqueAnswers: 0,
    commonPatterns: []
  };
}

/**
 * エラー時のローカルフォールバック分析
 */
function createLocalFallbackAnalysis(input: FacilitationAnalysisInput): FacilitationAnalysisResult {
  const { answers } = input;
  const validAnswers = answers.filter(a => a.hasAnswered);
  
  if (validAnswers.length === 0) {
    return createEmptyResult();
  }

  const suggestions: FacilitationSuggestion[] = [];
  
  // 基本的なフォールバック提案
  if (validAnswers.length >= 2) {
    suggestions.push({
      id: `fs_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      type: 'group' as const,
      message: `${validAnswers.length}人の回答が出揃いました！それぞれの理由を聞いてみませんか？`,
      priority: 3,
      category: 'common' as const
    });
  }
  
  if (validAnswers.length >= 1) {
    const randomAnswer = validAnswers[Math.floor(Math.random() * validAnswers.length)];
    suggestions.push({
      id: `fs_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      type: 'individual' as const,
      target: randomAnswer.userName,
      message: `${randomAnswer.userName}さんの「${randomAnswer.content}」について詳しく聞かせてください！`,
      priority: 4,
      category: 'interesting' as const
    });
  }

  return {
    suggestions,
    analysisTimestamp: new Date(),
    totalAnswers: answers.length,
    uniqueAnswers: new Set(validAnswers.map(a => a.content.trim().toLowerCase())).size,
    commonPatterns: []
  };
}