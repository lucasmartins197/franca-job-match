import type { CapacitorConfig } from "@capacitor/cli";

/**
 * App nativo (Google Play / App Store) com Capacitor.
 * Fluxo: `npm run build && npx cap sync` → abrir com `npx cap open android` / `npx cap open ios`.
 * appId é o identificador nas lojas: depois de publicar NÃO dá para trocar.
 */
const config: CapacitorConfig = {
  appId: "br.com.frela.app",
  appName: "FreLa",
  webDir: "dist",
  backgroundColor: "#f6faf9",
  android: {
    allowMixedContent: false,
  },
  ios: {
    contentInset: "never",
  },
};

export default config;
