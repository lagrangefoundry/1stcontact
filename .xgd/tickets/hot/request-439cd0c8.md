---
uid: request-439cd0c8
id: REQ-163
type: request
title: 'Ingestion: from a dropped file to an indexed material ticket'
created_by: xgd
created_at: '2026-08-31T20:33:08.539304+00:00'
updated_at: '2026-09-02T17:48:27.176999+00:00'
completed_at: null
last_field_updated: status
status: bundled
fields:
  priority: high
  story_points: 13
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-0fb97f84
  commits:
  - working_sha: d99c1f438572f2da868db0bc384c798858681cac
    reconcile_sha: null
    main_sha: null
  version: 0.2.24
  bundled_in: bundle-203b1dc2
---

# Ingestion: from a dropped file to an indexed `material` ticket

## Why

[[DOC-38]] §10 specifies the path from bytes to knowledge, and nothing implements
it. [[REQ-162]] gives the tickets somewhere to live; this creates them.

It is also the first user-visible capability in this whole line of work. Until it
exists there is no way to put a byte into the system at all.

## The pipeline

Five steps, per [[DOC-38]] §10:

1. **Store the blob.** Blob-first, then the record — a crash leaves an orphan
   blob a sweep collects, never a dangling pointer nothing can heal. Content
   addressed within the tenant prefix (`t/<tenant>/blob/<sha256>`), so the same
   file uploaded twice is one blob.
2. **Classify.** `kind` from the content type. **`rights` inferred from
   provenance, never asked** — see [[DOC-38]] §10.1, which is a decision, not a
   default: a per-file *"do you own this?"* is a legal question put to a café
   owner, is clicked through unread, and most importantly asks for information
   the client frequently does not have.
3. **Describe.** The step that makes the material findable, and the reason this
   ticket is not plumbing. Four sub-pipelines with four failure modes:

   | Input | Description |
   |---|---|
   | PDF / document | extracted text (and a decision on scanned pages — OCR or refuse) |
   | Image | a written description, from a VLM |
   | Font | family, weights, and what it is for |
   | Capture bundle | what the site is and how it looks |

   Per [[DOC-38]] §7.4 this is ours, not the ticketing component's. The component
   stores bytes and metadata.
4. **Create the ticket** with that description as its body, plus §9's fields.
5. **Index incrementally** — the `since` cursor picks it up ([[DOC-39]] §4.1).
   No rebuild. This is what makes the material searchable *immediately*, which is
   what lets the map rebuild run asynchronously behind it ([[DOC-39]] §5.2).

## Entry points in scope

- **Upload** — a file from the client (4a site assets, 4b background material).
- **Fetch** — material we pull on their behalf: an industry report, an article
  (3c).

Both converge after step 1.

## Why the body matters more than it looks

The description is what the knowledge base indexes. [[DOC-38]] §6's whole
simplification rests on it: because a photo carries a written description, the KB
indexes bodies uniformly and never learns that images exist, and there is no
second retrieval path for media. A weak description is not a cosmetic problem — it is
material that cannot be found.

## Constraints

- **25MB per blob** ([[DOC-38]] §14), enforced with a clear rejection rather than
  discovered as an out-of-memory. Measured, not guessed: the largest member
  across three real capture bundles is 7.4MB; the binding case is image-heavy
  brand-guideline PDFs at 20–50MB.
- **A capture-sourced asset may never be promoted into a site's asset library
  unless its bundle is `republishable`** ([[DOC-38]] §5). This is the most
  damaging single action available in the system — it publishes third-party
  copyright under the client's own domain — and it is one plausible tool call
  away without the gate.

## Out of scope

- **Capture → ticket.** Bundles land in the ReferenceStore and become tickets by
  the same path, but as N attachment records per member ([[DOC-38]] §9). Its own
  ticket.
- **The Library UI** — [[REQ-161]]. This ticket owns the pipeline; that one owns
  the surfaces. Either can be built first, but neither is demonstrable alone.
- **The quarantine write gate** ([[DOC-38]] §11) — the n-gram check on
  control-surface text. v1 is the prompt-level constraint plus the asset gate
  above.

## Acceptance

- A file arriving through the Worker becomes a blob, then a `material` ticket
  whose body is a usable description, and is searchable without a full reindex.
- Rights are set from provenance and never from a question.
- The same file uploaded twice yields one blob and two records.
- A blob above the ceiling is rejected with a message a non-technical client can
  act on.
- A crash between blob and record leaves no dangling pointer.
- An image's description is good enough to retrieve it by what it depicts —
  *"the kitchen at dusk"* — not merely by filename.
- The pipeline calls the index seam exactly once per created material, and the
  Worker logs when no indexer is wired.
- A degraded description (no key, scanned, unsupported) still yields a material that
  is visible, honestly described, and selectable by `description_status`.
- A fetch of a private, loopback, link-local or non-HTTPS address is refused, and
  each redirect hop is re-validated.
- Promotion of a non-`republishable` source is refused.
- Every route the origin declares carries the no-store directive — the two new
  ones included. Adding a route without a probe is a failure of the existing
  origin-wide criterion, not a new rule.

## Decisions from implementation review

**Routes.** This ticket owns exactly two — `POST /api/material` (upload) and
`POST /api/material/fetch` (URL). They are pipeline entry points, not Library
surfaces; `/api/tickets/*` and the drop overlay belong to [[REQ-161]], whose
overlay will POST to these. Treat the contract as public from the start.

**The index step is a seam.** [[REQ-159]] does not exist yet, so step 5 declares
`deps.index?(uid)` and a UAT proves the pipeline calls it exactly once per
created material. Building an index here would be building half of [[REQ-159]].

But an unwired optional hook is a silent failure of the worst kind: [[DOC-39]]
§4 is explicit that an unindexed document is **invisible**, not merely stale. So
the Worker **logs loudly when no indexer is wired**, and [[REQ-159]] promotes it
to a construction-time requirement in the manner of `ticketStoreFor(env)`.

**The image description takes a second LLM path, deliberately.** The AI component's
backend surface is text-only (`promptStream(ref, text)`) with no image content
block anywhere, so `describeImage` calls the SDK directly behind an injectable
seam. This is duplication and is accepted as temporary — **the consolidation
point is named now** ([[REQ-157]], or an image block on the AI component's
surface) so it does not become permanent by default.

**`description_status` is one mechanism for three degraded cases**, not three special
cases: no API key, a scanned PDF with no extractable text, and an unsupported
content type. In each the material is still created, is visible in the Library
with an honest description of what is missing, and is findable **by predicate**
for a later re-describe pass. `description_model` is recorded alongside it.

- **Scanned PDFs are never rejected.** Store the blob, write *"Scanned document,
  14 pages, no extractable text"*, set the status. Refusing a client's scanned
  brand book is the worse failure. No OCR in v1.
- **Regeneration is out of scope but enabled** — no automatic re-describe, and the
  two fields make a later pass a query rather than a migration.

**PDF text extraction takes a dependency** — `unpdf` (pdf.js packaged for
workerd, no native code). The fallback of filename-plus-size guts step 3, and
class 4b *is* PDFs. Two conditions: check the licence, and **measure its
contribution to the Worker bundle** — [[REQ-158]] independently plans to bundle
the KB vector index, neither ticket can see the other's footprint, and the
Cloudflare bundle ceiling is hard. Whoever lands second would otherwise discover
it. Report the measured number to [[REQ-158]].

**Fetch is a plain `fetch`, with a guard this repo does not yet have.** A
*rendered* fetch is capture ([[REQ-166]]). The guard: HTTPS only, no
private/loopback/link-local/metadata addresses, a redirect cap with
re-validation at each hop, and a size cap at the 25MB ceiling.

The guard matters more than the SSRF framing suggests. **Fetched content becomes
corpus material the AI reads**, so this is a prompt-injection path into the
assistant's context, not only a network-reach problem. Two consequences: keep the
guard, *and* mark fetched material untrusted in the manner [[DOC-10]] §5.2
already requires for retrieved content — a fetch of attacker-chosen content is a
risk even when the address is entirely legitimate.

**The asset-promotion gate ships here, unrouted.** There is no material →
site-asset promotion path today, so there is nothing to gate — which is exactly
how [[DOC-38]] §5's "most damaging single action available in the system" reaches
production ungated. Implement the function *with* its refusal now, so [[REQ-161]]
wires a surface to something already safe. It writes a `site_assets` row pointing
at the existing blob; that table exists today and this does not wait on the
`site_assets` migration.

## What was built, and where it departs from the decisions above

Five departures, each because the decision met something in the code it had not
seen. The decisions above are left as written; these are the corrections.

**1. [[REQ-159]] had landed, so step 5 is wired to a real indexer.** The seam
survives exactly as decided — `deps.index?(uid)`, proved by a UAT that counts
calls without needing an embedder — but the router's default resolves it to the
project KB's `onMaterialWritten()`, which refreshes the vector index inline and
defers the awareness-map rebuild behind it ([[DOC-39]] §5.2). The loud log is
therefore reached only when the `AI` binding is absent, which is what it should
have meant all along. A UAT now proves searchability by *actually searching*: it
uploads into a KB that already holds a document, retrieves the new one, and
asserts the old one's vector was not recomputed — which is what "without a full
reindex" means mechanically.

**2. Promotion copies the bytes; it cannot point at them.** The decision above
says the `site_assets` row points at the existing blob. It cannot: `readAsset`
resolves `site_assets.r2_key` against `SITES`, and the material blob is in
`BLOBS` — a second bucket precisely because `SITES` is bound by the Worker that
serves the public internet ([[REQ-162]]). A row pointing into `BLOBS` would 404,
and making it resolve would mean handing the public Worker a binding on the
private bucket, which is the disclosure the bucket boundary exists to prevent.
So promotion copies across that boundary, through the site store's ordinary
`write`. That is also what promotion *means*: taking something private and making
it publishable is a real act, and the byte copy is that act made honest. Nothing
waits on a migration either way.

**3. `description_status` has six values, not four.** The three degraded cases
named above are all present (`no_describer`, `no_text`, `unsupported`), plus `ok`
and two the implementation found:

- `too_large` — an image above the Messages API's own per-image ceiling, which is
  far below [[DOC-38]] §14's 25MB blob ceiling. The file is stored **whole** and
  simply not looked at: the client's photograph is not at fault, and losing it in
  order to describe it would be the wrong trade.
- `failed` — the describer was reached and threw. Kept distinct from
  `no_describer` because the two want different retries: one waits for a key,
  the other for the next attempt.

The describer never throws. An extraction failure costs findability and nothing
else — letting it reach the route would turn *"we could not read your PDF"* into
*"your upload failed"*, which is untrue and unrecoverable.

**4. Fonts are parsed, not described by a model, and WOFF/WOFF2 degrade.** A font
already carries the answer in its own `name` table — family, style, designer, and
often a sentence about what it is for, written by whoever drew it — so asking a
model to guess from the bytes would cost a call to produce something worse. SFNT
(`.ttf`/`.otf`/`.ttc`) is read directly. WOFF compresses each table with zlib and
WOFF2 with brotli, and workerd's `DecompressionStream` has no brotli at all, so
both are recorded `unsupported` rather than half-supported. The font registry
([[REQ-101]]) remains where a family's provenance lives; this only makes the
*file* retrievable.

**5. Two fields were added to the `material`/`reference` schema, plus one more.**
`description_status` and `description_model` are declared rather than left
undeclared — the engine tolerates undeclared fields, but the whole value of the
status is that a later re-describe pass is a *query* rather than a migration, and
a predicate over an undeclared field is a predicate over a convention.
`filename` joins them: the Library lists materials, and reading a name off the
attachment record would cost an `attachments` call per row. All three are
optional, because a `reference` created by a capture has no description when its
bundle lands.

### The bundle measurement, for [[REQ-158]]

Measured with `wrangler deploy --env production --dry-run`, gzip, four builds:

| build | gzip | delta |
|---|---|---|
| baseline (before this ticket) | 322 KiB | — |
| `@anthropic-ai/sdk` only | 460 KiB | **+138 KiB** |
| `unpdf` only | 939 KiB | **+617 KiB** |
| both (what ships) | **1032 KiB** | **+710 KiB** |

Both licences are MIT. The Cloudflare ceiling is 10 MiB gzip on the paid plan
(3 MiB free), so the Worker sits at roughly **10% of the paid limit** — but it
has tripled, and `unpdf` is four fifths of the increase. [[REQ-158]] plans to
bundle the KB vector index into the same Worker and should budget against 1032
KiB, not against 322.

The SDK's 138 KiB is smaller than it looks because the AI component already
brings `@anthropic-ai/sdk` in transitively; that number is the second copy
esbuild resolves from `apps/control-app/node_modules`. Consolidating the vision
call onto the AI component's own surface (departure 3's named point, [[REQ-157]])
would recover most of it.

### Evidence

Two UAT files, split by the repository's own runtime convention:

- `tests/test_UAT_FC_REQ-163_material_pipeline.test.ts` (node, 17 tests) — the
  steps that are pure functions of bytes: classification, every describer against
  a real PDF and a real SFNT font, and the fetch guard driven by a stub `fetch`.
  The guard's load-bearing test is not *"a loopback address is refused"* but *"a
  **public** address that redirects to a loopback address is refused, and the
  redirect target was never fetched"*.
- `tests/test_UAT_FC_REQ-163_ingestion.workers.test.ts` (workerd, 13 tests) — the
  whole pipeline through `route()` against real D1 and two real R2 buckets:
  blob residency in `BLOBS` and not `SITES`, dedup counted in R2, the ceiling
  refusal in a client's words with no material left behind, the crash-ordering
  property, the index seam called exactly once, the loud log, the tenant barrier
  over both rows and vectors, and both sides of the promotion gate.

Two doubles, both at model boundaries — the vision describer and the embedder —
for the reason `tests/support/stub-embedder.ts` already argues: no claim here is
about the quality of a description or an embedding, and miniflare has no local
Workers AI to reach.

One existing UAT was extended rather than worked around:
`reconciliation-builder-workspace-origin`'s AC-977 requires every route the
origin declares to carry the no-store directive, and it failed on the two new
routes exactly as designed. Both now have probes, in their rejection shape.

## Resolved after implementation (2026-08-31)

Two of the questions left open at hand-off have since been answered. Recorded
here rather than by deleting them, so what made them questions stays legible.

**Vision moves into the AI component, and the consolidation point is
lagrange-framework REQ-111 — not [[REQ-157]].** *"Image content on the backend
surface: the AI component grows eyes"* widens `promptStream`/`prompt` to accept
content blocks (`{type:'image', mediaType, data}`) behind a declared `vision`
capability, and it names this ticket as its first consumer with the direct-SDK
path here as the thing it deletes. So "who owns vision" resolves to the
component, on exactly the grounds this ticket used to justify the temporary
duplication: credentials, retry, rate limiting, the audit trail and the current
model id all live on one path or get copied onto a second.

What changes here when it lands: `anthropicImageDescriber` goes, and the
`@anthropic-ai/sdk` dependency with it — which also reclaims the +138 KiB the
measurement above attributes to the SDK. The `DescribeImage` seam itself stays
exactly as it is; it exists so the UATs do not reach the network, which remains
true either way. Only the implementation behind it changes.

One follow-up this leaves: the doc comment on `VISION_MODEL`
(`apps/control-app/src/describe.ts`) still names [[REQ-157]] as the consolidation
point, and REQ-111 should correct it as part of deleting the function.

**Re-describe splits by field: automatic where there is no description,
operator-triggered where there is one that could be better.** The two fields
answer different questions, so a single policy over both would be wrong in one
direction or the other:

- `description_status` of `no_describer` or `failed` means the material has **no
  real description** — it is not findable by its contents at all. That is a
  defect, and repairing it should not wait for someone to notice: a pass over
  those two predicates re-describes automatically once a key is configured or a
  transient failure has passed. `no_text`, `unsupported` and `too_large` are not
  defects — they are honest accounts of what the material is, and re-running them
  changes nothing.
- `description_model` naming an older describer means the description is **fine
  and could be better**. Re-describing a corpus against a new model costs a call
  per material and rewrites bodies that are not wrong, so it is an operator's
  decision rather than a background sweep.

Both remain out of scope here, as decided, and both remain a query rather than a
migration — which was the point of declaring the fields.

## Open questions

- **DNS is not resolved before a fetch**, so a hostname that resolves to a
  private address defeats the literal-host check. workerd cannot resolve a name
  before fetching it, so the guard cannot be made complete from inside a Worker.
  Recorded rather than implied — closing it needs a resolver the platform does
  not offer.