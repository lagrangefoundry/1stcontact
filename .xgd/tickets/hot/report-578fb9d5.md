---
uid: report-578fb9d5
id: REPORT-3044
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-22'
created_by: xgd
created_at: '2026-08-31T20:02:20.092259+00:00'
updated_at: '2026-08-31T20:02:20.092259+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-22
---

## Files resolved

- `.xgd/tickets/hot/request-7ae3c2cc.md` — **AA** (both added; no stage-1 base).
  Class 2e (intent/bookkeeping ticket, `request-*`), resolved per-fact. Path is
  outside the sparse-checkout cone, so staged with `git add --sparse` per
  DOC-986 §2/§4.1.

Incoming commit: `773e1698198c4066bd2dfad635bb963bde641a6b`
(`xgd(ticket): update request request-7ae3c2cc`, 2026-08-23 12:43:59 -0700).
It touches exactly one file — this ticket — and carries no code.

HEAD-side commit: `ce11ecb0c4d298ea9afcd663e3beb6660d9ad819`
(`xgd(ticket): seed_local_overlay request request-7ae3c2cc`, 2026-08-30 22:06:21 -0700).

### Delta between the two sides

The document bodies are **byte-identical**. The entire conflict is four
frontmatter facts. Per the auto-enrichment rule (intent unknown on one or both
sides -> take the more recent commit by timestamp), and per 2e's per-fact
superset test, every fact resolves to HEAD:

| Fact | Ours (HEAD) | Theirs (incoming) | Resolution |
|---|---|---|---|
| `updated_at` | 2026-08-24T02:10:41 | 2026-08-20T00:47:43 | ours — later |
| `status` | `bundled` | `ready_to_reconcile` | ours — later lifecycle state; reverting would un-bundle the ticket mid-reconcile |
| `fields.bundled_in` | `bundle-b3b7c399` | absent | ours — field theirs never had; bundling postdates the incoming commit |
| `fields.commits` | one entry (`a28d2f52`), history `[ade64575a, 055378794, a6e92ca26]` | two entries (`a28d2f52` + `055378794`) | ours — the post-merge-back collapse; **no SHA is lost** (see below) |

Both timestamp signals agree that ours is later: commit date (08-30 vs 08-23)
and ticket `updated_at` (08-24 vs 08-20).

Nothing was invented; the resolution is HEAD's blob verbatim
(`git checkout --ours`), so no content absent from either side was introduced,
and no `intent_uid`/`story_uid`/`capability_uid` field was touched.

## Incoming changes preserved

This is a ticket-only commit, so STEP 3's code-file check reduces to: is the
incoming commit's content present in the resolved file, or absent?

**Present — via a different route, i.e. redundant, not discarded.**

- The incoming commit adds the file whole (`new file mode`, 303 insertions).
  Its entire markdown body — §1–§6, the 2026-08-19 verification run, the
  failure-family correction, and the "Landed — free-coded" section — is
  byte-identical in HEAD's version. `git diff` between the two blobs shows
  changes confined to the frontmatter block; not one body line differs.
- The one fact that could have been lost is the second commit entry,
  `055378794f49f1dc39b20fdcf54aa7fa0b1190e3` (the merge into `xgd-working`
  carrying the 0.1.60 version bump). It **survives** in HEAD as an entry in
  `a28d2f52`'s `working_sha_history`. Both SHAs the incoming side tracked are
  therefore still recorded; ours restructures where they sit, it does not drop
  them.
- HEAD additionally carries `status: bundled` and `bundled_in`, which the
  incoming side predates. So HEAD is a strict information superset of the
  incoming blob.

No BUG-1301 precedence exception was invoked — no hunk was dropped, and no test
function on either side was deleted.

### Net staged diff

`git diff --cached HEAD` is **empty**: the resolution equals HEAD. This is the
BUG-1109/BUG-1122 shape — the incoming ticket update's effect already landed in
HEAD through the later `seed_local_overlay` commit, which carried the same body
plus the subsequent bundling bookkeeping. Per STEP 4 this is not a `--skip`
trigger for me and not a failure; the file is staged and
`cherry_pick_finalize_resolution` will detect the clean staged diff. STEP 3
distinguishes this from a discard, and it lands on "redundant": the incoming
commit's key content is verifiably present in HEAD, not merely absent.

### Post-merge review flag

Per the enrichment rule's "flag this file for post-merge review": the incoming
side's two-entry `fields.commits` structure was collapsed into one entry plus
history on the HEAD side. Both SHAs are retained, but if reconcile needs to map
`055378794` to its own `reconcile_sha`/`main_sha` slot, that slot no longer
exists as a separate entry. Worth a glance during bundle finalization.

### State left for the next step

- No conflict classes remain (`git status --porcelain` shows no UU/AA/DU/UD/AU/UA).
- No conflict markers in the file (grep count 0).
- `CHERRY_PICK_HEAD` still resolves to `773e1698...` — the cherry-pick sequencer
  state is intact. No `--continue`/`--skip`/`--quit`/`--abort`/`reset` was run.
