import { PrismaClient } from "@prisma/client/scripts/default-index";
import { makeTypeDefs } from "./makeTypeDefs";
import { makeResolver } from "./makeResolver";
import { DMMF } from "@prisma/generator-helper";
import { ApolloServerOptions, BaseContext } from "@apollo/server";

export const makeServerConfig = (
  dmmf: DMMF.Document,
  db: PrismaClient
): ApolloServerOptions<BaseContext> => {
  return {
    typeDefs: makeTypeDefs(dmmf),
    resolvers: makeResolver(dmmf, db),
  };
};
