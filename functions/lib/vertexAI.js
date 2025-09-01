"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.callVertexAI = callVertexAI;
const google_auth_library_1 = require("google-auth-library");
const firebase_functions_1 = require("firebase-functions");
/**
 * Vertex AI API呼び出し
 */
async function callVertexAI(answers, topicContent) {
    var _a, _b, _c, _d, _e;
    const projectId = "match-party-findy";
    const location = "us-central1";
    const modelId = "gemini-2.5-flash-lite";
    // Service Account認証
    const googleAuth = new google_auth_library_1.GoogleAuth({
        scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    });
    const authClient = await googleAuth.getClient();
    const accessToken = await authClient.getAccessToken();
    if (!accessToken.token) {
        throw new Error("Failed to obtain access token");
    }
    // プロンプト生成
    const prompt = createFacilitationPrompt(answers, topicContent);
    // Vertex AI API呼び出し
    const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelId}:generateContent`;
    const response = await fetch(url, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${accessToken.token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            contents: [
                {
                    role: "user",
                    parts: [{ text: prompt }],
                },
            ],
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: "object",
                    description: "ファシリテーション提案のレスポンス",
                    properties: {
                        suggestions: {
                            type: "array",
                            description: "主催者が使える話題振りの提案リスト",
                            items: {
                                type: "object",
                                description: "個別の話題振り提案",
                                properties: {
                                    type: {
                                        type: "string",
                                        description: "提案のタイプ（個人向け、グループ向け、比較）",
                                        enum: ["individual", "group", "comparison"],
                                    },
                                    target: {
                                        type: "string",
                                        description: "個人向けの場合の対象者名（individualタイプのみ）",
                                    },
                                    message: {
                                        type: "string",
                                        description: "主催者が使う具体的な話題振りメッセージ",
                                    },
                                    priority: {
                                        type: "integer",
                                        description: "提案の優先度（1-5、5が最高）",
                                        minimum: 1,
                                        maximum: 5,
                                    },
                                    category: {
                                        type: "string",
                                        description: "提案のカテゴリ（共通点、独特性、興味深い、追加質問）",
                                        enum: ["common", "unique", "interesting", "follow_up"],
                                    },
                                },
                                required: ["type", "message", "priority", "category"],
                            },
                        },
                    },
                    required: ["suggestions"],
                },
                temperature: 0.7,
                maxOutputTokens: 1024,
            },
        }),
    });
    if (!response.ok) {
        throw new Error(`Vertex AI API error: ${response.status}`);
    }
    const result = await response.json();
    const text = ((_e = (_d = (_c = (_b = (_a = result.candidates) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c.parts) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.text) || "";
    if (!text) {
        throw new Error("Empty response from Vertex AI");
    }
    return parseGeminiResponse(text);
}
/**
 * ファシリテーション用プロンプト生成
 */
function createFacilitationPrompt(answers, topicContent) {
    const answersText = answers
        .filter((a) => a.hasAnswered)
        .map((a) => `${a.userName}: ${a.content}`)
        .join("\n");
    return `
あなたはチームビルディングゲームのファシリテーターです。
このゲームは参加者が同じお題に回答し、その一致を目指す協力ゲームです。勝敗より参加者同士が知り合い、チームの結束を深めることが目的です。現在、お題「${topicContent}」への回答が公開され、主催者が一致判定する前の交流タイムです。

参加者は自分の好みではなく、他の人と一致しそうだと考えた回答を選んでいます。そのことを念頭に置き、回答の理由や本当の好みも引き出せるような話題振りを提案してください。

参加者の回答:
${answersText}

## 提案ルール
**タイプ**: individual（個人質問、targetに名前必須）/ group（全体向け）/ comparison（比較）
**カテゴリ**: common（共通点）/ unique（個性）/ interesting（面白さ）/ follow_up（追加質問）

## 作成指針
- 自然で親しみやすい口調
- 実際の回答を具体的に言及
- ユニークに感じる回答が存在する場合はそれを取り上げる
- 優先度: 5（盛り上がる話題）> 4（共通点・比較）> 3（一般質問）> 2-1（補助）
- 3〜5個、質重視

参加者が互いの考えを知り合えるような効果的な話題振りを提案してください。
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
                    commonPatterns: [],
                };
            }
        }
        throw new Error("Invalid JSON format");
    }
    catch (error) {
        firebase_functions_1.logger.error("Gemini response parse error:", error);
        // フォールバック
        return {
            suggestions: [
                {
                    id: `fs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    type: "group",
                    message: "回答について詳しく聞いてみませんか？",
                    priority: 3,
                    category: "common",
                },
            ],
            analysisTimestamp: new Date(),
            totalAnswers: 0,
            uniqueAnswers: 0,
            commonPatterns: [],
        };
    }
}
//# sourceMappingURL=vertexAI.js.map