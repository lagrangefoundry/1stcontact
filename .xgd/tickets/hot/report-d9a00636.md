---
uid: report-d9a00636
id: REPORT-5324
type: report
title: 'Resync resolve conflicts: b6b7f564f0bf1ee0904f0b6aa25ee3ca053055f0'
created_by: xgd
created_at: '2026-09-28T07:51:16.013444+00:00'
updated_at: '2026-09-28T07:51:16.013444+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- **`.xgd/tickets/hot/request-13a5e206.md`** (REQ-162) — class **2e**, intent/bookkeeping
  ticket (`request-*`). Single `UU`. Rule applied: *"Same field/section changed differently
  on both: take the LATER-positioned intent, per fact."* Resolved to **ours (HEAD)**.

Incoming pick is `6caee0c5d1` (2026-08-31 14:12:57 -0700), whose `--commit-message`
reads: *"content edit: answer implementation review — REQ-104 stranded on a resync
branch, shared tenants registry needs an ALTER, wiring-layer enforcement, bucket name
and creation step, no HTTP routes; both open questions settled"*.

**Stages:** base `e795ee7ef4`, ours `e909dcbb97` (HEAD), theirs `03909332c4`.

### Theirs-only content, enumerated

`git diff <ours> <theirs>` yields exactly two groups of added lines:

1. Frontmatter regression — `updated_at: 2026-08-31T21:12:57`, `completed_at: null`,
   `last_field_updated: body`, `status: draft`. Ours is `free_and_reconciled`,
   completed `2026-09-02T01:34:00Z`, `result: pass`. Ours is later.
2. The whole `## Prerequisite: the installed component predates REQ-104` section —
   the `bin/install` / `COMPONENTS = REPO / "components"` analysis, the
   main / xgd-working / resync-577be0d7 table, the stranded commit `a60537ee3c`,
   the "land REQ-104/107/108 on xgd-working first" instruction, and the BUG-1303
   warning.

Nothing else. The five substantive claims the commit message advertises are
**already on ours** (see next section) — this pick's content contribution had
already reached HEAD by another path.

### Why the prerequisite section is correctly dropped

This is not HEAD outvoting the developer. It is the developer's own retraction,
made on the incoming branch itself:

- `git log -S 'predates REQ-104' --all` → introduced by `6caee0c5d1` (14:12:57),
  removed by `1e28c676bf` (14:18:42).
- `git log -S 'Prerequisite: refresh the installed component' --all` → introduced
  by that same `1e28c676bf`.
- `git rev-list --count 6caee0c5d1..1e28c676bf` = **8** — `1e28c676bf` is a
  descendant of the commit being picked, 5m45s later on the same line.
- `1e28c676bf`'s `--commit-message`: *"content edit: **correct the prerequisite** —
  REQ-104 is on xgd-working; only the shared artifact store is stale, so
  bin/install is the whole fix"*. Its diff replaces the `predates REQ-104` section
  with the `refresh the installed component` section verbatim.

HEAD already carries that corrected section (introduced on HEAD's line by
`8b5aa7c1ec`, `seed_local_overlay`, 2026-08-31 17:01:32). Restoring theirs would
resurrect prose its author explicitly labelled incorrect six minutes after
writing it, and would assert that `attachments.js` is absent from `xgd-working`
— a claim the author retracted and which the ticket's own completion record
contradicts.

Corroborating: ours' `## What landed (free-coded, 2026-08-31)` section documents
15 workerd UATs passing against real D1 and both real R2 buckets, so the
component was in fact installed successfully — the blocker theirs describes did
not hold.

## Incoming changes preserved

Not a code file, so STEP 3's `git show` check is applied to the ticket content
directly, against the five claims the pick's own commit message names. All five
are present in the resolved version (blob `e909dcbb97`):

| Claim from `6caee0c5d1`'s commit message | Present on ours |
| --- | --- |
| shared tenants registry needs an ALTER | L587 `**One shared 'tenants' registry, and it needs an ALTER.**`; L592 `ALTER TABLE tenants ADD COLUMN config` |
| wiring-layer enforcement | L639 `**Enforcement lives at our wiring layer, not the component's.**` |
| bucket name | L625 `**The bucket is '1stcontact-material'.**` |
| creation step | L634 `wrangler r2 bucket create 1stcontact-material`; restated L834 as an operator note |
| no HTTP routes | L706 `**No HTTP routes**: '/api/tickets/*' belongs to [[REQ-161]]` |
| both open questions settled | L710 `## Both open questions are now settled` |

The sixth clause of the message — "REQ-104 stranded on a resync branch" — is the
one the author retracted in `1e28c676bf`; its absence is intentional and
documented above.

No hunk was dropped under the BUG-1301 precedence exception. No UAT test files
were involved, so 2f did not apply.

## Outcome

`git checkout --ours` + `git add --sparse` (each issued as the sole content of its
own call, per BUG-1294). `git ls-files -u` and `git status --porcelain` are both
empty: no conflict-class entries remain, and the staged tree is byte-identical to
HEAD, so this pick is empty. Per the instructions I did **not** call `--skip`;
finalize detects the clean staged diff. `CHERRY_PICK_HEAD` remains
`6caee0c5d1323162b7f3d425e3161ddc27a29e93`.
