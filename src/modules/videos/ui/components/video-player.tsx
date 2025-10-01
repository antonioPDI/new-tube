"use client";

import MuxPlayer from "@mux/mux-player-react";

interface VideoPlayerProps {
  playbackId?: string | null | undefined;
  thumbnailUrl?: string | null | undefined;
  autoplay?: boolean;
  onplay?: () => void;
}

export const VideoPlayer = ({
  playbackId,
  thumbnailUrl,
  autoplay,
  onplay,
}: VideoPlayerProps) => {
  if (!playbackId) {
    return null;
  }

  return (
    <MuxPlayer
      playbackId={playbackId}
      poster={thumbnailUrl || "/placeholder.svg"}
      autoPlay={autoplay}
      playerInitTime={0} /* si no ponemos esto vamos a tener un problema de hidratacion */
      thumbnailTime={0}
      className="w-full h-full object-contain"
      accentColor="#ff2056"
      onPlay={onplay}
    />
  );
};
