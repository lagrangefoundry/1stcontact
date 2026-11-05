---
uid: request-a589df82
id: REQ-450
type: request
title: 'Provisioning: first-draft test business copied from an existing business'
created_by: EPIC-25
created_at: '2026-10-24T20:21:16.093660+00:00'
updated_at: '2026-10-24T20:54:37.986492+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  parent_uid: epic-4553b54e
  story_points: 8
  priority: medium
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-255d2d41
  commits:
  - working_sha: 4396bee5e442efbd58ab743ca253bedeefac973d
    reconcile_sha: null
    main_sha: null
  - working_sha: 8119f6c50bb6af4df12a1c5354d31045b4116bf8
    reconcile_sha: null
    main_sha: null
  version: 0.2.620
---

## What changes

**People → "Provision a business"** (`apps/control-app/src/builder/people.js:1473`) gains a **"First-draft test"** option. Ticking it shows a picker of existing businesses to copy discovery from.

- **Name.** The business name is prefixed with `First-Draft-Test ` (e.g. `First-Draft-Test Dina's Diner`). Name uniqueness follows the existing rules (`availableBusinessName` / `requireFreeBusinessName`), so repeat runs need distinct names.
- **Provisioning** is unchanged (`provisionBusiness`, `identity.ts:778`): the business, membership, entitlement and blank starter site are created as today.
- **Discovery is copied** from the chosen source business's ticket store into the new business's:
  - the **plan**, onto the new site's `site_key`;
  - every **material**, with its attachments;
  - every **reference** (comparison-site captures, likes and dislikes), with its attachments;
  - the source's **site and business chats**, through `chat-copy.ts`'s `readChats` / `writeChats`. These already re-address session ids and backends to the destination and strip runtime pointers.
- **Remapping.** Ticket uids are minted fresh at the destination. Every uid the plan holds is rewritten to the destination's: `comps[].reference`, `decisions[].comps`, and any material/reference uid in the story board. Material labels are carried as-is.
- **Re-uploaded bytes.** The blob store is tenant-partitioned, so each attachment is read from the source and attached to the destination.
- **Chunked, resumable copy.** Dina's Diner is 395 attachments, about 102 MB, so the copy must not depend on one request staying inside Worker limits. The popup shows progress and reports when the copy is complete. If the copy is interrupted, re-running it continues and doesn't duplicate.

**The site stays blank.** The source's site (pages, `site.json`, site assets) is **not** copied. The test business keeps the blank starter site provisioning made.

**The plan is reset to "ready for a first draft"**, so it agrees with the blank site:
- every stage from `first_draft` onwards (`first_draft`, `refining`, `colours_and_fonts`, `finishing_touches`, `ready_to_publish`) is set to not started;
- `getting_to_know_you` and `other_sites` keep their state;
- `milestones` (`first_pass_at`, `revision_rounds`), `critique`, `readiness` and `looked_at` are cleared;
- everything else is kept as the source had it: brief, decisions, asks, comps, board, public details, functionality and checks.

**Deliberately not copied:**
- **Builder and critic chats** (`worker-*`, `critic_*` sessions). They are about the source's old site.
- **People, contacts, delegates, domains, sending settings and network settings.** A test business must never be able to email or message anyone from the source.

**The client-facing name is the source's.** The `First-Draft-Test` prefix is on the business record only. The starter site's `site.json` title and the plan's public details carry the **source's** business name, so the prefix never reaches the draft or the consultant's view of the client.

**The source is read-only.** The copy never writes to the source business.

**Access.** The option is an operator/admin action, on the same authority as the existing "Provision a business" (`/api/admin/`).

**Starting the draft is manual.** The operator opens the test business and asks the consultant for the first draft.

## Why

EPIC-25: first-draft production is the pivot of a build and the place to test:
- whether L1 helps;
- whether the principal/delegate model works;
- how delegate models compare.

Today every run needs a full discovery conversation. This makes a run cost a copy. It is reproducible as long as source businesses are not re-edited.

The operator accepted (EPIC-25 decision) that the copy is not a faithful rewind: the copied conversation may include feedback given after the source's own first draft.

## Test plan

UATs named `test_UAT_FC_REQ-450_*`, at real entry points (the admin provisioning route and the People panel), against a source business seeded with a plan, materials and references with attachments, site, business, builder and critic chats, and contacts:
- **Popup:** the option and the source picker appear; the name is prefixed.
- **Copy:** the destination holds the plan, materials, references and site/business chats with identical attachment bytes, and plan uids resolve to destination tickets.
- **Not copied:** builder and critic chats, contacts and people.
- **Blank site:** the destination site is the starter site, with the source's name as its title.
- **Plan reset:** `first_draft` and later stages are not started; milestones and critique are absent; discovery stages and decisions are intact.
- **Resumable:** an interrupted copy, re-run, completes with no duplicates.
- **Source unchanged:** the source's ticket count and versions are identical before and after.


## Implementation (as built)

**Interaction.** In the Provision dialog, ticking **First-draft test** loads a picker of every business with a site, each listed once, excluding businesses that are themselves first-draft tests (names starting `First-Draft-Test `). Picking a source fills the name field with the source's name (still editable), and a line shows the final name, `Provisioned as First-Draft-Test <name>`. Pressing **Provision** provisions the business, then copies in slices. A progress bar and line (`copying discovery, N of M…`) update after each slice. The dialog finishes with `<name> is provisioned, and its discovery is copied.` If a slice fails, the message ends `Provision again to continue the copy.`

**API.**
- `POST /api/admin/businesses` takes `firstDraftFrom: <source businessId>`. The Worker applies the prefix, provisions through `provisionBusiness`, and passes a new `siteName` (the source's name) for the starter site. It then marks the new plan with `first_draft_copy: { source, started_at }`.
- The same request sent again finds the unfinished copy of the same source on that account and returns it (`firstDraft.resumed: true`). This is how an interrupted copy is re-run.
- Once a copy is complete, the same name is refused with 409 (the existing name rule). A missing source, or a source with no site, is refused 404/409.
- `POST /api/admin/businesses/first-draft { business }` copies one slice and answers `{ total, done, complete }`. It is behind the same platform-owner gate as provisioning. The source is read from the target plan's `first_draft_copy`, never from the request. A business without that marker is refused 409.

**Copy mechanics** (`apps/control-app/src/first-draft.ts`):
- **Resumable, no duplicates.** Each copied material and reference carries `copied_from: <source uid>` from its create, and `copy_complete: true` once its comments and attachments have landed. Attachments are matched to the source by (sha256, filename, member), and comments by (kind, body). Each slice works out what is left from these records, so no cursor is kept.
- **Budget.** A slice stops at 40 attachments or 16 MB. Chats, the plan and the finishing steps run on a slice of their own.
- **Chats.** Only `sessionIdFor(source site)` and `businessSessionIdFor(source business)` are copied, through `readChats` / `writeChats` with `force` (so a half-written conversation from an interrupted run is finished, not kept).
- **Placements.** `placed_on` / `placed_as` are dropped from material: they describe the source's site, which isn't copied.
- **Labels.** Labels are carried as-is, and the destination's label counter is advanced past the highest carried number per kind, so the next upload does not reuse `IMAGE-7`.
- **Uid remap** covers every string at any depth in the plan's fields **and body** (prose mentions too), plus cross-references between copied materials (e.g. one material naming another). `copied_from` itself is left alone.
- **Plan reset.** The plan is read with `findPlan`/`toPlan`, never `sitePlan().read()`, which would create a plan in the source. It is written through `sitePlan(dest).write`, so `checkPlan` and the host's stage settling apply. Stages from `first_draft` onward become `not_started` with no `settled`. `milestones`, `critique`, `readiness` and `looked_at` are dropped. Earlier stages keep their state, and the host re-derives self-ticking stages exactly as it would on any write to the source.
- **Finishing.** `first_draft_copy.completed_at` is stamped. The new business's knowledge base is then refreshed once, best-effort; a missed pass is picked up from the change feed later.

**Exports added for reuse:** `toPlan` (plan.ts), `reserveMaterialLabels` (material.ts), `BusinessSpec.siteName` (identity.ts).

## UATs

- `tests/test_UAT_FC_REQ-450_first_draft_copy.workers.test.ts` (workerd, real D1/R2, through `route()` with a real admission). It covers:
  - the name prefix, and the site title carrying the source's name;
  - the blank starter site;
  - identical attachment bytes, labels, likes/dislikes and comments;
  - `placed_on` dropped, the cross-reference remapped and the next label `IMAGE-10`;
  - plan uids (comps, decision comps, body) resolving to destination tickets;
  - only the site and business chats copied, no `worker-*` chats, no people or contacts;
  - the plan reset;
  - an interrupted copy, re-provisioned, completing with matching counts and no duplicates, and a finished copy refused 409;
  - the source's ticket and attachment versions unchanged;
  - the copy route refusing a business that is not a test.
- `tests/test_UAT_FC_REQ-450_first_draft_dialog.test.ts` (jsdom People panel, only `fetch` stubbed). It covers:
  - the option, and no admin request until it is ticked;
  - the picker deduplicated and excluding test businesses;
  - the source's name as the default, and the prefix shown;
  - the provisioning request naming `firstDraftFrom`, one copy call per slice until complete, and the progress and completion message;
  - the "Provision again" hint after an interrupted slice.

**Not in scope (as specified):** transcripts are carried byte for byte, so a uid the consultant quoted inside an old chat turn still names the source's ticket. Only the plan's uids are rewritten.