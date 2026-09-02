import { GoogleAuth } from "google-auth-library";
import { logger } from "firebase-functions";

/**
 * Vertex AI API呼び出し
 */
export async function callVertexAI(answers: any[], topicContent: string) {
  const projectId = "match-party-findy";
  // gemini-3系 flash-lite はリージョンエンドポイント（us-central1）未提供のため global を使用
  const location = "global";
  // 2.5系は退役予定のため後継の低コスト帯モデルへ移行
  const modelId = "gemini-3.5-flash-lite";
  const apiHost =
    location === "global"
      ? "aiplatform.googleapis.com"
      : `${location}-aiplatform.googleapis.com`;

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
  const url = `https://${apiHost}/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelId}:generateContent`;

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
- 分析で見つけた「話題の芯」を優先度5〜4で埋める:
  - 5: 外れ値がいる / きれいに票が割れた / 全員一致 → 理由や背景を掘る
  - 5: 世代・地域・家庭差が疑われる割れ → 「これは世代で違うのかも？」と振る
  - 4: 寄せの読み合い（誰が言いそうと思って選んだか）/ 中身が別物の惜しい不一致ペア
- **回答が平凡・全員一致でも、回答内容そのものから会話を広げる提案を必ず1〜2個入れる（priority 3〜4）。以下のパターンを使う:**
  - 個人の思い出: 「〇〇さん、△△（回答）にまつわる思い出やエピソードはありますか？」
  - 全体への呼びかけ: 「△△（回答）で忘れられない出来事がある人、いますか？」
  - 回答がアーティスト・作者・ブランド・ジャンル等なら1段掘る: 「△△の中で特に好きな□□（曲・作品・商品など）は？」
  - 回答が特定の曲・作品・場所等なら分岐を渡す: 「△△は今も一番のお気に入りですか？それとも他に□□はありますか？」
  - 選び方・きっかけ: 「△△を最初に知った・好きになったきっかけは？」
- 呼び方・略称・表記の違いそのものを話題にした提案は、全体で最大1個かつ priority 2 以下。上記の話題を先に埋めること
- type: individual（targetに正確な参加者名が必須）/ group / comparison（2人以上を並べる）
- category: common / unique / interesting / follow_up

## message のルール（厳守）
- 主催者がそのまま読み上げる。日本語で1〜2文、60字程度まで
- **必ず参加者に発言を促す問いかけで終える**（「〜ですか？」「〜教えてください」「〜聞かせてください」など）。事実や感想を述べるだけで終わる文は禁止（例: 「〜が分かれましたね。」「〜代表格ですよね！」はNG）
- 前半で回答の事実に触れ、後半で問いかける構成にする
- 必ず実際の回答内容と参加者名を入れる
- 回答の説明・豆知識を長々と添えない（「背中の板が特徴的な◯◯」のような描写は不要）。回答名はそのまま使う
- 「それぞれの理由を聞いてみませんか？」のような、どのゲームでも使える当たり障りのない文は禁止。必ずこの回答セット固有の内容に踏み込む
- 名称の違いだけのペアを「不一致」「惜しい」として扱わない。基本は一致とみなす
- はい/いいえだけで終わる質問にしない。答えが広がる開かれた聞き方にする
- 外れ値の人を「間違い」扱いしない。好奇心で拾う
- 回答者が2〜3人なら「1人だけ」強調や comparison は避け、全員に均等に振る

## 出力例（形式と踏み込み方の参考。名前・内容はダミー。コピーしない）
お題「国民的アニメといえば？」／太郎:サザエさん、花子:サザエさん、次郎:ドラえもん、桜:サザエさん の場合:
[
  {"type":"individual","target":"次郎","message":"次郎さんだけ『ドラえもん』でしたね。ひみつ道具で今いちばん欲しいものは何ですか？","priority":5,"category":"unique"},
  {"type":"group","message":"太郎さん・花子さん・桜さんは『サザエさん』。日曜の夕方に見ていた思い出、ありますか？","priority":4,"category":"common"},
  {"type":"individual","target":"太郎","message":"太郎さん、『サザエさん』の登場人物で一番好きなのは誰ですか？","priority":3,"category":"interesting"},
  {"type":"group","message":"『ドラえもん』の映画で泣いた経験がある人、いますか？","priority":3,"category":"interesting"}
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
            id: `fs_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
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
          id: `fs_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
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
