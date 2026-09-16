import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { include: ["test/storage.test.js"], environment: "jsdom" },
});
