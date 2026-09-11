---
uid: report-ec725944
id: REPORT-3836
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-26'
created_by: xgd
created_at: '2026-09-11T01:09:38.853287+00:00'
updated_at: '2026-09-11T01:09:38.853287+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-26
---

## Files resolved

- `.xgd/tickets/hot/request-13a5e206.md` — **UU**, intent/bookkeeping ticket
  (rule 2e, `request-*`). Resolved per-fact in favour of HEAD for all three
  conflict regions, because HEAD is a strict refinement/superset of the
  incoming side on every contested fact:

  1. **Frontmatter lifecycle block** (`updated_at` / `completed_at` /
     `last_field_updated` / `status`). Incoming: `status: draft`,
     `completed_at: null` (2026-08-31T20:42:52Z). HEAD:
     `status: free_and_reconciled`, `completed_at` set, `result: pass`
     (2026-09-02T01:34:36Z). Operator-owned lifecycle state that advanced
     well past the incoming snapshot — kept HEAD.

  2. **Body, "3. The blob store, in its own bucket"**. The incoming commit
     authored this section; HEAD already contains it in expanded form. The
     incoming's single closing paragraph ("Keys stay `t/<tenant>/blob/<sha256>`
     … a named environment inherits neither vars nor bindings") appears in HEAD
     verbatim plus an added clause (`vitest.workers.config.mts` so the UAT runs
     against real R2), and HEAD additionally names the bucket
     (`1stcontact-material`), records the pre-deploy
     `wrangler r2 bucket create` step, and adds the
     "enforcement lives at our wiring layer" paragraph. Kept HEAD.

  3. **Acceptance bullet on attachment ops**. Same fact stated differently on
     each side, so the timeline rule applies to that fact. Incoming
     (2026-08-31 13:42): "a store constructed without a `BlobStore` fails at
     construction rather than at first use." HEAD (later): "`ticketStoreFor(env)`
     throws when the blob binding is absent. (The *component's* call-time
     refusal is correct and stays as upstream wrote it.)" HEAD's text is a
     deliberate correction of the incoming claim — upstream refuses at *call*
     time, not at construction — written after it. Kept HEAD.

## Incoming changes preserved

Confirmed. The incoming commit `00a976b04e` is a single content edit
("add the blob store — separate bucket, not a prefix in the publicly-bound
sites bucket"), and its whole intent is already present in HEAD:

- Section "**3. The blob store, in its own bucket.**" — present in HEAD
  (including the `1stcontact-sites` disclosure argument, the BUG-31 /
  [[DOC-12]] §7 comparison, and the `t/<tenant>/blob/<sha256>` key scheme).
- Renumbering of the TypePack section from **3.** to **4.** — present in HEAD.
- Acceptance bullet "A blob bucket distinct from `1stcontact-sites`, declared
  top-level and under `[env.production]`, with a UAT pinning both" — present
  in HEAD verbatim, outside the conflict region.
- Acceptance bullet on attachment ops — present in HEAD in corrected form
  (see region 3 above).

Route: the refined text was integrated into the bundle branch by
`8b5aa7c1ec` (`xgd(ticket): seed_local_overlay request request-13a5e206`,
2026-08-31 17:01 -0700), i.e. the post-watermark sync landed the developer's
own later revision of this same section roughly three hours after the commit
now being cherry-picked (13:42 -0700). So this cherry-pick is redundant, not
discarded: STEP 3's guard is satisfied because the incoming commit's key
changes are demonstrably in HEAD, reached by a different route.

Consequently the staged tree has **no net diff vs HEAD**. Per STEP 4 this is
not a failure and `--skip` was not invoked — the finalize step will detect the
empty staged diff and skip the commit. `CHERRY_PICK_HEAD`
(`00a976b04e9ee8f8d06470f6f20c327a4503458f`) is intact.

No code, test, or UAT files were involved in this conflict, so no BUG-1301
precedence exception was needed and no test function was dropped.
