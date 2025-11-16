import { FastifyRequest, FastifyReply } from "fastify";

import { AuthenticatedUser } from "@plugins/auth";

/** /bot
 *
 * @param app FastifyInstance
 *
 * @get /bot
 *
 * @description
 * Returns all available AI bot models.
 *
 * @returns
 * - 200 with the list of bots on success,
 * - 401 if not authenticated.  
 */
export async function bot(app: any) {
  app.get(
    "/bot",
    {
      onRequest: [app.auth],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user as AuthenticatedUser;

      const bots = await app.prisma.ai.findMany({
        select: { id: true, modelType: true },
      });

      return reply.code(200).send(bots);
    }
  );
}
