import { networkInterfaces } from "node:os";
import { spawn } from "node:child_process";

const interfaces = networkInterfaces();
const addresses = Object.entries(interfaces)
  .flatMap(([name, entries]) =>
    entries
      .filter(
        (address) =>
          address &&
          address.family === "IPv4" &&
          !address.internal &&
          !address.address.startsWith("169.254."),
      )
      .map((address) => ({
        address: address.address,
        preferred: /wi-?fi|wireless|ethernet/i.test(name),
        virtual: /virtual|vmware|vbox|host-only|loopback/i.test(name),
      })),
  )
  .sort((left, right) => {
    if (left.preferred !== right.preferred) {
      return left.preferred ? -1 : 1;
    }
    if (left.virtual !== right.virtual) {
      return left.virtual ? 1 : -1;
    }
    return 0;
  })
  .map(({ address }) => address);

const displayAddress = addresses[0] || "127.0.0.1";
const hostname = "0.0.0.0";
console.log(`Starting Next.js on all local interfaces.`);
console.log(`Use this address on another device: http://${displayAddress}:3000`);
if (addresses.length > 1) {
  console.log(`Other available IPv4 addresses: ${addresses.slice(1).join(", ")}`);
}

const nextCommand = process.platform === "win32" ? "next.cmd" : "next";
const next = spawn(nextCommand, ["dev", "-H", hostname, ...process.argv.slice(2)], {
  cwd: process.cwd(),
  stdio: ["inherit", "pipe", "inherit"],
  shell: process.platform === "win32",
});

next.stdout.on("data", (chunk) => {
  process.stdout.write(
    chunk.toString().replaceAll("http://0.0.0.0:3000", `http://${displayAddress}:3000`),
  );
});

next.on("error", (error) => {
  console.error(`Could not start Next.js: ${error.message}`);
  process.exitCode = 1;
});

next.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
  } else {
    process.exitCode = code ?? 1;
  }
});
