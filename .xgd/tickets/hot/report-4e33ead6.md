---
uid: report-4e33ead6
id: REPORT-4842
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-23T18:26:07.533437+00:00'
updated_at: '2026-09-23T18:26:07.533437+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/request-8b33a146.md` (REQ-172) — **UU**, intent/bookkeeping
  ticket (`request-*`), resolved under STEP 2e. Six conflict regions, all
  resolved to HEAD.

  Incoming commit is `87607d2ecee4ab01c18a809577cc92cb06f0e95a` (Tue Sep 1
  14:16:28 2026, empty commit body). Its merge base is the ticket in
  freshly-created state (`title: Untitled`, `status: draft`, body
  `(new ticket)`), so the commit is the ticket's **first real draft**: it sets
  the title and writes the initial REQ-172 spec body.

  HEAD carries the **same prose, later evolved** — `status:
  free_and_reconciled`, `completed_at` set 2026-09-14, `updated_at`
  2026-09-19, plus `commits`, `version: 0.2.37`, `bundled_in: bundle-8e1807f6`.
  Every conflict region is the same shape: HEAD holds a superset revision of
  the identical paragraph, theirs holds the thinner first draft of it.

  Region-by-region:

  1. **Frontmatter** (`updated_at` / `completed_at` / `last_field_updated` /
     `status`) — the one genuine per-fact conflict: both sides set the same
     four fields differently. 2e's timeline rule applies and HEAD is
     later-positioned (2026-09-19 vs 2026-09-01T21:16). Independently
     corroborated by lifecycle direction: theirs would revert
     `free_and_reconciled` → `draft` and null out a recorded `completed_at`,
     i.e. un-complete an already-reconciled ticket. HEAD.
  2. **Content-type table + expand button** — HEAD adds JSON and XML to the
     `text/*` row, adds the window-height-cap paragraph, and says "existing
     modal shell … reused rather than rebuilt". Superset. HEAD.
  3. **DOC-14 §8 sentence** — HEAD appends "the bytes are read once". Superset.
     HEAD.
  4. **`MaterialRow` content type** — HEAD adds the BUG-41 no-drift sentence
     and promotes theirs' one-sentence filename-fallback note into a full
     dedicated paragraph. Superset. HEAD.
  5. **`renderSafe` / plain text** — HEAD adds the description cell, the
     BUG-42 `markdownReady` repaint paragraph, HTML-is-not-run, SVG-stays-a-
     picture, reader-destroyed-with-detail, missing-bytes, and the
     `markdown.js` re-export. Superset. HEAD.
  6. **Test plan** — HEAD's jsdom list contains all five of theirs' assertions
     plus more, and adds a second file
     (`test_UAT_FC_REQ-172_material_content_type.workers.test.ts`) that covers
     theirs' "origin coverage" sentence explicitly. Superset. HEAD.

  Applied with `git checkout --ours` then `git add --sparse` (ticket paths lie
  outside the sparse-checkout cone on resync branches, DOC-986 §2/§4.1) rather
  than hand-editing six regions, since the resolution is HEAD's version
  verbatim.

  The auto-enrichment rule offered ("intent unknown on both sides; take the
  more recent commit by timestamp and flag for post-merge review") agrees with
  the outcome — HEAD is the more recent side — and 2e's superset test reaches
  it without relying on the timestamp alone.

No deletion conflicts (DU/UD), no AA, no code files, no spec tickets, no UAT
test files, and no config files were involved. The BUG-1301 precedence
exception was not invoked.

## Incoming changes preserved

This is a ticket, not a code file, so no implementation hunks are at stake.
Even so, each incoming *assertion* was checked individually against HEAD before
resolving, and every one is present in equal or expanded form:

- `text/*` (plain, csv, log) → preformatted — present, plus JSON and XML.
- expand button opens the builder's modal shell at modal size — present, as
  "existing modal shell", plus "reused rather than rebuilt".
- PDF via the file route's `content-disposition: inline`, browser viewer in a
  frame, both honest limits (browser chrome, iOS Safari first page only) —
  present verbatim, plus the read-once sentence.
- content type duplicated onto the material ticket at ingest, as `filename`
  already is, to avoid an `attachments()` call per row — present verbatim.
- material ingested before the change falls back to its filename, no
  migration, mapping owned by `resolveContentType` — present as its own
  paragraph ("same mapping the field caches, so nothing has to be backfilled").
- markdown sanitized through the `renderSafe` seam (`webui-chat` over
  `webui-markdown` + DOMPurify), degrading to escaped source — present, plus
  the description cell.
- plain text not rendered as markdown — present, plus HTML-is-not-run.
- "why free-coded" paragraph — identical on both sides, merged cleanly by git
  outside any conflict region.
- test plan's five jsdom assertions and the origin-coverage sentence — all
  present in HEAD's longer list and its second workers suite.

No incoming fact was discarded. Nothing needed to be dropped, so there is no
BUG-1301 exception to record.

## Note for the finalize step

`git ls-files -u` is empty and `git diff --cached HEAD` is empty: because the
resolution is HEAD's version verbatim, this cherry-pick carries no net change.
Per STEP 4 I did not call `--skip` — Python's finalize step should detect the
clean staged diff and skip the commit. `CHERRY_PICK_HEAD` is intact at
`87607d2ecee4ab01c18a809577cc92cb06f0e95a`.
