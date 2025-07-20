export function StructuredData() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Match Party",
    description:
      "プレイヤー同士で回答の一致を目指すリアルタイムゲーム。最大20人で楽しめるパーティーゲーム。",
    url: "https://match-party-findy.web.app",
    applicationCategory: "Game",
    operatingSystem: "Web Browser",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "JPY",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      bestRating: "5",
      worstRating: "1",
    },
    author: {
      "@type": "Person",
      name: "aiandrox",
    },
    publisher: {
      "@type": "Organization",
      name: "Match Party",
      url: "https://match-party-findy.web.app",
    },
    inLanguage: "ja",
    isAccessibleForFree: true,
    browserRequirements: "Requires JavaScript. Modern web browser recommended.",
    softwareVersion: "1.0.0",
    releaseNotes: "リアルタイム一致ゲーム。最大20人対応、スマホ・PC対応。",
    // TODO: OG画像作成後に有効化
    // screenshot: "https://match-party-findy.web.app/og-image.jpg",
    featureList: [
      "リアルタイム同期",
      "最大20人参加",
      "スマートフォン対応",
      "ルームコード参加",
      "447種類のお題",
      "音声フィードバック",
    ],
    gamePlatform: "Web Browser",
    genre: "Party Game",
    playMode: "MultiPlayer",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
