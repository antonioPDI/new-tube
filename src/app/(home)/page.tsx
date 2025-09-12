import Image from "next/image";

export default function Home() {
  return (
    // <section className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div>
        <Image src="logo.svg" alt="Logo" width={100} height={100} />
        <p className="text-xl font-semibold tracking-tight">NewTube</p>
      </div>
    // </section>
  );
}
