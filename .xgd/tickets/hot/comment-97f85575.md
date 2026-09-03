---
uid: comment-97f85575
id: COMMENT-1937
type: comment
title: Comment on request REQ-166
created_by: xgd
created_at: '2026-09-01T00:19:24.380095+00:00'
updated_at: '2026-09-03T00:12:29.094479+00:00'
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

<!-- xgd-turn id="01a7e6ac-1e73-4dab-b339-f1e0b0d2de36-user" -->

<!-- xgd-chat role="user" ts="2026-09-02T23:33:02.140548+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="01a7e6ac-1e73-4dab-b339-f1e0b0d2de36-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-02T23:35:54.077942+00:00" -->
#### Claude
Let me read the protocol and survey the ground before asking anything.

The protocol doc is xgd-project-specific (pytest). Let me get this project's own conventions.

Important finding — let me confirm where a full capture bundle is actually produced.

I've surveyed enough to implement, and one question genuinely changes the shape of the work. Here's what I found.

**The ground is mostly prepared.** `MATERIAL_TYPES` already includes `reference`, `r2ReferenceStore` uses the same `DB` + `BLOBS` the ticket store uses (so the Worker can already reach a tenant's bundles), `bundleNameFor` already gives one bundle per URL, and `driver.query(EXTRACT_SCRIPT)` runs in-page so `document.title` is a one-line addition to the extract signals.

**The gap: nothing triggers the transition.** A complete bundle is only produced by `cmdCapturePage`, called from the `1c capture page` CLI. It takes a `ReferenceStore` and nothing else — REQ-155 deliberately removed `node:fs` from that module's graph, and handing it a `TicketStore` would put D1 back in the CLI's import graph for the same reason. Meanwhile `shot.ts` says in as many words that no route exposes Browser Rendering yet, on purpose, because rate-limiting and authorisation belong to REQ-157.

So the ticket needs an entry point it doesn't currently name.

## Q1 — What triggers the ticket creation? (blocking)

My recommendation: **a Worker route that adopts an already-written bundle by name** — `POST /api/material/capture {bundle}` — reading the bundle out of R2 through `r2ReferenceStore`, creating the `reference` ticket, attaching each member, and indexing it. That matches the ticket's own out-of-scope line, *"The capture pipeline itself — REQ-154/REQ-155. This consumes what they produce."* It's drivable end-to-end through `route()` in a UAT exactly like REQ-163's, with no browser in the test.

The alternative — having `1c capture page` create the ticket itself — I'd avoid for the import-graph reason above.

Is an adopt route right, or did you intend REQ-166 to also grow the in-Worker capture trigger (which would pull REQ-157's rate-limiting question in with it)?

## Q2 — Who calls it? (affects auth, not structure)

If it's the adopt route: is it operator/assistant-facing for v1, or does the builder UI need a "capture a site" control? Nothing in the Library UI currently initiates a capture, and I'd rather not invent that surface unasked. My assumption unless you say otherwise: **no new client-facing control** — the route exists, the Library displays the result.

## Assumptions I'll proceed on without asking

- **`title` is optional** on the `Capture` interface, with `host` as the fallback — matching the existing precedent there (*"All optional so pre-REQ-47 `capture.json` bundles still parse"*), so bundles captured before this change keep working.
- **The describer reuses `describe.ts`'s model seam** rather than introducing a second one, stubbed at that boundary in tests as REQ-163 stubs vision.
- **The file route grows a `member` parameter** (`/api/material/file?uid=X&member=screenshot.full.png`) rather than a new route.
- Test naming `test_UAT_FC_REQ-166_*` in `tests/`, driven through real entry points, no mocks of anything we own.

One practical note: this worktree is missing `apps/control-app/src/generated/` (gitignored, and its absence breaks webui resolution and the workerd project at import). I'll restore it from the main checkout before running anything — flagging it so a failing suite later isn't mistaken for a code problem.

Answer Q1 and I'll start; Q2 I can proceed on the stated assumption if you'd rather not decide it now.

<!-- xgd-turn id="499765de-b8ed-4294-a3d7-b275aa820e3e-user" -->

<!-- xgd-chat role="user" ts="2026-09-02T23:43:56.142421+00:00" -->
#### You
## Q1 -- I don't mind your recommendation is fine

Q2 — Who calls it? <-- Right now the AI it need to be exposed as a tool for AI use there may be a UI later if its relevant

<!-- xgd-turn id="499765de-b8ed-4294-a3d7-b275aa820e3e-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-03T00:12:29.021840+00:00" -->
#### Claude
Q2 changes the entry point from a bare route to a tool. Let me see how tools are registered.

The fidelity surface already has a `capture_result` shape — let me check whether the assistant can already capture.

`capture_site` already exists as an assistant tool — and today its bundle "lands in the ReferenceStore and stops there", exactly the asymmetry the ticket describes. Let me read it.

Now I have the full picture — and the answer to Q2 is better than a new route. Recording the entry-point decision in the ticket before I write code.

Ticket is at `free_coding` and the worktree has its generated assets. Now implementing.

Now the first change — capturing the page's own title.

Now the core module. Let me read the ingest path and store interface I need to mirror.

Now the schema field that makes a bundle findable, then the core module.

Now the capture describer.

Two findings on recapture that need care — let me verify one before I write.

Now the core module.

Now wiring `capture_site` to it. Let me add the optional dep and the report.

Now the Worker supplies the dep. Let me wire `shot.ts` and the router.

The Worker doesn't yet compose the fidelity surface (REQ-157 left that unwired), so I'll supply the dep where it will land. Adding it to `shot.ts`:

Now the member-addressed file route and the member list on read.

Now the Library. Let me check the client API helper first.

Now the Library detail pane.

Now the link safety — following a captured URL must not navigate the builder away.

Now let me typecheck the TypeScript side.

Backticks in my comment terminated the template literal. Fixing:

These are pre-existing — wrong tsconfig (no workers types). Let me use the app's own.

Pre-existing on main too. Now the `tools/generate` side.

Now the UATs. Let me look at the fixtures and vitest projects.

Now the workers UAT.

Now writing the real test file.

8 passing. Now the tool-surface UAT — let me see how REQ-157 drives `capture_site`.

`RawSignals.title` is now required, so the shared fake driver needs it — and that also lets the title be proved end-to-end.

Now the tool-surface UAT — driving `capture_site` through the real Toolbox.

My expectation was wrong about the root-path slug (`index`, not `_`). Fixing the test:

Now the Library UI UAT. Let me check REQ-172's detail-pane test for the DOM harness.

I have the harness. Writing the Library UAT:

6 passed — let me confirm they actually ran rather than silently skipping.

All 17 UATs run and pass. Now regression on everything I touched.

Those skipped — worth understanding, since my own Library test ran.

Let me compare against the main checkout to see whether that skip predates my change.

A concurrent REQ-178 merge is mid-flight in the main checkout — not mine to touch. Back to my worktree:

Identical guards, different outcomes — let me find out what's actually true.

That earlier "skipped" was an artifact of my bad filename in the batch. Re-running properly:

36 pass. Now the material, store, capture and fidelity suites.

Let me run the full suite to catch anything I haven't thought of.

One failure, in a file I never touched. Let me establish whether it's mine.

Confirmed pre-existing — it fails with all my work stashed. Let me verify my changes restored, then correct the ticket where my implementation diverged from it.

Now the version bump and commit.

Committed as `f1a2b408`. Before merging back, let me check the concurrent merge and whether my version is already claimed.

The concurrent merge finished and resolved that conflict. My version bump is now behind — let me check.

xgd-working moved to 0.2.51 while I worked. Let me take the lock and integrate.

Only the version scalar conflicts, as expected. Resolving above working's version:

Merged. Now verifying the suite still passes on `xgd-working` post-merge.

Two failures. Let me check whether either is mine.

`dist-assets.staging` no longer exists — a transient artifact from a concurrent build. Re-running both failures:

`reconciliation-builder-workspace-origin` passes on re-run — it was the transient staging dir. `bug32` remains the pre-existing failure I proved earlier by stashing. Now the promotion gate:

Another process landed on `xgd-working` while I was testing. Let me look.

My merge is in — the later commits are just xgd ticket bookkeeping. Following the gate's instruction to re-bump:

Another agent is actively committing to `xgd-working` (a different ticket). Let me bump and gate atomically so nothing interleaves.

Promoted. Releasing the lock and tearing down the branch:

REQ-166 is implemented, merged into `xgd-working`, and at `free_coded`.

## What landed

**The transition** — `apps/control-app/src/capture-material.ts`. A completed bundle becomes one `reference` ticket with one attachment record per member, each carrying `meta.member`. Rights come from provenance alone: the client's own domain (or a subdomain) is republishable and not exportable, anything else the reverse.

**The title** — `document.title` is now read by the extractor and carried on `Capture` as an optional field, so bundles written before this still parse. Falls back to the host.

**The body** — written from `capture.json` plus the screenshot, opening with a markdown link to the captured site. The model is asked what only looking can answer; the palette, type and section count are read from `capture.json` rather than guessed. All three degraded paths keep the link and the measured facts — only the prose is lost.

**The entry point** — `capture_site`, the tool the assistant already had. The ticket store reaches it as an optional `FidelityDeps` dep, so the `1c` CLI captures exactly as before and reports that no reference was written.

**The Library** — screenshot preview addressed as one member, file count in place of the *File* field, screenshot as the download, and description links that open away from the builder so following one can't discard unsaved editing state.

17 UATs across three files, all passing: adoption and member addressing through the Worker's own route against real D1/R2, `capture_site` through the real fidelity operations, and the pane against the installed webui components.

## Three things worth your attention

**I corrected two of your decisions in the code, and recorded why in the ticket.** The acceptance line *"recapturing creates new records but no new blobs"* was written when attachments were content-addressed; the component has since withdrawn that. I did the dedup here instead against the `sha256` it still records — so an unchanged recapture now writes **neither** a blob nor a record, which is stronger than what was asked for. And I keyed the ticket on the **bundle name** rather than the URL: `bundleNameFor` drops the query string, so URL-keying would let one bundle grow two tickets.

**The Worker doesn't compose the fidelity surface yet.** REQ-157 built and proved it but `workerHost` never passes `fidelity`, so `capture_site` isn't reachable from a deployed chat session today. My wiring is in place for when that lands — the UATs drive the real operations directly, as REQ-157's own do — but this capability isn't live in the Worker until someone wires that. That's REQ-157's gap, not something I widened scope to fix.

**One pre-existing test failure.** `bug32-webui-scope-rebrand` fails because `test_UAT_FC_BUG-42_markdown_rendering.test.ts` names the component scope outside the permitted set. I confirmed it by stashing all my work and watching it still fail. Everything else is green — 2343 passing.

The promotion gate fought a concurrent agent committing to `xgd-working` for another ticket, which is why the ticket carries four SHAs: the feature commit, the merge, and two version bumps burned to the race.

<!-- xgd-chat-end -->