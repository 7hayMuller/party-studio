// TypeScript type resolution stub.
// At runtime Metro picks useBackgroundAudio.native.ts (iOS/Android) or useBackgroundAudio.web.ts (browser).

export function useBackgroundAudio(_musicUri: string): { playing: boolean; unlock: () => void } {
  return { playing: false, unlock: () => {} };
}
