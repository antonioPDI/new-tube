"use client";

import InfiniteScroll from "@/components/infinite-scroll";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DEFAULT_LIMIT } from "@/constants";
import VideoThumbnail from "@/modules/videos/ui/components/video-thumbnail";
import { trpc } from "@/trpc/client";
import Link from "next/link";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

export const VideosSection = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ErrorBoundary fallback={<div>Error. Something went wrong</div>}>
        <VideosSectionSuspense />
      </ErrorBoundary>
    </Suspense>
  );
};

const VideosSectionSuspense = () => {
  const [videos, query] = trpc.studio.getMany.useSuspenseInfiniteQuery(
    {
      limit: DEFAULT_LIMIT, //como he puesto en la pagina del server
    },
    {
      getNextPageParam: (lastPage) => {
        return lastPage.nextCursor;
      },
    },
  );

  return (
    <div>
      <div className="border-y">
        <Table>
          {/* Table Header */}
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6 w-[510px]">Video</TableHead>
              <TableHead>Visibility</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Views</TableHead>
              <TableHead className="text-right">Comments</TableHead>
              <TableHead className="text-right pr-6">Likes</TableHead>
            </TableRow>
          </TableHeader>

          {/* Table Body */}
          <TableBody>
            {videos.pages
              .flatMap((page) => page.items)
              .map((video) => (
                /**
                 * TODO: cambiar a next 13+ Link con role="link" en tableRow y onKeyDown para
                 * enter. Quitar legacyBehavior https://nextjs.org/docs/app/api-reference/components/link
                 * Link es mas rapido pero se puede tener un comportamiento similar o igual con
                 * router.prefetch(href) (por ejemplo, en onPointerEnter, onMouseEnter,
                 * al enfocar la fila, o cuando la fila aparece en viewport)
                 */

                <Link key={video.id} href={`/studio/videos/${video.id}`} legacyBehavior>
                  <TableRow /* role="link" */ className="cursor-pointer">
                    <TableCell>
                      <div className="flex items-center gap-4 ">
                        <div className="relative aspect-video w-36 shrink-0 ">
                          <VideoThumbnail />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell> visibility </TableCell>
                    <TableCell> status </TableCell>
                    <TableCell> date </TableCell>
                    <TableCell className="text-right"> views </TableCell>
                    <TableCell className="text-right"> comments </TableCell>
                    <TableCell className="text-right pr-6"> likes </TableCell>
                  </TableRow>
                </Link>
              ))}
          </TableBody>
        </Table>
      </div>

      <InfiniteScroll
        isManual
        hasNextPage={query.hasNextPage}
        isFetchingNextPage={query.isFetchingNextPage}
        fetchNextPage={query.fetchNextPage}
      />
    </div>
  );
};
