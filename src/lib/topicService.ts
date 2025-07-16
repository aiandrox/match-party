import { Topic } from "@/types";
import topicsData from "@/data/topics.json";

// お題データの取得
function getAllTopics(): Topic[] {
  return topicsData;
}

// ランダムなお題を取得
export function getRandomTopic(): Topic {
  const topics = getAllTopics();
  const randomIndex = Math.floor(Math.random() * topics.length);
  return topics[randomIndex];
}
