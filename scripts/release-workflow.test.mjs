import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { load } from "js-yaml";

const workflow = (name) => load(readFileSync(new URL(`../.github/workflows/${name}.yml`, import.meta.url), "utf8"));
const tagWorkflow = workflow("create-release-tag");
const deployWorkflow = workflow("deploy-production");
const backupWorkflow = workflow("backup-production-db");
// Synthetic repositories remain in the temporary directory for inspection.
const root = mkdtempSync(join(tmpdir(), "home-fund-release-rehearsal-"));
const read = (file) => existsSync(file) ? readFileSync(file, "utf8") : "";

function command(cwd, executable, args, env = {}) {
  const result = spawnSync(executable, args, {
    cwd, encoding: "utf8", timeout: 20000,
    env: { PATH: process.env.PATH, ...env },
  });
  assert.ifError(result.error);
  return result;
}

function fixture() {
  const directory = mkdtempSync(join(root, "case-"));
  const remote = join(directory, "remote.git");
  const source = join(directory, "source");
  const bin = join(directory, "bin");
  mkdirSync(bin);
  const git = (cwd, ...args) => {
    const result = command(cwd, "git", args);
    assert.equal(result.status, 0, result.stderr);
    return result.stdout.trim();
  };
  git(directory, "init", "--bare", "--initial-branch=main", remote);
  git(directory, "clone", remote, source);
  git(source, "config", "user.name", "Release rehearsal");
  git(source, "config", "user.email", "rehearsal@example.invalid");
  mkdirSync(join(source, "scripts"));
  copyFileSync(new URL("./validate-release-tag.mjs", import.meta.url), join(source, "scripts/validate-release-tag.mjs"));
  writeFileSync(join(source, "package.json"), '{"version":"0.1.9"}\n');
  git(source, "add", ".");
  git(source, "commit", "-m", "Synthetic baseline");
  git(source, "tag", "v0.1.9");
  git(source, "push", "origin", "main", "refs/tags/v0.1.9");
  const calls = join(directory, "external-calls.jsonl");
  // External process boundaries only. Release scripts and Git execute for real.
  const adapter = `#!${process.execPath}
import fs from 'node:fs';
import path from 'node:path';
const name = path.basename(process.argv[1]);
const args = process.argv.slice(2);
fs.appendFileSync(process.env.REHEARSAL_CALLS, JSON.stringify([name, ...args]) + '\\n');
if (process.env.REHEARSAL_FAIL && args.join(' ').includes(process.env.REHEARSAL_FAIL)) process.exit(42);
if (name === 'corepack' && args.includes('deploy') && args.includes('--prebuilt')) console.log('https://deployment.example.invalid');
if (name === 'curl' && args.includes('--write-out')) process.stdout.write(process.env.REHEARSAL_CRON_STATUS || '401');
`;
  for (const name of ["corepack", "curl"]) writeFileSync(join(bin, name), adapter, { mode: 0o700 });
  const env = {
    PATH: `${bin}:${process.env.PATH}`, REHEARSAL_CALLS: calls,
    GITHUB_ACTOR: "rehearsal-operator", GITHUB_SERVER_URL: "https://github.com",
    GITHUB_REPOSITORY: "fixture/release", GITHUB_RUN_ID: "1",
  };
  const observed = () => read(calls).trim().split("\n").filter(Boolean).map((line) => JSON.parse(line));
  const published = () => git(remote, "tag", "--list").split("\n");
  return { directory, source, remote, git, env, observed, published };
}

// This is a deliberately bounded local dry-run, not a GitHub Actions emulator.
// Read the real job dependencies, env, checkout refs, run blocks and outputs.
// Fail closed on unsupported expressions/actions instead of silently skipping.
function rehearse(f, definition, inputs, { beforeStep = () => {}, env = {} } = {}) {
  const context = { inputs, github: { ref: "refs/heads/main" }, needs: {}, secrets: {} };
  const resolve = (value) => String(value).replace(/\$\{\{\s*(.*?)\s*\}\}/g, (_, expression) => {
    if (expression.startsWith("secrets.")) return "synthetic-secret";
    const result = expression.split(".").reduce((object, key) => object?.[key], context);
    assert.notEqual(result, undefined, `Unsupported expression: ${expression}`);
    return result;
  });
  const resolveEnv = (values = {}) => Object.fromEntries(Object.entries(values).map(([key, value]) => [key, resolve(value)]));
  const completed = [];
  for (const [jobId, job] of Object.entries(definition.jobs)) {
    for (const need of job.needs ?? []) assert.ok(context.needs[need], `Unsatisfied dependency ${need}`);
    const cwd = mkdtempSync(join(f.directory, `${jobId}-`));
    context.steps = {};
    for (const step of job.steps) {
      beforeStep(step, f);
      if (step.uses) {
        if (step.uses.startsWith("actions/checkout@")) {
          f.git(cwd, "clone", "--no-checkout", f.remote, ".");
          f.git(cwd, "checkout", "--detach", resolve(step.with?.ref ?? "main"));
        } else {
          assert.ok(step.uses.startsWith("actions/setup-node@"), `Unsupported action ${step.uses}`);
        }
        completed.push(step.name);
        continue;
      }
      assert.equal(typeof step.run, "string");
      const output = join(cwd, `output-${completed.length}`);
      const summary = join(f.directory, "summary.md");
      const result = command(cwd, "bash", ["--noprofile", "--norc", "-eo", "pipefail", "-c", resolve(step.run)], {
        ...f.env, ...resolveEnv(job.env), ...resolveEnv(step.env), ...env,
        GITHUB_OUTPUT: output, GITHUB_STEP_SUMMARY: summary,
      });
      if (result.status !== 0) return { ...result, failedStep: step.name, completed };
      completed.push(step.name);
      if (step.id) context.steps[step.id] = { outputs: Object.fromEntries(read(output).trim().split("\n").filter(Boolean).map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index), line.slice(index + 1)];
      })) };
    }
    context.needs[jobId] = { outputs: resolveEnv(job.outputs) };
  }
  return { status: 0, context, completed, summary: read(join(f.directory, "summary.md")) };
}

const deployInputs = {
  version: "v0.1.10", migration_status: "no-migration",
  release_evidence: "https://github.com/fixture/release/issues/48#issuecomment-1",
};

// First slice: a failed quality gate must not consume an immutable version.
test("failed preflight never publishes the candidate tag", () => {
  const f = fixture();
  const result = rehearse(f, tagWorkflow, { version: "v0.1.10" }, { env: { REHEARSAL_FAIL: "pnpm build" } });
  assert.equal(result.status, 42);
  assert.equal(result.failedStep, "Build");
  assert.deepEqual(f.published(), ["v0.1.9"]);
});

// Authorization must be explicit: the UI default cannot attest no migrations.
test("deploy UI requires choosing a completed migration gate", () => {
  const input = deployWorkflow.on.workflow_dispatch.inputs.migration_status;
  const defaultChoice = input.default ?? input.options[0];
  const f = fixture();
  const result = rehearse(f, deployWorkflow, { ...deployInputs, version: "v0.1.9", migration_status: defaultChoice });
  assert.notEqual(result.status, 0);
  assert.equal(result.failedStep, "Resolve tag version");
  assert.deepEqual(f.observed(), []);
});

for (const version of ["v0.1.9", "v0.1.8", "v00.2.0", "v0.02.0", "v0.2.00", "0.2.0", "v0.2.0-rc.1", "v0.2.0+build", "v0.2.0\n", "v0.2.0\nforged=value"]) {
  test(`tag creation rejects ${JSON.stringify(version)} without publishing`, () => {
    const f = fixture();
    const result = rehearse(f, tagWorkflow, { version });
    assert.notEqual(result.status, 0);
    assert.equal(result.failedStep, "Validate candidate tag");
    assert.deepEqual(f.published(), ["v0.1.9"]);
    assert.deepEqual(f.observed(), []);
  });
}

test("main advancing during quality checks leaves the version available", () => {
  const f = fixture();
  const result = rehearse(f, tagWorkflow, { version: "v0.1.10" }, {
    beforeStep(step) {
      if (step.name === "Recheck latest main and version after preflight") {
        f.git(f.source, "commit", "--allow-empty", "-m", "Main advanced");
        f.git(f.source, "push", "origin", "main");
      }
    },
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /main advanced/);
  assert.deepEqual(f.published(), ["v0.1.9"]);
});

test("a competing tag publication during preflight cannot be overwritten", () => {
  const f = fixture();
  const result = rehearse(f, tagWorkflow, { version: "v0.1.10" }, {
    beforeStep(step) {
      if (step.name === "Recheck latest main and version after preflight") {
        f.git(f.source, "tag", "v0.1.10");
        f.git(f.source, "push", "origin", "refs/tags/v0.1.10");
      }
    },
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /already exists/);
  assert.ok(!result.completed.includes("Create and push tag"));
});

for (const inputs of [
  { migration_status: "" }, { migration_status: "not-done" }, { release_evidence: "" },
  { release_evidence: "https://github.com/fixture/release\ninjected" },
  { version: "v01.2.3" }, { version: "v1.2.3\nforged=value" },
]) {
  test(`deploy rejects incomplete or malformed authorization ${JSON.stringify(inputs)}`, () => {
    const f = fixture();
    const result = rehearse(f, deployWorkflow, { ...deployInputs, ...inputs });
    assert.notEqual(result.status, 0);
    assert.equal(result.failedStep, "Resolve tag version");
    assert.deepEqual(f.observed(), []);
  });
}

test("tag commit outside main stops deployment before production access", () => {
  const f = fixture();
  f.git(f.source, "switch", "-c", "unmerged");
  f.git(f.source, "commit", "--allow-empty", "-m", "Not merged");
  f.git(f.source, "tag", "v0.1.10");
  f.git(f.source, "push", "origin", "refs/tags/v0.1.10");
  const result = rehearse(f, deployWorkflow, deployInputs);
  assert.notEqual(result.status, 0);
  assert.equal(result.failedStep, "Verify release source");
  assert.deepEqual(f.observed(), []);
});

test("tag moved after preflight stops deployment before production access", () => {
  const f = fixture();
  const result = rehearse(f, deployWorkflow, { ...deployInputs, version: "v0.1.9" }, {
    beforeStep(step) {
      if (step.name === "Checkout verified tag commit") {
        f.git(f.source, "commit", "--allow-empty", "-m", "Moved tag");
        f.git(f.source, "tag", "--force", "v0.1.9");
        f.git(f.source, "push", "--force", "origin", "refs/tags/v0.1.9");
      }
    },
  });
  assert.notEqual(result.status, 0);
  assert.equal(result.failedStep, "Verify immutable tag before production operations");
  assert.ok(!f.observed().some((args) => args.includes("vercel") || args.includes("db:deploy")));
});

for (const migrationStatus of ["no-migration", "backup-complete"]) {
  test(`release rehearsal: independent tag and deploy dispatch with ${migrationStatus}`, () => {
    const f = fixture();
    const sourceCommit = f.git(f.source, "rev-parse", "HEAD");
    const created = rehearse(f, tagWorkflow, { version: "v0.1.10" });
    assert.equal(created.status, 0, created.stderr);
    assert.equal(f.git(f.remote, "rev-parse", "v0.1.10^{commit}"), sourceCommit);
    assert.equal(f.git(f.remote, "cat-file", "-t", "refs/tags/v0.1.10"), "tag");
    assert.equal(f.git(f.remote, "show", "v0.1.10:package.json"), '{"version":"0.1.9"}');
    assert.ok(!f.observed().some((args) => args.includes("vercel") || args.includes("db:deploy")));
    // Backup internals have their own regression suite. Here exercise the real
    // backup preflight against the newly created tag despite package mismatch.
    const backup = rehearse(f, { jobs: { preflight: backupWorkflow.jobs.preflight } }, { version: "v0.1.10" });
    assert.equal(backup.status, 0, backup.stderr);
    assert.equal(backup.context.needs.preflight.outputs.source_commit, sourceCommit);
    const deployed = rehearse(f, deployWorkflow, { ...deployInputs, migration_status: migrationStatus });
    assert.equal(deployed.status, 0, deployed.stderr);
    assert.equal(deployed.context.needs.preflight.outputs.source_commit, sourceCommit);
    assert.match(deployed.summary, new RegExp(sourceCommit));
    assert.ok(deployed.summary.includes(`Migration decision: ${migrationStatus}`));
    assert.ok(deployed.summary.includes(deployInputs.release_evidence));
    const production = f.observed().filter((args) => args.includes("vercel") || args.includes("db:deploy") || args[0] === "curl");
    assert.deepEqual(production.slice(0, 4).map((args) => args.slice(0, 4)), [
      ["corepack", "pnpm", "vercel", "pull"], ["corepack", "pnpm", "vercel", "build"],
      ["corepack", "pnpm", "db:deploy"], ["corepack", "pnpm", "vercel", "deploy"],
    ]);
    assert.equal(production.filter((args) => args[0] === "curl").length, 3);
    assert.deepEqual(f.published(), ["v0.1.10", "v0.1.9"]);
  });
}

for (const failure of ["pnpm vercel build", "pnpm db:deploy"]) {
  test(`${failure} failure prevents Vercel deployment`, () => {
    const f = fixture();
    const result = rehearse(f, deployWorkflow, { ...deployInputs, version: "v0.1.9" }, { env: { REHEARSAL_FAIL: failure } });
    assert.equal(result.status, 42);
    assert.ok(!f.observed().some((args) => args.includes("--prebuilt")));
  });
}

test("automated smoke rejects an unprotected cron endpoint", () => {
  const f = fixture();
  const result = rehearse(f, deployWorkflow, { ...deployInputs, version: "v0.1.9" }, { env: { REHEARSAL_CRON_STATUS: "200" } });
  assert.notEqual(result.status, 0);
  assert.equal(result.failedStep, "Smoke production deployment");
  assert.match(result.stderr, /Expected cron invalid-token smoke to return HTTP 401/);
});

test("only manual dispatch can create a tag or deploy production", () => {
  assert.deepEqual(Object.keys(tagWorkflow.on), ["workflow_dispatch"]);
  assert.deepEqual(Object.keys(deployWorkflow.on), ["workflow_dispatch"]);
  assert.equal(deployWorkflow.concurrency.group, "production-deploy");
  assert.equal(deployWorkflow.concurrency["cancel-in-progress"], false);
});
