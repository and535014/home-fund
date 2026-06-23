---
id: learning-admin-created-member-google-binding
stage: learning
status: approved
workflow_version: ddd-website-lifecycle-v2
delivery_profile: mvp
release_target: local_dev
inputs:
  - .ai/intent/admin-created-member-google-binding.md
  - .ai/domain-impact/admin-created-member-google-binding.md
  - .ai/spec/admin-created-member-google-binding.md
  - .ai/verification/admin-created-member-google-binding.md
  - .ai/release/admin-created-member-google-binding-local-dev-readiness.md
  - .ai/project-context.md
outputs:
  - learning_questions
  - local_dev_feedback_plan
  - metrics_and_signals
  - follow_up_decision_criteria
trace_links:
  release:
    - .ai/release/admin-created-member-google-binding-local-dev-readiness.md
  verification:
    - .ai/verification/admin-created-member-google-binding.md
  domain_events:
    - Member created
    - Member binding link generated
    - Member Google account bound
reviewed_at: 2026-06-23
---

# Admin-Created Member Google Binding Learning Loop

## Decision Summary

- decision: approve
- release_target: local_dev
- tracking_maturity: manual/local only
- analytics_provider: not configured
- error_monitoring_provider: not configured
- next_gate: Artifact Compression

## Learning Questions

| Question | Linked Intent / Domain Outcome | Signal |
|---|---|---|
| Do admins understand that members are created before Google binding? | Admin-created membership replaces generic invite-created membership. | Manual local review: admin can explain `未綁定`, `待綁定`, `已綁定` after using `/settings/members`. |
| Can admins complete create-member to generate-link without confusion? | BDD: Admin creates an unbound member; Admin generates a binding link. | Manual smoke completion and no observed validation confusion around display name or role. |
| Is re-copying an active link useful and understandable? | Domain event: Member binding link generated; policy: active pending links are reused. | Reviewer notes whether reopening the modal and copying an existing link matches expectation. |
| Do expired-link and invalid-link states guide the recipient safely? | BDD: expired/missing/invalid links expose no household data. | Manual smoke and E2E continue to show `綁定連結無法使用` without household data. |
| Does binding preserve app-owned member data? | Policy: app-owned display name and role remain authoritative. | Manual review after binding: display name/role unchanged, status becomes bound, binding action disappears. |
| Are local setup steps clear enough after adding token encryption? | Release risk: new `MEMBER_BINDING_TOKEN_ENCRYPTION_KEY` env is required. | Reviewer can set up `.env`, run migrations/seeds, and generate/re-copy links without configuration errors. |

## Local Dev Feedback Plan

- Reviewer: household admin workflow reviewer.
- Cadence: one local review session after pulling the commit and applying migrations.
- Review path:
  - Start local DB and app.
  - Sign in as seeded admin.
  - Create one unbound member.
  - Generate and copy a binding link.
  - Reopen the same member's binding modal and copy the active link again.
  - Open missing, invalid, expired, and active binding links in a signed-out browser profile.
  - Optionally complete real Google OAuth binding if local OAuth credentials are available.
- Capture:
  - Notes on confusing labels, button names, and status copy.
  - Any setup errors involving `MEMBER_BINDING_TOKEN_ENCRYPTION_KEY`.
  - Any server console errors or unexpected redirects.
  - Whether admins expect delete/disable/revoke before binding.

## Metrics And Signals

Because no analytics provider is configured for this local_dev target, signals are manual or test-backed:

| Signal | Source | Threshold / Decision Use |
|---|---|---|
| Member creation success | Manual smoke, E2E `admin creates an unbound member then generates a binding link` | Must pass before considering preview intent. |
| Binding-link generation/re-copy success | Manual smoke, E2E `admin manages created member binding links` | Any confusion or copy failure becomes a UX follow-up. |
| Invalid/expired/used token safety | E2E `public binding links validate token states` | Must continue to block Google sign-in for invalid states. |
| Permission guard health | Full E2E permission/auth tests | Any non-admin access leak is blocking for release beyond local_dev. |
| Encryption config friction | Manual setup notes, server action error toast | Repeated config errors should trigger README/setup improvement. |
| Real OAuth binding confidence | Optional manual smoke | Required before preview/staging; not required for current local_dev readiness. |

## Follow-Up Decision Criteria

Start a new Intent Intake if local review shows any of these:

- Admins need to revoke active binding links before expiry.
- Admins need to delete or disable unbound members before binding.
- The `未綁定` / `待綁定` / `已失效` labels are confusing.
- Recipients need more context on `/members/bind` before Google sign-in.
- Real Google OAuth binding exposes callback, account-selection, or wrong-account copy gaps.
- Production or preview release becomes the next target; that requires target-specific readiness, monitoring, secrets, rollback, and real OAuth smoke.

No new intent is needed if local review confirms:

- Admins can create, link, re-copy, and regenerate without support.
- Invalid and expired links are understandable.
- Local setup works with the documented encryption key.
- Existing tests remain green after review fixes, if any.

## Guardrails

- Do not infer production readiness from this learning loop.
- Do not add analytics tooling only for this local_dev slice.
- Do not store raw binding tokens in notes, screenshots, or issue text.
- Redact real Google emails when documenting manual smoke.

## Review Gate

- decision: approve
- unresolved_blockers:
  - None for artifact compression.
- recommended_next_skill: artifact-compression
- next_step:
  - Compress this completed lifecycle slice into an archive summary, then stop before any prune/delete work.
