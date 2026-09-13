---
uid: report-59bfdb7a
id: REPORT-4149
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-13T22:07:46.641219+00:00'
updated_at: '2026-09-13T22:07:46.641219+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/request-13a5e206.md` (REQ-162) — **UU**, intent/bookkeeping
  ticket (`request-*`), rule **2e**. Three conflict regions, resolved per-fact.
  Markers edited out by hand rather than `git checkout --ours`, so hunks git had
  already auto-merged from the incoming side survived. Staged with
  `git add --sparse` (path is outside the sparse-checkout cone).

  Incoming commit: `6caee0c5d1` (2026-08-31 14:12:57 -0700), 99 insertions /
  21 deletions — *"content edit: answer implementation review — REQ-104 stranded
  on a resync branch, shared tenants registry needs an ALTER, wiring-layer
  enforcement, bucket name and creation step, no HTTP routes; both open
  questions settled"*.

  HEAD side: the same ticket at `status: free_and_reconciled`, `result: pass`,
  `updated_at` 2026-09-02 01:34Z, with a "What landed (free-coded)" section.

  Per-region resolution:

  1. **Frontmatter** — same fields both sides. Later-positioned wins: HEAD
     (2026-09-02, `free_and_reconciled`, `completed_at` set) over incoming
     (2026-08-31 21:12Z, `draft`, `completed_at: null`).
  2. **`## Prerequisite:` section** — the one substantive conflict. Two
     *contradictory* accounts of the same fact. Incoming: REQ-104 is absent from
     `main` and `xgd-working` and stranded on scratch branch `resync-577be0d7`
     as `a60537ee3c`, so the prerequisite is to land REQ-104/107/108 first
     (with a BUG-1303 warning about installing out of an unfinished resync).
     HEAD: `lagrange-framework` on `xgd-working` carries `fad535e8a4` and the
     files are present, so `bin/install` is the whole fix.

     **Resolved to HEAD, and this is the developer's own retraction rather than
     a discard by me.** `git log -S` on both sides' distinctive strings returns
     `1e28c676bf` (2026-08-31 14:18:42) for *both* — it introduces
     `fad535e8a4` and removes `resync-577be0d7` in the same commit, six minutes
     after the incoming commit, with the message: *"content edit: correct the
     prerequisite — REQ-104 is on xgd-working; only the shared artifact store is
     stale, so bin/install is the whole fix."* The incoming section is a
     superseded, factually-wrong account retracted by its own author.
  3. **Tail after `## Implementation notes carried from review`** — HEAD side is
     the `---` / "What landed (free-coded, 2026-08-31)" section through the
     operator note; **the incoming side of this region is empty** (incoming's
     file simply ends there). Nothing from incoming to preserve; kept HEAD.

  No `fields.intent_uid` / `story_uid` / `capability_uid` touched. No content
  invented that was not on one side.

## Incoming changes preserved

Verified against `git show 6caee0c5d1 -- .xgd/tickets/hot/request-13a5e206.md`.
The bulk of the incoming commit auto-merged cleanly and is present in the
resolved file — confirmed by line:

- `0003_ticket_store.sql` named in deliverable 1 — L583
- "One shared `tenants` registry" + `ALTER TABLE tenants ADD COLUMN config` — L592
- "**The bucket is `1stcontact-material`.**" + `vitest.workers.config.mts` — L625
- "**Enforcement lives at our wiring layer, not the component's.**" — L639
- acceptance bullet "**No HTTP routes**: `/api/tickets/*` belongs to REQ-161" — L706
- "## Both open questions are now settled" (with the `reference` / `brief`
  resolutions) — L710
- "## Implementation notes carried from review" (both bullets) — L722
- revised acceptance bullet "`ticketStoreFor(env)` throws when the blob binding
  is absent" — present

The only incoming content absent from the resolution is the retracted
`## Prerequisite: the installed component predates REQ-104` section (region 2),
absent by the author's own correction in `1e28c676bf` as evidenced above — not a
discard. `resync-577be0d7` and `a60537ee3c` therefore do not appear in the
resolved file, which is the intended end state.

No hunks dropped under the BUG-1301 precedence exception; none applied here.

## Note on the staged diff

The resolution nets to **no diff vs HEAD**. This is the redundant-commit case
(BUG-1109/BUG-1122), not a discard: STEP 3's test is whether the incoming
commit's key changes are *present* in HEAD rather than absent, and the itemised
list above confirms they are — HEAD had already absorbed this commit, including
the later correction to its prerequisite section. Staged and exiting `@done`;
`--skip` not called. `CHERRY_PICK_HEAD` still reads
`6caee0c5d1323162b7f3d425e3161ddc27a29e93` for
`cherry_pick_finalize_resolution`.

As on the two preceding attempts, the marker edits reintroduced a trailing
newline at EOF that HEAD does not have; stripped with `perl -i -pe 'chomp if
eof'` and re-staged before reporting.
