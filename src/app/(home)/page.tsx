import { trpc } from "@/trpc/server";

export default async function Home() {
  const data = await trpc.hello({ text: "from tRPC" });
  return (
    // <section className="flex min-h-screen flex-col items-center justify-center bg-background">
    <div>
      {/* <Image src="logo.svg" alt="Logo" width={100} height={100} /> */}
      <p className="text-xl font-semibold tracking-tight">
        Client component says: {data.greeting}
      </p>
    </div>
    // </section>
  );
}
