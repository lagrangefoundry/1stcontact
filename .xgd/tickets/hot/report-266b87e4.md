---
uid: report-266b87e4
id: REPORT-3434
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-23'
created_by: xgd
created_at: '2026-09-04T00:49:54.274593+00:00'
updated_at: '2026-09-04T00:49:54.274593+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-23
---

## Files resolved

- `.xgd/tickets/hot/request-78370159.md` — **UU**, index-only (outside the sparse-checkout cone, no working-tree markers; resolved with `git checkout --ours` + `git add --sparse`). Class **2e — intent/bookkeeping ticket** (`request-*`). Rule applied: **one side is a strict superset — keep the superset**, which here is HEAD.

Incoming commit: `d3a61cf5196b3a516ddec7f8fdba1a582fae73b2` — *xgd(ticket): update request request-78370159* (free_coded, 2026-08-31 17:42 -0700). HEAD side: *xgd(ticket): seed_local_overlay request request-78370159*, `updated_at 2026-09-02T17:48:27Z`.

## Incoming changes preserved

Direct three-way comparison (base `e12e7b16`, ours `ae3cea16`, theirs `47e06251`) shows **every body hunk the incoming commit authored is already present in HEAD verbatim** — the rights-record read-only paragraph, "one overlay instance, two watchers", the whole "The role is a new field…" section, the chat-turn/delta refinements, "Put it on the site means the bytes are on the site", "The origin contract this tab reads", "Fixed on the way: blob reads addressed by the wrong key", "Existing acceptance criteria this supersedes", the rewritten Depends-on / Out-of-scope / Acceptance lists, and "Open questions — resolved". A post-watermark sync had already landed this ticket body on the bundle branch, so the cherry-pick is redundant rather than discarded.

Per-fact resolution of the only two places the sides differ:

- **Frontmatter (bookkeeping)** — HEAD carries the later operator state: `status: bundled` (vs incoming's older `free_coding`), `story_points: 13` (vs 8), plus `commits` (working_sha `855dd57a…`, `482a1f98…`), `version: 0.2.26`, `bundled_in: bundle-203b1dc2`, and `updated_at 2026-09-02` vs incoming's `2026-09-01`. Taking the incoming side here would have reverted this very bundle's own bookkeeping and dropped its commit records. HEAD is the strict superset and the later-positioned side; kept.
- **"Existing acceptance criteria this supersedes", third bullet** — the one paragraph where both sides wrote different text. Incoming says *"[[REQ-163]]'s blob-addressing criteria"*; HEAD says *"[[REQ-163]]'s and [[REQ-162]]'s blob-addressing criteria"* and adds that both suites were already failing, that `sha256` is now an integrity field rather than the address, and that the claims which mattered (private-bucket-only bytes; no cross-tenant addressing) remain asserted. HEAD's text **contains** the incoming claim and extends it to a second suite — a strict superset, written a day later. Kept; no incoming assertion is lost.

No hunk was dropped under the BUG-1301 precedence exception, and no test function was touched — the conflict is a single prose/bookkeeping ticket.

Result: staged at stage 0 with the HEAD blob. `git diff --cached HEAD` is empty, i.e. this commit's effect was already in HEAD (BUG-1109/BUG-1122 redundant-commit case). Per STEP 4 no `--skip` was issued; the cherry-pick sequencer state is left intact for `cherry_pick_finalize_resolution`.
