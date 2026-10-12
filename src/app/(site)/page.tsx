import type { Metadata } from "next";
import { HomeSections } from "@/features/home/components/HomeSections";
import { getHomeSections } from "@/features/home/data/home.loader";
import { isLoggedIn } from "@/lib/session";

export const metadata: Metadata = {
  title: { absolute: "Arva | Fresh Produce Marketplace" },
  description:
    "Buy fresh fruits, vegetables, seeds, fertilizers and farming equipment straight from local farmers and shops on Arva.",
};

export default async function HomePage() {
  const [data, loggedIn] = await Promise.all([getHomeSections(), isLoggedIn()]);

  return <HomeSections data={data} isLoggedIn={loggedIn} />;
}
