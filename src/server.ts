import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

/**
 * Launcher Next.js. Membaca APP_PORT dari environment, lalu dari berkas
 * .env, dan terakhir dari .env.example sebagai cadangan.
 */
function readEnvFile(file: string): Record<string, string> {
  const fullPath = path.resolve(process.cwd(), file);
  if (!existsSync(fullPath)) return {};
  const result: Record<string, string> = {};
  for (const rawLine of readFileSync(fullPath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const idx = line.indexOf("=");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line
      .slice(idx + 1)
      .trim()
      .replaceAll(/(?:^['"])|(?:['"]$)/g, "");
    result[key] = value;
  }
  return result;
}

const nodeRequire = createRequire(import.meta.url);

const fileEnv = { ...readEnvFile(".env.example"), ...readEnvFile(".env") };
const port = String(
  Number(process.env.APP_PORT || fileEnv.APP_PORT) || 3000
);
const mode = process.argv[2] === "start" ? "start" : "dev";

const proc = spawn(
  process.execPath,
  [nodeRequire.resolve("next/dist/bin/next"), mode, "-p", port],
  {
    stdio: "inherit",
    env: { ...fileEnv, ...process.env, APP_PORT: port },
  }
);

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    proc.kill(signal);
    process.exit(0);
  });
}

proc.on("exit", (code) => process.exit(code ?? 0));