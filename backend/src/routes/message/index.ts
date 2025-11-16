import { FastifyRequest, FastifyReply } from "fastify";

import { AuthenticatedUser } from "@plugins/auth";

import { message } from "@prisma/client";

/** /chat/message
 * 
 * @param app FastifyInstance
 * 
 * @get /chat/message
 * 
 * @description
 * Returns all chats with their messages for the authenticated user.
 * 
 * @returns
 * - 200 with the chats on success,
 * - 401 if not authenticated.
 */
export async function message(app: any) {
  app.get(
    "/message",
    {
      onRequest: [app.auth],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user as AuthenticatedUser;

      const chats = await app.prisma.chat.findMany({
        where: { userId: user.id },
        include: {
          messages: {
            orderBy: { createdAt: "asc" }, // Sort the messages
            include: { sender: true }, // Shows who sent (user or AI)
          },
        },
      });

      // If the user has no chats, returns an empty array
      return reply.code(200).send(chats);
    }
  );

  
}
