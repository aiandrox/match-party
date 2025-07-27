"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.callVertexAI = callVertexAI;
const google_auth_library_1 = require("google-auth-library");
const firebase_functions_1 = require("firebase-functions");
/**
 * Vertex AI API呼び出し
 */
async function callVertexAI(answers, topicContent, roundNumber) {
    var _a, _b, _c, _d, _e;
    const projectId = 'match-party-findy';
    const location = 'us-central1';
    const modelId = 'gemini-2.5-flash-lite';
    // Service Account認証
    const googleAuth = new google_auth_library_1.GoogleAuth({
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
                    parts: [{ text: prompt }]
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
    const text = ((_e = (_d = (_c = (_b = (_a = result.candidates) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c.parts) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.text) || '';
    if (!text) {
        throw new Error('Empty response from Vertex AI');
    }
    return parseGeminiResponse(text);
}
/**
 * ファシリテーション用プロンプト生成
 */
function createFacilitationPrompt(answers, topicContent, roundNumber) {
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
function parseGeminiResponse(text) {
    try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed.suggestions && Array.isArray(parsed.suggestions)) {
                return {
                    suggestions: parsed.suggestions.map((s) => (Object.assign({ id: `fs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` }, s))),
                    analysisTimestamp: new Date(),
                    totalAnswers: 0,
                    uniqueAnswers: 0,
                    commonPatterns: []
                };
            }
        }
        throw new Error('Invalid JSON format');
    }
    catch (error) {
        firebase_functions_1.logger.error('Gemini response parse error:', error);
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
//# sourceMappingURL=vertexAI.js.map