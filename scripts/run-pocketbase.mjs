import { spawn } from "node:child_process";
import { access } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const binaryPath = join(projectRoot, "pocketbase", "bin", "pocketbase.exe");

try {
  await access(binaryPath);
} catch (error) {
  if (error.code !== "ENOENT") {
    throw error;
  }
  console.error("PocketBase is not installed. Run `npm run setup` first.");
  process.exit(1);
}

const pocketbase = spawn(
  binaryPath,
  [
    "serve",
    "--http=127.0.0.1:8090",
    `--dir=${join(projectRoot, "pb_data")}`,
    `--migrationsDir=${join(projectRoot, "pb_migrations")}`,
  ],
  {
    cwd: projectRoot,
    stdio: "inherit",
  },
);

pocketbase.on("error", (error) => {
  console.error(`Could not start PocketBase: ${error.message}`);
  process.exitCode = 1;
});

pocketbase.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
  } else {
    process.exitCode = code ?? 1;
  }
});
