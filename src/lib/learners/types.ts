import type { UUID, User } from "@/lib/curriculum/types";

export type StudentGroupStatus = "ACTIVE" | "INACTIVE" | "ARCHIVED";
export type StudentGroupMember = { id: UUID; student_group: UUID; student: UUID; student_detail: User; joined_at: string };
export type StudentGroup = { id: UUID; name: string; code: string; grade: string; academic_year: number; teacher: UUID | null; teacher_detail: User | null; status: StudentGroupStatus; member_count: number; memberships: StudentGroupMember[]; created_at: string; updated_at: string };
export type EnrollmentOutcome = { created: number; existing: number; targeted: number };
export type CourseAssignment = { id: UUID; course: UUID; course_version: UUID; student_group: UUID | null; student: UUID | null; assigned_by: UUID; assigned_by_detail: User | null; course_name: string; course_version_name: string; assigned_at: string; due_date: string | null; status: "ACTIVE" | "COMPLETED" | "CANCELLED"; enrollment_outcome: EnrollmentOutcome | null };
export type GroupInput = Pick<StudentGroup, "name" | "code" | "grade" | "academic_year" | "status"> & { teacher?: UUID | null };

