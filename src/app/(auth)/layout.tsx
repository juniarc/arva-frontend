import { GlobalHeader } from "@/components/layout/GlobalHeader";
import { AuthIllustration } from "@/features/auth/components/AuthIllustration";
import Image from "next/image";
import AuthHero from "../../assets/auth-hero.png";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <GlobalHeader />
      <main className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-8 md:grid-cols-2 md:gap-12 md:px-6 md:py-14">
        {/* Hidden on mobile so the form comes first. */}
        <div className="hidden justify-center md:flex">
          <Image src={AuthHero} alt={""} />
          {/* <AuthIllustration className="w-full max-w-md" /> */}
        </div>
        <div className="mx-auto w-full max-w-sm md:mx-0">{children}</div>
      </main>
    </>
  );
}
