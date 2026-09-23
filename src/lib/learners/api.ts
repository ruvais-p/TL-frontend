import { ApiError } from "@/lib/curriculum/api";
import type { ApiErrorBody, User, UUID } from "@/lib/curriculum/types";
import type { CourseAssignment, GroupInput, StudentGroup, StudentGroupMember } from "./types";

async function request<T>(path:string,init?:RequestInit):Promise<T>{const response=await fetch(`/api/learners/${path}`,{...init,headers:{...(init?.body?{"content-type":"application/json"}:{}),...init?.headers}});if(!response.ok){let body:ApiErrorBody={};try{body=await response.json() as ApiErrorBody}catch{}throw new ApiError(response.status,body)}return(response.status===204?undefined:await response.json())as T}
const json=(value:unknown)=>JSON.stringify(value);
export const learnersApi={
  groups:()=>request<StudentGroup[]>("student-groups"),
  group:(id:UUID)=>request<StudentGroup>(`student-groups/${id}`),
  createGroup:(data:GroupInput)=>request<StudentGroup>("student-groups",{method:"POST",body:json(data)}),
  updateGroup:(id:UUID,data:Partial<GroupInput>)=>request<StudentGroup>(`student-groups/${id}`,{method:"PATCH",body:json(data)}),
  students:()=>request<User[]>("students"),
  teachers:()=>request<User[]>("teachers"),
  addMember:(group:UUID,student:UUID)=>request<StudentGroupMember>(`student-groups/${group}/members`,{method:"POST",body:json({student})}),
  removeMember:(membership:UUID)=>request<void>(`student-group-members/${membership}`,{method:"DELETE"}),
  assignments:(group:UUID)=>request<CourseAssignment[]>(`course-assignments?student_group=${encodeURIComponent(group)}`),
  assignCourse:(data:{course:UUID;course_version:UUID;student_group:UUID;due_date:string|null;status:"ACTIVE"})=>request<CourseAssignment>("course-assignments",{method:"POST",body:json(data)}),
};
