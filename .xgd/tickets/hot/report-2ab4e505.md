---
uid: report-2ab4e505
id: REPORT-3757
type: report
title: 'Capability-Intent Alignment: Site Delivery: Deploy & Public Serving (level=story)'
created_by: xgd
created_at: '2026-09-10T16:13:17.093261+00:00'
updated_at: '2026-09-10T16:13:17.093261+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-a12e557f
  level: story
  violations: 3
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: Site Delivery: Deploy & Public Serving
# Level: story

**Result**: FAIL
**Violations**: 3
**Warnings**: 1
**Needs review**: 0

Anchor report: report-e37a6b4a. Capability: capability-a12e557f (CAP-82).
Previous attempts: 5.

**What changed since REPORT-3755 (attempt 5's input).** Both of that report's
findings are **resolved and verified closed**. STORY-96 (`story-66115f6b`,
updated 2026-09-10T16:05:05Z) no longer asserts the mapping holds on the
snapshot-addressed channel; a term sweep of all three story bodies for
`snapshot` / `addressing form` / `deploy index` / `1c deploy` / `manifest` /
`sha-address` returns hits **only inside explicit records of the retirement**
("dropped, not ported", "What was removed, and why it was removed rather than
ported", "A second addressing form was retired, recorded rather than absorbed"),
which is the shape this check asks for.

**The finding this pass adds is one level up.** Attempt 5 repaired the last
*story* BUNDLE-20's reconciliation had missed. It did not repair **CAP-82's own
body**, which is the scope statement governing that story tree and which no
intent after BUNDLE-13 has ever touched. Three of its claims are the same
retired REQ-110 design the stories now correctly record as removed. This is the
identical root cause as attempt 5's finding — the 2026-08-31 reconciliation swept
tickets one at a time and never reached the root — surfacing at the last element
that still carries it.

## Cumulative Intent Considered

CAP-82 carries no `fields.intent_uid` (the norm for capability tickets in this
store). The chain was built from the story tree: all three stories carry
`intent_uid: bundle-e0143ffa` (BUNDLE-13); STORY-94 and STORY-95 additionally
carry `updated_by: bundle-b3b7c399` (BUNDLE-20). STORY-96 still carries no
`updated_by` (attempt 5 edited its body, not its provenance field — noted, not
a finding: the field is a scalar and would have overwritten nothing useful).
Both bundles are `free_and_reconciled`. The ledger was then widened by sweeping
every `request` (50) and `bug` (38) ticket in the store for later delivery asks;
nothing reconciled after BUNDLE-20 touches this capability.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-109 | free_and_reconciled | 2026-07-30 | Rendered output relocatable: document-relative asset URLs | YES — owned by STORY-83 (`story-d0a8cfad`, CAP-70); a delivery *precondition*, correctly not duplicated here |
| REQ-110 | free_and_reconciled | 2026-07-30 | R2 artifact store + `1c deploy`: **content-addressed** snapshots (§"SHA-256 … Content-addressed"), **preview snapshots that are not revisions** and are shareable, per-site `manifest.json`, `--dry-run`, `--prune` | YES — **largely retired by REQ-149**; the source of all three violations below |
| REQ-111 | free_and_reconciled | 2026-07-30 | `public-site` Worker: route grammar, SiteStore seam, trailing-slash 301, content types, cache policy, opaque 404, reserved `draft` segment | YES → STORY-95 |
| REQ-113 | free_and_reconciled | 2026-07-31 | `1c serve` extensionless → `.html`; the 2026-07-30 scope extension added the Worker half after the "Cloudflare Pages auto-serves `.html`" premise was found false | YES → STORY-96 |
| BUG-30 | free_and_reconciled | 2026-07-31 | `relativizeUrl` turns `/#frag` into a same-page anchor | YES — owned by STORY-83 (CAP-70) |
| BUG-31 | free_and_reconciled | 2026-07-31 (BUNDLE-14) | `--sandbox` writes into a real site's R2 keyspace; `SERVABLE_ROOT` | YES (**retired** by REQ-149 — no writer left; STORY-95 records this correctly) |
| REQ-141 | free_and_reconciled | 2026-08-15 | workerd vitest project, real D1/R2 bindings | YES — test infrastructure, no CAP-82 behaviour |
| REQ-142 | free_and_reconciled | 2026-08-15 | Async SiteStore port, filesystem behind it | YES — the port CAP-82's publish sequences over |
| REQ-143 | free_and_reconciled | 2026-08-15 | **The Cloudflare SiteStore: definitions in D1, bytes in R2** | YES — the canonical store; out of CAP-82's *scope*, but it invalidates CAP-82's out-of-scope *rationale* (violation 3) |
| REQ-145 | free_and_reconciled | 2026-08-15 | control-app becomes the builder in workerd | YES — contributes D4's `/preview/<slug>/published` redirect → STORY-95 |
| **REQ-149** | **free_and_reconciled** | **2026-08-17 (BUNDLE-20)** | **Publish in the cloud.** D5 deletes `manifest.json`, live = `MAX(id)`. **D6 deletes `1c deploy`**, one publish over the store port, `--prune` "has no home". **D7 drops the sha-addressed shareable draft snapshots — "not ported"**. D2 slug claim. D4 published-view redirect. AC-1: no filesystem on the path. | **YES — the retiring intent this check turns on** |
| REQ-150 | free_and_reconciled | 2026-08-18 | `1c` boots plain Vite SSR | YES — launcher, no delivery behaviour |
| REQ-151 | free_and_reconciled | 2026-08-20 | Site locale identity, rendered lang/dir | YES — rendering, not delivery |
| REQ-152 | free_and_reconciled | 2026-08-20 | Money/time representation, render determinism | YES — rendering, not delivery |
| REQ-153 | free_and_reconciled | 2026-08-20 | Reserve locale-shaped page slugs | YES — checked against STORY-96 on purpose (it owns URL resolution): the guard is a `superRefine` on `pageSchema.slug` reached via `validateSite`, i.e. **authoring-time validation**, with no delivery-side addressing behaviour. Correctly absent from this tree |
| REQ-162 | free_and_reconciled | 2026-08-31 | Product ticket store: D1 schema, TypePack | YES — no delivery ask |
| REQ-154 | bundled | 2026-08-20 | Browser Rendering driver behind the capture seam | imminent — CAP capture, no delivery ask |
| REQ-155…REQ-161, REQ-163…REQ-166 | draft | 2026-08-20…08-31 | capture / KB / library work | NO (draft) |
| BUG-36, BUG-37, BUG-38 | free_and_reconciled | 2026-08-23…24 | control-app 503 / Edit-mode 1102 / chat turn failures | YES, but builder-surface defects — no CAP-82 delivery behaviour |
| REQ-112 | abandoned | 2026-07-31 | — | NO |

**Walking it forward.** REQ-110 + REQ-111 + REQ-113 (BUNDLE-13) established
delivery, and CAP-82's body was written to REQ-110's design: an artifact **named
by a digest of its contents**, two channels on the deployed site (a shareable
immutable preview alongside the published output), and a deploy command whose
legibility included `--dry-run` and `--prune`. BUG-31 (BUNDLE-14) hardened the
key namespace. REQ-143 (BUNDLE-20) then moved the canonical definition store into
D1. REQ-149 (BUNDLE-20) retired the rest: D6 deletes `1c deploy` and with it
snapshot-identity-as-digest, dry-run and prune; D5 deletes the manifest; D7 drops
the preview channel outright. **Current cumulative intent: one addressing form,
revision-numbered, published from wherever the site's store is — cloud or
filesystem — with the digest surviving only as an audit value.**

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| **CAP-82** (`capability-a12e557f`) — capability body | REQ-110, REQ-111 (**BUNDLE-13 only**) — never revised by BUNDLE-20 | **gap: three scope claims REQ-149/REQ-143 retired** (violations 1–3), one weakened framing (warning 1). The only element in this capability that the 2026-08-31 reconciliation never reached |
| STORY-94 (`story-5349d01f`, upgrade, uat_coverage=pass) — Publish a site to shared storage | REQ-110 (retired parts), BUG-31 (retired), REQ-142, REQ-143, **REQ-149 (D1–D3, D6, D7)** | aligned — every REQ-149 AC has a home: AC-1 → "No filesystem on the cloud path", AC-3 → "An unchanged draft mints nothing", AC-4 → "History is readable and forward-only", AC-5 → "Validate first, write nothing on failure", AC-6/AC-7 → "One publish, two front doors", AC-8 → "A published address belongs to whoever claimed it first". Removals recorded *as removals*; three dated reconciliation decisions carried |
| STORY-95 (`story-d34eccd8`, upgrade, uat_coverage=pass) — Serve a published site | REQ-111, BUG-31 (retired), **REQ-149 (D4, D5, D7, AC-2, AC-9)**, REQ-145 | aligned — "One addressing form, one server", "Live is derived, never stored", "The revision record is the authority", published-view redirect, grammar rejections, trailing-slash redirect, content typing, read-only surface, freshness, no crawler directive. Three dated reconciliation decisions carried |
| STORY-96 (`story-66115f6b`, feature, uat_coverage=pass) — Clean page URLs | REQ-113 (incl. its 2026-07-30 scope extension), **REQ-149 D7 (now recorded)** | **aligned — REPORT-3755's finding closed.** Verified in the current body, not taken from the fix report |

### Consistency, claim by claim

**STORY-96 — re-verified against code, not just re-read.** Every remaining
Technical Context claim holds today:
- "A second addressing form was retired, recorded rather than absorbed" matches
  `apps/public-site/src/routes.ts:13-22` verbatim in substance ("THERE IS ONE
  CHANNEL NOW (REQ-149 D7) … `draft` IS THEREFORE AN ORDINARY SEGMENT AGAIN").
- `parseRoute` (`routes.ts:112-141`) admits exactly `apex`, `redirect`, `asset`,
  `not-found` — no draft/sha branch, confirming the claim is retrospective.
- The "stale in-code comment" note is **still true**:
  `tools/generate/src/cli/serve.ts:72-74` still reads "Cloudflare Pages serves
  that at `/<slug>`". Documentation drift the story already documents — not a
  finding.
- The directory-index asymmetry note holds: `routes.ts:135-138` maps only the
  *site root* to `index.html`, so the deployed side has no nested-directory
  concept, exactly as stated.
- `tools/generate/src/deploy/` does not exist; `manifest.json` survives only as a
  historical comment at `apps/public-site/src/site-store.ts:10`. The producer and
  the index are both gone.
- STORY-95's read-only surface claim is live at `apps/public-site/src/index.ts:41-43`
  (405 for non-GET/HEAD).

**CAP-82's body — three live claims intent has retired.** Quoted exactly:

1. Scope bullet 1: "taking a rendered snapshot and its definition, **naming it by
   its contents**, and placing it in durable shared storage". That is REQ-110's
   content-addressed snapshot identity. REQ-149 D6 deleted the command that
   produced it, and STORY-94 states the replacement in terms: "**The audit digest
   is not an address.** A revision is named by its number, and every stored key
   and public URL is built from that" — and lists "snapshot identity as a digest
   of contents" among what was removed. The capability still describes the
   retired addressing model as its own scope.

2. Scope bullet 2: "**The draft/published split at delivery** — a shareable,
   immutable preview that costs the site nothing (no revision number, no publish
   history entry), versus the site's live published output." This is REQ-110's
   "Preview snapshots are not revisions" section word for word in substance, and
   it is exactly what REQ-149 D7 dropped **"not ported"**. It cannot be read as
   the surviving builder draft preview (`/preview/<slug>/draft/`, REQ-145): that
   one is behind Cloudflare Access (not shareable) and renders the mutable draft
   on request (not immutable). STORY-95 now says the opposite of this bullet —
   "There is no second addressing form" — so the capability contradicts its own
   story.

3. Out-of-scope parenthetical: "the canonical site store (delivery moves serving,
   not storing — **site definitions stay canonical on the operator's machine**)".
   REQ-143 put definitions in D1 and REQ-149 AC-1 requires "no filesystem
   anywhere on the path"; STORY-94 opens "Publishing **no longer happens on the
   operator's machine**. It happens wherever the site's storage is… it runs
   against the operator's filesystem and against the cloud store without knowing
   which it was handed", and REQ-149 D5 notes "the mutable draft lives in the
   database". The *exclusion* is still right — delivery does not own the store —
   but its stated reason is now false, and it is the reason a reader would use to
   decide what belongs here.

### Step 2.5 — implementation check before classifying

No finding here rests on ticket-graph evidence alone, and none is `needs_review`.
REQ-149 is `free_and_reconciled`, not abandoned, so the stale-vehicle rule does
not strictly apply; tier 3 was applied anyway and settles all three violations in
the same direction — the retired behaviour is **absent from the code**, so the
capability text is what is wrong, not the implementation:

- content-addressed identity: `tools/generate/src/deploy/` does not exist; the
  only publish path is `tools/generate/src/publish/publish.ts`, and `parseRoute`
  composes keys from `slug` + a record-supplied revision, never a URL-supplied
  digest.
- shareable preview channel: `parseRoute` (`routes.ts:112-141`) has no draft/sha
  branch; `routes.ts:13-22` documents the deletion.
- canonical store location: the D1/R2 adapter behind the async port
  (REQ-142/REQ-143) is live and `public-site` reads D1 through the unchanged seam
  (`site-store.ts:10`).

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | consistency | CAP-82 (`capability-a12e557f`), Scope bullet 2 | story-body-edit (capability body) | Scope claims "a shareable, immutable preview that costs the site nothing (no revision number, no publish history entry)" — the sha-addressed draft snapshot channel REQ-110 introduced and **REQ-149 D7 (free_and_reconciled, 2026-08-17) dropped "not ported"**. STORY-95 already states the opposite ("There is no second addressing form"); `routes.ts:112-141` has no such route | Replace the bullet with the one split that survives — the mutable draft the builder renders on request versus the site's immutable published revisions — and record the retirement in the same "removed, not ported" style STORY-94/95/96 use, citing REQ-149 D7. Do **not** simply delete the bullet: the draft/published distinction is still real, only its delivery-side shareable form is gone |
| 2 | violation | consistency | CAP-82 (`capability-a12e557f`), Scope bullet 1 | story-body-edit (capability body) | Scope claims artifacts are shipped by "naming it by its contents" — REQ-110's content-addressed snapshot identity, retired with `1c deploy` by **REQ-149 D6**. STORY-94 states the replacement: "The audit digest is not an address. A revision is named by its number, and every stored key and public URL is built from that" | "naming it by its contents" → naming it by the revision number it was minted as (the content digest survives as an audit value, not an address) |
| 3 | violation | consistency | CAP-82 (`capability-a12e557f`), out-of-scope parenthetical | story-body-edit (capability body) | "site definitions stay canonical on the operator's machine" is contradicted by **REQ-143 (free_and_reconciled, 2026-08-15)** — definitions in D1 — and **REQ-149 AC-1** — "no filesystem anywhere on the path". STORY-94: "Publishing no longer happens on the operator's machine" | Keep the exclusion, fix its reason: delivery moves serving, not storing — a site's definitions stay canonical in whichever store holds it (the operator's filesystem or the cloud D1/R2 store), and delivery never becomes that store |
| 4 | warning | consistency | CAP-82 (`capability-a12e557f`), opening framing paragraph | story-body-edit (capability body) | The framing — "off the operator's machine", "Every other capability … stops at rendered bytes **on disk**", "anyone who is not sitting at the operator's laptop", "from *the bytes exist locally*" — presumes the local-origin model REQ-149 AC-1 removed. On the cloud path the bytes never exist locally at all. Weakened premise rather than a false behavioural claim, hence warning | Re-frame around the boundary that survives: getting a rendered site out of the store it was authored in and in front of a visitor. The rest of the paragraph (other capabilities stop at rendered output; this one owns the path to a visitor) still holds |
| 5 | info | — | STORY-96 (`story-66115f6b`) | — | REPORT-3755's two findings are closed. Verified in the live body plus `routes.ts:13-22` / `112-141`, not taken on the fix report's word | none |
| 6 | info | — | STORY-94 + STORY-95 | — | Exclusivity checked on the two places they touch the same subject and both are complementary, not duplicate: the slug claim (STORY-94 refuses the *write*, STORY-95 resolves the *read*, each cross-referencing the other) and the trailing slash (STORY-95 owns the site-root redirect, STORY-96 owns the html-fallback eligibility exclusion) | none |
| 7 | info | — | CAP-82 Scope bullet 5 | — | "what it will and will not delete" originated as REQ-110's `--dry-run` / `--prune`, both retired by REQ-149 D6 ("`--prune` has no home"). Not a violation: a true reading survives in STORY-94's forward-only guarantee ("A revision is never removed, renumbered or reused") and in REQ-149's note that orphaned bytes are unreachable and cost only storage | none — but if bullet 5 is touched while repairing 1–3, anchor it to the forward-only guarantee rather than to a deploy command's flags |

## Notes for the Editor

**One root cause, one element left.** Findings 1–4 are the last residue of the
same drift attempt 5 repaired in STORY-96: BUNDLE-20's 2026-08-31 reconciliation
rewrote STORY-94 and STORY-95, attempt 5 today rewrote STORY-96, and **nothing
has ever rewritten the capability body they hang under**. It is still a faithful
description of REQ-110's design. Repairing it is subtractive in the same way
attempt 5's repairs were — REQ-149 removed channels and an addressing model, not
the capability — and none of it weakens REQ-111 or REQ-113.

**Do not cascade this into the ACs.** Unlike attempt 5's finding, this one has no
AC-level echo. All nine of STORY-96's ACs were swept in attempt 5 and re-checked
here; STORY-94's and STORY-95's ACs sit under bodies that already describe the
one-channel, revision-numbered world. `uat_coverage` is `pass` on all three
stories and on the capability, and no finding here bears on test evidence — this
is a matrix-text repair only. **No production code change is implied by any
finding**; the code is the thing the capability text disagrees with.

**Precedent for the wording.** All three story bodies already carry a house style
for this exact situation — a named section that records the retirement rather than
silently deleting the text ("What was removed, and why it was removed rather than
ported" in STORY-94; "Draft preview snapshots are dropped, not ported" in
STORY-94; "A second addressing form was retired, recorded rather than absorbed" in
STORY-96). The capability body should record its retirements the same way, so the
next reader can tell a deliberate removal from an omission.

**Carried forward, unchanged from REPORT-3755.** STORY-96's documented in-code
drift at `tools/generate/src/cli/serve.ts:72-74` (the comment still citing the
false "Cloudflare Pages auto-serves `.html`" premise) is still present. The story
documents it as drift and it is not re-raised as a finding — but it has now
survived at least two alignment cycles, and a one-line comment fix would retire
the note from the story body entirely.

**Verification performed this pass**: all 3 story bodies read in full at their
current revision; term sweep for retired-premise vocabulary across all 3;
`request` (50) and `bug` (38) ticket sweeps for post-BUNDLE-20 delivery asks;
REQ-149 read in full (D1–D7, AC-1…AC-9, "Implementation notes (as landed)");
REQ-110 read for the origin of the capability's scope wording; REQ-153 read to
confirm it carries no delivery addressing ask; and code checks against
`apps/public-site/src/routes.ts`, `index.ts`, `site-store.ts`,
`tools/generate/src/cli/serve.ts`, `tools/generate/src/publish/`, and the absence
of `tools/generate/src/deploy/`.
