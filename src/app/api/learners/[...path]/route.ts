import{forwardResponse}from"@/lib/server/response";import{djangoRequest}from"@/lib/server/session";import{isAllowedLearnersProxyRequest}from"@/lib/server/learners-proxy-policy";
async function handle(request:Request,context:{params:Promise<{path:string[]}>}){const{path}=await context.params;const resourcePath=path.join("/");const search=new URL(request.url).search;if(!isAllowedLearnersProxyRequest(request.method,resourcePath,search))return Response.json({detail:"Unsupported learners route."},{status:404});const body=["GET","HEAD"].includes(request.method)?undefined:await request.text();return forwardResponse(await djangoRequest(`${resourcePath}/${search}`,{method:request.method,body}))}
export const GET=handle;export const POST=handle;export const PATCH=handle;export const DELETE=handle;

