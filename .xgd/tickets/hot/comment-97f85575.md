---
uid: comment-97f85575
id: COMMENT-1937
type: comment
title: Comment on request REQ-166
created_by: xgd
created_at: '2026-09-01T00:19:24.380095+00:00'
updated_at: '2026-09-02T23:22:09.994193+00:00'
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

<!-- xgd-turn id="ef95cb6f-e386-43a9-9b37-5886ce18ea96-user" -->

<!-- xgd-chat role="user" ts="2026-09-02T22:29:09.006061+00:00" -->
#### You
I agree with B. can we talk about the user experience for a second. After this ticket is created if we capture a site does it appear in my library? What does it look like?

<!-- xgd-turn id="ef95cb6f-e386-43a9-9b37-5886ce18ea96-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-02T22:30:54.999685+00:00" -->
#### Claude
I'll ground this in what's actually built rather than what's designed. Let me look.

Good question to ask before cutting the branch, because the answer turns out to be *"yes, automatically"* — and that's what makes the gaps worth deciding now rather than discovering later.

## It already appears — REQ-161 built the shelf

Two things are already in place, both anticipating this ticket:

- `material.ts:702` — `MATERIAL_TYPES = ['material', 'reference']`, and `listMaterial` queries both types into one list.
- `builder/library.js` — `KINDS = ['image', 'document', 'font', 'capture']` in the kind filter.

So the moment REQ-166 writes a `reference` ticket, it shows up in the Library with no UI work at all. Nothing to build for it to be *visible*.

## What it looks like today, unchanged

**The row**: title, plus a `capture` kind badge. No role badge (roles are `site` / `reference` — both about a *dropped* file; a capture wasn't dropped). No "On this site" badge. That all reads correctly.

**The detail pane** is where it comes apart, because every part of it assumes *one ticket = one file* and a bundle is 11–99:

| Element | What happens |
|---|---|
| **Preview** | `kind !== 'image'`, and `readerKind()` on a resolved `application/octet-stream` returns null → **nothing renders**. The screenshot — the one thing that makes a captured site instantly recognisable — is sitting right there as a member and isn't shown. |
| **"File"** | `rowOf` falls back `filename ?? ticket.title`, so the File field shows the ticket title. Reads like a bug. |
| **Download link** | `materialFile` takes `attachments[0]` — an arbitrary member. The link labelled *gigabytealchemy.ai* serves whichever member sorts first, probably `assets/hero.jpg`. That's a wrong answer, not a cosmetic one. |
| **Rights block** | Genuinely good already: `source_url` shows the captured address, and a competitor capture reads **"Can appear on the site: No"** — exactly the reassurance §10.1's inference is for. |
| **Description** | The AI's prose about the site, rendered as markdown, editable by the client. The good bit, and the bit the KB indexes. |

## Four decisions this raises

**1. The preview is the screenshot.** Highest-value change and it costs nothing extra: the member-addressed file route (`?uid=X&member=screenshot.full.png`) is already required by the ticket's *"read a single member without materialising the bundle"* criterion. The UX need and the architectural criterion are the same route.

**2. What replaces "File" and the download link.** My recommendation: drop the filename field, point the download at the screenshot, and add a plain *"99 files captured"* line. The client's model of a capture is *"a picture of that site and what you thought of it"* — members are re-extraction machinery, not something to browse. A 99-row member list would be honest and useless.

**3. The title should be AI-written, like the body.** DOC-38 §7 is explicit that project-KB entries have an AI-written title over an AI-written body — *"a `material` ticket is not called `Notes.pdf`"*. So *"Gigabyte Alchemy — dark, gold-accented consultancy site"* rather than the bare host, with the host visible in `source_url` beneath it.

**4. Recapture behaviour is a direct consequence of choosing (B).** One `reference` per URL means the row doesn't multiply — it updates in place and floats to the top of the list. But: **does a recapture overwrite a description the client corrected?** `reviseDescription` sets `description_model: 'client'` precisely so a re-describe pass can't clobber their words. If the site genuinely changed, their description is stale too — but silently replacing what they wrote is the worse failure. I'd re-describe only when `description_model !== 'client'`, and leave a visible marker otherwise. Your call.

One thing I'd flag but not change: a competitor capture sitting in *"Your material"* alongside the client's own photos is slightly odd phrasing, but I think showing it is right — it's transparent about what we hold on their behalf, and the rights block says plainly that it can't reach their site.

Say which way you want 1–4 and I'll record the reasoning in the ticket body, set `status=free_coding`, and cut the branch.

<!-- xgd-turn id="c7a54191-2a11-4412-a534-ddec2c6763e9-user" -->

<!-- xgd-chat role="user" ts="2026-09-02T23:19:28.966005+00:00" -->
#### You
**The preview is the screenshot. <-- this**

**What replaces "File" and the download link.** My recommendation: drop the filename field, point the download at the screenshot, and add a plain *"99 files captured"* line. The client's model of a capture is *"a picture of that site and what you thought of it"* — members are re-extraction machinery, not something to browse. A 99-row member list would be honest and useless. <-- sure AND can we make sure the body notes always begin with a clear link to the site captured please

3. The site has a title, why not use that? The same that appears in my browser tab

4. Good - yes overwrite we don't want to store inacceible garbage copied from elsewhere - archiving 3rd party sites is NOT our goal

<!-- xgd-turn id="c7a54191-2a11-4412-a534-ddec2c6763e9-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-02T23:22:09.703571+00:00" -->
#### Claude
Taking 1, 2 and 4 as decided. Two things to verify before I write them into the ticket — whether the markdown renderer actually keeps links, and what `capture.json` already carries for a title.

Both checks came back with something that changes #3. Let me read the full ticket body before I touch it.

Two findings that bear on your answers:

**#3 — the browser-tab title isn't captured.** `capture.json`'s schema (`tools/generate/src/cli/capture/types.ts:562`) is `url, host, path, capturedAt, viewport, theme, sections, assets`. No `title`. It exists in `rendered.html` but not in the structured essence, and re-extraction reads `capture.json` first — so parsing it out of the HTML at ticket-creation time would duplicate parsing logic that re-extraction wouldn't benefit from. I'd add `title` to the §4 schema and read `document.title` in the capture pass: one field, one line. That crosses into `tools/generate`, which this ticket currently lists as out of scope, so I'll note the exception explicitly rather than let it look like scope creep. Fallback to `host` when the title is blank.

**Your link request works, with one snag.** `renderSafe` is DOMPurify on default config, so a markdown link in the body renders as a real clickable anchor. But the default adds no `target`/`rel` — clicking a captured competitor's URL would navigate the whole builder away and lose editor state. Cheap to fix where the description is painted.

Appending the decisions to the ticket body — append-only so nothing existing is disturbed.

Dependencies are clear — REQ-162 `free_and_reconciled`, REQ-163 `bundled`. Cutting the branch as promised.

Ticket scoped and the branch is cut at `/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-REQ-166`.

**What I recorded** — a *"What the client sees"* section covering all four decisions, with acceptance criteria that give each one something a UAT can trace to:

- Screenshot as the preview, fetched as a single member — noting this is the same member-addressed read the re-extraction criterion already needed, so it's one route rather than two.
- Detail drops the *File* field, downloads the screenshot, states the member count.
- Body opens with a markdown link to the captured URL, which must not navigate the builder away.
- Title from the page's own `<title>`, falling back to `host`.
- Recapture overwrites the description in place.

**Two things I wrote down as deliberate rather than incidental**, because both look like mistakes to anyone reading the code later:

The `title` field is a **named exception** to *"the capture pipeline itself is out of scope"* — the ticket says so in as many words, so reconciliation doesn't read a `tools/generate` change as drift.

Overwriting on recapture is an **exception to the `description_model: 'client'` protection** REQ-161 added. That guard exists so a background re-describe pass can't silently replace a client's words about their own material; a recapture is an explicit act about a page that has demonstrably moved. I wrote the distinction into the body in your terms — stale prose about a third-party page is inaccessible garbage, and archiving other people's sites isn't the goal — so the exception reads as reasoned rather than forgotten.

Two things worth knowing before I write code:

The dependencies are clear (REQ-162 `free_and_reconciled`, REQ-163 `bundled`), but this ticket now spans three subsystems — `tools/generate` for the schema field, `control-app/src/material.ts` for the member-addressed file route, and `builder/library.js` for the capture-shaped detail. At 8 story points that's the largest single piece of work in this area so far.

I also haven't verified the worktree renders — memory records that a worktree breaks webui resolution and needs `src/generated/*` copied from the main checkout before the builder suites will run. I'll deal with that when I get there rather than assume it.

Want me to start implementing, or would you rather review the ticket body first? `xgd ticket get REQ-166` shows it.

<!-- xgd-chat-end -->