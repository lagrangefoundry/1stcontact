---
uid: comment-fd21bf4f
id: COMMENT-97
type: comment
title: Comment on request REQ-54
created_by: xgd
created_at: '2026-07-12T23:39:16.035998+00:00'
updated_at: '2026-07-13T15:55:11.531990+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-dfc95a22
  kind: chat_transcript
---

<!-- xgd-turn id="cc30b72a-bdca-425c-8a73-4d2a1d57eef7-user" -->

<!-- xgd-chat role="user" ts="2026-07-12T23:39:12.962570+00:00" -->
#### You
Please read the ticket and tell me if you have enough information to free code it?

<!-- xgd-turn id="cc30b72a-bdca-425c-8a73-4d2a1d57eef7-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-12T23:42:05.739891+00:00" -->
#### Claude
I'll read the ticket and the referenced spec doc to assess whether it's ready to free code.

The ticket body is well-populated. Before I answer, let me assess the actual scope against the codebase — this ticket spans 5 workstreams (schema, parser, render, capture, diff), and scope is the deciding factor for whether it's free-codeable at all.

I've already got DOC-22 (the full spec) in my context. Let me wait for the reconnaissance to come back before answering.

I have a strong picture forming. Let me get the schema/migration specifics from the reconnaissance agent before I give you a precise answer.

I have enough to give you a grounded answer. Here's my assessment.

## Is the ticket well-specified? — Yes.

The information to build from is all here:
- **DOC-22** is the authoritative model (baseline+runs, the `[text]{field=value}` grammar, CommonMark escaping §4.1, the `parse(serialize(runs)) === runs` invariant §5, read/represent symmetry).
- The ticket enumerates 5 workstreams + 6 ACs.
- The codebase already has the foundations: `TextRun` type + `resolveTextStyle` (REQ-50), `renderMarkdown`, object-grouped diff pairing (REQ-51), and per-run computed-style capture. Only **2 site docs** need migrating (`1stcontact` and `gigabytealchemy` home.json).

## Is it free-codeable as a single ticket? — No. It's too big, and it's develop-shaped.

Per FREE-CODING.md, anything over ~20 story points isn't free-codeable — it's an `xgd develop` ticket in disguise. This spans:

| Workstream | Where | Weight |
|---|---|---|
| 1. Schema swap | `site-schema/{schema,validate,types}.ts` + framework `validateModuleContent` | medium |
| 2. Parse/serialize | **new** pure module (markdown desugar + attribute-span grammar + escaping + round-trip) | medium, self-contained |
| 3. Render | `text-style.ts` + **6** module `.astro` files (text-block, services-grid, contact-form, hero, header, footer) | medium |
| 4. Capture projection | `extract.ts` (681 lines) + `pipeline.ts` — the ticket's flagged "lead risk" | large |
| 5. Diff pairing | `values-diff.ts` (1712 lines) | medium |

That's easily >20 points, multi-day, cross-cutting.

**The coupling is the real problem.** The ticket mandates "no legacy dual-model — migrate the docs." So the moment you change the content shape, render + the 2 site docs all break until updated *in the same commit*. You can't land the schema change green in isolation. That tight atomic coupling is exactly the signal for `xgd develop` (design first) rather than free-coding.

## One genuine spec ambiguity worth resolving first

DOC-22 says the model "applies to **every** text-bearing module," but today `heading`/`eyebrow`/`cta`/`nav`/`wordmark` are single `TextRun`s (text+style), and only `body` has the `string + bodyStyle` split. **Does `{baseline, runs[]}` replace the content shape for *all* those fields, or only the multi-run prose/body fields?** This single decision swings the blast radius enormously (6 modules × 4-5 fields each vs. just the body fields). It's not answered by DOC-22's examples, which are all body-prose.

## My recommendation

Two viable paths — your call:

1. **Route to `xgd develop`** — cleanest fit given the atomic schema↔render↔docs coupling. Design pass resolves the ambiguity above and sequences the work.

2. **Split into a free-coded sequence** (each ≤20 pts, independently reconcilable):
   - **A:** the pure parse/serialize module (workstream 2) — no schema dependency, cleanly testable, lands first.
   - **B:** schema + render + doc migration (1+3) — the "represent" side, must land atomically.
   - **C:** capture projection + diff pairing (4+5) — the "read" side.

   Note: this violates the one-ticket-per-intent default, so it needs your explicit go-ahead to create the sibling tickets.

How would you like to proceed — `xgd develop`, or split into the A/B/C free-coded sequence? And do you have a call on the baseline+runs-everywhere vs. body-only ambiguity?

The reconnaissance is back and it confirms the assessment — nothing changes my recommendation, but it sharpens two points:

- **The ambiguity is narrower than I feared, but real.** Modules already distinguish markdown `body` (prose) from flat `heading`/`cta`/`bodyStyle` runs. DOC-22's `{baseline, runs[]}` most naturally lands on the **prose/body** field (giving it per-run styling it lacks today), while `heading`/`eyebrow`/`cta` are already single `TextRun`s. So the likely-intended blast radius is "body-shaped fields become baseline+runs," not "rewrite every field." But DOC-22's "every text-bearing module" wording still needs your explicit call before anyone builds — it's the difference between a contained change and a sweeping one.

- **Workstream 4 (capture) is confirmed as the dominant cost and the ticket's own flagged lead risk.** `RawRun`/`ValueElement` mirror the content shape field-for-field across ~2000 lines of extract + values-diff, so the schema change ripples straight through the read side. Migration itself is trivial (only 14 styled-run instances across 2 sites).

Net: **well-specified, but too large and too tightly coupled to free-code as one ticket** — it's develop-shaped. My two paths stand (route to `xgd develop`, or split into the A/B/C free-coded sequence).

Your call on how to proceed, and on the baseline+runs-everywhere vs. body-only question — I'll hold until you decide.

<!-- xgd-turn id="2a13bb6d-fe4b-4b00-9ff0-14968e2e46c4-user" -->

<!-- xgd-chat role="user" ts="2026-07-12T23:46:36.326977+00:00" -->
#### You
I think this needs to apply to all text fields... how do we handle text fields without it? That doesn't seem to be where you're going maybe you need to tell me more about your perspective on this. I also don't really understand why it represents a bigger "blast radius" surely you implement this once and it applies to all text Fields??

You can code this in multiple stages as one ticket there's no need for multiple tickets.

<!-- xgd-turn id="2a13bb6d-fe4b-4b00-9ff0-14968e2e46c4-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-12T23:48:08.184112+00:00" -->
#### Claude
You're right, and I was overcautious — let me give you the real picture and correct my framing.

## "How do we handle text fields without it?" — there is no "without it"

That's the key insight I buried. In this model a plain single-style field isn't a separate case — it's the **degenerate** case: `{ baseline, runs: [{ text: "..." }] }` — one run, zero overrides. `baseline` is the cascade; `runs` only carry what *differs* from it (CSS-inheritance semantics, exactly as DOC-22 specifies). A heading with uniform styling is just baseline + one run with no override fields. A prose body with an italic 18px tagline over 16px paragraphs is baseline + several runs, each overriding only `fontStyle`/`fontSizePx`.

So the model is *uniform*. Every text field is `{ baseline, runs[] }`. Most fields happen to have one run and no overrides. And the ticket already commits to exactly this — "**Applies to every text-bearing module.**" So there's no real ambiguity to resolve; all-fields is the spec, and it's the right call.

## Why you're right that "blast radius" was the wrong word

You've got the architecture correct: the **core is implemented once** — one schema shape, one `resolveTextStyle` (extended from single-run to run-list), one parse/serialize unit — and every field inherits it. I conflated two different things:

- **Design/algorithmic risk** — the genuinely hard, novel engineering.
- **Mechanical breadth** — number of edit/migration sites.

All-fields adds to the *second* but **not** the *first*. The mechanical breadth is: each module template reads the new shape, and each field in the 2 site docs gets migrated. That's uniform find-and-replace work — more sites than body-only, but not more design.

The genuinely hard part lives entirely in **multi-run** content: capture projecting a block into baseline + per-run deltas (derive the dominant baseline, emit each run's override, group by paragraph) and the diff pairing runs-within-block. That only bites where a block *has* multiple runs — i.e. prose bodies. Single-value fields (headings, eyebrows, CTAs) project trivially: one run, no overrides. **So going all-fields adds ~nothing to the hard part** — it just unifies the easy part. My earlier framing was wrong; thank you for pushing on it.

## And all-fields is actually the *simpler* end state

It lets us delete concepts, not add them: the `body: string + bodyStyle` split goes away, *and* the style-only sidecar fields (`subheadStyle`, `captionStyle`, `navStyle`) collapse into each field's `baseline`. One shape everywhere instead of three patterns. That's fully in line with the "no legacy dual-model" mandate.

## One ticket, staged — agreed

Staging as commits within REQ-54 (not separate tickets):

1. **Parse/serialize** — the pure unit (markdown desugar + `[text]{…}` spans + escaping + round-trip). No schema dependency; lands green on its own first.
2. **Schema** — replace field shapes with `{ baseline, runs[] }`; drop `bodyStyle`/`*Style` sidecars.
3. **Render** — `resolveTextStyle` single→list; update all module templates.
4. **Migrate the 2 site docs.**
5. **Capture projection + serialize**, then **diff run-within-block pairing.**

The only constraint: because there's no dual-model, stages 2–4 must land **atomically green together** (a schema swap breaks render + docs until all three are updated). Stage 1 is independently green; stage 5 follows. UATs named `test_UAT_FC_REQ-54_*` per the ACs.

REQ-54's body already captures the all-fields decision correctly, so no body edit is needed to proceed.

Shall I start on **Stage 1** (parse/serialize + its property/round-trip UAT)?

<!-- xgd-turn id="15f6f3c9-27e7-4e0f-af79-bf6139fd44ad-user" -->

<!-- xgd-chat role="user" ts="2026-07-12T23:51:31.919345+00:00" -->
#### You
Yes

<!-- xgd-turn id="15f6f3c9-27e7-4e0f-af79-bf6139fd44ad-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-13T00:03:01.112949+00:00" -->
#### Claude
Let me read the authoritative spec (DOC-22) and the existing code I'll be building against.

Now let me understand the package layout, existing conventions, and the exact run field set I'll parse to/from.

Both `framework` and `generate` depend on `site-schema`, and `generate` depends on `framework` — so the parse/serialize unit belongs in **framework** (alongside `text-style.ts`/`markdown.ts`), where the capture serializer can import it. Let me read the current `TextRun` and text-style to stay field-consistent.

Now let me check the test conventions in `framework` so my UAT matches house style, and confirm the test runner.

I have everything I need: the full DOC-22 grammar, the `TextRun` vocabulary, test conventions (`tests/*.test.ts`, run via `vitest run`, no `fast-check` so I'll write a deterministic generator), and the module home (`packages/framework`).

REQ-54 is already scoped with a full behavior description and ACs (workstream 2 = this stage), so the precondition is met. Let me write the pure parse/serialize unit.

Let me fix a latent coercion bug — `href`/`color`/`fontFamily`/`emphasis` are string-only fields and must never be coerced to numbers (an all-digit `href` would corrupt the round-trip).

Now export the new unit from the framework index, then write the UAT suite.

Now the UAT suite covering all six ACs, including a deterministic property/round-trip generator (no `fast-check` in the repo).

The `quoted_attribute_value` test needs a style override alongside `href` to force the span path (where quoting actually happens) rather than the markdown-link path. Let me fix that.

The 500-seed property test passes — the one failure is the attribute-block reader closing on a `}` that sits *inside* a quoted value. The `{…}` reader needs to be quote-aware. Let me fix `parseInline`.

All 8 pass, including the 500-seed property test. Now let me typecheck and run the full suite to confirm no regressions from the index export changes.

All 551 tests pass, typecheck clean. Let me check lint/format tooling before committing so the code is gate-ready.

No linter/formatter configured; code matches the no-semicolon house style, typecheck and all 551 tests pass. Let me commit **only my Stage 1 files** (leaving the unrelated pre-existing faelan deletions out of this commit).

Committed (sha `05767c0e`), only my 4 files — the faelan deletions were left untouched. Now the free-coding bookkeeping: record the commit on REQ-54 and note Stage 1 landed. Let me check the ticket-update interface.

I'll record the commit and append a staging note to the ticket body (preserving the existing body). I'll keep the status as-is rather than flip to `free_coded` — the ticket's ACs span all five workstreams (render, capture, diff), so it isn't code-complete until the final stage lands; flipping now would falsely signal the matrix that the whole behavior is covered.

Let me verify the ticket update landed cleanly.

Stage 1 is done and committed. Here's where we are.

## Stage 1 landed — the styled-text notation

**New pure unit:** `packages/framework/src/modules/text-markup.ts`
- `serializeStyledText(content)` / `parseStyledText(markup)` / `normalizeRuns(runs)` + types `StyledText` / `StyledRun` / `StyleOverride` / `Emphasis`, exported from the framework index.
- **Round-trip is bulletproof by design:** the serializer emits only self-delimiting forms (bare escaped text, `[text](href)` links, generic `[text]{k=v …}` spans), so `parse(serialize(x)) === normalize(x)` holds exactly. The parser *additionally* accepts markdown shorthands (`*x*`, `**x**`, `***…***`, `> …`) so authors can type them — but the serializer never depends on their trickier re-parsing.

**UATs** (`tests/req54-styled-text-markup.test.ts`, all 6 ACs):
- `test_UAT_FC_REQ-54_roundtrip_invariant` — **500-seed deterministic property test** (no `fast-check` in the repo, so I wrote an xorshift generator) over delimiter-laden text, dense per-run overrides, paragraphs, blockquotes, baselines.
- markdown desugaring · attribute-span overrides · baseline fence · delimiter escaping · quoted attribute values.

**Verification:** `8/8` new + `551/551` full suite green; framework typecheck clean.

**Bookkeeping:** committed `05767c0e` with `[FREE-CODED]` (only my 4 files — the pre-existing faelan deletions were left untouched); recorded on REQ-54's `commits` field with a staging note appended to the body.

## Two decisions I made worth flagging

1. **Scope boundary of the notation:** it covers the scalar `TextRun` overrides + `href` + `emphasis`. `gradient` and `position` are structured, so they stay **runtime-only** (JSON on the run object), outside the string surface — DOC-22 §4's attribute-span is scalar `k=v`, and §8 defers richer forms. Stages 2/4 must carry those two fields as JSON, not markup. Flagging in case you'd rather I invent a notation for gradients now.

2. **I did *not* set `status=free_coded`.** The ticket's ACs span render (Stage 3) and capture (Stage 4), so it isn't code-complete — flipping now would tell the capability matrix the whole behavior is covered when it isn't. It stays `draft` until the final stage lands. The commit is recorded regardless.

## Next: Stage 2 (schema) — one design call before I start

Stage 2 replaces the field shapes with `{ baseline, runs[] }` and deletes the `bodyStyle`/`subheadStyle`/`captionStyle`/`navStyle` sidecar fields. Per "no dual-model," it must land atomically green with Stage 3 (render) + Stage 4 (doc migration) in one commit — so Stage 2 alone won't be independently green.

The one thing worth settling before I touch the schema: today `heading`/`eyebrow`/`cta` are single `TextRun`s (text **and** style in one object), while `body` is `string + bodyStyle`. Converting all of them to `{ baseline, runs[] }` is the uniform end state — but it churns every module template and both site docs. **Confirm you want the full uniform conversion** (my read of DOC-22 §3), and I'll proceed with Stages 2–4 as one atomic change. Or say the word and I'll pause here.

<!-- xgd-turn id="202c56be-536e-4134-a625-f316dcd5825c-user" -->

<!-- xgd-chat role="user" ts="2026-07-13T06:07:16.340632+00:00" -->
#### You
Proceed with stage 2

<!-- xgd-turn id="202c56be-536e-4134-a625-f316dcd5825c-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-13T06:10:23.819489+00:00" -->
#### Claude
The user confirmed the full uniform conversion. As I flagged, "Stage 2" here means the atomic schema + render + doc-migration change (no dual-model). Let me update the ticket to mark this stage in progress, then read every edit target precisely.

This is a large, delicate refactor. Before writing code I need the exact blast radius — every `styled-text` field declaration, every template consumption, every test that constructs run content, and the conformance payload generator (which auto-builds module content). Let me measure it precisely.

The hard data confirms this is genuinely large: **24 test files** touch module content, plus 7 templates, 7 metas, the conformance payload generator, schema, and validate. And I've hit a real design fork I can't invent past: `body`/`subhead`/`caption` are `type: 'markdown'` (rich markdown → HTML, incl. lists), *separate* from the `styled-text` fields. DOC-22 §8 defers "rich embeds," so converting markdown-body → runs risks dropping list/heading support. Let me check whether the two site docs actually use rich markdown before deciding — legwork, not a question for you.

I've now confirmed the exact picture by reading the actual content, and I've hit one genuine blocker I shouldn't invent past — it changes what renders on a live page, so it needs your call. This is not the "all fields" decision again (that's settled); it's a specific content-representation gap.

## Confirmed scale (so you can calibrate)
The atomic schema+render+migrate change touches: **schema.ts + validate.ts**, **7 module metas**, **7 `.astro` templates**, the **conformance payload generator**, **2 site docs**, and **~24 test files** that construct content in the old shape. Large but mostly mechanical — except for the fork below.

## The blocker: `markdown`-type body fields vs. the run model

There are two *different* content types today, and DOC-22 only cleanly covers one:
- **`styled-text` fields** (heading, eyebrow, subhead-style, cta, title, wordmark, submitLabel, navStyle, bodyStyle) → convert cleanly to `{ baseline, runs[] }`. This is the uniform "all fields" conversion, no issues.
- **`markdown` fields** (text-block `body`, services-grid `body`/`subhead`, contact-form `subhead`/`caption`/`successMessage`) → these carry **rich prose**. DOC-22 §2–3 wants `body` unified into runs (it's the motivating case — per-run styling *within* a body), but §8 defers rich block structure.

I read the actual body content. Almost everything is representable by the Stage-1 notation — **bold, italic, blockquote, multi-paragraph** all round-trip (e.g. gigabytealchemy's `*Your private space to think out loud*\n\nA voice-first app…`). **One thing is not:** the 1stcontact homepage body has an **ordered list**:

```
"1. Pick a starting point.\n2. Drop in your words and pictures.\n3. Publish. Every version is kept, so you can always roll back."
```

The run model + notation deliberately has no list marker. So merging `body` into runs either drops this list or requires extending the model beyond DOC-22.

## Your call (one decision)

1. **Migrate that one list to styled prose runs now** (I'll show you the exact before/after render — it becomes three short lines/paragraphs instead of a numbered list). Lowest scope; keeps Stage 1's notation as-is. Only visible change is that one list's appearance. ← my recommendation.
2. **Add list markers to the run model + notation first** — reopens Stage 1, larger, but "properly" represents lists.
3. **Leave `markdown` fields as markdown**, convert only the already-`styled-text` fields. But this *doesn't* solve REQ-54's motivating case (per-run styling inside a body), so I don't recommend it.

Which way? If (1), I'll proceed to write the whole atomic change (schema → render → migrate, all 24 test files updated) and show you the one list's rendered diff before committing.

<!-- xgd-turn id="7b9feb82-8120-4e6b-81e0-b4b09b46c2ab-user" -->

<!-- xgd-chat role="user" ts="2026-07-13T15:23:08.258668+00:00" -->
#### You
Lets talk a little more about how this works. There's an aspect here that I don't completely understand - the UX of these text blocks.

The user needs to be able to edit this text blocks directly. The user does not need to know or understand any kind of text representations.

The experience that I would like is that the user select a text box, clicks on and opens a WYSIWIG editor. I was expecting that the representation would be marked down because that makes the editor easy. However, so long as we can translate whatever we do into something that we can represent in the editor then it's OK. And the editor representation doesn't have to be perfect it doesn't have to be the right width it doesn't have to have exactly the right font or the right font sizes. It probably does need to be able to indicate italics, bold face, bullet lists, etc. it probably needs to capture certain changes in font size or font color.

I think the answer here for your question is probably number two and the scope is bigger than you are suggesting. It is not just lists I would like to represent, I would like to capture tables and block quotes and code etc.

But tell me if two works with my new constraints around user experience

<!-- xgd-turn id="7b9feb82-8120-4e6b-81e0-b4b09b46c2ab-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-13T15:25:03.570333+00:00" -->
#### Claude
Great question — and it exposes a real fault line in the model that we should settle now, before Stage 2 hardens the wrong shape. Let me give you my honest read.

## Short answer

Option 2 is right in *spirit* — yes, expand the model — but **not as "add list/table/code markers to the flat run list."** What your UX constraints actually point at is a **block-document tree whose leaves are the `{ baseline, runs[] }` model**. That's a bigger change than "markers," and it's the correct one. Let me explain why the flat-runs model can't stretch to cover what you want, and why the WYSIWYG requirement itself is the tell.

## The tension: runs are an *inline* model; you're now asking for *block structure*

DOC-22's `{ baseline, runs[] }` is fundamentally a **flat, inline** model. A run is a span of text with per-run style overrides. It's superb at its motivating job — the italic 18px tagline over the 16px paragraph, inline emphasis, per-word colour. That's an inline-styling-fidelity model, built for the capture/values-diff loop.

But the things you just added — **lists, tables, blockquotes, code** — are a *different axis*. They're **structure**, and structure is a tree:

- **Tables are 2D** (rows × cells). You cannot encode a table as a flat sequence of runs without inventing a `cell-start`/`row-end` marker encoding — which is just a tree serialized badly.
- **Lists nest** and have item boundaries.
- **Blockquotes/code blocks** are block containers with their own semantics.

DOC-22 §8 deferred exactly these ("Rich embeds (tables, media inside text) — not text runs; not covered here") — not by accident. They don't fit the inline model. So bolting markers on would fight the grain the whole way.

## The clean shape: block tree + inline-run leaves

```
Document
 └─ blocks[]:  paragraph | heading | bullet-list | ordered-list |
               list-item | blockquote | code-block | table/row/cell
       └─ (text-bearing blocks) inline content = { baseline, runs[] }   ← DOC-22, intact
```

The runs model **survives exactly as-is** — it just becomes the *inline leaf* instead of the whole thing. Nothing from Stage 1 is wasted; `text-markup.ts` becomes the inline serializer for a run list *within* a block. Structure lives above it; styling fidelity lives inside it. They compose instead of competing.

This also **dissolves the Stage 2 blocker** from earlier: the 1stcontact ordered list is no longer a "force it into prose or extend the model" dilemma — it's just an `ordered-list` node. Clean.

## The WYSIWYG requirement is the confirmation, and it corrects the markdown assumption

Here's the thing about your instinct that "markdown makes the editor easy": **real WYSIWYG editors don't store markdown.** ProseMirror/TipTap and Lexical — the editors that give you exactly the "click the text box → edit inline" experience you described — store a **block-tree-with-marks document** internally. Markdown is only an import/export convenience they bolt on the side.

And markdown actively *can't* hold what you need: there's no CommonMark for "this word is 18px gold." That's the whole reason DOC-22 had to invent the `[text]{k=v}` extension. So markdown-as-storage would fight both the per-run styling *and* the editor.

So the layering that satisfies all your constraints:

| Concern | Representation |
|---|---|
| **Source of truth (storage)** | block-tree + inline runs — structured JSON |
| **Authoring** | TipTap (ProseMirror) or Lexical, bound directly to that model — no markdown in the loop |
| **Editor rendering** | *semantic & loose* — shows bold as bold, a list as a list, gold-ish as gold; **not** pixel-accurate |
| **Site rendering** | the framework renderer produces the exact pixels/width/fonts |
| **Capture / values-diff** | DOM → block-tree(runs); the `[k=v]` markup string stays as the **inline serialization** that makes the diff's `expected` column paste-able |

That table also honours your relaxation directly — "the editor doesn't have to be the right width/font" is precisely the *editor renders semantics, framework renders pixels* split. Two projections of one model.

## Honest cost

This is genuinely bigger than DOC-22 as written, in ways worth naming:

- It's a **spec change** — DOC-22 §8 explicitly deferred tables/embeds; we'd be pulling them in. We should update DOC-22 (or write a companion doc) *before* more code.
- **Capture projection (workstream 4 — already the lead risk) grows**: it must reconstruct block structure from the DOM, not just group runs. Though note it also gets *more natural* — a DOM is already a block tree, so DOM→block-doc is arguably a better fit than DOM→flat-runs-with-markers.
- The **diff engine** pairs runs-within-block-node instead of runs-within-flat-block — cleaner, but a change.
- This likely pushes the whole thing past comfortable free-coding size. I can still stage it, but it's worth acknowledging it's now closer to develop-shaped.

## What I'd want to decide before touching code

1. **Confirm the shape**: block-document tree with `{ baseline, runs[] }` leaves — *not* flat markers. (My strong recommendation.)
2. **Editor alignment**: do you want the storage model shaped to mirror a specific editor's doc JSON (TipTap/ProseMirror is my pick — headless, React-friendly, native tables/lists/code, custom marks for fontSize/colour) so authoring is near-free? Or a framework-native model we adapt to the editor?
3. **Process**: I think the right next step is me updating **DOC-22** with the block model + editor mapping (a doc change — no ticket needed), then re-staging REQ-54 against it. Want me to draft that spec update so we're working from an agreed model?

I've kept this to design only — no code, no ticket changes yet. Which way do you want to go on those three?

<!-- xgd-turn id="73da077f-77c6-4185-823b-46bae3ad738e-user" -->

<!-- xgd-chat role="user" ts="2026-07-13T15:42:32.376009+00:00" -->
#### You
I think this is the right (probably necessary) direction. But lets just set the stage for it. Can you (1) make the basic modifications to set the stage in this ticket (2) handle lists and numberd lists the right way so we can cover 1stcontact and then (3) create a ticket for the other forms - agreed

Oh and yes, please update the documentation also as part of this ticket

<!-- xgd-turn id="73da077f-77c6-4185-823b-46bae3ad738e-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-13T15:55:11.503133+00:00" -->
#### Claude
Let me gather the current state before making changes — the ticket body, DOC-22, and the existing text-markup code.

DOC-22 wasn't found as a file — it's likely an xgd ticket. Let me check, and look at the schema + text-style + site docs.

Let me look at the existing test file conventions and the actual 1stcontact list content that motivated this.

Ordered list confirmed (the 1stcontact "How it works" block). Let me confirm nothing outside the test file consumes the Stage-1 symbols yet, so I can evolve the model cleanly.

Now let me read the rest of the existing test file (the generator) to preserve conventions.

This is a multi-step change. Let me track it and check the ticket-update mechanism.

Now let me update the ticket first (free-coding: scope ticket before code), then implement.

Ticket updated. Now the core model change — rewriting `text-markup.ts` to the block-document shape. The inline serialize/parse helpers are unchanged; only the block-level orchestration and types change.

Now update the index re-exports to add the new block types:

Now rewrite the test file to the block model and add list UATs covering the 1stcontact ordered list.

Now let me run the tests to validate the model before proceeding.

All 13 pass. Now the full suite + typecheck/lint to catch any breakage from the exports/model change.

Tests green (564). No root lint/typecheck script — quality runs via `xgd`. Let me typecheck the framework package directly to validate the new exports compile.

Clean. Now update DOC-22 to the block model.

Now create the ticket for the deferred block forms.

REQ-57 created. Let me link it back into REQ-54 (I left a placeholder) and also add the `[[REQ-54]]` cross-link is already in REQ-57.

Now the commit sequence. Let me check the version-bump script and staged changes.

There are pre-existing unrelated `faelan` deletions in the tree — I'll leave those alone and commit only my four files plus the version bump. Let me bump the version first.

Now record the commit and move REQ-54 to free_coded via the documented gate (it runs the version-bump check).

Done. Let me verify final ticket state and close out the task list.

Done — the stage is set. Here's what landed under REQ-54:

## 1. Model foundation (the pivot)
`packages/framework/src/modules/text-markup.ts` now uses a **block-document tree** instead of a flat run list:

- `StyledText = { baseline?, blocks[] }`
- `Block` = `paragraph` (inline `runs` + optional `blockquote`) or `list`
- The **run model is unchanged as the inline leaf** — the `paragraphBreak`/`blockquote` markers moved *up* to the block level where structure belongs. Nothing from Stage 1 was wasted.
- Round-trip invariant broadened to block documents: `parse(serialize(x)) === normalizeStyledText(x)` (new `normalizeStyledText` export normalizes runs within every paragraph and list item).

## 2. Lists — done properly (covers 1stcontact)
One `list` block with an `ordered` dial (not two kinds — generalized). Bullet + ordered, positional item ordinals, `start` only when ≠ 1. Paragraph text that merely *starts* like a marker (`- `, `N. `) is escaped so it stays a paragraph. The 1stcontact "How it works" ordered list — the exact thing the flat model couldn't hold — now parses to a clean ordered-list block. There's a UAT pinning that specific content.

**Verification:** the REQ-54 suite is 13 green (incl. a 500-seed property test over paragraphs/blockquotes/bullet+ordered lists); full suite **564 green**; framework `tsc --noEmit` clean.

## 3. Deferral ticket
**REQ-57** — *Richer text block kinds*: tables (2-D), code blocks, rich/nested blockquotes, headings, nested/multi-block list items. Each is a genuinely new block kind, cross-linked with REQ-54.

## 4. Documentation
**DOC-22** revised to the block model — §3 (tree with inline-run leaves), a new §3.2 on the WYSIWYG editor rationale, §4 list notation, §5 the broadened invariant, §8 pointing at REQ-57.

## Free-coding
Committed `dc41e246` `[FREE-CODED]`, patch-bumped to `0.0.99`, REQ-54 → `free_coded` with both SHAs recorded. I left the pre-existing unrelated `faelan` deletions untouched — they weren't part of this change.

One note for when you pick up the next stage: the schema/render/migrate/capture/diff workstreams (2–5) are still pending and now target the block model — that's the natural continuation from here, not part of "setting the stage."

<!-- xgd-chat-end -->