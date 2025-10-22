import HomeView from "@/modules/home/ui/views/home-view";
import { HydrateClient, trpc } from "@/trpc/server";
// If you want to prefetch data on the server and then
// hydrate it on the client, you can do so like this.

export const dynamic = "force-dynamic"; // this page will be dynamic (SSR) even if no props are used

interface PageProps {
  searchParams: Promise<{
    categoryId?: string;
  }>;
}

const Page = async ({ searchParams }: PageProps) => {
  const { categoryId } = await searchParams;

  void trpc.categories.getMany.prefetch();
  return (
    // cada vez que hayas hecho un prefetch en el servidor, envuelve
    // el componente que lo va a usar con <HydrateClient>
    <HydrateClient>
      <HomeView categoryId={categoryId} />
    </HydrateClient>
  );
};
export default Page;
