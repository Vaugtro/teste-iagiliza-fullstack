import { z } from "zod";

export const userMessageSchema = z.object({
  chatId: z.number({ message: "Invalid chat ID" }),
  content: z.string().trim().min(1, { message: "The message cannot be empty" }).max(128, { message: "Content is too long" }),
  createdAt: z.date().optional(),
});

export const aiMessageSchema = z.object({
  content: z.string().trim().min(1, { message: "The message cannot be empty" }).max(128, { message: "Content is too long" }),
});