// src/app.ts

console.log('[DEBUG] DB_URL is:', process.env.DB_URL);

import fastify from "fastify";

import {
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider,
} from 'fastify-type-provider-zod';

// Import using path aliases!
import prismaPlugin from '@infrastructure/web/plugins/prisma';
import swaggerPlugin from '@infrastructure/web/plugins/swagger';
import dependencyPlugin from '@infrastructure/web/plugins/dependencies';
import userRoutes from '@infrastructure/web/routes/users';

// ... all imports ...

// --- 1. Right after imports
console.log('[APP] Starting...');

const server = fastify({
  logger: true,
}).withTypeProvider<ZodTypeProvider>();

// ...

// --- 2. Before plugins
console.log('[APP] Registering plugins...');
server.register(swaggerPlugin);
server.register(prismaPlugin);
server.register(dependencyPlugin);
console.log('[APP] Plugins registered.');

// --- 3. Before routes
console.log('[APP] Registering routes...');
server.register(userRoutes, { prefix: '/users' });
console.log('[APP] Routes registered.');

const start = async () => {
  try {
    // --- 4. Before listen
    console.log('[APP] Server is about to listen...');
    await server.listen({ port: 3000 });
    // This line will only run if it's successful
    server.log.info(`Server listening on http://localhost:3000`);
  } catch (err) {
    // --- 5. THE MOST IMPORTANT PART
    console.error('[APP] FATAL ERROR:', err); // Log the actual error
    server.log.error(err);
    process.exit(1);
  }
};

start();