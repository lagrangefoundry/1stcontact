---
uid: request-b6df210d
id: REQ-654
type: request
title: 'Site copy: copy a prepared site between any two businesses, carrying its handoff
  note and no conversation'
created_by: EPIC-19
created_at: '2026-11-05T01:24:34.861110+00:00'
updated_at: '2026-11-05T16:05:41.751345+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: high
  parent_uid: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-9897b039
  commits:
  - working_sha: b6a7bf14718f693bbaa8ae083f08aa7cdde7d861
    reconcile_sha: null
    main_sha: null
  - working_sha: 35a2c7dc70d90271781dc664431ae06d9db5d8f2
    reconcile_sha: null
    main_sha: null
  version: 0.2.782
  story_points: 13
---

## Why

**Handoff mode** (REQ-638, "Handoff mode"): the operator prepares a starter site for a real client, in the operator's own business on dev, from the client's existing website and material. It is then handed to the client's own business, usually on production, under the client's account. The client's consultant opens it in handoff mode: the draft is a proposal, a handoff note explains intent and open points, and the conversation starts fresh.

Today's copy (`bin/copy-to-cloud` / `bin/copy-from-cloud` → `tools/generate/src/cli/copy.ts`, REQ-289/294) can't do this:
- It matches the business **by name on both sides**, so it can only copy a business to a same-named business.
- It only crosses between local and the deployed builder, in two fixed directions.
- It knows nothing of a handoff note or handoff mode.

## What

Extend the existing copy command (one implementation; don't add a separate script). The wrappers stay as convenient spellings.

1. **Any source to any destination.** The source and destination are each named independently: an environment (local dev, or a deployed environment such as production), plus a business on it, by name or id. Spelled `1c copy-site --from dev:"Starter — Client Shop" --to production:"Client Shop"` (`bin/copy-site`); `1c copy` already names the copy-editing verb. An end is `dev`/`local` (the local builder) or `production`/`prod` (the deployed builder), a colon, then the business. Any pair works: dev→prod, prod→dev, dev→dev, prod→prod. The two businesses may belong to different accounts. Each end uses its own credential, as BUG-134 does today.
2. **The destination business must already exist** (unchanged: the copy never mints a tenant or an account). The refusal names what the far side offers.
3. **`--handoff`** marks the copy as a handoff. Then:
   - **The site comes across whole:** pages, sections, design, site config, assets, every Library material and reference the source business holds (photos, generated clips and posters, documents; operator decision 2026-11-05: all of the business's materials, not only those placed on the site), the Shop inventory (items, collections, categories, photos), and the captured references of the client's existing site, so the consultant can look at them.
   - **No conversation comes across:** no chat or tool transcript, engagement ledger, junction log, builder cases, turn or spend records. `--chats` is refused together with `--handoff`.
   - **Nothing account-specific comes across:** contacts, leads, payments/Stripe connection, domains, publish history and published versions. The destination starts unpublished.
   - **The handoff note comes across,** and the destination site enters **handoff mode** (REQ-638): agreement pieces `prepared`, Building done, the preparer named.
4. **The handoff note is a `comment` ticket on the source site's plan, with `fields.kind: handoff_note`** (operator decision, 2026-11-05). This follows the existing pattern of transcripts as comments of a kind on a ticket. There is no new ticket type and no field on the plan itself, so having a note never puts the source site into handoff mode and never reads as an agreement. The note gets its author, date and history from the comment. It isn't a Library material, because the client never browses it.
   - **Written by telling the consultant** in the source builder ("write the handoff note"). The consultant that built the site drafts it from its own context (what was assumed, chosen and left open), and the operator corrects it in chat. Rewriting replaces the note's body; there is one current note per site. It can be several paragraphs.
   - **The copy picks it up** and writes it as a `handoff_note` comment on the destination site's plan, where the owner's consultant reads it as background (REQ-638's handoff mode). It is never shown in the client's own conversation.
   - A `--handoff` copy with no note warns and proceeds; the consultant then knows only the host's facts.
5. **A destination that already holds a site** is refused unless `--force` (BUG-51's rule). With `--force` the destination's site is replaced. The destination's conversations are untouched, but a handoff into a business that already has conversation history is reported in the output, because the client won't get a fresh start.
   - With `--force` on a handoff, the destination's Library and references are **added to**: anything an earlier copy of the same source brought is matched and not duplicated, so re-running a copy resumes rather than repeats. Shop items an earlier copy brought are replaced; items the destination added itself are kept. A destination that is already published stays live (the copy writes the draft only) and the output says so.
6. **The output** lists what was copied (pages, materials, items, references), what was deliberately left behind (conversations, contacts, payments, domains, publish history) and the handoff state of the destination.
7. **`--backup`** behaves as today, for any pair. **`--dry-run`** is new (it did not exist): it resolves both ends, reads the source and reports what would be copied, and writes nothing.
8. **A copy without `--handoff`** names any source and destination the same way but carries only the site, as today (`--chats` still carries conversations where allowed).
9. **The transfer is chunked and resumable.** A real source can be ~100 MB of Library and captures, so the copy reads a manifest from the source, then moves bytes item by item, then finishes on the destination. Every copied record remembers the source uid it came from, so an interrupted copy is completed by running it again.
10. **Wrappers:** `bin/copy-to-cloud` and `bin/copy-from-cloud` keep meaning the fixed dev→production and production→dev copies of a same-named business; `bin/copy-site` (`1c copy-site`) takes `--from`/`--to`.

## Not in scope

- Creating the destination account or business (the client signs up first, or the operator creates it through the normal path).
- Moving a published site's live domain.

## Test plan

`test_UAT_FC_<ID>_*` (copy command against two local stores or the existing copy test seams):
- **Arbitrary pair:** a site in business A (one account) is copied to business B (a different name, a different account), and B renders the same pages, design, inventory and materials.
- **Handoff:** with `--handoff`, B has no chat or tool transcript, builder cases, contacts, payment connection or publish history. Its site is unpublished, carries the source's handoff note, and its plan is in handoff mode (agreement pieces `prepared`, Building done).
- **Captured references copied:** B's consultant can list and screenshot the reference capture made in A.
- **`--chats` with `--handoff` is refused** before anything is written.
- **Existing destination site:** refused without `--force`, replaced with it, and a destination with conversation history is reported.
- **Missing note:** `--handoff` with no note on the source warns and completes.
- **Missing destination business:** refused, naming what the far side has.


### Test plan additions: the handoff note

- Asking the source consultant to write the handoff note creates one `comment` ticket on the site's plan with `fields.kind: handoff_note`. Asking again replaces its body; there's still one note. The plan's own fields are unchanged and the source site is not in handoff mode.
- A `--handoff` copy writes the note as a `handoff_note` comment on the destination site's plan, and the destination consultant's opening context contains its text.
- The note never appears in the destination client's conversation or Library.

## Implementation (as built)

- **Wire:** a third route family on the control app, `/api/handoff/*` (`apps/control-app/src/handoff-copy.ts`): `GET manifest` (Library tickets with comments and attachment records, capture bundles with member lists, inventory, note; no bytes), `GET attachment` / `GET bundle` (one item's bytes), and on the destination `POST state` (site key, builder changes, conversation count, published, what is already held), `POST tickets`, `POST attachment`, `POST bundle`, `POST finish` (uid remap, labels, inventory, note, handoff mode). Added to `OPERATOR_PATHS` and `ACCESS.md` as `/api/handoff/*` and `/b/*/api/handoff/*`. **The production Access application must gain those two destinations** before a handoff can reach production.
- **Order:** destination state read and BUG-51 refusal first (nothing written); then the Library, with the source site key in placements moved to the destination's, so the site import that follows finds every picture already catalogued (no duplicate Library items); then captures; then the site through the existing `/api/export` → `/api/import`; then finish.
- **Shop:** items keep the source's import key (`woocommerce:123`), or `handoff:<source item id>` for hand-made ones, so a re-run replaces the items it brought and leaves the destination's own. Every price row is copied. A published destination's catalog is rebuilt.
- **Handoff note:** `write_handoff_note` on the plan surface (consultant's PlanWork group, also allowed to the talker) writes a `handoff_note` comment on the plan ticket via `writeHandoffNote` in `plan.ts`; a rewrite replaces the body. On the destination the copy writes the same comment and puts the note into REQ-638's `HandoffRecord.note`, which is what the consultant's per-turn handoff line reads.
- **Credentials:** each end uses the credential for its machine (local pair, else cloud pair, for a local end; cloud pair for a cloud end), whichever role it plays.
- **Any-pair data-class rule:** `--chats`/`--contacts` from a cloud source to a local destination stays refused (REQ-294's reasoning); `--chats` with `--handoff` is always refused.

## UATs

`tests/test_UAT_FC_REQ-654_handoff_copy.workers.test.ts`: two origins answered by the real router over real D1/R2; the copy command runs unchanged through its injected transport.