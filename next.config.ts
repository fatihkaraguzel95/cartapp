// ============================================================
// next.config.ts — Next.js Yapılandırması
// ============================================================
// Bu dosya Next.js'in nasıl derleneceğini ve çalışacağını ayarlar.
// ============================================================

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: 'standalone' — Docker ile dağıtım için kritik bir ayar.
  // Normal Next.js derlemesi çalışması için node_modules klasörüne ihtiyaç duyar.
  // 'standalone' modu, uygulamayı tek başına çalışabilecek hale getirir:
  // node_modules'u dahil etmeden sadece gereken dosyaları paketler.
  // Bu sayede Docker image boyutu küçülür ve dağıtım kolaylaşır.
  output: 'standalone',
};

export default nextConfig;
