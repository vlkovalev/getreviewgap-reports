const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const cwd = __dirname;
const out = fs.openSync(path.join(cwd, "dev.out.log"), "a");
const err = fs.openSync(path.join(cwd, "dev.err.log"), "a");

const child = spawn(process.execPath, [path.join(cwd, "node_modules", "next", "dist", "bin", "next"), "dev", "--webpack"], {
  cwd,
  detached: true,
  stdio: ["ignore", out, err],
  windowsHide: true
});

child.unref();
console.log(`Started Next dev server with PID ${child.pid}`);
