import React from 'react';

export default function YouTubePlayer({ videoId }: { videoId: string }) {
  if (!videoId) return null;
  return React.createElement('iframe', {
    src: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&loop=1&playlist=${videoId}&playsinline=1&controls=0&mute=0&rel=0`,
    allow: 'autoplay; fullscreen',
    frameBorder: '0',
    style: {
      position: 'absolute',
      width: 1,
      height: 1,
      opacity: 0.01,
      top: 0,
      left: 0,
      border: 'none',
    },
  });
}
