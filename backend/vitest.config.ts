import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "html"],
      exclude: [
        "node_modules/**",
        "dist/**",
        "src/server.ts",
        "src/app.ts",
        "**/*.d.ts",
        "src/**/*.interface.ts",
        "src/**/*.types.ts",
        "src/**/*.enum.ts",
        "src/config/**",
        "src/models/**",
        "src/repositories/**",
        "src/routes/**",
        "src/schemas/**",
      ],
      thresholds: {
        lines: 95,
        functions: 95,
        branches: 95,
        statements: 95,
      },
    },
    include: ["test/**/*.test.ts"],
  },
});
