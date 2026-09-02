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

const scenarios = [
  {
    label: "名称ゆれ（rex = ティラノサウルス）は一致扱いのはず＋外れ値",
    topic: "恐竜の名前といえば？",
    answers: [
      A("かおる", "ティラノサウルス"),
      A("るんるん", "ステゴサウルス"),
      A("さふぁり", "rex"),
      A("しーくれっと", "トリケラトプス"),
    ],
  },
  {
    label: "2対2のクラスタ",
    topic: "朝ごはんのおかずといえば？",
    answers: [A("A", "納豆"), A("B", "納豆"), A("C", "卵焼き"), A("D", "焼き鮭")],
  },
  {
    label: "世代で割れる想定",
    topic: "伝説のポケモンといえば？",
    answers: [
      A("父", "ミュウツー"),
      A("母", "ミュウ"),
      A("娘", "レックウザ"),
      A("息子", "アルセウス"),
    ],
  },
  {
    label: "略称ゆれ（セブン / セブンイレブン）＋少人数",
    topic: "コンビニといえば？",
    answers: [A("A", "セブンイレブン"), A("B", "セブン"), A("C", "ローソン")],
  },
  {
    label: "全員一致",
    topic: "赤い果物といえば？",
    answers: [A("A", "いちご"), A("B", "いちご"), A("C", "いちご"), A("D", "いちご")],
  },
  {
    label: "全員バラバラ",
    topic: "好きな四字熟語といえば？",
    answers: [
      A("A", "一期一会"),
      A("B", "臨機応変"),
      A("C", "温故知新"),
      A("D", "有言実行"),
    ],
  },
  {
    label: "平凡・ほぼ一致（横展開の話題が出るか）",
    topic: "好きなアーティストといえば？",
    answers: [
      A("けん", "Mrs. GREEN APPLE"),
      A("まい", "Mrs. GREEN APPLE"),
      A("そう", "米津玄師"),
      A("ゆい", "Mrs. GREEN APPLE"),
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
