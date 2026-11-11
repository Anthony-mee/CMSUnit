import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { createWriteStream } from "node:fs";
import { access, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const binaryDirectory = join(projectRoot, "pocketbase", "bin");
const binaryPath = join(binaryDirectory, "pocketbase.exe");
const temporaryZip = join(binaryDirectory, "pocketbase-download.zip");
const forceInstall = process.argv.includes("--force");

async function ensureLocalEnvironment() {
  const envPath = join(projectRoot, ".env.local");

  try {
    await readFile(envPath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
    await writeFile(envPath, "POCKETBASE_URL=http://127.0.0.1:8090\n", "utf8");
    console.log("Created .env.local with the local PocketBase URL.");
  }
}

async function download(url) {
  const response = await fetch(url, {
    headers: { "User-Agent": "pocketbase-cms-studio-setup" },
    signal: AbortSignal.timeout(120_000),
  });

  if (!response.ok) {
    throw new Error(`Download failed (${response.status}): ${url}`);
  }

  return response;
}

async function main() {
  if (process.platform !== "win32" || process.arch !== "x64") {
    throw new Error("This installer currently supports Windows x64 only.");
  }

  if (!forceInstall) {
    try {
      await access(binaryPath);
      await ensureLocalEnvironment();
      console.log(`PocketBase is already installed at ${binaryPath}`);
      return;
    } catch (error) {
      if (error.code !== "ENOENT") {
        throw error;
      }
    }
  }

  const releaseResponse = await download(
    "https://api.github.com/repos/pocketbase/pocketbase/releases/latest",
  );
  const release = await releaseResponse.json();
  const version = release.tag_name.replace(/^v/, "");
  const assetName = `pocketbase_${version}_windows_amd64.zip`;
  const archiveAsset = release.assets.find((asset) => asset.name === assetName);
  const checksumAsset = release.assets.find((asset) => asset.name === "checksums.txt");

  if (!archiveAsset || !checksumAsset) {
    throw new Error(`Could not find the Windows x64 archive and checksum for ${release.tag_name}.`);
  }

  await mkdir(binaryDirectory, { recursive: true });

  try {
    const archiveResponse = await download(archiveAsset.browser_download_url);
    await pipeline(Readable.fromWeb(archiveResponse.body), createWriteStream(temporaryZip));

    const checksumResponse = await download(checksumAsset.browser_download_url);
    const checksums = await checksumResponse.text();
    const expectedHash = checksums
      .split(/\r?\n/)
      .map((line) => line.trim().match(/^([a-fA-F0-9]{64})\s+\*?(.+)$/))
      .find((match) => match?.[2] === assetName)?.[1];

    if (!expectedHash) {
      throw new Error(`The release checksum file does not contain ${assetName}.`);
    }

    const archive = await readFile(temporaryZip);
    const actualHash = createHash("sha256").update(archive).digest("hex");

    if (actualHash.toLowerCase() !== expectedHash.toLowerCase()) {
      throw new Error(`SHA-256 verification failed for ${assetName}.`);
    }

    const extraction = spawnSync("tar", ["-xf", temporaryZip, "-C", binaryDirectory], {
      stdio: "inherit",
    });

    if (extraction.error) {
      throw extraction.error;
    }
    if (extraction.status !== 0) {
      throw new Error(`Could not extract ${assetName} (tar exited ${extraction.status}).`);
    }

    await access(binaryPath);

    await ensureLocalEnvironment();

    console.log(`Installed PocketBase ${release.tag_name}; the release archive SHA-256 was verified.`);
    console.log("Start the CMS with: npm run pocketbase");
  } finally {
    await rm(temporaryZip, { force: true });
  }
}

main().catch((error) => {
  console.error(`PocketBase setup failed: ${error.message}`);
  process.exitCode = 1;
});
