---
uid: report-3149fd01
id: REPORT-3394
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-23'
created_by: xgd
created_at: '2026-09-03T23:09:51.481528+00:00'
updated_at: '2026-09-03T23:09:51.481528+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-23
---

## Files resolved

- `.xgd/tickets/hot/request-13a5e206.md` — **AA** (both added), intent/bookkeeping
  ticket (rule **2e**, with **2b** superset test). Resolved to the **HEAD (ours)**
  side; staged with `git checkout --ours` + `git add --sparse` (the path is outside
  the sparse-checkout cone — `.xgd/tickets/` is excluded, DOC-986 §2/§4.1).

  Incoming commit `c2c4b393c8b261890100344e9f9679f5b90ada7a`
  (`xgd(ticket): create request request-13a5e206`, 2026-08-31 13:32:40 -0700) is the
  **creation** of REQ-162 — 105 lines, `status: draft`, `completed_at: null`,
  `last_field_updated: created_at`, and only the four seed fields (`priority`,
  `story_points`, `auto_merge_back`, `needs_review`).

  HEAD's version (539 lines) is the same ticket after its full lifecycle:
  `status: free_and_reconciled`, `completed_at: 2026-09-02T01:34:00Z`, plus
  `chat_comment`, `commits` (main_sha `4b43dd9a5c…`), `version: 0.2.20`, and the
  `orphan_commits` remap table. `created_at` is byte-identical on both sides
  (`2026-08-31T20:32:40.203324+00:00`), confirming HEAD descends from this very
  creation event rather than being an independent ticket that collided on uid.

  Both the enrichment rule ("take the more recent commit by timestamp") and 2e's
  strict-superset clause point the same way: HEAD is the later, strictly larger
  side.

## Incoming changes preserved

Every section of the incoming draft body is present in the resolved file, verbatim
or expanded. Verified section by section against `git show $CPHEAD -- <file>`:

- `# The product ticket store: …` title — identical.
- `## The gap is larger than "add three types"` — identical.
- `## What it delivers` §1 (schema / `SCHEMA_STATEMENTS` / `DB` binding already in
  `wrangler.toml`) — present, expanded to name `0003_ticket_store.sql` and to add
  the shared-`tenants`-registry ALTER.
- §2 (`MultiTenantTicketStore`, `forTenant()`, DOC-10 §4.1 tenant barrier,
  `TENANT_ID`) — present verbatim.
- The TypePack block — present verbatim (`material` / `reference` / `brief` / chat
  schemas, the DOC-38 §9 `rights`/`republishable`/`exportable`/`origin`/`kind`/
  `source_url` fenced block, and the DOC-38 §4.2 rationale paragraph). Renumbered
  `**3. The TypePack**` → `**4. The TypePack**` only because HEAD inserted a new
  §3 for the blob store.
- `## What this unblocks` — identical (REQ-159/160/161, ingestion, DOC-10 chat).
- `## Out of scope` — identical.
- `## Acceptance` — all five incoming bullets present; the "readable back through
  it" bullet is expanded with the `.workers.test.ts` assertion detail.
- `## Open questions` — both questions carried forward and answered under
  `## Both open questions are now settled` (`reference` keeps its own type;
  `brief` keeps its own type with `fields.site_slug`). Neither question was
  dropped.

HEAD additionally carries `## Prerequisite: refresh the installed component`,
`## Implementation notes carried from review`, and the appended
`## What landed (free-coded, 2026-08-31)` record — content the incoming draft
never had.

No hunk was dropped under the BUG-1301 precedence exception; none applied.

## Net effect

The staged diff against HEAD is empty (`git diff --cached HEAD` returns nothing):
this commit's content already reached the branch through the later ticket-update
commits. Per STEP 4 (BUG-1109/BUG-1122) this is a *redundant*, not a *discarded*,
commit — STEP 3's test distinguishes them, and the incoming commit's key changes
are demonstrably **present** in HEAD rather than absent. Left staged for
`cherry_pick_finalize_resolution` to skip; `CHERRY_PICK_HEAD` untouched and still
present. No conflict-class entries remain (`git ls-files -u` is empty).
