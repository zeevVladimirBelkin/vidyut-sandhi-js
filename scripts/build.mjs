// SPDX-License-Identifier: MIT

import { copyFile, mkdir } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const dist = new URL("dist/", root);
await mkdir(dist, { recursive: true });

const files = [
  ["src/index.js", "index.js"],
  ["data/rules.csv", "rules.csv"],
  ["LICENSE", "LICENSE"],
  ["NOTICE.md", "NOTICE.md"],
];
for (const [source, destination] of files) {
  await copyFile(new URL(source, root), new URL(destination, dist));
}
