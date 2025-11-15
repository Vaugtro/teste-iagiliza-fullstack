import { PrismaClient } from "@prisma/client";
import { FastifyInstance } from "fastify";

import fp from "fastify-plugin";

const prisma = new PrismaClient();

// --- Module Definitions ---
declare module "fastify" {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

/**
 * @file prisma.ts
 *
 * @description
 * Fastify plugin to decorate the 'app' instance with a shared
 * PrismaClient. It also adds an 'onClose' hook to disconnect
 * the client when the server shuts down.
 *
 * @decorator app.prisma
 */
async function prismaPlugin(app: FastifyInstance) {
  // Make the PrismaClient instance available on 'app.prisma'
  app.decorate("prisma", prisma);

  app.addHook("onClose", async (server) => {
    app.log.info("Disconnecting Prisma from database...");
    await server.prisma.$disconnect();
    app.log.info("Prisma disconnected.");
  });
}

export default fp(prismaPlugin, {
  name: "prisma",
});
