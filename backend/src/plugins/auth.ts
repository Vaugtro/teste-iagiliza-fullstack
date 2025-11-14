import { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';
import { user, sender } from '@prisma/client'; // Import your Prisma types

// --- Type Definitions ---
export interface JWTPayload {
  userId: number;
}

export type AuthenticatedUser = user & { sender: sender | null };

/**
 * @plugin auth
 *
 * @description
 * Registers the '@fastify/jwt' plugin and provides a global 'app.auth'
 * decorator for route authentication and user fetching.
 *
 * @decorator app.auth
 *
 * @description
 * 1. Verifies the JWT (requires 'Authorization' header).
 * 2. Extracts the 'userId' from the token payload.
 * 3. Fetches the full user from the database (including 'sender').
 * 4. Attaches the complete 'AuthenticatedUser' object to 'request.user',
 * replacing the original JWT payload.
 *
 * @depends
 * - '@fastify/prisma' (must be registered before this plugin)
 *
 * @requires
 * - 'JWT_SECRET' environment variable must be set.
 * - A valid 'Authorization: Bearer <token>' header on the request.
 */
const authPlugin: FastifyPluginAsync = async (fastify, options) => {
  
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    fastify.log.error("Missing JWT_SECRET environment variable");
    throw new Error("Missing JWT_SECRET environment variable");
  }

  fastify.register(fastifyJwt, {
    secret: jwtSecret,
  });

  fastify.decorate(
    "auth",
    async function (
      request: FastifyRequest,
      reply: FastifyReply
    ) {
      try {
        await request.jwtVerify();

        const { userId } = request.user as JWTPayload;

        const user = await fastify.prisma.user.findUnique({
          where: { id: userId },
          include: { sender: true },
        });

        if (!user) {
          throw new Error("Authenticated user not found");
        }

        request.user = user as AuthenticatedUser;

      } catch (err) {
        fastify.log.error(err);
        reply
          .code(401)
          .send({ error: "Unauthorized", message: (err as Error).message });
      }
    }
  );
};

export default fp(authPlugin, {
  name: 'auth',
  dependencies: ['@fastify/prisma'] 
});