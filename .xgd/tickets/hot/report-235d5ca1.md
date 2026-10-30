---
uid: report-235d5ca1
id: REPORT-4490
type: report
title: 'Resync resolve conflicts: 18ffaec45665d29545db8bfd323ee4bf6d1f8678'
created_by: xgd
created_at: '2026-09-20T19:05:28.532846+00:00'
updated_at: '2026-09-20T19:05:28.532846+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/request-554ac441.md` — **UU**, intent/bookkeeping ticket (rule 2e). Outside the sparse-checkout cone, so resolved with `git checkout --ours --` followed by `git add --sparse --`.

  Incoming pick: `a74ac03993024fbbffb13bf95ca29a0605894043` (`xgd(ticket): update request request-554ac441`, committed 2026-08-22). Both sides are same-subject xgd ticket auto-commits, so the enrichment's "more recent by timestamp" rule applies — but it only had to decide five scalars, because on content HEAD is a strict superset.

  Diffing theirs against ours (`git diff <stage3> <stage2>`) shows the ONLY lines present on the incoming side and absent from ours are five frontmatter scalars, each superseded by a later HEAD value:

  | fact | incoming (`2026-08-23T03:24:38Z`) | ours (`2026-08-31T14:22:34Z`) |
  |---|---|---|
  | `updated_at` | `2026-08-23T03:24:38…` | `2026-08-31T14:22:34…` |
  | `completed_at` | `null` | `2026-08-31T14:22:34…` |
  | `last_field_updated` | `body` | `status` |
  | `status` | `free_coded` | `free_and_reconciled` |
  | `fields.version` | `0.2.7` | `0.2.9` |

  Ours additionally carries `working_sha_history` on two commit entries, two further commit entries (`ec144c85…`, `02bd4437…`), `bundled_in: bundle-b3b7c399`, `chat_comment: comment-98e86f10`, and a second body section (`## Follow-up: the deploy secret guard asked the wrong question`) that the incoming side does not have. Taking incoming would have regressed the lifecycle state, cleared `completed_at`, rolled the version backwards, and dropped all of that.

  No code, spec-ticket, UAT, or config files were in conflict for this pick.

## Incoming changes preserved

No code files were involved, so STEP 3's `git show $CPHEAD -- <file>` verification applies to the one ticket file.

The incoming commit's substantive change was a **body addition** (`last_field_updated: body`): a new 50-line section, `## Follow-up: \`bin/build\` failed on a type-only reach into node`, covering the `apps/control-app` typecheck failure, the type-only `LoadedSite` re-export through `node:path`, why REQ-146's runtime-only import guard missed it, new acceptance criterion 12, and the version-bookkeeping note.

That section is **present verbatim** in the resolved, staged file — confirmed by reading the staged blob (`git show :<path>`):

- line 405 — `## Follow-up: \`bin/build\` failed on a type-only reach into node`
- line 442 — `12. No module reachable from a Worker entrypoint imports a node-only module,`
- line 451 — `changes. Ticket version is now 0.2.7.`

HEAD had already absorbed this body text through a later commit on the main-rooted line and then appended a further follow-up on top of it. Nothing authored by the developer on the incoming side was discarded; only the five stale frontmatter scalars above were not taken, each because HEAD holds a strictly later value for the same fact.

The BUG-1301 precedence exception was not needed and is not invoked — nothing was deleted, and no test function was touched.

Note for the finalize step: the staged resolution is byte-identical to HEAD (`git diff --cached` empty), so this pick will land empty. `CHERRY_PICK_HEAD` (`a74ac039…`) was left intact; no `--continue`/`--skip`/`--quit`/`--abort` was issued.
