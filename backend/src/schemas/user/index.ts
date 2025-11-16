import { z } from "zod";

const registerSchema = z.object({
  email: z.email({ message: "Please enter a valid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters long" }),
  name: z.string().min(2, { message: "Name must be at least 2 characters long" }),
});

const loginSchema = z.object({
  email: z.email({ message: "Please enter a valid email address." }),
  password: z.string().min(1, { message: "Password is required" }),
});

const updateUserSchema = z.object({
  email: z.email({ message: "Please enter a valid email address." }).optional(),
  name: z.string().min(2, { message: "Name must be at least 2 characters long" }).optional(),
  password: z.string().min(6, { message: "Password must be at least 6 characters long" }).optional(),
});

export { registerSchema, loginSchema, updateUserSchema };