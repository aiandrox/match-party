import { TopicData } from '@/types';
import topicsData from '@/data/topics.json';

// お題データの取得
export function getAllTopics(): TopicData[] {
  return topicsData;
}

// ランダムなお題を取得
export function getRandomTopic(): TopicData {
  const topics = getAllTopics();
  const randomIndex = Math.floor(Math.random() * topics.length);
  return topics[randomIndex];
}

// 使用済みお題を除外してランダム取得
export function getRandomTopicExcluding(usedTopicIds: string[]): TopicData | null {
  const topics = getAllTopics().filter(topic => !usedTopicIds.includes(topic.id));
  
  if (topics.length === 0) {
    return null; // 全てのお題を使い切った場合
  }
  
  const randomIndex = Math.floor(Math.random() * topics.length);
  return topics[randomIndex];
}