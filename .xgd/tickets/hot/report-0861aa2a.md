---
uid: report-0861aa2a
id: REPORT-5321
type: report
title: 'Resync resolve conflicts: b6b7f564f0bf1ee0904f0b6aa25ee3ca053055f0'
created_by: xgd
created_at: '2026-09-28T07:41:02.023988+00:00'
updated_at: '2026-09-28T07:41:02.023988+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/request-13a5e206.md` — **AA (both added)**, resolved under
  **§2b** (incoming/ours wins where one side is a strict superset), corroborated
  by **§2e** (intent/bookkeeping ticket, `request-*`; keep the superset) and by
  the enrichment's timestamp rule.

  The path is outside the sparse-checkout cone (`git sparse-checkout list`
  shows `!/.xgd/tickets/` and `!/.xgd/tickets/**`), so the conflict existed only
  in the index with no working-tree markers. Resolved per STEP 4's DOC-986 note:
  `git checkout --ours -- <path>` then `git add --sparse -- <path>`, each as the
  sole content of its own call.

  **Why ours:** the incoming side (`c2c4b393c8`, *"xgd(ticket): create request
  request-13a5e206"*) is the ticket's creation state — 105 lines,
  `status: draft`, `updated_at == created_at`
  (`2026-08-31T20:32:40.203324+00:00`), `last_field_updated: created_at`,
  `completed_at: null`, and no `version`/`commits`/`orphan_commits` fields. The
  ours side is the fully-evolved ticket — 835 lines,
  `status: free_and_reconciled`, `version: 0.2.20`, `completed_at` set,
  `updated_at: 2026-09-02T01:34:36.152341+00:00`, with populated `commits`
  (`main_sha: 4b43dd9a5c`) and a 300+ entry `orphan_commits` list. Taking
  incoming would regress the ticket to `draft` and drop the version and commit
  records.

  Per [[incoming-create-side-is-a-stub]] I tested the frontmatter rather than
  trusting the `create` subject alone, and per [[overlay-advances-past-incoming-status]]
  confirmed the status regression an incoming-wins resolution would cause.

## Incoming changes preserved

No code/implementation files were in conflict — the single conflicted path is a
`request-*` intent ticket. §2e's composition check was still performed rather
than assumed: I extracted both blobs and diffed line-membership
(`grep -Fxv -f ours theirs`) to find every line present on the incoming side and
absent from ours. All 14 such lines are superseded, not lost:

- `updated_at`, `completed_at: null`, `last_field_updated: created_at`,
  `status: draft` — creation-state frontmatter, deliberately not carried back.
- `**1. The schema.**` / `**3. The TypePack**` paragraph lines — present in ours
  with different line wrapping and renumbering: ours inserts a new
  `**3. The blob store, in its own bucket.**` section and shifts TypePack to
  `**4.**`. Content retained.
- `- A ticket created through the Worker is readable back through it.` — present
  verbatim in ours' `## Acceptance` section, extended with the
  `.workers.test.ts` assertion and the "No HTTP routes" rationale.
- `## Open questions` plus its two bullets (`reference` as its own type; `brief`
  as a type vs. well-known ticket) — ours replaces the section with
  `## Both open questions are now settled`, resolving both questions in the same
  direction the incoming body proposed.

Ours additionally carries sections the creation state never had:
`## Prerequisite: refresh the installed component`,
`## Implementation notes carried from review`, and
`## What landed (free-coded, 2026-08-31)`.

No hunk was dropped under the BUG-1301 precedence exception, and no test
function on either side was deleted — §2f was not engaged.

## State left for the next step

`CHERRY_PICK_HEAD` is intact at `c2c4b393c8b261890100344e9f9679f5b90ada7a`.
`git ls-files -u` is empty; the path is staged at stage 0 as blob
`e909dcbb97209588efd021442f7dcabf0e18405c` (the ours blob verbatim).
No `cherry-pick --continue/--skip/--quit/--abort` was run.
