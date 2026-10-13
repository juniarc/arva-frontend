import { proxyRegions } from "@/features/checkout/api/regions.server";

type Context = { params: Promise<{ path: string[] }> };

/** The region lists for the address form (provinces, cities, districts, sub-districts), from wilayah.id. */
export async function GET(_request: Request, { params }: Context) {
  const { path } = await params;
  return proxyRegions(path);
}
