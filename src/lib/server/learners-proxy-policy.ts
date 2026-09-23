const UUID="[0-9a-fA-F-]{36}";
export function isAllowedLearnersProxyRequest(method:string,path:string,search=""){
  const clean=path.replace(/^\/+|\/+$/g,"");
  if(search&&!(/^\?student_group=[0-9a-fA-F-]{36}$/.test(search)&&clean==="course-assignments"&&method==="GET"))return false;
  if(clean==="student-groups")return method==="GET"||method==="POST";
  if(new RegExp(`^student-groups/${UUID}$`).test(clean))return method==="GET"||method==="PATCH";
  if(new RegExp(`^student-groups/${UUID}/members$`).test(clean))return method==="POST";
  if(clean==="students"||clean==="teachers")return method==="GET";
  if(new RegExp(`^student-group-members/${UUID}$`).test(clean))return method==="DELETE";
  if(clean==="course-assignments")return method==="GET"||method==="POST";
  return false;
}
