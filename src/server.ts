import "./config/env";
import { createApp } from "./app";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { prisma } from "./prisma/client";

const app = createApp();

async function bootstrap() {
  await prisma.$connect();
  app.listen(env.port, () => {
    logger.info(`API listening on :${env.port}`);
  });
}

bootstrap().catch((error) => {
  logger.error({ error }, "Failed to start server");
  process.exit(1);
});
