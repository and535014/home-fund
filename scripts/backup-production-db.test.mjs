import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { after, before, test } from "node:test";

// Real PostgreSQL 17 and GPG, synthetic fixtures only. Never inherit DB URLs,
// keys or runner evidence from the caller. Require Docker instead of skipping.
const script = fileURLToPath(new URL("./backup-production-db.sh", import.meta.url));
const image = "postgres:17-alpine";
const root = mkdtempSync(join(tmpdir(), "home-fund-backup-test-"));
const keyHome = mkdtempSync("/tmp/hf-test-gpg-");
const id = `hf-backup-test-${process.pid}-${randomBytes(4).toString("hex")}`;
const network = `${id}-network`;
const source = `${id}-source`;
const sourcePort = "5544";
const password = randomBytes(24).toString("hex");
const tables = ["Household", "Member", "Category", "LedgerRecord", "RecurringRule", "RecurringOccurrence", "ReimbursementPayment"];
const sourceCommit = "a".repeat(40);
const timestamp = "20260930T000000Z";
const expectedComparison = "1|1|1|1|1|1|1|1|2026-01-01 00:00:00|2026-01-01 00:00:00|2026-01-01 00:00:00";
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const dockerHost = process.env.DOCKER_HOST ?? spawnSync("docker", ["context", "inspect", "--format", "{{.Endpoints.docker.Host}}"], {
  encoding: "utf8", env: { PATH: process.env.PATH, HOME: process.env.HOME },
}).stdout?.trim();
const baseEnv = {
  PATH: process.env.PATH,
  HOME: root,
  LANG: "C",
  ...(dockerHost ? { DOCKER_HOST: dockerHost } : {}),
};
let publicKey;
let fingerprint;
let networkCreated = false;
let sourceCreated = false;

function run(command, args, { env = {}, input, timeout = 120000, cwd } = {}) {
  return spawnSync(command, args, {
    encoding: "utf8", input, timeout, cwd,
    env: { ...baseEnv, ...env },
    maxBuffer: 8 * 1024 * 1024,
  });
}

function checked(command, args, options) {
  const result = run(command, args, options);
  // Never put captured output into assertion messages (it may contain SQL/URLs).
  assert.equal(result.error?.code, undefined, `${command} execution failed`);
  assert.equal(result.status, 0, `${command} returned a nonzero status`);
  return result.stdout;
}

function sql(statement) {
  return checked("docker", ["exec", "--interactive", source, "psql", "--no-psqlrc", "--username", "postgres", "--port", sourcePort, "--dbname", "fixture", "--set", "ON_ERROR_STOP=1"], { input: statement });
}

before(async () => {
  checked("docker", ["pull", image]);
  checked("docker", ["network", "create", network]);
  networkCreated = true;
  checked("docker", ["run", "--detach", "--name", source, "--network", network,
    "--env", "POSTGRES_DB=fixture", "--env", "POSTGRES_PASSWORD", image,
    "postgres", "-p", sourcePort], { env: { POSTGRES_PASSWORD: password } });
  sourceCreated = true;
  let ready = false;
  for (let attempt = 0; attempt < 30; attempt++) {
    if (run("docker", ["exec", source, "pg_isready", "--host", "127.0.0.1", "--username", "postgres", "--port", sourcePort, "--dbname", "fixture"]).status === 0) {
      ready = true;
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  assert.ok(ready, "isolated source did not become ready");
  sql(`
    ${tables.map((table) => `CREATE TABLE "${table}" (id integer, "updatedAt" timestamp);
      INSERT INTO "${table}" VALUES (1, '2026-01-01');`).join("\n")}
    CREATE TABLE "_prisma_migrations" (finished_at timestamp, rolled_back_at timestamp);
    INSERT INTO "_prisma_migrations" VALUES ('2026-01-01', NULL);
    CREATE ROLE backup_reader LOGIN PASSWORD '${password}';
    ALTER ROLE backup_reader SET default_transaction_read_only = on;
    GRANT CONNECT ON DATABASE fixture TO backup_reader;
    GRANT USAGE ON SCHEMA public TO backup_reader;
    GRANT SELECT ON ALL TABLES IN SCHEMA public TO backup_reader;
    CREATE ROLE denied_reader LOGIN PASSWORD '${password}';
    GRANT CONNECT ON DATABASE fixture TO denied_reader;
    GRANT USAGE ON SCHEMA public TO denied_reader;
  `);
  checked("gpg", ["--batch", "--pinentry-mode", "loopback", "--passphrase", "",
    "--quick-generate-key", "Backup Regression Fixture", "rsa2048", "encr", "1d"], { env: { GNUPGHOME: keyHome } });
  const listing = checked("gpg", ["--batch", "--with-colons", "--list-keys"], { env: { GNUPGHOME: keyHome } });
  fingerprint = listing.split("\n").find((line) => line.startsWith("fpr:"))?.split(":")[9];
  assert.match(fingerprint, /^[0-9A-F]{40}$/);
  publicKey = checked("gpg", ["--armor", "--export", fingerprint], { env: { GNUPGHOME: keyHome } });
});

after(() => {
  // Only this fixture's containers/network. Retain host files for inspection;
  // local removal follows the repository's recoverable deletion policy.
  if (sourceCreated) checked("docker", ["rm", "--force", source]);
  if (networkCreated) checked("docker", ["network", "rm", network]);
  checked("gpgconf", ["--kill", "gpg-agent"], { env: { GNUPGHOME: keyHome } });
});

function backup({ host = source, port = sourcePort, user = "backup_reader", secret = password, query = "", env = {}, trace = false, slowRehearsal = false } = {}) {
  const directory = mkdtempSync(join(root, "case-"));
  const bin = join(directory, "bin");
  const output = join(directory, "output");
  const evidence = join(directory, "evidence");
  mkdirSync(bin);
  // A transport adapter attaches source clients to the isolated test network.
  // All client arguments and execution are delegated to real Docker/PostgreSQL.
  const docker = checked("bash", ["-c", "command -v docker"]).trim();
  writeFileSync(join(bin, "docker"), `#!${process.execPath}
const { spawnSync } = require('node:child_process');
const args = process.argv.slice(2);
const nameIndex = args.indexOf('--name');
const rehearsal = args[0] === 'run' && nameIndex !== -1 && args[nameIndex + 1].startsWith('home-fund-backup-db-');
if (rehearsal && process.env.TEST_SLOW_REHEARSAL) {
  // Hold the real image's socket-only initialization server open. Return only
  // once that window starts, so the old socket probe reliably starts restore early.
  const imageIndex = args.indexOf('${image}');
  args.splice(imageIndex, 0, '--entrypoint', 'sh');
  args.push('-c', "printf '%s\\\\n' 'touch /tmp/rehearsal-init-started' 'sleep 6' > /docker-entrypoint-initdb.d/slow.sh; exec /usr/local/bin/docker-entrypoint.sh postgres");
}
if (args[0] === 'run' && args.some(a => a === 'PGDATABASE' || a.startsWith('PGDATABASE='))) {
  args.splice(1, 0, '--network', process.env.TEST_NETWORK);
}
const result = spawnSync(process.env.TEST_DOCKER, args, { stdio: 'inherit' });
if (result.status === 0 && rehearsal && process.env.TEST_SLOW_REHEARSAL) {
  let initializing = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    const marker = spawnSync(process.env.TEST_DOCKER, ['exec', args[nameIndex + 1], 'test', '-f', '/tmp/rehearsal-init-started'], { stdio: 'ignore' });
    if (marker.status === 0) { initializing = true; break; }
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 100);
  }
  if (!initializing) process.exit(1);
}
if (result.status === 0 && process.env.TEST_AFTER_DUMP && args.some(a => a.includes('pg_dump'))) {
  const change = spawnSync(process.env.TEST_DOCKER,
    ['exec', '--interactive', process.env.TEST_SOURCE, 'psql', '--no-psqlrc', '--username', 'postgres', '--port', '${sourcePort}', '--dbname', 'fixture', '--set', 'ON_ERROR_STOP=1'],
    { input: process.env.TEST_AFTER_DUMP, stdio: ['pipe', 'ignore', 'ignore'] });
  if (change.status !== 0) process.exit(1);
}
process.exit(result.status ?? 1);
`, { mode: 0o700 });
  // The unmodified production cleanup permanently removes host temp files.
  // Override only that cleanup on macOS; preserve local fixtures, do not run rm.
  const shellEnv = join(directory, "shell-env");
  writeFileSync(shellEnv, process.platform === "darwin" ? "function rm() { return 0; }\n" : "");
  const url = `postgresql://${user}:${secret}@${host}:${port}/fixture?connect_timeout=2&application_name=backup-regression${query}`;
  const result = run("bash", [...(trace ? ["-x"] : []), script], {
    env: {
      PATH: `${bin}:${baseEnv.PATH}`,
      TEST_DOCKER: docker,
      TEST_NETWORK: network,
      TEST_SOURCE: source,
      ...(slowRehearsal ? { TEST_SLOW_REHEARSAL: "1" } : {}),
      BASH_ENV: shellEnv,
      BACKUP_DATABASE_URL: url,
      BACKUP_GPG_PUBLIC_KEY: publicKey,
      BACKUP_GPG_RECIPIENT_FINGERPRINT: fingerprint,
      BACKUP_OUTPUT_DIR: output,
      RUNNER_TEMP: directory,
      POSTGRES_MAJOR: "17",
      TARGET_VERSION: "v0.2.1",
      SOURCE_COMMIT: sourceCommit,
      BACKUP_TIMESTAMP_UTC: timestamp,
      GITHUB_OUTPUT: evidence,
      ...env,
    },
  });
  assert.equal(result.error?.code, undefined, "backup execution failed");
  return { result, output, evidence, directory, url, secret };
}

function privateLogs(fixture) {
  const logs = fixture.result.stdout + fixture.result.stderr;
  for (const sensitive of [fixture.url, fixture.secret, "postgresql://", "postgres://", "CREATE TABLE", "INSERT INTO", "PGDMP"]) {
    assert.equal(logs.includes(sensitive), false, "backup logs contain sensitive output");
  }
}

function noSuccess(fixture) {
  assert.notEqual(fixture.result.status, 0, "backup must fail closed");
  assert.equal(existsSync(fixture.evidence), false, "failed backup published evidence");
  assert.deepEqual(existsSync(fixture.output) ? readdirSync(fixture.output) : [], [], "failed backup published artifacts");
  assert.equal(fixture.result.stdout.includes("passed restore rehearsal"), false);
  privateLogs(fixture);
}

test("full URL reaches the specified PostgreSQL 17 target and publishes only a verified encrypted bundle", () => {
  const f = backup();
  assert.equal(f.result.stderr.includes("/var/run/postgresql/.s.PGSQL.5432"), false, "source client attempted the default Unix socket");
  assert.equal(f.result.status, 0, "backup did not complete");
  privateLogs(f);
  const backupId = `home-fund-production-pre-v0.2.1-${timestamp}`;
  assert.deepEqual(readdirSync(f.output).sort(), [`${backupId}.dump.gpg`, `${backupId}.dump.gpg.sha256`, `${backupId}.metadata.json`].sort());
  const encrypted = join(f.output, `${backupId}.dump.gpg`);
  const metadata = JSON.parse(readFileSync(join(f.output, `${backupId}.metadata.json`), "utf8"));
  assert.equal(metadata.postgresMajor, 17);
  assert.equal(metadata.sourceCommit, sourceCommit);
  assert.equal(metadata.restoreRehearsal, "passed");
  assert.equal(metadata.restoreComparison.status, "matched");
  assert.equal(metadata.restoreComparison.sha256, sha256(expectedComparison));
  assert.equal(metadata.encryptedSha256, sha256(readFileSync(encrypted)));
  checked("sha256sum", ["--check", `${backupId}.dump.gpg.sha256`], { cwd: f.output });
  const dump = join(f.directory, "decrypted.dump");
  checked("gpg", ["--batch", "--output", dump, "--decrypt", encrypted], { env: { GNUPGHOME: keyHome } });
  const archive = checked("docker", ["run", "--rm", "--volume", `${f.directory}:/fixture:ro`, image, "pg_restore", "--list", "/fixture/decrypted.dump"]);
  for (const table of [...tables, "_prisma_migrations"]) assert.ok(archive.includes(table), "encrypted archive is missing a fixture table");
  assert.ok(readFileSync(f.evidence, "utf8").includes(`backup_id=${backupId}`));
});

test("restore waits for TCP readiness while initialization still accepts socket connections", () => {
  const f = backup({ slowRehearsal: true });
  privateLogs(f);
  assert.equal(f.result.stderr.includes("Restore rehearsal failed"), false, "restore started before PostgreSQL accepted TCP connections");
  assert.equal(f.result.status, 0, "delayed initialization backup did not complete");
  assert.ok(existsSync(f.evidence), "verified backup evidence was not published");
});

test("unknown host fails closed without exposing its URL or credentials", () => {
  const f = backup({ host: `${id}-absent` });
  noSuccess(f);
  assert.ok(f.result.stderr.includes("Source PostgreSQL version query failed"));
});

test("unreachable port fails closed instead of falling back to a socket", () => {
  noSuccess(backup({ port: "5545" }));
});

test("authentication failure with shell tracing enabled does not expose credentials", () => {
  noSuccess(backup({ secret: "fixture-wrong-password", trace: true }));
});

test("server diagnostics caused by malformed URL options are withheld", () => {
  noSuccess(backup({ query: "&options=-cfixture-secret-option" }));
});

test("matching PostgreSQL major remains a required gate", () => {
  const f = backup({ env: { POSTGRES_MAJOR: "16" } });
  noSuccess(f);
  assert.ok(f.result.stderr.includes("does not match production major 17"));
});

test("dump permission failure stops before restore or artifact publication", () => {
  const f = backup({ user: "denied_reader" });
  noSuccess(f);
  assert.ok(f.result.stderr.includes("Source pg_dump failed"));
});

test("source comparison SQL failure stops after a real dump without publishing evidence", () => {
  sql('ALTER TABLE "Member" RENAME TO "FixtureRenamedMember";');
  try {
    const f = backup();
    noSuccess(f);
    assert.ok(f.result.stderr.includes("Source restore comparison query failed"));
  } finally {
    sql('ALTER TABLE "FixtureRenamedMember" RENAME TO "Member";');
  }
});

test("unfinished migration in the restored dump fails the rehearsal gate", () => {
  sql('UPDATE "_prisma_migrations" SET finished_at = NULL;');
  try {
    const f = backup();
    noSuccess(f);
    assert.ok(f.result.stderr.includes("Restored database validation failed"));
  } finally {
    sql('UPDATE "_prisma_migrations" SET finished_at = \'2026-01-01\';');
  }
});

test("a source change after dump fails comparison and never publishes an encrypted artifact", () => {
  try {
    const f = backup({ env: { TEST_AFTER_DUMP: 'UPDATE "Household" SET "updatedAt" = \'2026-01-02\';' } });
    noSuccess(f);
    assert.ok(f.result.stderr.includes("did not restore exactly"));
  } finally {
    sql('UPDATE "Household" SET "updatedAt" = \'2026-01-01\';');
  }
});

test("incorrect GPG recipient fingerprint stops before successful evidence", () => {
  const f = backup({ env: { BACKUP_GPG_RECIPIENT_FINGERPRINT: "B".repeat(40) } });
  noSuccess(f);
  assert.ok(f.result.stderr.includes("does not match BACKUP_GPG_RECIPIENT_FINGERPRINT"));
});
