import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { TopicFeedback, TopicFeedbackRating } from '@/types';

interface SubmitTopicFeedbackInput {
  topicContent: string;
  userId: string;
  userName: string;
  rating: TopicFeedbackRating;
}

export async function checkExistingFeedback(
  userId: string,
  topicContent: string
): Promise<boolean> {
  try {
    const feedbackRef = collection(db, 'topicFeedbacks');
    const q = query(
      feedbackRef,
      where('userId', '==', userId),
      where('topicContent', '==', topicContent)
    );
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error('フィードバック重複チェックに失敗しました:', error);
    return false;
  }
}

export async function submitTopicFeedback(input: SubmitTopicFeedbackInput): Promise<void> {
  try {
    // 重複チェック
    const alreadySubmitted = await checkExistingFeedback(
      input.userId,
      input.topicContent
    );
    
    if (alreadySubmitted) {
      throw new Error('既にこのお題にフィードバックを送信済みです');
    }

    const feedbackData: Omit<TopicFeedback, 'id'> = {
      topicContent: input.topicContent,
      userId: input.userId,
      userName: input.userName,
      rating: input.rating,
      createdAt: new Date(),
    };

    await addDoc(collection(db, 'topicFeedbacks'), feedbackData);
  } catch (error) {
    console.error('お題フィードバックの送信に失敗しました:', error);
    throw error;
  }
}