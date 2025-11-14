
import Fastify from "fastify";

import prismaPlugin from "@plugins/prisma";
import authPlugin from "@plugins/auth";

import { login, register } from "@routes/auth";
import { me } from "@routes/user";

const app = Fastify({ logger: true });

app.register(prismaPlugin);
app.register(authPlugin);

app.register(register, { prefix: "/user" });
app.register(login, { prefix: "/user" });
app.register(me, { prefix: "/" });


const start = async () => {
  try {
    await app.listen({ port: 3000 });
    app.log.info(`Server running at http://localhost:3000`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
