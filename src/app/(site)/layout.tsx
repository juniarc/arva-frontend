import { GlobalHeader } from "@/components/layout/GlobalHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

/** Layout for the public storefront pages: the shared header, the page, then the footer. */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <GlobalHeader />
      <main>{children}</main>
      <SiteFooter />
    </>
  );
}
