import { z } from "zod";

const registerSchema = z.object({
  email: z.email({ message: "Invalid email format" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters long" }),
  name: z.string().min(1, { message: "Name is required" }),
});

const loginSchema = z.object({
  email: z.email({ message: "Invalid email format" }),
  password: z.string().min(1, { message: "Password is required" }),
});

const updateUserSchema = z.object({
  email: z.email({ message: "Invalid email format" }).optional(),
  name: z.string().min(1, { message: "Name cannot be empty" }).optional(),
});

export { registerSchema, loginSchema, updateUserSchema };