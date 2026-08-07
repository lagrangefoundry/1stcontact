---
uid: report-c9b2a81e
id: REPORT-1614
type: report
title: 'Capability-Intent Alignment: Structured Copy Editing: One Validated, Atomic
  Write Path (level=ac)'
created_by: xgd
created_at: '2026-08-07T19:28:38.590423+00:00'
updated_at: '2026-08-07T19:28:38.590423+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-f753cecd
  level: ac
  violations: 0
  warnings: 3
  needs_review_count: 0
---

# Capability-Intent Alignment: Structured Copy Editing: One Validated, Atomic Write Path
# Level: ac

**Result**: PASS
**Violations**: 0
**Warnings**: 3
**Needs review**: 0

Scope checked: CAP-86 → STORY-100 (`story-37a3921b`, `story_kind: upgrade`) → 17
acceptance criteria (AC-980…AC-992, AC-1024…AC-1027), all `active`. No deprecated
or retired ACs exist under this story (`--status all` returns the same 17).

## Cumulative Intent Considered

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-117 (`request-395b67e6`, folded into BUNDLE-16 `bundle-15c1f647`) | free_and_reconciled | created 2026-07-31, merged `1741ee5d` | Copy editing end-to-end: segment address contract, `copyFieldsOf` derivation, `1c copy get\|set`, one-map-one-diff atomicity, shared whole-definition validator, structured refusal, module-slot editing, overflow copy legible, no raw-code mode; later the `/api/copy` origin transport and the both-channel re-render | YES |
| REQ-115 (in same bundle) | free_and_reconciled | merged `1741ee5d` | Builder chrome / shell / origin — CAP-85, not this capability | YES (out of this capability) |
| REQ-44 (in same bundle) | free_and_reconciled | merged `1741ee5d` | `1c` CLI dependency preflight — unrelated capability | YES (out of this capability) |
| REQ-118 (`request-66e4c630`) | free_and_reconciled | created 2026-07-31, merged `b2b9208` | Image selection as the *second half of the same surface*: field vocabulary widened `string` → `string \| enum`; image region exposes `src` (closed list, current handle always included) + `alt`; enum membership enforced server-side before the shared validator; no separate image command or route; asset listing extracted as its own surface | YES |

STORY-100 carries `intent_uid: bundle-15c1f647`, `updated_by: request-66e4c630` —
matching the ledger exactly. Individual ACs carry no `intent_uid`; attribution
below is by creation window (AC-980…992 created with the REQ-117 reconcile;
AC-1024…1027 created 2026-08-07T04:40, the REQ-118 reconcile).

No intent in the ledger retires behaviour expressed by an earlier one. REQ-118 is
purely additive with one clarification REQ-117 had left open (an image region is
*not* a "nothing to edit" region), and that clarification is correctly reflected
in AC-981.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| AC-980 — copy region exposes one plain-text field | REQ-117 | aligned (see W3 on its multi-line sub-clause) |
| AC-981 — region exposing nothing returns empty list, succeeds | REQ-117, REQ-118 (image explicitly excluded from this set) | aligned; correctly absorbs REQ-118's reclassification of image regions |
| AC-982 — saving words updates draft + re-renders | REQ-117 | aligned |
| AC-983 — one save is one change, never half-written | REQ-117 | aligned |
| AC-984 — rejected edit leaves draft + render byte-identical | REQ-117 | aligned |
| AC-985 — structured fault: code, path, hint, failing exit status | REQ-117 | aligned |
| AC-986 — whole-definition validation by the shared validator, both kinds | REQ-117, REQ-118 | aligned; REQ-118's "proved by consequence" framing preserved |
| AC-987 — malformed address refused outright, never coerced | REQ-117 | aligned |
| AC-988 — unknown field / non-text value / off-list choice refused | REQ-117, REQ-118 (third clause) | aligned; the "before the shared validator runs" rationale matches REQ-118 §2 |
| AC-989 — copy in a module's presentation slot, scoped by instance+slot | REQ-117 | aligned |
| AC-990 — overflowing copy reads back in full | REQ-117 (AC-8) | aligned (see W3) |
| AC-991 — only two field shapes, neither can carry code | REQ-117 (AC-6), REQ-118 §1 | aligned; correctly states the enum shape is a *narrowing*, matching REQ-118's own argument |
| AC-992 — builder origin is the same surface, both kinds, both renderings | REQ-117 (origin half), REQ-118 (origin half) | aligned (see W1) |
| AC-1024 — image region exposes closed-list `src` + `alt`, images only | REQ-118 (AC-1) | aligned (see W1) |
| AC-1025 — current handle always among its own options | REQ-118 (the "one non-obvious correctness detail") | aligned |
| AC-1026 — image save updates draft + re-renders; handle and alt in one diff | REQ-118 (AC-2, AC-4) | aligned (see W1, W2) |
| AC-1027 — bakes nothing; other region parameters survive | REQ-118 (AC-6) | aligned; protects the deferred framing-parameter home per DOC-28 §13 Q5 |

**Coverage sweep against the story body's in-scope bullets** — every bullet has at
least one AC: naming a region (AC-987, AC-989); asking what a region exposes
(AC-980, AC-981, AC-1024, AC-1025); applying one change as one change (AC-983,
AC-1026); validating the whole result (AC-986); refusing legibly (AC-984, AC-985,
AC-988); making the change visible (AC-982, AC-1026, AC-992); being incapable of
raw code (AC-991); changing nothing but structured fields (AC-1027); plus AC-990
for the overflow guarantee and AC-992 for the origin-as-same-surface claim.

**Out-of-scope sweep** — no AC claims behaviour the story body excludes: no AC
asserts the click gesture, innermost-wins resolution, View-mode inertness
(REQ-117 ACs 1/9/10 → CAP-87), the independent asset listing (REQ-118 AC-7 →
CAP-88 / STORY-102), framing parameters, upload, or undo. The story's own note
that the browser gesture "is not claimed as an acceptance criterion here" holds
in the matrix.

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | exclusivity | AC-992 + AC-1024 + AC-1026 | ac-edit | AC-992 is the "builder origin is the same surface" criterion and already states it covers *both* kinds ("the same single endpoint for a change of words and a change of image"), asserting origin read-parity including the image field's option list, and both-channel re-render on a valid edit "of each kind". AC-1024's verification repeats "Assert the same answer is returned when the region is read through the builder origin"; AC-1026's criterion repeats "Through the builder's origin, a saved choice leaves both the editable rendering and the plain draft rendering current" and its verification repeats "Repeat the save through the builder origin and assert both rendered channels on disk reflect it". Both restate AC-992's own clauses for the image case. | Drop the origin clauses from AC-1024 and AC-1026 and let AC-992 own origin parity for both region kinds (AC-992 already names the image case explicitly); or, if the image-over-origin assertions are wanted where they are, narrow AC-992 to copy — but not both |
| 2 | warning | exclusivity | AC-983 + AC-1026 | ac-edit | AC-983 already establishes the general rule ("a well-formed map results in exactly one modified page document", applied whole or not at all, however many fields it names). AC-1026 restates the multi-field half of it for the image case ("A new image and a new alt text chosen together are **one change, not two**… a single operation producing a single diff"). The story body does carry the image sentence as its own in-scope example, and REQ-118 AC-4 asked for it — so this is a defensible specialisation rather than drift, but the one-diff claim is currently asserted twice | Reduce AC-1026's second paragraph to the part AC-983 does not cover — that *both* fields are reported as changed — and let AC-983 own the one-diff/atomicity claim |
| 3 | warning | exclusivity | AC-980 + AC-990 | ac-edit | The "a long or multi-line value asks for a multi-line control, a short one does not" rule is asserted in AC-980 (criterion and verification) and again in AC-990 ("together with a request for a control able to display it in full" / "assert… the multi-line control is requested"). AC-990's distinct core — that overflowing copy is *accepted* and reads back character-for-character untruncated (REQ-117 AC-8) — is not duplicated | Keep the multi-line-control rule in AC-980, which owns the descriptor shape, and reduce AC-990 to the full-fidelity readback it uniquely covers |
| 4 | info | consistency | AC-981 | — | Correctly updated for REQ-118: it now names an image region as explicitly *not* a nothing-to-edit region, matching REQ-118's note that the REQ-117 test using an image as the empty-field example was moved to a painted container. No stale "images have nothing to edit" text survives anywhere in the AC set | none |
| 5 | info | consistency | AC-980, AC-982 | — | Both carry detail the story body does not spell out (the multi-line-control request; the "identical values succeed and report nothing changed" no-op outcome). Neither contradicts the story body — they are ACs specifying finer than the prose above them, which is the expected direction — so neither is recorded as drift | none |
| 6 | info | coverage | AC-985 | — | The story body asks for the fault "in both human and machine-readable form"; AC-985 pins the machine-readable envelope and exit status precisely and covers the human side only implicitly (code + path + hint, "not prose"). Sufficient as written; noted so a future check does not read it as a silent gap | none |

## Notes for the Editor

- **Nothing here blocks the level.** All three warnings are the same shape:
  REQ-118's ACs were authored as a self-contained set (mirroring REQ-118's own
  seven ACs) rather than as deltas against the REQ-117 ACs already in the story,
  so three claims that REQ-117's ACs already owned — origin parity, one-diff
  atomicity, the multi-line-control rule — now appear in two places. The fix in
  each case is subtraction from the newer AC, never addition, and none of it
  changes the behavioural surface the matrix describes.
- **Watch the direction of the AC-992 overlap if it is repaired.** AC-992's value
  is precisely that it asserts origin parity is *kind-agnostic* — the same
  endpoint for words and for images. Trimming AC-992 to copy in order to resolve
  warning 1 would remove the criterion carrying "there is no separate image
  route", which is the load-bearing claim of REQ-118's "second half, not a second
  mechanism" framing. Trim AC-1024/AC-1026 instead.
- **The whole-definition-validation claim is well guarded.** AC-986 asserts the
  shared validator by *consequence* (an unrelated violation refuses a copy edit,
  an image edit and an unrelated structured-edit command with identical code,
  message and path), which is exactly how both REQ-117 and REQ-118 said the claim
  must be proved. No AC weakens it to an inspection-style assertion.
- **Neighbouring capabilities absorb the intent this story excludes** — verified,
  not assumed: CAP-87 (click-to-edit gesture, edit render), CAP-88 / STORY-102
  (asset listing as its own surface), CAP-85 (builder chrome). The out-of-scope
  bullets in STORY-100's body therefore create no orphaned intent at this level.
