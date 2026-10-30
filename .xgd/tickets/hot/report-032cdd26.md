---
uid: report-032cdd26
id: REPORT-5326
type: report
title: 'Resync resolve conflicts: b6b7f564f0bf1ee0904f0b6aa25ee3ca053055f0'
created_by: xgd
created_at: '2026-09-28T07:54:48.629471+00:00'
updated_at: '2026-09-28T07:54:48.629471+00:00'
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

Incoming pick is `76cd837f38` (2026-08-31 14:18:30 -0700).

**Stages:** base `9bff7c4d1c`, ours `e909dcbb97` (HEAD), theirs `0a0077e29e`.

### ⚠️ This pick's commit message outruns its diff

`76cd837f38`'s `--commit-message` reads:

> content edit: **correct the prerequisite** — REQ-104 is on xgd-working; only the
> shared artifact store is stale, so bin/install is the whole fix

That is the *same message* carried by `1e28c676bf` (14:18:42), its **direct child**
(`git rev-list --count 76cd837f38..1e28c676bf` = **1**). The content edit arrives as
a pair: this commit announces it, the next one delivers it.

Evidence the delivery is not in this commit:

- `git show 76cd837f38 --stat` = **3 insertions, 3 deletions** — frontmatter only
  (`updated_at`, `last_field_updated: status` → `body`). No body text changes.
- This commit's post-image blob is `0a0077e29e`, which is exactly `1e28c676bf`'s
  **pre-image** (`index 0a0077e29e..eb6694f0ac` in that commit's diff).
- Theirs (`0a0077e29e`) still contains the full, uncorrected
  `## Prerequisite: the installed component predates REQ-104` section.

This matters for resolution safety: a resolver trusting the commit message alone
would conclude "the correction is in this pick, so take theirs" — and would
thereby restore the very text the message claims to be correcting.

### Theirs-only content over ours, enumerated

`git diff <ours> <theirs>` adds exactly two groups:

1. **Frontmatter** — `status: free_coding`, `completed_at: null`,
   `last_field_updated: body`, `updated_at: 2026-08-31T21:18:30`. Ours is
   `free_and_reconciled`, completed `2026-09-02T01:34:00Z`, `result: pass` —
   downstream in the lifecycle and two days later.
2. **The uncorrected `## Prerequisite: the installed component predates REQ-104`
   section** — the `bin/install` / `COMPONENTS = REPO / "components"` analysis, the
   main / xgd-working / resync-577be0d7 table, the stranded commit `a60537ee3c`,
   the "land REQ-104/107/108 on xgd-working first" instruction, and the BUG-1303
   warning.

Nothing else.

### Why the prerequisite section is correctly dropped

- Introduced by `6caee0c5d1` (14:12:57); **removed by `1e28c676bf`** (14:18:42),
  which replaces it with `## Prerequisite: refresh the installed component`.
- `1e28c676bf` is this pick's direct child, so the retraction is unambiguously
  downstream of it.
- HEAD already carries the corrected section (introduced on HEAD's line by
  `8b5aa7c1ec`, `seed_local_overlay`, 2026-08-31 17:01:32).

Restoring theirs would resurrect prose its own author retracted 12 seconds later,
and would assert `attachments.js` is absent from `xgd-working` — a claim the
author withdrew and which ours' completion record (15 workerd UATs green against
real D1 and both real R2 buckets) contradicts.

## Incoming changes preserved

Not a code file, so STEP 3's `git show` check is applied to the ticket content
directly.

This commit contributes **no body content** — its entire delta over its base is a
frontmatter bookkeeping update. Ours sits at `free_and_reconciled`, downstream of
theirs' `free_coding`, so the incoming state is subsumed rather than discarded.

The one body section theirs carries that ours lacks is the retracted prerequisite
block, documented above. The correction it is missing is precisely what ours
already holds, so resolving to ours realises this commit's *stated* intent more
faithfully than taking its diff would.

No hunk was dropped under the BUG-1301 precedence exception. No UAT test files
were involved, so 2f did not apply.

## Outcome

`git checkout --ours` + `git add --sparse` (each issued as the sole content of its
own call, per BUG-1294). `git ls-files -u` and `git status --porcelain` are both
empty: no conflict-class entries remain, and the staged tree is byte-identical to
HEAD, so this pick is empty. Per the instructions I did **not** call `--skip`;
finalize detects the clean staged diff. `CHERRY_PICK_HEAD` remains
`76cd837f383bddc490cb33eba89fa98ccfb6769f`.

**Note for the orchestrator:** fifth consecutive empty resolution against
`request-13a5e206` (attempts 111–115: `00a976b04e`, `e53d8f39fd`, `6caee0c5d1`,
`8b6541d4b1`, `76cd837f38`). All five predate `1e28c676bf` (14:18:42), whose
result HEAD already holds via the `8b5aa7c1ec` overlay. `1e28c676bf` is now the
direct child of this pick, so the cluster should be exhausted imminently — the
next pick is either `1e28c676bf` itself (which will also be empty, since HEAD
holds its output) or the first commit past it.
