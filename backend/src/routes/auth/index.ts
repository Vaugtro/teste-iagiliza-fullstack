import { Prisma, PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { FastifyReply, FastifyRequest } from "fastify";

import { z } from "zod";

import { loginSchema, registerSchema } from "schemas/user";

/** POST /register
 *
 * @param app FastifyInstance
 *
 * @body {email: string, password: string, name: string }
 *
 * @description
 * Hashes the password with bcrypt and creates both a Sender (nested create) and User,
 * returning the created user with sender (password omitted).
 *
 * @returns
 * - 201 on success,
 * - 400 for missing fields,
 * - 409 for unique constraint violations (email),
 * - 500 for other failures.
 */
export async function register(app: any) {
  app.post(
    "/register",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parse = registerSchema.safeParse(request.body);

      if (!parse.success) {
        return reply.code(400).send({
          error: "Invalid request body",
          issues: z.treeifyError(parse.error),
        });
      }

      const { email, password, name } = parse.data;

      // If validation passes, hashes password and proceeds to create user
      const hashedPassword = await bcrypt.hash(password, 10);

      try {
        const newUser = await app.prisma.user.create({
          data: {
            email: email,
            password: hashedPassword,
            sender: {
              create: {
                name: name,
              },
            },
          },
          include: {
            sender: true,
          },
        });

        const { password: _, ...userData } = newUser;

        reply.code(201).send(userData);
      } catch (err: unknown) {
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === "P2002"
        ) {
          return reply
            .code(409)
            .send({ error: "The email is already registered" });
        }
        app.log.error(err);
        reply.code(500).send({ error: "Failed to create user" });
      }
    }
  );
}

/** POST /login
 * 
 * @body { email: string, password: string }
 *
 * @description
 * Finds user by email, compares password via bcrypt.
 * On success signs and returns a JWT containing { userId, senderId }.
 *
 * @returns
 * - 200 with { token: string } on success
 * - 400 for invalid request body
 * - 401 for invalid credentials
 */
export async function login(app: any) {
  app.post(
    "/login",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parse = loginSchema.safeParse(request.body);

      if (!parse.success) {
        return reply.code(400).send({
          error: "Invalid request body",
          issues: z.treeifyError(parse.error),
        });
      }

      const { email, password } = parse.data;

      // Find user by email
      const user = await app.prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        return reply.code(401).send({ error: "Invalid credentials" });
      }

      // HASH comparison
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return reply.code(401).send({ error: "Invalid credentials" });
      }

      const token = app.jwt.sign({
        userId: user.id,
        senderId: user.senderId,
      });

      reply.send({ token });
    }
  );
}
