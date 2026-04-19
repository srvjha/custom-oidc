import "dotenv/config";
import http from "node:http";
import { initializeKeys } from "./config/keys.js";
import { createExpressApplication } from "./app/index.js";

async function main() {
  try {
    await initializeKeys();

    const server = http.createServer(createExpressApplication());
    const PORT: number = Number(process.env.PORT) || 8000;

    server.listen(PORT, () => {
      console.log(`Http server is running on PORT ${PORT}`);
      console.log(
        `OIDC Discovery → http://localhost:${PORT}/.well-known/openid-configuration (local)`,
      );
    });
  } catch (error) {
    console.log(`Error starting http server`);
    throw error;
  }
}

main();
