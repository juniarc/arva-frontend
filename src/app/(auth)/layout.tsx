import Image from "next/image";
import { GlobalHeader } from "@/components/layout/GlobalHeader";
import AuthHero from "../../assets/auth-hero.png";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <GlobalHeader />
      <main className="mx-auto grid max-w-6xl items-center gap-6 px-4 pb-10 pt-6 md:grid-cols-2 md:gap-12 md:px-6 md:py-14">
        <div className="flex justify-center">
          <Image src={AuthHero} alt="" priority className="h-auto w-full max-w-xs md:max-w-md" />
        </div>
        <div className="mx-auto w-full max-w-sm md:mx-0">{children}</div>
      </main>
    </>
  );
}
