"use client";

import { DEFAULT_LIMIT } from "@/constants";
import { trpc } from "@/trpc/client";

const VideosSection = () => {
  const { data } = trpc.studio.getMany.useSuspenseInfiniteQuery(
    {
      limit: DEFAULT_LIMIT, //como he puesto en la pagina del server
    },
    {
      getNextPageParam: (lastPage) => {
        return lastPage.length === DEFAULT_LIMIT
          ? {
              id: lastPage[lastPage.length - 1].id,
              updatedAt: lastPage[lastPage.length - 1].updatedAt,
            }
          : undefined;
      },
    },
  );

  return <div>Videos Section</div>;
};

export default VideosSection;
