
import Fastify from "fastify";

import prismaPlugin from "@plugins/prisma";
import authPlugin from "@plugins/auth";

import { login, register } from "@routes/auth";
import { me } from "@routes/user";
import { chat } from "@routes/chat";
import { message } from "@routes/message";

const app = Fastify({ logger: true });

app.register(require('@fastify/cors'), { 
  origin: "http://localhost:5173"
});

app.register(require('@fastify/rate-limit'), {
  global: false,
});

app.register(prismaPlugin);
app.register(authPlugin);

app.register(register, { prefix: "/user" });
app.register(login, { prefix: "/user" });
app.register(me, { prefix: "/" });
app.register(chat, { prefix: "/" });
app.register(message, { prefix: "/chat" });



const start = async () => {
  try {
    await app.listen({ port: 3000, host: '0.0.0.0' });
    app.log.info(`Server running at http://0.0.0.0:3000`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
