/**
 * ファシリテーション提案のスモークテスト（手動実行用・デプロイ対象外）
 *
 * 前提:
 *   1. gcloud auth application-default login 済み（match-party-findy で Vertex AI User 権限）
 *   2. cd functions && npm run build （lib/ を生成）
 *
 * 実行:
 *   cd functions && node scripts/facilitation-smoke.mjs
 *   cd functions && node scripts/facilitation-smoke.mjs 0   # 0番のシナリオだけ
 *
 * 注意: ローカルのユーザーADCで叩く場合、割り当てプロジェクトによっては
 *   Vertex エンドポイントが HTML 404 を返すことがある（x-goog-user-project 未指定）。
 *   本番は専用サービスアカウントで動くため影響なし。ローカル検証時は
 *   `gcloud auth application-default set-quota-project match-party-findy` を実行しておく。
 */
import { callVertexAI } from "../lib/vertexAI.js";

const A = (userName, content) => ({ userName, content, hasAnswered: true });

// サンプル名（ダミー）
const [taro, hanako, jiro, sakura, kenta, misaki, daisuke, yuki] = [
  "太郎",
  "花子",
  "次郎",
  "さくら",
  "健太",
  "美咲",
  "大輔",
  "ゆき",
];

const scenarios = [
  {
    label: "名称ゆれ（rex = ティラノサウルス）は一致扱いのはず＋外れ値",
    topic: "恐竜の名前といえば？",
    answers: [
      A(taro, "ティラノサウルス"),
      A(hanako, "ステゴサウルス"),
      A(jiro, "rex"),
      A(sakura, "トリケラトプス"),
    ],
  },
  {
    label: "きれいな2対2",
    topic: "朝ごはんのおかずといえば？",
    answers: [
      A(taro, "納豆"),
      A(hanako, "納豆"),
      A(jiro, "卵焼き"),
      A(sakura, "卵焼き"),
    ],
  },
  {
    label: "世代で割れる想定（4人バラバラ）",
    topic: "伝説のポケモンといえば？",
    answers: [
      A(taro, "ミュウツー"),
      A(hanako, "ミュウ"),
      A(jiro, "レックウザ"),
      A(sakura, "アルセウス"),
    ],
  },
  {
    label: "略称ゆれ（セブン / セブンイレブン）＋少人数",
    topic: "コンビニといえば？",
    answers: [
      A(taro, "セブンイレブン"),
      A(hanako, "セブン"),
      A(jiro, "ローソン"),
    ],
  },
  {
    label: "完全に全員一致（同一表記）",
    topic: "赤い果物といえば？",
    answers: [
      A(taro, "いちご"),
      A(hanako, "いちご"),
      A(jiro, "いちご"),
      A(sakura, "いちご"),
    ],
  },
  {
    label: "全員一致だが表記だけバラバラ（一致として扱えるか）",
    topic: "ファストフードの店といえば？",
    answers: [
      A(taro, "マクドナルド"),
      A(hanako, "マック"),
      A(jiro, "マクド"),
      A(sakura, "McDonald's"),
    ],
  },
  {
    label: "全員バラバラ",
    topic: "四字熟語といえば？",
    answers: [
      A(taro, "一期一会"),
      A(hanako, "臨機応変"),
      A(jiro, "温故知新"),
      A(sakura, "有言実行"),
    ],
  },
  {
    label: "平凡・ほぼ一致（横展開の話題が出るか）",
    topic: "米津玄師の曲といえば？",
    answers: [
      A(taro, "Lemon"),
      A(hanako, "Lemon"),
      A(jiro, "KICK BACK"),
      A(sakura, "Lemon"),
    ],
  },
  {
    label: "大人数（8人・複数クラスタ＋少数派）",
    topic: "日本の有名な観光地といえば？",
    answers: [
      A(taro, "京都"),
      A(hanako, "京都"),
      A(jiro, "京都"),
      A(sakura, "東京"),
      A(kenta, "東京"),
      A(misaki, "北海道"),
      A(daisuke, "沖縄"),
      A(yuki, "大阪"),
    ],
  },
];

const only = process.argv[2] != null ? Number(process.argv[2]) : null;
const targets = only == null ? scenarios.map((_, i) => i) : [only];

for (const i of targets) {
  const s = scenarios[i];
  console.log("\n" + "=".repeat(70));
  console.log(`#${i} ${s.label}`);
  console.log(`お題: ${s.topic}`);
  console.log(s.answers.map((a) => `  ${a.userName}: ${a.content}`).join("\n"));
  console.log("-".repeat(70));
  try {
    const r = await callVertexAI(s.answers, s.topic);
    for (const g of r.suggestions) {
      const tgt = g.target ? `/${g.target}` : "";
      console.log(`  [${g.type}${tgt}] p${g.priority} ${g.category}`);
      console.log(`    ${g.message}`);
    }
    console.log(`  → ${r.suggestions.length}件`);
  } catch (e) {
    console.error(`  ERROR: ${e.message}`);
  }
}
