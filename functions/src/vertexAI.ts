import { GoogleAuth } from "google-auth-library";
import { logger } from "firebase-functions";

/**
 * Vertex AI API呼び出し
 */
export async function callVertexAI(answers: any[], topicContent: string) {
  const projectId = "match-party-findy";
  const location = "us-central1";
  const modelId = "gemini-2.5-flash-lite";

  // Service Account認証
  const googleAuth = new GoogleAuth({
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
        maxOutputTokens: 1536,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Vertex AI API error: ${response.status}`);
  }

  const result = await response.json();
  const text = result.candidates?.[0]?.content?.parts?.[0]?.text || "";

  if (!text) {
    throw new Error("Empty response from Vertex AI");
  }

  return parseGeminiResponse(text);
}

/**
 * ファシリテーション用プロンプト生成
 */
function createFacilitationPrompt(answers: any[], topicContent: string): string {
  const respondents = answers.filter((a) => a.hasAnswered);
  const answersText = respondents
    .map((a) => `${a.userName}: ${a.content}`)
    .join("\n");
  const respondentCount = respondents.length;

  return `
あなたはチームビルディングゲームのファシリテーターです。
このゲームは参加者が同じお題に回答し、その一致を目指す協力ゲームです。勝敗より、参加者同士が知り合い結束を深めることが目的です。今はお題「${topicContent}」への回答が公開され、主催者が一致判定をする前の交流タイムです。

重要: 参加者は「自分の好み」ではなく「他の人と一致しそうだと考えた回答」を選んでいます。つまり回答は"読み合い"の結果です。本当の好みや、誰の何を意識して寄せたのかを引き出す話題振りを作ってください。

参加者の回答（回答者${respondentCount}人）:
${answersText}

## 手順1: まず回答の分布を分析する（出力はしない）
- クラスタ: 同じ／ほぼ同じ回答をした人のかたまり
- 外れ値: 1人だけ違う回答をした人
- 惜しい不一致: 意味は近いのに表記・種類がわずかに違うペア
- 割れの軸: なぜ割れたか（世代・地域・家庭の習慣・知識量・職業など）を仮説する

## 手順2: 分析をもとに話題振りを3〜5個作る
**タイプ**: individual（特定の1人へ。targetに正確な参加者名が必須）/ group（全体へ）/ comparison（2人以上を並べて比較）
**カテゴリ**: common（共通点）/ unique（個性・外れ値）/ interesting（面白さ・意外性）/ follow_up（追加質問）

狙うフックと優先度の目安:
- 5: 外れ値が1人いる / きれいに票が割れた / 全員一致した → 理由や背景を掘る
- 5: 世代・地域・家庭差が疑われる割れ → 「これって世代で違うのかも？」と振る
- 4: 寄せの読み合い（「誰が言いそうだと思って選んだ？」）/ 惜しい不一致のペア
- 3: 一般的な深掘り質問 / 2-1: 補助的な小ネタ

## メッセージのルール
- 主催者がそのまま読み上げる想定。日本語で1〜2文、60字程度まで
- 実際の回答内容と参加者名を具体的に入れる。はい/いいえで終わらない開かれた聞き方にする
- 協力ゲームなので、外れ値の人を「間違い」扱いせず、あくまで好奇心で拾う
- 回答者が2〜3人のときは comparison や「1人だけ」の強調を避け、全員に均等に振る

## 出力例（形式の参考。内容はコピーしない）
{"type":"individual","target":"たろう","message":"たろうさんだけ『きしめん』でしたね。ご当地の味だったりします？","priority":5,"category":"unique"}

参加者が互いの考えを知り合える、効果的な話題振りを提案してください。
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
            ...s,
          })),
          analysisTimestamp: new Date(),
          totalAnswers: 0,
          uniqueAnswers: 0,
          commonPatterns: [],
        };
      }
    }

    throw new Error("Invalid JSON format");
  } catch (error) {
    logger.error("Gemini response parse error:", error);

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
