import Image from "next/image";
import React from "react";

const VideoThumbnail = () => {
  return (
    <div className="relative ">
      {/* thumbnail wrapper */}
      <div className="relative w-full overflow-hidden rounded-xl aspect-video ">
        <Image
          className="object-cover w-full h-full"
          src="/placeholder.svg"
          alt="Thumbnail"
          layout="fill"
          objectFit="cover"
          // fill
        />
      </div>

      {/* video duration box */}
      {/* todo: add video duration box */}
    </div>
  );
};

export default VideoThumbnail;
