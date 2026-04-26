import "dotenv/config";
import http from "node:http";
import { createExpressApplication } from "./app/index.js";

async function main() {
  try {
    const server = http.createServer(createExpressApplication());
    const PORT: number = Number(process.env.PORT) || 8000;

    server.listen(PORT, () => {
      console.log(`Http server is running on PORT ${PORT}`);
    });
  } catch (error) {
    console.log(`Error starting http server`);
    throw error;
  }
}

main();
