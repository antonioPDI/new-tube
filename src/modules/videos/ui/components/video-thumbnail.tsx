import { formatDuration } from "@/lib/utils";
import Image from "next/image";

interface VideoThumbnailProps {
  title: string;
  imageUrl?: string | null;
  previewUrl?: string | null;
  duration: number | null;
}

const VideoThumbnail = ({ title, imageUrl, previewUrl, duration }: VideoThumbnailProps) => {
  return (
    <div className="relative group ">
      {/* thumbnail wrapper */}
      <div className="relative w-full overflow-hidden rounded-xl aspect-video ">
        <Image
          src={imageUrl ?? "/placeholder.svg"}
          alt={title || "Video thumbnail"}
          fill
          className="object-cover w-full h-full group-hover:opacity-0  "
        />
        <Image
          unoptimized={!!previewUrl}
          src={previewUrl ?? "/placeholder.svg"}
          alt={title || "Video thumbnail"}
          fill
          className="object-cover w-full h-full opacity-0 group-hover:opacity-100  "
        />
      </div>

      {/* video duration box */}
      <div className="absolute bottom-2 right-2 px-1 py-0.5 rounded bg-black/80 text-xs text-white font-medium">
        {<span>{formatDuration(duration) || 0}</span>}
      </div>
    </div>
  );
};

export default VideoThumbnail;
