import { z } from "zod";

export const userMessageSchema = z.object({
  content: z.string().trim().min(1, { message: "The message cannot be empty" }).max(128, { message: "Content is too long" }),
  createdAt: z.date().optional(),
});

export const aiMessageSchema = z.object({
  content: z.string().trim().min(1, { message: "The message cannot be empty" }).max(128, { message: "Content is too long" }),
});