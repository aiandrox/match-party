import { GoogleAuth } from "google-auth-library";
import { logger } from "firebase-functions";

/**
 * Vertex AI API呼び出し
 */
export async function callVertexAI(answers: any[], topicContent: string) {
  const projectId = "match-party-findy";
  const location = "us-central1";
  // TODO: 2.5系は退役予定。gemini-3.5-flash-lite への移行は可用性確認後に別対応
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
              minItems: 3,
              maxItems: 5,
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
        temperature: 0.5,
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
export function createFacilitationPrompt(answers: any[], topicContent: string): string {
  const respondents = answers.filter((a) => a.hasAnswered);
  const answersText = respondents
    .map((a) => `${a.userName}: ${a.content}`)
    .join("\n");
  const respondentCount = respondents.length;

  return `
あなたはチームビルディングゲームのファシリテーターです。
参加者は同じお題に回答し、一致を目指す協力ゲームです。勝敗より、参加者同士が知り合い結束を深めるのが目的。今はお題「${topicContent}」への回答が公開され、主催者が一致判定をする前の交流タイムです。

重要な前提: 参加者は「自分の好み」ではなく「他の人と一致しそうな回答」を選んでいます。回答は"読み合い"の結果です。本当の好みや、誰の何を意識して寄せたのかを引き出す話題振りを作ってください。

参加者の回答（回答者${respondentCount}人）:
${answersText}

## まず分析する（出力はしない）
- 名称の統一: 略称・英語/カタカナ・愛称・表記ゆれの違いだけのものは「一致」とみなし、同じクラスタにまとめる（例:「rex」＝「ティラノサウルス」、「マック」＝「マクドナルド」、「たまごやき」＝「卵焼き」）。これらは不一致・惜しい差として扱わない
- クラスタ: 実質同じ回答をした人のかたまり
- 外れ値: 1人だけ違う回答をした人
- 惜しい不一致: 名称ではなく中身が実際に別物で、かつ意味が近いペア（例:「ラーメン」と「うどん」）
- 割れの軸: 世代・地域・家庭の習慣・知識量・職業などで仮説を立てる

## 提案を作る
- 必ず3〜5個。うち最低1個は individual（特定の1人向け）
- 各提案の狙いと優先度:
  - 5: 外れ値がいる / きれいに票が割れた / 全員一致 → 理由や背景を掘る
  - 5: 世代・地域・家庭差が疑われる割れ → 「これは世代で違うのかも？」と振る
  - 4: 寄せの読み合い（誰が言いそうと思って選んだか）/ 中身が別物の惜しい不一致ペア
  - 3: 一般的な深掘り / 2-1: 補助的な小ネタ
  - 2: 他に振る話題が本当に無いときに限り、同じものを別の呼び方で書いていた点に軽く触れる（例:「太郎さんと次郎さんは同じものを別表記で書いてましたね」）。話題があるならこれは出さない
- 呼び方・略称・表記の違いそのものを話題にした提案は、全体で最大1個かつ priority 2 以下。外れ値・クラスタ・世代差・読み合いの話題を先に埋めること
- type: individual（targetに正確な参加者名が必須）/ group / comparison（2人以上を並べる）
- category: common / unique / interesting / follow_up

## message のルール（厳守）
- 主催者がそのまま読み上げる。日本語で1〜2文、60字程度まで
- 必ず実際の回答内容と参加者名を入れる
- 「それぞれの理由を聞いてみませんか？」のような、どのゲームでも使える当たり障りのない文は禁止。必ずこの回答セット固有の内容に踏み込む
- 名称の違いだけのペアを「不一致」「惜しい」として扱わない。基本は一致とみなす
- はい/いいえで終わらせない
- 外れ値の人を「間違い」扱いしない。好奇心で拾う
- 回答者が2〜3人なら「1人だけ」強調や comparison は避け、全員に均等に振る

## 出力例（形式と踏み込み方の参考。名前・内容はダミー。コピーしない）
お題「朝ごはんといえば？」／太郎:パン、花子:ごはん、次郎:パン、桜:シリアル の場合:
[
  {"type":"group","message":"太郎さんと次郎さんは『パン』、花子さんは『ごはん』。朝はパン派とごはん派、どちらが多いんでしょうね？","priority":5,"category":"common"},
  {"type":"individual","target":"桜","message":"桜さんだけ『シリアル』でしたね。忙しい朝の定番だったりしますか？","priority":5,"category":"unique"},
  {"type":"comparison","message":"太郎さんと次郎さん、同じ『パン』でも菓子パン派と食パン派で分かれそうです。こだわりありますか？","priority":3,"category":"follow_up"}
]

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
