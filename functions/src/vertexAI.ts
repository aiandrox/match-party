import {GoogleAuth} from 'google-auth-library';
import {logger} from 'firebase-functions';

/**
 * Vertex AI API呼び出し
 */
export async function callVertexAI(answers: any[], topicContent: string, roundNumber: number) {
  const projectId = 'match-party-findy';
  const location = 'us-central1';
  const modelId = 'gemini-2.5-flash-lite';

  // Service Account認証
  const googleAuth = new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/cloud-platform']
  });
  
  const authClient = await googleAuth.getClient();
  const accessToken = await authClient.getAccessToken();

  if (!accessToken.token) {
    throw new Error('Failed to obtain access token');
  }

  // プロンプト生成
  const prompt = createFacilitationPrompt(answers, topicContent, roundNumber);
  
  // Vertex AI API呼び出し
  const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelId}:generateContent`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [{
        role: 'user',
        parts: [{text: prompt}]
      }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.7,
        maxOutputTokens: 1024
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Vertex AI API error: ${response.status}`);
  }

  const result = await response.json();
  const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
  
  if (!text) {
    throw new Error('Empty response from Vertex AI');
  }

  return parseGeminiResponse(text);
}

/**
 * ファシリテーション用プロンプト生成
 */
function createFacilitationPrompt(answers: any[], topicContent: string, roundNumber: number): string {
  const answersText = answers
    .filter(a => a.hasAnswered)
    .map(a => `${a.userName}: ${a.content}`)
    .join('\n');

  return `
あなたはチームビルディングの専門ファシリテーターです。
お題「${topicContent}」（第${roundNumber}ラウンド）に対する以下の回答を分析し、
主催者が使える自然な話題振りを3-5個提案してください。

参加者の回答:
${answersText}

以下のJSON形式で提案してください（JSONのみ出力、説明文は不要）:
{
  "suggestions": [
    {
      "type": "individual",
      "target": "参加者名",
      "message": "○○さんの回答について詳しく聞いてみませんか？",
      "priority": 4,
      "category": "unique"
    },
    {
      "type": "group",
      "message": "みなさん××が多いですね！共通体験を聞かせてください",
      "priority": 3,
      "category": "common"
    }
  ]
}

制約:
- type: "individual", "group", "comparison" のいずれか
- category: "common", "unique", "interesting", "follow_up" のいずれか
- priority: 1-5 (5が最高優先度)
- 自然で親しみやすい日本語を使用
- 参加者の名前は実際の回答者名を使用
- 最大5個まで
`;
}

/**
 * Geminiレスポンス解析
 */
function parseGeminiResponse(text: string) {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      
      if (parsed.suggestions && Array.isArray(parsed.suggestions)) {
        return {
          suggestions: parsed.suggestions.map((s: any) => ({
            id: `fs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            ...s
          })),
          analysisTimestamp: new Date(),
          totalAnswers: 0,
          uniqueAnswers: 0,
          commonPatterns: []
        };
      }
    }
    
    throw new Error('Invalid JSON format');
  } catch (error) {
    logger.error('Gemini response parse error:', error);
    
    // フォールバック
    return {
      suggestions: [{
        id: `fs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'group',
        message: '回答について詳しく聞いてみませんか？',
        priority: 3,
        category: 'common'
      }],
      analysisTimestamp: new Date(),
      totalAnswers: 0,
      uniqueAnswers: 0,
      commonPatterns: []
    };
  }
}