import { forwardResponse } from "@/lib/server/response";
import { djangoRequest } from "@/lib/server/session";

export async function GET() { return forwardResponse(await djangoRequest("auth/me/")); }
