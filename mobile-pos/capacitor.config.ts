import type { CapacitorConfig } from '@capacitor/cli';
const config: CapacitorConfig = {
  appId: 'com.remontada.pos.mobile',
  appName: 'REMONTADA POS',
  webDir: 'dist',
  android: { allowMixedContent: false }
};
export default config;