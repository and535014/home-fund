import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

// Execute the actual documented blocks, including their Bash error handling.
// Fixtures contain synthetic data only. CI discards its ephemeral runner; local
// fixtures are retained in the system temporary directory for failure inspection.
const runbook = readFileSync(new URL("../docs/database-backup-and-recovery.md", import.meta.url), "utf8");
const root = mkdtempSync(join(tmpdir(), "home-fund-recovery-test-"));
const backupId = "home-fund-production-pre-vX.Y.Z-YYYYMMDDTHHMMSSZ";
const sourceCommit = "a".repeat(40);
const ciphertext = "synthetic encrypted backup";
const comparison = "1|2|3|4|5|6|7|8|timestamp";
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

function documentedBlock(section) {
  const content = runbook.split(`### ${section}. `)[1]?.split("\n### ")[0];
  const block = content?.match(/```sh\n([\s\S]*?)\n```/);
  assert.ok(block, `Missing recovery section ${section}`);
  return block[1];
}

function fixture({ missingCiphertext = false } = {}) {
  const directory = mkdtempSync(join(root, "case-"));
  const bin = join(directory, "bin");
  mkdirSync(bin);
  const metadata = {
    backupId,
    sourceCommit,
    encryptedSha256: sha256(ciphertext),
    restoreComparison: { sha256: sha256(comparison) },
  };
  const metadataFile = join(directory, `${backupId}.metadata.json`);
  const encryptedFile = join(directory, `${backupId}.dump.gpg`);
  const checksumFile = `${encryptedFile}.sha256`;
  const calls = join(directory, "calls.log");
  const terminal = join(directory, "terminal-input");
  if (!missingCiphertext) writeFileSync(encryptedFile, ciphertext);
  writeFileSync(checksumFile, `${sha256(ciphertext)}  ${backupId}.dump.gpg\n`);
  writeFileSync(terminal, "postgresql://fixture.invalid/recovery\n");
  const saveMetadata = () => writeFileSync(metadataFile, JSON.stringify(metadata));
  saveMetadata();
  const mock = `#!${process.execPath}
const fs = require('node:fs');
const path = require('node:path');
const name = path.basename(process.argv[1]);
const args = process.argv.slice(2);
fs.appendFileSync(process.env.MOCK_CALLS, name + '\\n');
if (name === 'git') {
  if (args[0] === 'switch') process.exit(Number(process.env.MOCK_GIT_EXIT || 0));
  if (args[0] !== 'rev-parse') process.exit(99);
  process.stdout.write(process.env.MOCK_HEAD);
} else if (name === 'psql') {
  process.stdout.write(process.env.MOCK_COMPARISON);
  process.exit(Number(process.env.MOCK_PSQL_EXIT || 0));
} else if (name === 'gpg') {
  if (args[args.indexOf('--decrypt') + 1] !== '${backupId}.dump.gpg') process.exit(99);
  if (process.env.MOCK_GPG_EXIT) process.exit(Number(process.env.MOCK_GPG_EXIT));
  fs.writeFileSync(args[args.indexOf('--output') + 1], 'synthetic plaintext');
} else if (name === 'pg_restore') {
  process.exit(Number(process.env.MOCK_RESTORE_EXIT || 0));
}
`;
  for (const name of ["git", "psql", "gpg", "pg_restore"]) {
    writeFileSync(join(bin, name), mock, { mode: 0o700 });
  }
  function run(section, overrides = {}) {
    const command = documentedBlock(section)
      .replaceAll("<GitHub evidence source commit>", sourceCommit)
      .replaceAll("<GitHub evidence encrypted SHA-256>", sha256(ciphertext))
      .replaceAll("<GitHub evidence restore comparison SHA-256>", sha256(comparison))
      .replaceAll("<metadata-file>", metadataFile)
      // Simulate terminal input without a real TTY or database credential.
      .replaceAll("/dev/tty", `"${terminal}"`);
    const result = spawnSync("bash", ["-c", command], {
      cwd: directory,
      encoding: "utf8",
      timeout: 10000,
      env: {
        PATH: `${bin}:${process.env.PATH}`,
        MOCK_CALLS: calls,
        MOCK_HEAD: sourceCommit,
        MOCK_COMPARISON: `${comparison}\n`,
        ...overrides,
      },
    });
    assert.ifError(result.error);
    return result;
  }
  const called = () => existsSync(calls) ? readFileSync(calls, "utf8").trim().split("\n") : [];
  return { directory, metadata, metadataFile, encryptedFile, checksumFile, terminal, saveMetadata, run, called };
}

test("valid evidence decrypts the exact verified ciphertext", () => {
  const f = fixture();
  const result = f.run(4);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(f.called(), ["gpg"]);
  assert.match(result.stdout, /Backup evidence verified and decryption completed/);
});

test("redirected sidecar cannot authorize a substituted ciphertext", () => {
  const f = fixture();
  writeFileSync(join(f.directory, "original.gpg"), ciphertext);
  writeFileSync(f.checksumFile, `${sha256(ciphertext)}  original.gpg\n`);
  writeFileSync(f.encryptedFile, "substituted ciphertext");
  assert.notEqual(f.run(4).status, 0);
  assert.deepEqual(f.called(), []);
});

test("missing ciphertext stops before decrypt", () => {
  const f = fixture({ missingCiphertext: true });
  assert.notEqual(f.run(4).status, 0);
  assert.deepEqual(f.called(), []);
});

for (const field of ["backupId", "sourceCommit", "encryptedSha256", "comparisonSha256"]) {
  test(`metadata ${field} mismatch stops before decrypt or restore`, () => {
    const f = fixture();
    if (field === "comparisonSha256") f.metadata.restoreComparison.sha256 = "b".repeat(64);
    else f.metadata[field] = "mismatch";
    f.saveMetadata();
    assert.notEqual(f.run(4).status, 0);
    assert.deepEqual(f.called(), []);
  });
}

test("invalid JSON stops before decrypt", () => {
  const f = fixture();
  writeFileSync(f.metadataFile, "invalid JSON");
  assert.notEqual(f.run(4).status, 0);
  assert.deepEqual(f.called(), []);
});

test("GPG failure does not report successful verification and decryption", () => {
  const result = fixture().run(4, { MOCK_GPG_EXIT: "42" });
  assert.equal(result.status, 42);
  assert.doesNotMatch(result.stdout, /decryption completed/);
});

test("restore failure propagates instead of returning unset success", () => {
  const f = fixture();
  const result = f.run(5, { MOCK_RESTORE_EXIT: "42" });
  assert.equal(result.status, 42);
  assert.deepEqual(f.called(), ["pg_restore"]);
  assert.doesNotMatch(result.stdout, /restore completed/);
});

test("failed credential read prevents restore", () => {
  const f = fixture();
  writeFileSync(f.terminal, "");
  assert.notEqual(f.run(5).status, 0);
  assert.deepEqual(f.called(), []);
});

test("successful restore reports completion", () => {
  const result = fixture().run(5);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Recovery database restore completed/);
});

test("valid comparison passes", () => {
  const result = fixture().run(6);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Recovery comparison verified/);
});

test("failed git switch prevents database access", () => {
  const f = fixture();
  assert.equal(f.run(6, { MOCK_GIT_EXIT: "42" }).status, 42);
  assert.deepEqual(f.called(), ["git"]);
});

test("unexpected checkout SHA prevents database access", () => {
  const f = fixture();
  assert.notEqual(f.run(6, { MOCK_HEAD: "b".repeat(40) }).status, 0);
  assert.ok(!f.called().includes("psql"));
});

for (const output of ["", `${comparison}\n`]) {
  test(`psql failure propagates even when its ${output ? "partial" : "empty"} output matches the digest`, () => {
    const f = fixture();
    f.metadata.restoreComparison.sha256 = sha256(output.replace(/[\r\n]/g, ""));
    f.saveMetadata();
    const result = f.run(6, { MOCK_PSQL_EXIT: "42", MOCK_COMPARISON: output });
    assert.equal(result.status, 42);
    assert.doesNotMatch(result.stdout, /Recovery comparison verified/);
  });
}

test("comparison mismatch stops before the success marker", () => {
  const result = fixture().run(6, { MOCK_COMPARISON: "different counts" });
  assert.notEqual(result.status, 0);
  assert.doesNotMatch(result.stdout, /Recovery comparison verified/);
});

test("invalid source SHA stops before git or psql", () => {
  const f = fixture();
  f.metadata.sourceCommit = "invalid";
  f.saveMetadata();
  assert.notEqual(f.run(6).status, 0);
  assert.deepEqual(f.called(), []);
});
