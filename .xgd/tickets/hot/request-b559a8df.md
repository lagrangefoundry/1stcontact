---
uid: request-b559a8df
id: REQ-645
type: request
title: 'Control app: bounded-by-construction sweep (per-item queries, unbounded fan-out,
  whole-log reads)'
created_by: EPIC-32
created_at: '2026-11-04T19:54:11.483754+00:00'
updated_at: '2026-11-04T21:08:30.455192+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: high
  epic_parent: epic-24a2ec33
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-65d37889
  commits:
  - working_sha: bf0376c4fc6a0e3cdb2791ada2d6d93b74693b34
    reconcile_sha: null
    main_sha: null
  - working_sha: 30971e035f7289b2753ce250486dbb64e233e212
    reconcile_sha: null
    main_sha: null
  version: 0.2.762
  story_points: 8
---

## What changes

Code that stays on Workers and Durable Objects is made bounded by construction, per DOC-1 item 35 and DOC-86 §7. Its memory and CPU must not grow with a business's catalog, Library, comment corpus or conversation length.

A sweep of `apps/control-app/src`, `tools/generate/src/cli/ai` and `packages/framework/src`:
1. **No per-item store query inside a loop over a business's items.** The ticket store's `query` loads every ticket of a type before filtering. One query per item multiplied it into the 2 GB dev crash (BUG-341: 1,616 Library items, each running a full comment scan in parallel). Replace any such pattern with one shared scan or a keyed read.
2. **No `Promise.all` over a list whose length a business controls.** Use a fixed-concurrency helper (one shared helper, not per-site copies).
3. **No whole-log reads per poll or per step.** Readers tail from a cursor, as the framework already does for stop watches.

Each finding is either fixed, or listed in this ticket's body with the reason it is bounded.

## Why free-coded

A mechanical sweep against three stated rules. The heavy paths move to containers under the cutover ticket, but these rules still apply to what stays.

## Test plan

UATs `test_UAT_FC_REQ-645_*` (`tests/test_UAT_FC_REQ-645_bounded_by_construction.workers.test.ts`) drive each fixed path in workerd over a real D1, in a business holding a Library of about 2,000 items (300 for the first-draft copy, which copies every item) and, for the shop, 2,000 inventory items (400 items make only four 100-id batches, which cannot show a fan-out). Only the D1 binding — the external boundary — is wrapped, counting type scans (at their first page), change-journal rows read, and statements in flight. They assert:
- store reads per operation are constant: the comp board scans attachments once (30 comps); a chat export scans comments once and each import of it once (40 conversations); tester message times scan comments once (20 conversations); a first-draft copy chunk scans comments at most 4 times and attachments at most twice (300 items);
- peak concurrency is at most the helper's limit: `/api/sites` (24 sites) and the comp board stay at or under `DEFAULT_LANES`; reading a 2,000-item inventory stays at or under two lanes of batches plus the currency read;
- a draft-change poll that moved by one change reads one journal row, and a read from zero still returns the whole retained window.

Each of these fails against the pre-change code with the per-item count (30, 40, 20, 600 scans; 24 and 41 in flight; 200 rows).

## Scope boundary (set 2026-11-04 for parallel work)

The sweep covers code that **stays on Workers and DOs**: control-app routes, the shop and material imports, the gate, the junction and coordinator DOs, and the framework packages they call. To avoid colliding with sessions running in parallel, it leaves alone:
- the agent host path in `tools/generate/src/cli/ai/host-core.ts`, which belongs to BUG-343 and REQ-646;
- the catalog rebuild path (`catalog.ts`, `catalogItemChanged`) and shop photo serving, which belong to REQ-647.

## Fixed

- **Shared helper.** `inLanes(items, limit, work)` in `tools/generate/src/cli/ai/bounded.ts` (with `DEFAULT_LANES = 6`) runs at most `limit` at a time and answers results in order. It replaces the two hand-rolled lanes (`shop-import.ts` `inParallel`, `builder-case-core.ts` `libraryCatalogue`).
- **One scan, indexed by subject.** `commentsBySubject` / `attachmentsBySubject` in `apps/control-app/src/by-subject.ts` read the type once and index by `fields.subject_uid`, in the uid order `comments`/`attachments` answer in.
  - Comp board (`comps.ts` `compBoard`): one attachment scan for the board, not one per comp; comps read in lanes.
  - Chat copy (`chat-copy.ts`): `readChats` reads comments once; `writeChats` reads the destination's once and keeps that index current as it writes, so two records landing on one address still match the first one's comments.
  - Feedback (`feedback.ts` `testerMessageStamps`): one comment scan, and none when no conversation matches.
  - First-draft copy (`first-draft.ts` `copyFirstDraftChunk`): both stores' comments and attachments read once per chunk, not four scans per copied item.
  - Notifications (`notifications.ts` `sentNotifications`): the mail is read once, not once per notification kind.
- **Unbounded fan-out → `inLanes`.** `/api/sites` revision reads (`router.ts`), the audit flush (`ai.ts` `flushAudit`), shop hydrate's 100-id batches (`shop.ts` `inBatches`), `read_plan` comps (`plan-core.ts`), `list_references` (`fidelity-core.ts`).
- **Journal tailed from the cursor.** The D1 site store's `changesSince` (`tools/generate/src/store/d1r2-store.ts`) selects `at > since` off the `(site_id, at)` index, with the oldest retained counter asked for separately, instead of reading the whole 500-entry window and filtering.

## Found and left, with the reason it is bounded

- Fixed-length `Promise.all` tuples (two to nine named reads): `acceptances.ts`, `router.ts` zones/drift, `shop.ts` hydrate and list, `shop-routes.ts`, `invoices.ts`, `zones.ts`, `ledger.ts`, `resolver.ts` record probes, `digest-core.ts`, `account-core.ts`, `image-core.ts`, `fidelity-core.ts` pairs, `builder-case-core.ts`, `shop-import.ts` download/describe.
- Fan-out over a constant list: `resolver.ts` DKIM selectors, `serving.ts` served hosts (apex and www), `material.ts` `MATERIAL_TYPES` / change filters, `security-headers.ts` inline scripts.
- `session-knowledge.ts` searches: one per knowledge base the session declares — a platform-configured set, not a business's items.
- `junctions.ts` `flush`: the junctions open in this isolate; `router.ts` `inIsolate`: jobs this isolate itself started; `comps.ts` `compCapturesSettled`: captures this isolate started.
- Builder browser code (`builder/*.js`): runs in the client's browser, not on a Worker; `plan-panel.js` uploads already go `UPLOADS_AT_ONCE` at a time.
- Single-item reads that are not in a loop: `material.ts` `membersOf`, `materialFile`, `materialText`, republish; `capture-material.ts` `syncMembers`; `chat-copy.ts` per-ticket helpers; `imagegen.ts` attachments.
- `material.ts` `labelUnlabelled`: one keyed counter write per unlabelled item, sequential, and an item is labelled once.
- `messages.ts` `applyDeliveryEvent`: one mail scan per active tenant for a delivery webhook — a loop over the platform's tenants, not a business's items. Worth an index on `provider_id` later; out of this ticket's rules.
- `reserveMaterialLabels`: counter increments up to the highest carried label, once per first-draft copy; keyed writes, no scan.
- Pollers: the contact stream reads `contactsChangedSince` from its cursor with a limit; the draft stream reads the counter and, only when it moved, the journal tail (now cursor-tailed); material changes ride the ticket store's `watch` from `since`.
- DOs: `SessionJunction` reads chunks from the reader's offset (`start + len > ?`); `SiteCoordinator` holds one lease key.
- `packages/framework/src`: no store reads; its `Promise.all` uses are none in scope.