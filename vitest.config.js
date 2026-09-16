import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import { cloudflareTest, readD1Migrations } from "@cloudflare/vitest-pool-workers";

export default defineConfig(async () => {
  const migrations = await readD1Migrations(fileURLToPath(new URL("./migrations", import.meta.url)));
  return {
    plugins: [
      cloudflareTest({
        wrangler: { configPath: "./wrangler.jsonc" },
        miniflare: { bindings: { TEST_MIGRATIONS: migrations, DEV_EMAIL: "test@example.com" } },
      }),
    ],
    test: {
      include: ["test/worker*.test.js"],
      setupFiles: ["./test/apply-migrations.js"],
    },
  };
});
