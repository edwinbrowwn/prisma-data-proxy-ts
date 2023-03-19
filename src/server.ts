#! /usr/bin/env node
import { PrismaClient } from "@prisma/client";
import Fastify, { FastifyInstance } from "fastify";
import { getDMMF, getSchemaSync } from "@prisma/sdk";
import { ApolloServer, BaseContext } from "@apollo/server";
import { afterMiddleware, makeServerConfig, beforeMiddleware } from "./";
import { config } from "dotenv";
import fastifyApollo, {
  fastifyApolloDrainPlugin,
} from "@as-integrations/fastify";
import fastifyExpress from "@fastify/express";
config();

const db = new PrismaClient(
  process.env.NODE_ENV === "production"
    ? undefined
    : { log: ["query", "info", "error", "warn"] }
);
db.$connect();

const apiKey = process.env.DATA_PROXY_API_KEY;
if (!apiKey) {
  throw Error("`DATA_PROXY_API_KEY` is not set.");
}

const fastify: FastifyInstance = Fastify({
  logger: true,
});

(async () => {
  const dmmf = await getDMMF({
    datamodel: getSchemaSync(process.env.PRISMA_SCHEMA_PATH),
  });

  const server = new ApolloServer<BaseContext>({
    ...makeServerConfig(dmmf, db),
    plugins: [fastifyApolloDrainPlugin(fastify)],
  });

  await fastify.register(fastifyExpress);

  fastify.use(beforeMiddleware({ apiKey }));
  fastify.use(afterMiddleware());

  if (process.env.PORT) {
    const port = Number(process.env.PORT);
    await server.start();
    await fastify.register(fastifyApollo(server));
    await fastify.listen({ port });
    console.log(`🔮 Alternative Prisma Data Proxy listening on port ${port}`);
  } else {
    console.info(
      `🔮 Alternative Prisma Data Proxy skipped listen because no PORT was specified.`
    );
  }
})();

export default fastify;
