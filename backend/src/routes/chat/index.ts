import { FastifyRequest, FastifyReply } from "fastify";

import { AuthenticatedUser } from "@plugins/auth";

import z from "zod";

import axios from "axios";

import { aiMessageSchema, userMessageSchema } from "@schemas/message";
import { message } from "@prisma/client";

/** /chat
 *
 * @param app FastifyInstance
 *
 * @post /chat
 *
 * @body { aiId: number }
 *
 * @description
 * Get the authenticated user's profile (excluding password).
 * Through the authentication, a new chat is created associated with the user.
 *
 * @returns
 * - 201 with the created chat on success,
 * - 401 if not authenticated.
 * - 404 if the specified AI model is not found.
 * 
 * @get /chat
 * 
 * @description
 * Returns all chats for the authenticated user.
 * 
 * @returns
 * - 200 with the chats on success,
 * - 401 if not authenticated.
 *
 * @get /chat/:chatId/message
 *
 * @description
 * Returns the specified chat with its messages for the authenticated user.
 *
 * @returns
 * - 200 with the chat on success,
 * - 400 for invalid chat ID,
 * - 401 if not authenticated.
 *
 * @post /chat/:chatId/message
 *
 * @body { chatId: number, content: string, createdAt?: Date }
 *
 * @description
 * Creates a new user message in the specified chat and fetches a response from the AI model.
 * Supports different AI model types (e.g., "ollama", "no-model").
 *
 * @returns
 * - 201 with the bot message on success,
 * - 400 for invalid input,
 * - 404 if AI model or chat not found,
 * - 500 for other failures.
 */
export async function chat(app: any) {
  app.post(
    "/chat",
    {
      onRequest: [app.auth],
      config: {
        rateLimit: {
          max: 5,
          timeWindow: "1 hour",
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const aiId = request.body && (request.body as any).aiId;

      const user = request.user as AuthenticatedUser;

      const ai = await app.prisma.ai.findUnique({
        where: { id: aiId },
      });

      if (!ai) {
        return reply.code(404).send({ error: "AI model not found" });
      }

      const newChat = await app.prisma.chat.create({
        data: {
          userId: user.id,
          aiId: ai.id,
        },
      });

      return reply.code(201).send(newChat);
    }
  );
  app.get(
    "/chat",
    {
      onRequest: [app.auth],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user as AuthenticatedUser;

      const chat = await app.prisma.chat.findMany({
        where: { userId: user.id },
        include: {
          ai: {
            include: {
              sender: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return reply.code(200).send(chat);
    }
  );
  app.get(
    "/chat/:chatId/message",
    {
      onRequest: [app.auth],
    },
    async (
      request: FastifyRequest<{ Params: { chatId: string } }>,
      reply: FastifyReply
    ) => {
      const params = request.params as { chatId: string };

      const chatId = Number(params.chatId);
      if (Number.isNaN(chatId)) {
        return reply.code(400).send({ error: "Invalid Chat ID" });
      }

      const user = request.user as AuthenticatedUser;

      const chat = await app.prisma.chat.findUnique({
        where: { userId: user.id, id: chatId },
        include: {
          messages: {
            orderBy: { createdAt: "asc" }, // Sort the messages
            include: { sender: true }, // Shows who sent (user or AI)
          },
        },
      });

      // If the user has no chats, returns an empty array
      return reply.code(200).send(chat);
    }
  );

  app.post(
    "/chat/:chatId/message",
    {
      onRequest: [app.auth],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const params = request.params as { chatId: string };

      if (!params.chatId) {
        return reply.code(400).send({ error: "Chat ID is required" });
      }

      const chatId = Number(params.chatId);

      const parse = userMessageSchema.safeParse(request.body);

      if (!parse.success) {
        return reply.code(400).send({
          error: "Invalid request body",
          issues: z.treeifyError(parse.error),
        });
      }

      const { content, createdAt } = parse.data;

      const user = request.user as AuthenticatedUser;

      const chat = await app.prisma.chat.findUnique({
        where: { id: chatId, userId: user.id },
      });

      if (!chat) {
        return reply.code(400).send({ error: "Chat not found" });
      }

      const ai = await app.prisma.ai.findUnique({
        where: { id: chat.aiId },
      });

      if (!ai) {
        return reply.code(404).send({ error: "AI model not found" });
      }

      const newMessage = await app.prisma.message.create({
        data: {
          content: content,
          chatId: chatId,
          senderId: user.senderId,
          senderType: "user",
          createdAt: createdAt,
        },
      });

      // Initiate AI response based on model type
      let botMessage: message | null = null;

      switch (ai.modelType) {
        case "ollama":
          // Call self-hosted Ollama API, validates and creates the bot message as response
          try {
            const response = await axios.post(
              ai.url!,
              {
                model: "qwen3:8b",
                prompt: `<|im_start|>system\nYou are a broker assistant. All answers must be polite. You must limit any answer to 128 characters at max.<|im_end|>\n<|im_start|>user\n${newMessage.content}<|im_end|>\n<|im_start|>assistant\n`,
                raw: true,
                stream: false,
                options: {
                  num_predict: 256,
                  stop: ["<|im_end|>"],
                },
              },
              {
                headers: {
                  "Content-Type": "application/json",
                },
              }
            );

            const parse = aiMessageSchema.safeParse({
              content: response.data.response,
            });

            if (!parse.success) {
              return reply.code(500).send({
                error: "Invalid AI response",
                issues: z.treeifyError(parse.error),
              });
            }

            const { content } = parse.data;

            botMessage = await app.prisma.message.create({
              data: {
                content: content,
                chatId: chatId,
                senderId: ai.senderId,
                senderType: "ai",
              },
            });
          } catch (error) {
            return reply
              .code(500)
              .send({ error: "Failed to fetch AI response" });
          }
          break;
        case "no-model":
          // No AI model, returns a canned response. As is hardcoded, no validation needed.
          const CANNED_RESPONSES = [
            "Sorry, I don't have an answer for that right now.",
            "I'm not sure how to respond to that.",
            "Could you please rephrase your question?",
            "I'm still learning and can't answer that.",
            "Let's talk about something else.",
            "I don't have that information.",
            "I'm unable to process that request.",
            "That's an interesting point! I'll have to think about it.",
            "I can't help with that, but I'm here for other questions.",
            "I'm not equipped to handle that topic.",
            "My apologies, I can't provide a response.",
            "I'm afraid I don't understand.",
            "Please ask another question.",
            "I am a simple bot and that is beyond my capabilities.",
            "I'm not sure I follow.",
            "Let's change the subject.",
          ];
          try {
            botMessage = await app.prisma.message.create({
              data: {
                content:
                  CANNED_RESPONSES[
                    Math.floor(Math.random() * CANNED_RESPONSES.length)
                  ],
                chatId: chatId,
                senderId: ai.senderId,
                senderType: "ai",
              },
            });
          } catch (error) {
            return reply
              .code(500)
              .send({ error: "Failed to create bot message" });
          }
          break;
        default:
          return reply.code(500).send({ error: "AI model type not supported" });
      }

      // Returns the bot message created
      if (!botMessage) {
        return reply.code(500).send({ error: "No bot message created" });
      }

      return reply.code(201).send(botMessage);
    }
  );
}
