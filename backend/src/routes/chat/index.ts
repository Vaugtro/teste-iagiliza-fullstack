import { FastifyRequest, FastifyReply } from "fastify";

import { AuthenticatedUser } from "@plugins/auth";

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
      }
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
}
