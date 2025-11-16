import { Prisma, PrismaClient } from "@prisma/client";
import { FastifyRequest, FastifyReply } from "fastify";

import { updateUserSchema } from "@schemas/user";

import { AuthenticatedUser } from "@plugins/auth";

import bcrypt from "bcrypt";

import { z } from "zod";

/** /me
 * 
 * @param app FastifyInstance
 * 
 * @get /me
 * 
 * @description
 * Returns the authenticated user's profile (excluding password and senderId).
 * Requires authentication via the 'auth' plugin.
 * 
 * @returns
 * - 200 with user profile on success,
 * - 401 if not authenticated.
 * 
 * @patch /me
 * 
 * @body { email?: string, name?: string, password?: string }
 * 
 * @description
 * Updates the authenticated user's email and/or sender name.
 * Validates input using 'updateUserSchema'.
 * Handles unique constraint violations for email.
 * Requires authentication via the 'auth' plugin.
 * 
 * @returns
 * - 200 with updated fields on success,
 * - 400 for invalid input,
 * - 409 for email already in use,
 * - 500 for other failures.
 */
export async function me(app: any) {
  app.get(
    "/me",
    {
      onRequest: [app.auth],
    },
    async (request: FastifyRequest) => {
      // 'request.user' is populated by the 'auth' plugin, use it to get user data
      const user = (request.user ?? {}) as {
        password?: string;
        [k: string]: any;
      };

      // Exclude password for sensitivity and senderId to avoid redundancy
      const { password, senderId, ...userData } = user;

      return userData;
    }
  );

  app.patch(
    "/me",
    {
      onRequest: [app.auth],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {

      const user = request.user as AuthenticatedUser;

      const parse = updateUserSchema.safeParse(request.body);

      if (!parse.success) {
        return reply.code(400).send({
          error: "Invalid request body",
          issues: z.treeifyError(parse.error),
        });
      }

      const { email, name, password } = parse.data;

      const updates: { email?: string; name?: string; password?: string } = {};

      try {
        // If 'email' was sent, update the 'user' model
        if (email) {
          const updatedUser = await app.prisma.user.update({
            where: { id: user.id },
            data: { email },
          });
          updates.email = updatedUser.email;
        }

        // If 'name' was sent, update the 'sender' model
        if (name) {
          const updatedSender = await app.prisma.sender.update({
            where: { id: user.senderId },
            data: { name },
          });
          updates.name = updatedSender.name;
        }

        // If 'password' was sent, update the 'user' model
        if (password) {
          const hashedPassword = await bcrypt.hash(password, 10);
          const updatedUser = await app.prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword },
          });
          updates.password = updatedUser.password;
        }

        return updates;
      } catch (err: unknown) {
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === "P2002"
        ) {
          return reply.code(409).send({ error: "E-mail already in use." });
        }
        app.log.error(err);
        reply.code(500).send({ error: "Failed to update profile." });
      }
    }
  );
}
