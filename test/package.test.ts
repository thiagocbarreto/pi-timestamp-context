import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import test from "node:test";

test("published package contains only runtime and user documentation", () => {
  const output = execFileSync("npm", ["pack", "--dry-run", "--json"], { encoding: "utf8" });
  const [result] = JSON.parse(output) as [{ files: Array<{ path: string }> }];
  const files = result.files.map((file) => file.path);

  assert.deepEqual(
    files.sort(),
    [
      "CHANGELOG.md",
      "LICENSE",
      "README.md",
      "extensions/timestamp-context.ts",
      "package.json",
    ].sort(),
  );
});

test("package metadata follows Pi package rules while publishing stays blocked", () => {
  const manifest = JSON.parse(readFileSync("package.json", "utf8"));

  assert.equal(manifest.name, "pi-timestamp-context");
  assert.equal(manifest.private, true);
  assert.ok(manifest.keywords.includes("pi-package"));
  assert.deepEqual(manifest.pi.extensions, ["./extensions/timestamp-context.ts"]);
  assert.deepEqual(manifest.peerDependencies, {
    "@earendil-works/pi-coding-agent": "*",
  });
  assert.deepEqual(manifest.publishConfig, { access: "public", provenance: true });
});
