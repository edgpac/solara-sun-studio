import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.solargames.solodecabo",
  appName: "Sol de Cabo",
  webDir: ".vercel/output/static",
  plugins: {
    AdMob: {
      // Replace with your real AdMob iOS App ID from admob.google.com
      // Format: ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX
      appId: process.env.ADMOB_APP_ID_IOS ?? "ca-app-pub-2553443675625544~9811623019",
    },
  },
};

export default config;
