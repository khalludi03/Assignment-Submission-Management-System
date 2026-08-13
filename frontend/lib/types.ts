export type Role = "Admin" | "Teacher" | "Student";

export interface LoginResponse {
  token: string;
  email: string;
  fullName: string;
  role: Role;
}

export interface Assignment {
  id: number;
  title: string;
  description: string;
  deadline: string;
  maxMarks: number;
  status: "Draft" | "Published";
  classId: number;
  className: string;
  subjectId: number;
  subjectName: string;
  teacherName: string;
}

export interface Submission {
  id: number;
  answer: string;
  status: "Submitted" | "Graded" | "Rejected";
  marks: number | null;
  feedback: string | null;
  submittedAt: string;
  updatedAt: string | null;
  assignmentId: number;
  assignmentTitle: string;
  studentId: number;
  studentName: string;
}

export interface User {
  id: number;
  email: string;
  fullName: string;
  role: Role;
  classId: number | null;
  className: string | null;
}

export interface ClassItem {
  id: number;
  name: string;
}

export interface SubjectItem {
  id: number;
  name: string;
}

export interface TeacherAssignment {
  teacherId: number;
  teacherName: string;
  classId: number;
  className: string;
  subjectId: number;
  subjectName: string;
}
