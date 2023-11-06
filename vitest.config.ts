import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        coverage: {
            enabled: true,
            provider: "v8",
            reporter: ["text", "html", "json"],
        },
        reporters: ["default"],
        include: ["src/*.test.ts"],
        exclude: ["node_modules", "out"],
        testTimeout: 1000 * 20,
    },
});
