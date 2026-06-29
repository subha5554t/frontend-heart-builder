import { z } from "zod";
import { TASK_PRIORITIES, TASK_STATUSES } from "@/lib/types";

// Shared Zod schemas. The frontend uses these for instant feedback; the spec
// keeps the same rules on the backend as the real security boundary.

export const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters").max(80),
    email: z.string().min(1, "Email is required").email("Enter a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const projectSchema = z.object({
  name: z.string().trim().min(3, "Name must be 3–100 characters").max(100),
  description: z.string().trim().max(500, "Keep it under 500 characters").optional(),
  dueDate: z.string().optional(),
});

export const taskSchema = z.object({
  title: z.string().trim().min(3, "Title must be 3–150 characters").max(150),
  description: z.string().trim().max(2000).optional(),
  status: z.enum(TASK_STATUSES as [string, ...string[]]),
  priority: z.enum(TASK_PRIORITIES as [string, ...string[]]),
  dueDate: z.string().optional(),
  assigneeId: z.string().optional(),
  labels: z.array(z.string()).optional(),
});

export const commentSchema = z.object({
  text: z.string().trim().min(1, "Comment cannot be empty"),
});

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
});

export const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ProjectInput = z.infer<typeof projectSchema>;
export type TaskInput = z.infer<typeof taskSchema>;
export type CommentInput = z.infer<typeof commentSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type PasswordInput = z.infer<typeof passwordSchema>;
