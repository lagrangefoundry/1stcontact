---
uid: comment-97f85575
id: COMMENT-1937
type: comment
title: Comment on request REQ-166
created_by: xgd
created_at: '2026-09-01T00:19:24.380095+00:00'
updated_at: '2026-09-01T00:23:48.080912+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-20bd7d63
  kind: chat_transcript
---

<!-- xgd-turn id="f483668a-c305-4bcf-8bd1-eb32a94e80d0-user" -->

<!-- xgd-chat role="user" ts="2026-09-01T00:18:55.486448+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="f483668a-c305-4bcf-8bd1-eb32a94e80d0-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-01T00:23:48.026715+00:00" -->
#### Claude
I've read the ticket, `DOC-38` §4.2/§5/§9/§10.1, the landed REQ-162 type pack and REQ-163 ingestion pipeline, the capture bundle writer in `tools/generate/src/cli/capture/`, and the vendored `@lagrangefoundry/ticketing` store. Four things I want settled before I cut the branch — the first is a genuine conflict, the rest are scope boundaries.

---

**1. "No new blobs on recapture" is not achievable through `attach` any more.**

The acceptance criterion *"recapturing an unchanged site creates new records but no new blobs"* was written against the content-addressed model. The component has since dropped it — `store.js` `attach`:

> *"The blob is addressed by the record's own uid, so one record owns exactly one blob and the same file attached twice is two blobs and two records. REQ-104 addressed it by content hash and deduplicated; REQ-108 gives that up, because a shared blob cannot be moved to the trash without breaking whichever sibling record still names it."*

So a record pointing at a sibling's blob is precisely what upstream removed on purpose. Three ways out:

- **(a)** Drop the criterion. One `reference` ticket per capture, every member re-attached, storage duplicated on recapture. Record why on the ticket.
- **(b)** *(my recommendation)* Dedup at the **ticket** level: one `reference` per captured URL, found by `fields.source_url`. A recapture reuses it and attaches only members whose `sha256` is new; unchanged members keep their existing record *and* blob. Net effect is the one the ticket actually wants — unchanged bytes are stored once — at the cost of the criterion's exact wording ("new records"), and at the cost of the reference no longer being a point-in-time snapshot of the site.
- **(c)** Bypass `attach` and hand-write attachment records at a content address. Achieves the letter of the criterion and reintroduces exactly the trash bug REQ-108 fixed. I'd rather not.

(b) also has a real downside worth your call: if a site changes between captures, (a) gives you two comparable snapshots and (b) gives you one ticket whose members accumulate. Which matters more to you — storage economy for DOC-15's retained corpus, or capture history per URL?

**2. Where does the client's declared domain come from?**

Rights inference is `captured host === client's declared domain → republishable`, and nothing in the repo declares a domain today — not `siteConfigSchema`, not the tenant row. For now I'd make it an explicit argument to the classifier, and have a mismatch return the *question* (`"is this your site?"`) alongside a fail-closed `third_party` classification, rather than silently assuming. Is that right, or do you want a `domain` field added to the site config / tenant as part of this?

**3. What's the entry point — and is the Node-side pusher in scope?**

REQ-155 (ReferenceStore, capture in workerd) is still `draft`, so today capture only runs in Node via `1c capture page` and writes to `storage/references/<host>/<path>/`; the Worker has no capture route. Following the `/api/import` precedent (Node has no D1/R2, so the Worker is the writer), I'd land:

- `apps/control-app/src/reference.ts` — `ingestCapture(store, bundle, deps)`, the pure pipeline;
- `POST /api/reference` to create the ticket, `POST /api/reference/member` to attach one member (per-member rather than one 23MB multipart, so 99 members stream);
- a member reader — `readMember(store, uid, 'capture.json')` — proving the "single member without materialising the bundle" criterion;
- and a small Node-side pusher that walks a local bundle dir and posts it.

Is the pusher in scope, or do you want just the library + routes, with the wiring left to REQ-155? (I would *not* rewire `reextractFromBundle` itself — that's the ReferenceStore port's job.)

**4. Confirming a decision rather than asking one.** The body description needs both `capture.json` (copy, palette, type) and the screenshot, so I'll add a `DescribeCapture` seam beside `DescribeImage` in `describe.ts` (text + image in one call, capture-specific prompt), and `kind: 'capture'` stops falling through to `unsupported`. Degraded cases reuse the existing `description_status` vocabulary. Shout if you'd rather it were text-only.

Once you answer 1–3 I'll set `status=free_coding`, cut `free-REQ-166`, and record the answers in the ticket body so reconciliation sees the reasoning rather than just the code.

<!-- xgd-chat-end -->