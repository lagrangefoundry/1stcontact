---
uid: request-dfc95a22
id: REQ-54
type: request
title: Styled-run text content model + markup (implements DOC-22)
created_by: xgd
created_at: '2026-07-12T23:37:43.237932+00:00'
updated_at: '2026-07-13T18:05:07.874619+00:00'
completed_at: null
last_field_updated: status
status: bundled
fields:
  priority: high
  auto_merge_back: true
  needs_review: false
  commits:
  - working_sha: 05767c0e5d636eb4924ee407891dc20c4eaa6181
    reconcile_sha: null
    main_sha: null
  - working_sha: dc41e246f24a27075b1efe199b41a9c66cbbcdb2
    reconcile_sha: null
    main_sha: null
  version: 0.0.99
  bundled_in: bundle-d9c2e655
---

## Goal

Replace the single-`bodyStyle` text representation with the **styled-run content
model** and its markup, so a text block can express (and the capture can read)
arbitrary intra-block styling — different size/weight/colour/leading per run,
inline emphasis, per-paragraph overrides.

**Spec:** [[DOC-22]] — Styled Text Content Model & Markup. That doc is the
authoritative model; this ticket implements it. Motivated by [[REQ-52]] (the
gigabytealchemy re-import, where italic taglines at 18px over 16px paragraphs and
a 14px "More to come" line could not be represented). Consumed under exact-match
diffing ([[REQ-53]]).

## The model (see DOC-22 for full spec)

- Text content = `{ baseline, runs[] }`; each run overrides only what differs from
  the baseline (CSS-inheritance semantics). Applies to every text-bearing module.
- Authoring/serialization surface = CommonMark + a generic attribute-span
  `[text]{field=value …}` whose keys are the `TextRun` field names; markdown is
  shorthand for specific spans; CommonMark backslash-escaping; quotable values;
  block-level fenced `::: {…}` overrides.

## Workstreams

1. **Schema (represent):** extend the site-schema so text content is
   `{ baseline, runs[] }` with runs carrying optional `TextRun` overrides + structure
   markers. Replace the `body: string + bodyStyle` shape (no legacy dual-model —
   migrate the existing site docs). Coordinate with [[REQ-23]]/[[REQ-3]].
2. **Markup parse/serialize:** `parse(markup) → runs` and `serialize(runs) → markup`.
   Markdown desugars to runs; attribute-spans map keys→override fields; escaping per
   DOC-22 §4.1. This is a pure, well-testable unit.
3. **Render:** extend `resolveTextStyle` (framework `text-style.ts`) from one style
   to a run list — emit each run as baseline+override inline styles. Update
   `text-block`, `services-grid`, `contact-form`, etc. to consume run lists.
4. **Read (capture projection + serialization):** project the original DOM into
   `{ baseline, runs[] }` — group runs by block/paragraph, derive baseline as the
   dominant computed style, emit per-run deltas as overrides — then serialize to the
   markup string so the values-diff `expected` column is paste-able. (Per-run
   computed styles are already captured; the grouping + baseline/override projection
   + serialization are new.)
5. **Diff:** pair runs-within-block by order + text (extends the existing
   object-grouped pairing).

## Acceptance criteria (UATs)

- `test_UAT_*_roundtrip_invariant` — **property test**: for arbitrary run lists
  (including text containing `[ ] { } *` and dense per-run overrides),
  `parse(serialize(runs)) === runs`. (DOC-22 §5.)
- `test_UAT_*_markdown_desugars_to_runs` — `*x*`, `[x](url)`, `> …` compile to the
  expected runs; a bare paragraph compiles to a single inherited run.
- `test_UAT_*_attribute_span_overrides` — `[x]{fontSizePx=18 color=#314158}`
  yields a run with exactly those overrides and inherits the rest from baseline.
- `test_UAT_*_render_emits_per_run_styles` — rendering the Sanctum Voice card emits
  the 18px italic tagline over the 16px paragraph (per-run inline styles present).
- `test_UAT_*_capture_projects_and_serializes` — capturing a fixture page with
  mixed-size runs yields `{ baseline, runs[] }` whose serialized markup re-parses to
  the same runs (read/represent symmetry).
- `test_UAT_*_escaping_literal_delimiters` — a run whose text contains literal
  `[`/`]`/`{`/`}` serializes escaped and round-trips.

## Notes

- No legacy dual-model: replace `body:string + bodyStyle` outright and migrate
  existing site docs; git history is the archive.
- Lead risk is workstream 4 (capture projection/serialization) — the read side is
  what makes the transcription loop close; land it with strong fixtures.


## Implementation staging (agreed with operator — one ticket, staged commits)

The model applies to **every** text-bearing field (DOC-22 §3): a plain field is
the degenerate `{ baseline, runs: [{ text }] }` (one run, zero overrides). "All
fields" is one implementation of the core (schema + resolver + notation) that
every field inherits — the incremental cost over body-only is mechanical breadth
(more templates + doc migration), not design/algorithmic risk; the hard novel
work (multi-run capture projection + diff pairing) is body-shaped and identical
either way.

Stages (commits within this ticket, not separate tickets):
1. **Notation (parse/serialize)** — pure unit. ✅ DONE — commit 05767c0e.
2. **Schema** — replace field shapes with `{ baseline, runs[] }`; drop
   `bodyStyle`/`*Style` sidecars. (must land atomically green with 3+4)
3. **Render** — `resolveTextStyle` single→run-list; update module templates.
4. **Migrate** the 2 site docs (1stcontact, gigabytealchemy).
5. **Capture projection + serialize**, then **diff run-within-block pairing**.

Constraint: no dual-model, so stages 2–4 land in one atomic green commit.

### Stage 1 notes (commit 05767c0e)
- New pure unit `packages/framework/src/modules/text-markup.ts`:
  `serializeStyledText` / `parseStyledText` / `normalizeRuns` + types
  `StyledText` / `StyledRun` / `StyleOverride` / `Emphasis`.
- Serializer emits only self-delimiting forms; parser also accepts markdown
  shorthands (`*x*`, `**x**`, `> …`) for authoring. Round-trip invariant is
  `parse(serialize(x)) === normalize(x)`, exact for normalized lists.
- **Scope boundary:** notation covers scalar `TextRun` overrides + `href` +
  `emphasis`. `gradient` and `position` are runtime-only, outside the string
  surface (DOC-22 §4 attribute-span is scalar `k=v`; §8 defers richer forms).
  Stages 2/4 must carry these structured fields as JSON, not markup.
- UATs: `tests/req54-styled-text-markup.test.ts` (500-seed property round-trip +
  desugaring + attribute-span + baseline fence + escaping). Full suite 551 green.


## Model pivot — block-document with inline-run leaves (agreed with operator, 2026-07-13)

**Trigger:** the WYSIWYG-editing UX. Users edit text blocks in a semantic
WYSIWYG editor (TipTap/ProseMirror- or Lexical-shaped) and never see the
notation. The editors that give that UX store a **block-tree-with-marks**
document internally; markdown is only their import/export side-channel and
cannot even hold per-run font-size/colour (the DOC-22 motivation). So the
storage model must mirror a block tree, not a flat inline string.

**The flat `{ baseline, runs[] }` model is an _inline_ model.** It nails per-run
style fidelity (its motivating case) but cannot cleanly hold **structure**:
lists nest, tables are 2-D, code/blockquote are block containers. Structure is a
_tree_; a flat run list with `paragraphBreak`/`blockquote` markers is a tree
serialized badly. DOC-22 §8 deferred tables/embeds for exactly this reason.

**New shape:** `StyledText = { baseline?, blocks[] }`. A block is a
`paragraph` (inline `runs`, optional `blockquote`) or a `list`
(`ordered` + `items[]`, each item inline `runs`). The Stage-1 run model
survives **unchanged as the inline leaf** — nothing wasted; the paragraph/
blockquote _run markers_ move up to the block level where structure belongs.
This resolves the Stage-2 blocker (the 1stcontact "How it works" ordered list
no longer forces prose) rather than requiring the list be flattened.

**Editor mapping:** the editor renders semantics _loosely_ (bold as bold, a
list as a list, gold-ish as gold — not pixel-accurate); the framework renderer
produces the exact pixels. Two projections of one model — which is the operator's
"editor need not be the right width/font" relaxation.

### Scope of this pivot (this ticket)
- Model + notation (`text-markup.ts`, the pure unit — where Stage 1 lives):
  `{ baseline, blocks[] }`; `paragraph` + `list` blocks; full **bullet and
  ordered** list parse/serialize/normalize (one `list` block with an `ordered`
  dial, not two block kinds — generalize, don't multiply). Covers 1stcontact.
- DOC-22 revised to the block model (documentation update, this ticket).
- New UATs for lists + updated round-trip property test over block docs.

### Deferred to a separate ticket (the "other forms")
Tables, rich/nested blockquotes, code blocks, headings-within-prose, and
nested / multi-block list items. These are genuinely new _block kinds_ (a table
is 2-D; a code block owns raw text + language); they get their own ticket so
this one lands the foundation + lists green. Tracked as [[the block-forms REQ]].

### Staging impact
Supersedes the earlier "Stage 2 = schema" note: the model shape changes first.
Revised order — 1b. **Model pivot (blocks + lists)** ✅ this session → then
Schema / Render / Migrate / Capture / Diff proceed against the block model.


> Deferred "other forms" ticket filed: **[[REQ-57]]** — tables, code blocks,
> rich/nested blockquotes, headings, nested/multi-block list items.