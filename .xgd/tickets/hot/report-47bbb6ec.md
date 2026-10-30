---
uid: report-47bbb6ec
id: REPORT-5316
type: report
title: 'Resync resolve conflicts: b6b7f564f0bf1ee0904f0b6aa25ee3ca053055f0'
created_by: xgd
created_at: '2026-09-28T07:21:05.811728+00:00'
updated_at: '2026-09-28T07:21:05.811728+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/doc-8d51d90d.md` — class **AA** (both added), path outside the
  sparse-checkout cone (`.xgd/tickets/**` on a resync branch, DOC-986 §2/§4.1), so the
  conflict existed only in the index with no working-tree markers. Rule applied: **2b
  (both added)** plus the enrichment's fallback rule ("intent unknown on one or both
  sides — take the more recent by timestamp"). Resolved to **ours (HEAD)** wholesale via
  `git checkout --ours` + `git add --sparse`.

  Both sides are the same 171-line ticket; the bodies are **byte-identical**. The entire
  conflict is four frontmatter lines:

  | field | ours (HEAD) | incoming (`e6f718b3`) |
  |---|---|---|
  | `updated_at` | `2026-09-11T09:33:35` | `2026-08-31T19:43:20` |
  | `last_field_updated` | `doc_kind` | `system_kb` |
  | `fields.doc_kind` | `system_kb` | `architecture` |

  Ours is 11 days newer by the ticket's own `updated_at`, so the timestamp rule selects
  it. Because the bodies match exactly, taking ours whole is lossless — there is no
  incoming section, paragraph, or field that ours lacks.

## Incoming changes preserved

The incoming commit `e6f718b3` is *"xgd(ticket): update doc doc-8d51d90d — field: retire
system_kb boolean; membership moves to doc_kind (DOC-39 3.3)"*. Its intent is a schema
migration: drop the `system_kb` boolean and carry KB membership on `doc_kind` instead.

That intent **is present in the resolved file**:

- `grep system_kb` over the ours-side blob returns exactly one hit — `fields.doc_kind:
  system_kb`, i.e. the *value*, not a `system_kb:` boolean key. The retired boolean is
  absent from ours just as it is from the incoming side, so the migration has already
  landed on HEAD.
- Ours then goes one step *further* than the incoming side: it assigns this doc the
  migrated membership value (`doc_kind: system_kb`) on 2026-09-11, which is precisely the
  follow-through the incoming commit's message calls for. The incoming side still reads
  `doc_kind: architecture` only because that reassignment had not happened yet on 08-31.

Taking incoming here would have *regressed* the migration by reverting `doc_kind` to
`architecture`. No incoming hunk was dropped; no BUG-1301 precedence exception was needed.

## Post-merge review flag

Per the enrichment rule ("flag this file for post-merge review"): `DOC-31`
(`doc-8d51d90d`) resolved on the timestamp fallback because neither side's commit subject
carried a recognizable xgd intent tag. The resolution is low-risk — identical bodies, one
frontmatter field, monotonic direction — but the `fields.doc_kind` value is worth a
confirming glance if DOC-39 §3.3's enum is revisited.

## Staging state

`git ls-files -u` → 0 unmerged paths. `git status --porcelain` → empty; the staged blob
(`e9383411`) equals `HEAD:.xgd/tickets/hot/doc-8d51d90d.md`, so this pick will be empty
and the finalize step should skip the commit. `CHERRY_PICK_HEAD` is still live at
`e6f718b3891ba08d0f418c29000489376d9ad83e` — no `--continue`/`--skip`/`--quit`/`--abort`
was issued.
