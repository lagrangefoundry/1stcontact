---
uid: report-c38c9ba9
id: REPORT-4147
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-13T21:58:47.658734+00:00'
updated_at: '2026-09-13T21:58:47.658734+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/request-13a5e206.md` (REQ-162) — **UU**, intent/bookkeeping
  ticket (`request-*`), rule **2e**. Three conflict hunks, resolved per-fact.
  Markers were edited out by hand rather than `git checkout --ours`, so the
  hunks git had already auto-merged from the incoming side survived intact.
  Staged with `git add --sparse` (path is outside the sparse-checkout cone).

  Incoming commit: `00a976b04e` — *"content edit: add the blob store — separate
  bucket, not a prefix in the publicly-bound sites bucket"* (2026-08-31 20:42Z).
  HEAD side: the same ticket at `status: free_and_reconciled`, `result: pass`,
  `updated_at` 2026-09-02 01:34Z, carrying a "What landed (free-coded)" section.

  Per-fact resolution:

  1. **Frontmatter** (`updated_at` / `completed_at` / `last_field_updated` /
     `status`) — same fields changed on both sides. Later-positioned side wins:
     HEAD (`2026-09-02T01:34:36Z`, `free_and_reconciled`, `completed_at` set)
     over incoming (`2026-08-31T20:42:52Z`, `draft`, `completed_at: null`).
     The incoming side is this same ticket's own earlier draft state.
  2. **Blob-store keys paragraph** — HEAD is a strict superset of incoming.
     Incoming's full text (the `t/<tenant>/blob/<sha256>` key scheme, the
     content-addressing/dedup rationale, the tenant-prefix-as-existence-oracle
     argument, [[DOC-37]] erasure, "declared in both wrangler blocks, since a
     named environment inherits neither vars nor bindings") is present verbatim
     in HEAD, which additionally names the bucket `1stcontact-material`, adds
     the `vitest.workers.config.mts` line, the `wrangler r2 bucket create`
     operator note, and the enforcement-at-the-wiring-layer paragraph. Kept the
     superset.
  3. **Acceptance bullet on construction-time failure** — same fact stated
     differently. Incoming: *"a store constructed without a `BlobStore` fails at
     construction rather than at first use."* HEAD: *"`ticketStoreFor(env)`
     throws when the blob binding is absent (the component's call-time refusal
     is correct and stays as upstream wrote it)."* Later-positioned side wins;
     HEAD's own "What landed" section documents this as the deliberate
     resolution of that acceptance line, at the wiring layer rather than in the
     upstream component.

  No `fields.intent_uid` / `story_uid` / `capability_uid` touched. No content
  invented that was not on one side.

## Incoming changes preserved

Verified against `git show 00a976b04e -- .xgd/tickets/hot/request-13a5e206.md`.
The incoming commit's entire contribution is the blob-store material; every
hunk is accounted for in the resolved file:

- `**3. The blob store, in its own bucket.**` section — present (line 606).
- `**It must not share `1stcontact-sites`.**` paragraph — present (line 612).
- The BUG-31 / [[DOC-12]] §7 disclosure-vs-overwrite paragraph — present
  (line 619).
- The `t/<tenant>/blob/<sha256>` keys paragraph — present (lines 626–629), in
  HEAD's superset phrasing and rewrapped, hence not greppable as a single line.
- Renumber `3. The TypePack` → `4. The TypePack` — present (line 649).
- Acceptance bullet "A blob bucket distinct from `1stcontact-sites`, declared
  top-level and under `[env.production]`…" — present (line 692).
- Acceptance bullet on construction-time failure — present in HEAD's later,
  refined form (see per-fact item 3 above); the fact is carried, the wording is
  the newer side's.

No hunks dropped under the BUG-1301 precedence exception; none applied here.

## Note on the staged diff

The resolution nets to **no diff vs HEAD** — HEAD had already absorbed this
commit's effect, in refined form, via the free-coding pass recorded in its
"What landed" section. This is the redundant-commit case (BUG-1109/BUG-1122),
not a discard: STEP 3's check confirms the incoming commit's key changes are
*present* in HEAD rather than absent. Staged and exiting `@done` as instructed;
`--skip` not called. Cherry-pick sequencer state left intact —
`CHERRY_PICK_HEAD` still reads `00a976b04e9ee8f8d06470f6f20c327a4503458f` for
`cherry_pick_finalize_resolution`.
