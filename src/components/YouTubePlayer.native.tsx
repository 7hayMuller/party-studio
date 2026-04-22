import React from 'react';
import { WebView } from 'react-native-webview';

export default function YouTubePlayer({ videoId }: { videoId: string }) {
  if (!videoId) return null;
  return (
    <WebView
      source={{
        html: `<!DOCTYPE html><html><head>
          <meta name="viewport" content="width=device-width,initial-scale=1">
          <style>*{margin:0;padding:0;background:#000}html,body,iframe{width:100%;height:100%;border:none;overflow:hidden}</style>
        </head><body>
          <iframe
            src="https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&loop=1&playlist=${videoId}&playsinline=1&controls=0&mute=0&rel=0&enablejsapi=1"
            allow="autoplay; fullscreen"
            frameborder="0"
            allowfullscreen
          ></iframe>
        </body></html>`,
        baseUrl: 'https://www.youtube-nocookie.com',
      }}
      style={{ position: 'absolute', width: 1, height: 1, opacity: 0.01, top: 0, left: 0 }}
      allowsInlineMediaPlayback={true}
      mediaPlaybackRequiresUserAction={false}
      javaScriptEnabled={true}
      originWhitelist={['*']}
      allowsFullscreenVideo={false}
      mixedContentMode="always"
      userAgent="Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
    />
  );
}
