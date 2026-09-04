---
uid: report-afac3e82
id: REPORT-3431
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-23'
created_by: xgd
created_at: '2026-09-04T00:43:59.628489+00:00'
updated_at: '2026-09-04T00:43:59.628489+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-23
---

## Files resolved

- `.xgd/tickets/hot/request-78370159.md` — **UU**, intent/bookkeeping ticket
  (`request-*`), rule **2e**, resolved **per-fact**. Out of the sparse-checkout
  cone (DOC-986 §2/§4.1): conflict existed only in the index, no working-tree
  markers, so `git checkout --ours` + `git add --sparse` were used.

Incoming commit: `8420f4d3` *"xgd(ticket): update request request-78370159"*
(2026-08-31 17:22 -0700, free_coded).
HEAD-side commit: `9b278972` *"xgd(ticket): seed_local_overlay request
request-78370159"* (2026-09-02 10:50 -0700).

`xgd ticket history` could not run for the timeline lookup — the ticket has no
working-tree file while the conflict is index-only, so the CLI reports
"Ticket not found". The auto-enrichment for this file already recorded intent as
unknown on one or both sides and prescribed the commit-timestamp rule, which is
what was applied; it is corroborated by HEAD's own frontmatter naming this run's
intent (`bundled_in: bundle-203b1dc2`). This is not the "both `updated_by`
lookups errored" @fail case — the ordering was resolvable from committed state.

### Per-fact table (base `15b0507d` → theirs `e12e7b16` / ours `ae3cea16`)

| Fact | Base | Theirs (incoming, Aug 31) | Ours (HEAD, Sep 2) | Resolution |
|---|---|---|---|---|
| `status` | `draft` | `free_coding` | `bundled` | **ours** — same field changed on both sides; later-positioned intent wins per-fact |
| `updated_at` | Aug 31 22:57 | Sep 01 00:22 | Sep 02 17:48 | **ours** — later |
| `last_field_updated` | `body` | `status` | `status` | identical on both sides |
| EOF trailing newline | present | removed | removed | identical on both sides |
| `story_points` | 8 | untouched | 13 | **ours-only**, kept |
| `commits`, `version`, `bundled_in` | absent | untouched | added | **ours-only**, kept |
| body prose | base | untouched (no content change) | rewritten | **ours-only**, kept |

The only genuinely competing facts were `status` and `updated_at`. Every other
change is on exactly one side, so nothing was dropped in composition. The
composed result is byte-identical to the ours blob (`ae3cea168e`) because ours is
a strict lifecycle superset — this was reached by per-fact composition, not by
picking a winner's whole file (BUG-1030).

## Incoming changes preserved

No code/implementation files were in this conflict; the single file is a
bookkeeping ticket. Accounting for all four hunks of the incoming diff:

- `last_field_updated: body → status` — **present** in the resolved file
  (`last_field_updated: status`).
- EOF trailing-newline removal — **present**; the resolved blob ends
  `...to keep asking.` with no trailing newline (verified by hexdump).
- `status: draft → free_coding` — **superseded, not discarded.** HEAD carries
  `status: bundled`, the downstream lifecycle state, and records this ticket's
  two free_coded working commits (`855dd57a`, `482a1f98`) plus
  `bundled_in: bundle-203b1dc2` — i.e. HEAD already holds the result of the
  free-coding pass the incoming commit was opening, arrived at by a later route.
- `updated_at` bump — **superseded** by HEAD's later timestamp, per the same rule.

STEP 3 distinction (per STEP 4's note on BUG-1109/BUG-1122): the staged tree has
no net diff against HEAD. This is the *redundant* case, not the *discarded* case
— the incoming commit's intent is present in HEAD via the later
`seed_local_overlay` state, rather than simply absent. Staged and left for
`cherry_pick_finalize_resolution` to skip; no `--skip`/`--continue` was issued
here.

No BUG-1301 precedence exception was invoked; no test functions were involved.

## Post-merge review flag

Per the enrichment rule for unknown-intent sides, flagging for post-merge review:
if the free_coding status transition in `8420f4d3` needs to be visible in the
ticket's own audit trail (as distinct from the `commits` list HEAD already
carries), it will have to be re-recorded — this resolution keeps only the
terminal `bundled` state.

## Verification

- `git ls-files -u` → 0 unmerged entries.
- Staged: `100644 ae3cea168ee3bc57c45f9812b2799151b9a6f4a8 0 .xgd/tickets/hot/request-78370159.md`.
- `CHERRY_PICK_HEAD` still present at `8420f4d3f4ae9d068fed87bf053a716722259977`.
