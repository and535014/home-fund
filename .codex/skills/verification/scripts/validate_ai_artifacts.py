#!/usr/bin/env python3
"""Validate basic .ai artifact frontmatter for the DDD harness."""

from pathlib import Path
import re
import sys

REQUIRED_KEYS = {
    "id",
    "stage",
    "status",
    "inputs",
    "outputs",
    "trace_links",
    "reviewed_at",
}

PROFILE_KEYS = {
    "delivery_profile",
    "release_target",
}

PROFILE_RECOMMENDED_STAGES = {
    "intent-intake",
    "domain-discovery",
    "domain-impact",
    "code-understanding",
    "impact-analysis",
    "project-foundation-architecture",
    "project-foundation-implementation",
    "experience-prototype",
    "behavior-spec",
    "feature-technical-design",
    "tdd-implementation",
    "verification",
    "target-aware-release",
    "release-execution",
    "learning-loop",
    "artifact-compression",
}


def parse_frontmatter(path: Path):
    text = path.read_text(encoding="utf-8")
    match = re.match(r"^---\n(.*?)\n---\n", text, re.DOTALL)
    if not match:
        return None
    keys = set()
    values = {}
    for line in match.group(1).splitlines():
        if line and not line.startswith((" ", "-")) and ":" in line:
            key, value = line.split(":", 1)
            key = key.strip()
            keys.add(key)
            values[key] = value.strip()
    return keys, values


def main() -> int:
    root = Path(sys.argv[1]) if len(sys.argv) > 1 else Path.cwd()
    ai_dir = root / ".ai"
    if not ai_dir.exists():
        print(f"No .ai directory found at {ai_dir}")
        return 1

    failures = []
    warnings = []
    for path in sorted(ai_dir.rglob("*.md")):
        parsed = parse_frontmatter(path)
        if parsed is None:
            failures.append(f"{path}: missing YAML frontmatter")
            continue
        keys, values = parsed
        missing = sorted(REQUIRED_KEYS - keys)
        if missing:
            failures.append(f"{path}: missing {', '.join(missing)}")
        stage = values.get("stage")
        if stage in PROFILE_RECOMMENDED_STAGES:
            missing_profile = sorted(PROFILE_KEYS - keys)
            if missing_profile:
                warnings.append(
                    f"{path}: recommended backfill {', '.join(missing_profile)}"
                )

    if failures:
        print("\n".join(failures))
        return 1
    if warnings:
        print("Warnings:")
        print("\n".join(warnings))
    print("All .ai markdown artifacts include required frontmatter keys.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
