import { GlobalHeader } from "@/components/layout/GlobalHeader";

/** Layout for non-auth pages. They are placeholders until their features are built. */
export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <GlobalHeader />
      <main>{children}</main>
    </>
  );
}
