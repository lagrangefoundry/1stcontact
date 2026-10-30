---
uid: report-856de587
id: REPORT-5248
type: report
title: 'Resync resolve conflicts: b6b7f564f0bf1ee0904f0b6aa25ee3ca053055f0'
created_by: xgd
created_at: '2026-09-28T01:51:11.753587+00:00'
updated_at: '2026-09-28T01:51:11.753587+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/request-b474390f.md` — **UU**, intent/bookkeeping ticket
  (`request-*`, STEP 2 rule **2e**). Resolved by taking the **HEAD** side of the
  single conflicting fact. Staged with `git add --sparse` (`.xgd/tickets/` is
  outside the sparse-checkout cone on resync branches, DOC-986 §2/§4.1).

### Why HEAD won this fact

A stage-2 vs stage-3 diff shows the **only** divergence between the two sides is
the status-lifecycle triple — body text, `fields`, and the entire `commits` list
are byte-identical:

| field | ours (HEAD) | theirs (incoming `b8b49733ed`) |
|---|---|---|
| `status` | `free_and_reconciled` | `bundled` |
| `updated_at` | `2026-08-31T14:22:40` | `2026-08-24T02:10:41` |
| `completed_at` | `2026-08-31T14:22:40` | `null` |

That is a single fact (lifecycle position) changed on both sides, so 2e's
per-fact **later-positioned-intent** rule applies:

- `xgd working-timeline` has no input here — it tie-breaks between two *distinct*
  UIDs, and both sides are the same `request-b474390f`. Fell back to commit
  timestamp, as with bundle tickets.
- HEAD-side commit `811a0911` is `Mon Aug 31 07:22:40 2026` (== HEAD's
  `updated_at`); incoming `b8b49733ed` is `Sun Aug 23 19:10:41 2026` (==
  incoming's `updated_at`). HEAD is **7 days later**.
- Lifecycle direction confirms the same ordering: `free_and_reconciled` is the
  terminal state written by `merge_back/success.py` on a successful reconcile,
  strictly downstream of `bundled`.
- Neither commit carries a free-text `--commit-message` body, so there is no
  structural-vs-content distinction to compose — both sides are plain status
  advances on the same field.

Taking the incoming side would have **regressed** the ticket from
`free_and_reconciled` back to `bundled` and nulled out `completed_at` — losing
the recorded completion. Resolution is therefore HEAD, per fact, not per file.

## Incoming changes preserved

No code/implementation files were in conflict, so STEP 3's
incoming-code-preservation check has no code targets.

For the one conflicted file, the incoming values (`status: bundled`,
`completed_at: null`, `updated_at: 2026-08-24`) are **deliberately not** carried
into the result. This is not discarded developer work and is not the BUG-1301
precedence exception: it is 2e's prescribed outcome for a genuine same-fact
conflict where the other side holds the later intent. Every non-status byte of
the incoming version is already present verbatim in the resolved file (the
stage-2/stage-3 diff is limited to the three frontmatter lines above), so no
incoming content of any other kind was dropped.

No UAT test functions were touched or deleted.

## Post-resolution state

- `git ls-files -u` — empty (no unmerged entries).
- `git status --porcelain` — empty.
- `git diff --cached HEAD` — empty: the resolution equals HEAD, so this
  cherry-pick has no net effect. Left for the finalize step to skip per
  instructions; `--skip`/`--continue`/`--quit`/`--abort` were **not** invoked.
- `CHERRY_PICK_HEAD` still present at `b8b49733eded154b7668103677e7a8e59aeb12df`.
