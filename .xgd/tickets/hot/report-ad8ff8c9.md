---
uid: report-ad8ff8c9
id: REPORT-4367
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-19T09:53:37.450068+00:00'
updated_at: '2026-09-19T09:53:37.450068+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/request-13a5e206.md` — UU, intent/bookkeeping ticket (rule 2e).
  Three conflict hunks, each resolved per-fact (not by whole-file winner):
  1. **Frontmatter lifecycle block** — HEAD: `status: free_and_reconciled`,
     `completed_at: 2026-09-02T01:34:00Z`, `last_field_updated: result`;
     incoming: `status: draft`, `completed_at: null`. Same facts, HEAD is the
     strictly later lifecycle state. Kept HEAD (taking incoming would have
     reverted an operator-only status to draft).
  2. **Blob-store keying paragraph** (body) — HEAD contains incoming's paragraph
     verbatim ("Keys stay `t/<tenant>/blob/<sha256>` per DOC-38 §7.2 …
     Declared in **both** wrangler blocks, since a named environment inherits
     neither vars nor bindings") plus the concrete bucket name
     (`1stcontact-material`), the `vitest.workers.config.mts` wiring, the
     `wrangler r2 bucket create` operator note, and the
     enforcement-at-our-wiring-layer discussion. Strict superset → kept HEAD.
  3. **Acceptance bullet on attachment ops** — same fact stated two ways.
     Incoming (2026-08-31 13:42): "a store constructed without a `BlobStore`
     fails at construction rather than at first use". HEAD (introduced by
     `8b5aa7c1ec`, 2026-08-31 17:01, i.e. later on the working timeline):
     "`ticketStoreFor(env)` throws when the blob binding is absent. (The
     *component's* call-time refusal is correct and stays as upstream wrote
     it.)" — the later edit deliberately corrects the earlier claim about where
     the failure occurs. Timeline rule → kept HEAD for that fact.

No `fields.intent_uid` / `story_uid` / `capability_uid` were touched, and no
content was introduced that is not on one of the two sides.

## Incoming changes preserved

Verified against `git show 00a976b04e -- .xgd/tickets/hot/request-13a5e206.md`.
The incoming commit ("content edit: add the blob store — separate bucket, not a
prefix in the publicly-bound sites bucket") made exactly three body additions,
all present in the resolved file:

- `**3. The blob store, in its own bucket.**` section including the
  `**It must not share `1stcontact-sites`.**` and BUG-31/DOC-12 §7 paragraphs —
  present verbatim (resolved file line 606 ff.).
- Renumbering of the TypePack section to `**4. The TypePack**` — present
  (line 649).
- Acceptance bullet "A blob bucket distinct from `1stcontact-sites`, declared
  top-level and under `[env.production]`, with a UAT pinning both" — present
  verbatim (line 692).

The only incoming text not reproduced literally is the two facts in hunks 2 and
3 above, which HEAD states in a later, more specific form that subsumes (hunk 2)
or deliberately corrects (hunk 3) the incoming wording. Nothing was discarded.

## Net result

The resolution is byte-identical to HEAD's blob for this file (verified by
diffing the composed resolution against `git show HEAD:<path>`): HEAD already
carries this commit's entire intent, arrived at by a later route. The staged
diff vs HEAD is therefore empty — a redundant commit, not a discarded one
(STEP 3's distinction). Per STEP 4 the file is staged and the cherry-pick
sequencer is left intact for `cherry_pick_finalize_resolution` to skip.
