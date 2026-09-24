import { execFileSync } from "node:child_process";
import fs from "node:fs";

const tag = process.env.INPUT_VERSION;
const match = /^v(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/.exec(tag ?? "");

if (!match || match[0] !== tag) {
  console.error(`Release tag must be strict vX.Y.Z, received: ${tag}`);
  process.exit(1);
}

const tags = execFileSync("git", ["tag", "--list"], { encoding: "utf8" })
  .split("\n")
  .filter((value) => /^v(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/.test(value));

if (tags.includes(tag)) {
  console.error(`Release tag already exists: ${tag}`);
  process.exit(1);
}

const parse = (value) => value
  .slice(1)
  .split(".")
  .map((part) => BigInt(part));

const compare = (left, right) => {
  for (let index = 0; index < 3; index += 1) {
    if (left[index] !== right[index]) {
      return left[index] > right[index] ? 1 : -1;
    }
  }

  return 0;
};

const current = parse(tag);
const latest = tags
  .map((value) => ({ value, parts: parse(value) }))
  .sort((left, right) => compare(right.parts, left.parts))[0];

if (latest && compare(current, latest.parts) <= 0) {
  console.error(`Release tag ${tag} must be greater than latest tag ${latest.value}.`);
  process.exit(1);
}

fs.appendFileSync(process.env.GITHUB_OUTPUT, `tag=${tag}\n`);
