import { proxyToBackend } from "@/features/checkout/api/checkout.server";

type Context = { params: Promise<{ path?: string[] }> };

async function handle(request: Request, { params }: Context) {
  const { path = [] } = await params;
  return proxyToBackend(request, `/checkout${path.map((segment) => `/${segment}`).join("")}`);
}

/** Every /api/checkout/... call goes through the proxy, which only forwards the known routes. */
export const GET = handle;
export const POST = handle;
export const PUT = handle;
