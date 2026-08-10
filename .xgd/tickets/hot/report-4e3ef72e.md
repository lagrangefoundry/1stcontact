---
uid: report-4e3ef72e
id: REPORT-1738
type: report
title: 'Capability-Intent Alignment: Structured Copy Editing: One Validated, Atomic
  Write Path (level=story)'
created_by: xgd
created_at: '2026-08-10T07:20:35.546138+00:00'
updated_at: '2026-08-10T07:20:35.546138+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-f753cecd
  level: story
  violations: 1
  warnings: 2
  needs_review_count: 0
---

# Capability-Intent Alignment: Structured Copy Editing: One Validated, Atomic Write Path
# Level: story

**Result**: FAIL
**Violations**: 1
**Warnings**: 2
**Needs review**: 0

## Cumulative Intent Considered

CAP-86 (`capability-f753cecd`) carries no `intent_uid`/`updated_by` of its own
(`fields` = `name`, `uat_coverage` only). The ledger is compiled from its single
story, STORY-100 (`story-37a3921b`, `story_kind: upgrade`):
`intent_uid = bundle-15c1f647` (BUNDLE-16 = REQ-117 + REQ-115 + REQ-44),
`updated_by = [request-66e4c630 (REQ-118)]`. None of the 17 ACs carries an
`intent_uid`/`updated_by` of its own, so the story chain is the whole ledger.

REQ-128 is **not** in that chain — it was found in REQ-118's own comment thread
(`comment-64cb2bfb`) and is included below because it asks for a change to the
field-exposure rule this capability owns.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-44 (`request-3b78151f`) | free_and_reconciled | 2026-07-03 | Tooling hygiene: `pnpm install` after a lockfile change; fail loud on out-of-sync `node_modules`. Not a CAP-86 behaviour. | YES (out of this capability) |
| REQ-115 (`request-a6740b4a`) | free_and_reconciled | 2026-07-31 | Builder shell: webui consumption, `site` tab, multi-mode display panel + toolbar. CAP-85's ask. Reaches CAP-86 only as the origin that fronts this surface as a thin transport. | YES (out of this capability) |
| REQ-117 (`request-395b67e6`) | free_and_reconciled | 2026-07-31 | **The founding CAP-86 ask.** Edit-address contract moved to `site-schema/src/l1/edit.ts` (one resolution rule, module/slot scoping); `copyFieldsOf` / `applyCopyFields`; `1c copy get\|set` landing beside `page`/`config`/`asset` so the editor is a second *producer*, not a second path; the same `validateSite` + `validateL1` call; one change map = one diff, applied-validated-written together; refusal carrying code/path/hint + `{ok,data}` envelope + exit code; empty field list as a legitimate answer; no raw HTML/CSS; long copy legible in full on reopen; `/api/copy` returning **400** with the validator's own fault. ACs 1-8 (ACs 9-10 are the gesture, CAP-87). | YES |
| REQ-118 (`request-66e4c630`) | free_and_reconciled | 2026-07-31 | Image selection **as the second half of the same surface** — no `image set` command, no `/api/image` route. `L1FieldDescriptor.type` widened from `'string'` to `'string' \| 'enum'`; an image region exposes `src` (closed list of the site's image assets, always including the node's current handle) + `alt`; enum membership enforced server-side in `applyCopyFields` *before* the shared validator; a save re-renders **both** channels. ACs 1-6 (AC-7, the independently reachable asset listing, belongs to CAP-89/STORY-102). | YES |
| BUNDLE-16 (`bundle-15c1f647`) | free_and_reconciled | 2026-08-07 | Carrier only — bundles REQ-117 + REQ-115 + REQ-44 at `1741ee5d`. | — (carrier) |
| REQ-128 (`request-de67e1a1`) | **bundled** | 2026-08-08 | Container segment's `backgroundImageUrl` in the phase-1 picker: same derivation, same enum control, same asset listing, same `copy get\|set` surface. Explicitly a re-phasing, not a REQ-118 gap. | imminent (NOT yet enforced) |

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| CAP-86 body (`capability-f753cecd`) | REQ-117 | **gap**: still the pre-REQ-118 text. "plain words and nothing else" is contradicted by REQ-118's `'string' \| 'enum'` widening; the body never mentions images at all. See finding 1. |
| CAP-86 title + `fields.name` | REQ-117 | **gap**: "Structured Copy Editing" / `name: Structured Copy Editing` predates REQ-118's second half. See finding 2. |
| STORY-100 (`story-37a3921b`) body — In scope | REQ-117, REQ-118 | aligned. All eight in-scope bullets trace: naming a region + strict parse + one resolution rule (REQ-117, `edit.ts`); asking what a region exposes incl. the empty list and the image closed list (REQ-117 + REQ-118); one change map = one diff (REQ-117 AC-3); whole-definition validation by the shared validator (REQ-117 AC-5, REQ-118 AC-3); legible refusal + byte-for-byte-unchanged draft (REQ-117 AC-4, and REQ-118's field-scoped refusal before the validator); re-render both channels (REQ-118 test plan, origin half); incapable of raw code (REQ-117 AC-6, REQ-118's "enum is *narrower* than a string"); bakes nothing (REQ-118 AC-6). |
| STORY-100 body — Out of scope | REQ-117, REQ-118 | aligned. Gesture → CAP-87/STORY-101; edit render channel → CAP-84/STORY-98; asset listing (REQ-118 AC-7) → CAP-88, **superseded_by** CAP-89, where STORY-102 ("Ask my site what assets it has…") expresses it — so the deferral resolves rather than dropping the ask; framing/upload/text-properties/undo → REQ-118 and REQ-117 non-goals. |
| STORY-100 body — Technical Context | REQ-117, REQ-118 | aligned. Every recorded divergence and known limitation traces to an intent: the "nothing to edit here" dismissible message vs REQ-117 AC-1's "opens nothing" (correctly attributed to the gesture capability); the `webui-fields` verbatim-option-text limitation (REQ-118, DOC-8 §9.4); the unicode-escaping diff (REQ-117 "Known, not fixed here"); `contact-form`'s missing slot seam (REQ-117). |
| STORY-100 body — "a container… answers with an empty list" | REQ-117, REQ-118 | aligned **today**; REQ-128 (bundled) inverts it. See finding 3. |
| STORY-100 AC set (17 ACs, all `active`) | REQ-117, REQ-118 | aligned. REQ-117 ACs 1-8 → AC-980/981, 982, 983, 984, 986, 991, 989, 990; plus AC-985 (fault code/path/hint) and AC-992 (builder origin, same surface) from REQ-117's "The loop is closed" section. REQ-118 ACs 1-6 → AC-1024, 1026, 986, 1026, 988, 1027, with AC-1025 carrying REQ-118's current-handle correctness rule. REQ-117 ACs 9-10 and REQ-118 AC-7 correctly live in other capabilities. |
| Exclusivity | — | No overlap. CAP-86 has exactly one story. STORY-101 (CAP-87), which shares the same intent chain, states the boundary explicitly — "the validated write path that applies the change is another [capability]" — and describes the field list only from the gesture's side. |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | consistency | CAP-86 body (`capability-f753cecd`) | story-body-edit (capability body) | Bullet 2 of the capability body reads "which fields a region exposes — **plain words and nothing else**, so no control this surface can offer is capable of carrying raw HTML or CSS". REQ-118 (`request-66e4c630`, free_and_reconciled, merged `b2b9208c`) widened `L1FieldDescriptor.type` from `'string'` to `'string' \| 'enum'` and made an image region expose `src` (a closed pick of asset handles) + `alt`. Verified in code on this branch: `packages/site-schema/src/l1/edit.ts:138` (`type: 'string' \| 'enum'`), `:240` (`type: 'enum'` for `src`). The body has no mention of images anywhere, while its sole story is titled "Change the words **and choose the images** on my page". STORY-100 and all 17 ACs (notably AC-991) *were* updated for REQ-118 — the drift is isolated to the capability body. | Replace "plain words and nothing else" with the two-shape rule REQ-118 established: a plain string, **or** a pick from a closed list the surface itself supplied — strictly *narrower* than a free string, so the raw-code guarantee is unchanged (it becomes a property of the shape, not a rule to enforce). Add image selection as the second half of the same surface (no separate command, no separate endpoint; the whole of it lives in what a region answers when asked which fields it exposes). Extend the out-of-scope line to carry REQ-118's exclusions the story already carries: image framing (DOC-28 §13 Q5), asset **upload** and processing, and the asset **listing** as a surface in its own right (CAP-89/STORY-102). |
| 2 | warning | consistency | CAP-86 title + `fields.name` | story-body-edit (capability rename) | Title "Structured Copy **Editing**: One Validated, Atomic Write Path" and `fields.name: Structured Copy Editing` predate REQ-118, which made this surface the write path for copy *and* images (and, under REQ-128, backgrounds). Same drift as finding 1 but a distinct action shape — a rename ripples into report titles and any `name`-keyed lookup — so it is called out separately for the editor to decide. | Consider "Structured Content Editing: One Validated, Atomic Write Path" (or equivalent) with `fields.name` updated to match. Low urgency; the body fix in finding 1 is the load-bearing repair. |
| 3 | warning | coverage | STORY-100 (`story-37a3921b`) | story-body-edit | REQ-128 (`request-de67e1a1`, **bundled** = imminent, 2026-08-08) asks that a container segment carrying `backgroundImageUrl` expose it in the same picker (its AC-1, AC-2). STORY-100's body currently states the opposite as a settled property of the surface: "For anything that exposes nothing — a container, a module instance — the answer is an **empty list**". Confirmed **not yet landed** on this branch — `packages/site-schema/src/l1/edit.ts` contains no `backgroundImageUrl` — so this is imminent, not enforced, and is a warning rather than a violation today. | No edit required until REQ-128 reconciles. On reconcile: the "exposes nothing" bullet must narrow to a container with paint but **no** `backgroundImageUrl` (REQ-128 AC-7 deliberately preserves the empty-list answer for that case), and the picker bullet must cover the background handle. Note REQ-128's two design constraints, which are the kind of thing that silently drops in a body rewrite: **selection only, no "none" option** (removal would drop `surfaceDecls` to zero and make the node stop being a segment), and **change, never add** (an unpainted container has no address to click). |

## Notes for the Editor

**The drift is one layer thick, and it is the top one.** REQ-118 was reconciled
into STORY-100 and into the AC set carefully — AC-991 already carries the
"plain text or a pick from a closed list" wording, AC-1024/1025/1026/1027 cover
the image half, and the story's Technical Context has a dedicated section on why
the vocabulary grew by exactly one shape. Only the capability body was left at
its pre-REQ-118 state. Finding 1 is a single-paragraph repair, not a
re-derivation; the story body is a reliable source for the replacement wording.

**Three inbound `bundled` intents may reshape this capability; none has touched
its tree yet, and their capability assignment is not settled.** Recorded here
rather than as findings, because guessing their home is exactly the drift this
check exists to detect:

- **REQ-128** (`request-de67e1a1`) — the only one unambiguously CAP-86 (it
  changes what `copyFieldsOf` exposes), hence finding 3.
- **REQ-126** (`request-d9407f80`) — formalises `edit.ts` into a declared control
  surface with a **published error taxonomy**, a **stated addressing contract**
  and a **version**. CAP-86 owns precisely those two contracts today ("the
  address of an editable region, its strict parse and its single resolution
  rule"; "the structured refusal — code, path, hint, exit status,
  machine-readable envelope"). REQ-126 is explicit that it is "a formalisation of
  `edit.ts`, not a second surface beside it" and that no consumer gains a way to
  bypass validation, atomicity or re-render — so it extends this capability
  rather than replacing it. But its scope is all 16 operations of `edit.ts`
  (`page`/`config`/`asset`/`copy`), which is wider than CAP-86. Whether it lands
  here, in a new capability, or splits, is an open assignment question.
- **REQ-129** (`request-b1300473`) — adds verbatim `get_l1`/`set_l1` to the
  control surface, explicitly leaving "the operator's click-to-edit modal exactly
  as it is". Worth watching against CAP-86's central claim that the two producers
  share one path and "neither has a private route to the draft": REQ-129 gives
  the AI a write shape the operator does not have. That may be a legitimate
  widening rather than a breach — `set_l1` is described as running the same
  envelope validator (REQ-107) — but the story body's "one addressing scheme, one
  validator, one atomicity rule and one refusal shape between them" will need a
  deliberate re-reading when it reconciles, not an incidental one.

**No `needs_review` items.** Every claim in STORY-100's body traced to a ledger
intent, including the ones that read like orphans: the "both rendered channels"
re-render (REQ-118 test plan, origin half — corroborated by
`tests/req117-nowrap-width-is-a-floor.test.ts`'s docstring), the dismissible
"nothing to edit here" divergence (REQ-117 AC-1, correctly attributed away to the
gesture capability), and the unicode-escaping cosmetic defect (REQ-117 "Known,
not fixed here").

**The asset-listing deferral resolves, despite pointing at a superseded
capability.** STORY-100 defers REQ-118 AC-7 to "a separate capability". That is
CAP-88, whose status is `superseded` with `superseded_by_uid: capability-b4ac88fc`
(CAP-89), and CAP-89's STORY-102 expresses the ask. No gap — but the story body
names no UID, so the chain is only followable by title. If the editor is touching
the body for finding 3 anyway, naming CAP-89/STORY-102 explicitly would make this
deferral verifiable without a search.
