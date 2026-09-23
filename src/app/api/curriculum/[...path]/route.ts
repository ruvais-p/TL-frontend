import { forwardResponse } from "@/lib/server/response";
import { isAllowedProxyRequest } from "@/lib/server/proxy-policy";
import { djangoRequest } from "@/lib/server/session";

async function handle(request: Request, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const resourcePath = path.join("/");
  if (!isAllowedProxyRequest(request.method, resourcePath)) return Response.json({ detail: "Unsupported curriculum route." }, { status: 404 });
  const body = ["GET", "HEAD"].includes(request.method) ? undefined : await request.text();
  return forwardResponse(await djangoRequest(`${resourcePath}/`, { method: request.method, body }));
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
