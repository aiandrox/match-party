import { APP_BASE_URL, APP_NAME, APP_CREATOR, APP_DESCRIPTION } from '@/constants/app';

export function StructuredData() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: APP_NAME,
    description: APP_DESCRIPTION,
    url: APP_BASE_URL,
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
      name: APP_CREATOR,
    },
    publisher: {
      "@type": "Organization",
      name: APP_NAME,
      url: APP_BASE_URL,
    },
    inLanguage: "ja",
    isAccessibleForFree: true,
    browserRequirements: "Requires JavaScript. Modern web browser recommended.",
    softwareVersion: "1.0.0",
    releaseNotes: "リアルタイム一致ゲーム。最大20人対応、スマホ・PC対応。",
    screenshot: `${APP_BASE_URL}/og-image.jpg`,
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
