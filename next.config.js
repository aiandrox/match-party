/** @type {import('next').NextConfig} */
const nextConfig = {
  // 動的ルートでクライアントコンポーネントを使用するため静的エクスポートを無効化
  // output: 'export',
  trailingSlash: true,
  distDir: 'dist',
  images: {
    unoptimized: true
  }
}

module.exports = nextConfig