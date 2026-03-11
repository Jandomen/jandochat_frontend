import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.jandochat.app',
  appName: 'Jandochat',
  webDir: 'build',
  server: {
    url: 'https://jandochat.vercel.app',
    cleartext: true
  }
};

export default config;
