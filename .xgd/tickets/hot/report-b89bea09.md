---
uid: report-b89bea09
id: REPORT-4623
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-21T04:30:41.720903+00:00'
updated_at: '2026-09-21T04:30:41.720903+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/request-13a5e206.md` (REQ-162) — **UU**, intent/bookkeeping
  ticket (`request-*`), rule 2e. Resolved via `git checkout --ours` +
  `git add --sparse` (DOC-986 §2/§4.1).

  Incoming this attempt is `6caee0c5d1` (2026-08-31T21:12:57Z) — a third
  distinct commit, and unlike the previous two attempts a *substantive* content
  edit (99 insertions, 21 deletions). Its `--commit-message` body states the
  operation: "answer implementation review — REQ-104 stranded on a resync
  branch, shared tenants registry needs an ALTER, wiring-layer enforcement,
  bucket name and creation step, no HTTP routes; both open questions settled".

  Three hunks:

  - **Hunk 1 (frontmatter)** — same facts, both sides: HEAD
    `free_and_reconciled` / completed 2026-09-02 / `last_field_updated: result`
    vs incoming `draft` / `completed_at: null` / `last_field_updated: body`.
    Genuine conflict; HEAD is later (2026-09-02T01:34 vs 2026-08-31T21:12).
    HEAD wins.
  - **Hunk 2 (Prerequisite section)** — **the one place real incoming prose is
    discarded**, so spelling out the reasoning. Both sides state the same fact
    — the prerequisite for deliverable 3, the installed ticketing component
    lacking `attachments.js` — but make *mutually exclusive* claims about where
    REQ-104 lives:
      - incoming: `attachments.js` **absent** on `xgd-working`; the commit is
        `a60537ee3c`, **stranded on in-flight resync branch `resync-577be0d7`**;
        prerequisite = land REQ-104/107/108 on `xgd-working` first.
      - HEAD: `lagrange-framework` on `xgd-working` **carries** `fad535e8a4`
        and the files **are present** in the checkout; fix = one operator
        action, `bin/install --lang js --component ticketing --env ...`.
    These cannot both hold. HEAD is ~28h later and is the state consistent with
    this ticket having completed (`result: pass`, plus a "What landed
    (free-coded, 2026-08-31)" section recording the shipped implementation) —
    i.e. the prerequisite was satisfied in the interim. Taking incoming would
    reintroduce a now-false claim ("xgd-working: attachments.js absent") into a
    closed ticket. Per 2e, same fact changed differently on both sides =>
    later-positioned intent wins, per fact. HEAD wins.
  - **Hunk 3 (implementation record)** — HEAD-side-only addition ("What landed
    (free-coded, 2026-08-31)", Evidence, Collateral, "Not done here", operator
    note); incoming side is empty. Nothing of incoming's to discard. Kept HEAD.

  Incoming's "## Both open questions are now settled" and "## Implementation
  notes carried from review" sections merged cleanly as common content (lines
  712-728 of the resolved file), outside all three conflict regions.

## Incoming changes preserved

No code/implementation files were in conflict; the single conflicted file is a
bookkeeping ticket. Because this incoming commit is substantive, each of its
contributions was checked individually against the resolved file by grep
(line numbers from the resolved file):

- `0003_ticket_store.sql` migration naming — line 583
- "One shared `tenants` registry, and it needs an ALTER" — line 587
- `ALTER TABLE tenants ADD COLUMN config` — line 592
- "The bucket is `1stcontact-material`" — line 625
- `wrangler r2 bucket create 1stcontact-material` — line 634
- "Enforcement lives at our wiring layer, not the component's" — line 639
- "**No HTTP routes**" / workers-test acceptance rewrite — line 706
- "`reference` keeps its own type" / "`brief` keeps its own type" — 712, 717
- "## Implementation notes carried from review" + `d1-site-factory.ts`
  MIGRATIONS note — lines 722, 728

All present. The resolved file is a superset of incoming **except** for the
Prerequisite section (hunk 2), where HEAD carries a later restatement of the
same fact rather than incoming's stale one. That is a deliberate per-fact
timeline resolution, not a dropped hunk — the BUG-1301 precedence exception was
not invoked and is not needed here.

Per the enrichment metadata's "flag this file for post-merge review": the
Prerequisite section is the item to eyeball. HEAD's version names `fad535e8a4`
on `xgd-working`; incoming named `a60537ee3c` on `resync-577be0d7`. If the
REQ-104 resync did *not* in fact land, HEAD's prerequisite text would be the
wrong one — but the ticket's own completion record indicates it did.

No UAT test functions exist on either side of this conflict.

Net staged diff against HEAD is empty. Per this step's instructions `--skip`
was NOT called — staging is clean, `CHERRY_PICK_HEAD` remains at
`6caee0c5d1323162b7f3d425e3161ddc27a29e93`, and the finalize step will detect
the clean staged diff and resolve the empty pick itself.
