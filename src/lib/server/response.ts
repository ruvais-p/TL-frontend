export async function forwardResponse(response: Response) {
  const contentType = response.headers.get("content-type") || "application/json";
  const body = response.status === 204 ? null : await response.text();
  return new Response(body, { status: response.status, headers: { "content-type": contentType } });
}
