---
uid: report-1b9eb760
id: REPORT-1759
type: report
title: 'Capability-Intent Alignment: In-Page Copy Editing: The Editable Render & The
  Click-to-Edit Gesture (level=ac)'
created_by: xgd
created_at: '2026-08-10T08:35:15.522088+00:00'
updated_at: '2026-08-10T08:35:15.522088+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-12fee326
  level: ac
  violations: 0
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: In-Page Copy Editing: The Editable Render & The Click-to-Edit Gesture
# Level: ac

**Result**: PASS
**Violations**: 0
**Warnings**: 1
**Needs review**: 0

Anchor report: report-69e94af9. Capability: capability-12fee326 (CAP-87).
Stories in scope: STORY-98 (story-af36c2cb, `upgrade`) with 13 ACs;
STORY-101 (story-3bf94bd4, `feature`) with 15 ACs. Both story kinds are matrix
kinds, so both are expected to carry ACs and both do. No ACs are deprecated.

## Cumulative Intent Considered

The capability ticket carries no `intent_uid`/`updated_by` of its own, so the
ledger is derived from its stories' chains.

| Intent ID | Status | When (created / merged) | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-14 `bundle-0385746c` (BUG-31 + REQ-114 + **REQ-116**) | free_and_reconciled | 2026-08-06 / `cd8f98c8` | REQ-116 is the load-bearing constituent: the edit render — a third, deliberately non-functional channel; settled-state content; derived segmentation; render-scoped L1 addresses; renderer-drawn outlines; `id` untouched; no leakage into shipped channels. Created STORY-98. | YES |
| REQ-116 `request-41796766` | free_and_reconciled | 2026-07-31 / (via BUNDLE-14) | As above; 9 stated ACs. | YES |
| BUNDLE-16 `bundle-15c1f647` (**REQ-117** + REQ-115 + REQ-44) | free_and_reconciled | 2026-08-07 / `1741ee5d` | REQ-117 is the load-bearing constituent: the click→modal→validated diff→re-render loop; `mountFields` in buffered commit; innermost-wins; module-slot editing; overflow legibility; View mode unaffected. Created STORY-101 and **updated STORY-98** (page stamp `data-fc-page`, vocabulary moved to `site-schema`, contact-form seam marker, hover rule). | YES |
| REQ-117 `request-395b67e6` | free_and_reconciled | 2026-07-31 / (via BUNDLE-16) | As above; 10 stated ACs, plus two recorded follow-up passes (`cda7fe4d` loop closure; the T1 viewport-fill fix, itself flagged as REQ-115 scope). | YES |
| REQ-118 `request-66e4c630` | free_and_reconciled | 2026-07-31 / `b2b9208c` | Image selection through the *same* loop: no `image set`, no `/api/image`; the field vocabulary widens by one shape (`enum`); the current handle is always an option; membership re-checked on the write side. Updated STORY-101. Explicitly out: framing, upload, processing. | YES |

**Comment evidence consulted** (secondary source of truth, used where the body
was silent): COMMENT-601 on REQ-117 carries the operator dialogue in which the
"nothing to edit on this ⟨kind⟩ segment yet" message, its three-route dismissal
(the TDZ bug that killed Close/Escape/backdrop on every non-form modal), and the
stale-rendering refusal were reported and adopted. COMMENT-747 on REQ-118 was
checked and adds nothing bearing on AC alignment.

## Alignment Ledger

### STORY-98 (aligned to REQ-116, updated by REQ-117) — 13 ACs

| Element | Intents aligned to | Outcome |
|---|---|---|
| AC-948 inert channel, same content | REQ-116 §2, AC1 | aligned |
| AC-949 scroll-revealed copy renders settled | REQ-116 §3, AC2 | aligned |
| AC-950 carousel slides all visible, module declares its own off-state | REQ-116 §3, AC3 | aligned |
| AC-951 derived segmentation; nothing-to-edit regions unstamped | REQ-116 §4, AC4 | aligned |
| AC-952 renderer draws resting + hot outline, neither moves a box | REQ-116 §6 + REQ-117 (hover rule rehomed into `L1_EDIT_CSS`) | aligned |
| AC-953 every address resolves to exactly one node, unique in namespace | REQ-116 AC5 | aligned |
| AC-954 seam content instance-rooted; every catalog module marks its seam | REQ-116 AC7 + REQ-117 (contact-form seam gap) | aligned |
| AC-955 reorder + re-render still resolves | REQ-116 AC6 | aligned |
| AC-956 no edit artefacts in shipped channels + idempotence | REQ-116 AC8, **relaxed** by REQ-117 | aligned (see Findings #2, info) |
| AC-957 author `id` unchanged, address stamped alongside | REQ-116 AC9 | aligned |
| AC-958 own output location, always draft, no revision | REQ-116 §1 | aligned |
| AC-1007 page stamp is the definition id | REQ-117 (`L1_EDIT_PAGE_ATTR`) | aligned |
| AC-1008 one published stamp vocabulary | REQ-117 (contract moved to `site-schema`) | aligned |

Every in-scope bullet of STORY-98's body maps to at least one AC: channel→958,
inertness→948, settled state→949/950, derived segmentation→951, addresses→953/
954/955, page stamp→1007, seam marking→954, outlines+hover→952, vocabulary→1008,
no leakage→956; the technical-context claim about the author identifier→957.
No AC asserts behaviour the story body does not carry.

### STORY-101 (aligned to REQ-117, updated by REQ-118) — 15 ACs

| Element | Intents aligned to | Outcome |
|---|---|---|
| AC-993 hover marks one region, never moves the page | REQ-117 §1 | aligned |
| AC-994 click a copy region → one shared-component form, buffered, pre-filled | REQ-117 §2, AC1 | aligned |
| AC-995 innermost-wins | REQ-117 AC9 | aligned |
| AC-996 click inside a seam names instance + slot | REQ-117 AC7 + the `moduleId`/`--module` shape bug | aligned |
| AC-997 one confirmed form = one change | REQ-117 AC3 | aligned |
| AC-998 after save the page shows the change, still editable | REQ-117 AC2 | aligned, wording narrowed to copy (Finding #1) |
| AC-999 refusal keeps the form and the typed text, shows its own reason | REQ-117 AC4 + the 400-carries-`code`/`path`/`hint` decision | aligned |
| AC-1000 unchanged form writes nothing | REQ-117 §2 (buffered commit) | aligned |
| AC-1001 nothing-to-edit message names the kind | REQ-117 AC1 as **amended by COMMENT-601** | aligned (see Findings #3, info) |
| AC-1002 dismissible by button, Escape and backdrop | REQ-117 / COMMENT-601 (TDZ bug) | aligned |
| AC-1003 stale rendering refused before anything is sent | REQ-117 / COMMENT-601 + `69f06deb` | aligned |
| AC-1004 overflowing copy legible in full in the field | REQ-117 §4, AC8 | aligned |
| AC-1005 viewing is not editing, as a property of the gesture | REQ-117 AC10 + the bridge's `data-fc-edit` bind guard | aligned |
| AC-1006 one implementation of address resolution, served to the browser | REQ-117 (`/framework/edit-client.js`, type-stripped source) | aligned |
| AC-1028 image click → same form, closed picker, current handle always present | REQ-118 §1, §5 | aligned (see Findings #4, info) |

Every in-scope bullet of STORY-101's body maps to at least one AC: seeing what is
about to be edited→993, resolving a click→995/996, a form over the region's
fields→994/1028, one form one change→997, opening to look is not an edit→1000,
the page updating→998, being told no→999, the two dead ends→1001/1002 and 1003,
copy that no longer fits→1004, viewing is not editing→1005; the technical-context
single-implementation claim→1006. No AC asserts behaviour the story body does not
carry.

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | coverage | AC-998 (STORY-101) | ac-edit | STORY-101's "The page updating" bullet says a successful Save leaves the operator looking at their page with the change on it — "**the new words, the chosen image**". AC-998 states and verifies only the copy half ("the new words … the displayed page's text becomes the new text"). AC-1028 covers the image case only as far as the form, its picker and its transport; it stops before Save. The image's post-save page update is asserted only by AC-1026, which belongs to story-37a3921b under CAP-86 (the write path) and is a CLI/definition-shaped criterion, not the gesture's no-further-step property. So the gesture-side claim "and the chosen image" is currently unasserted in this capability. REQ-118 §5 makes it load-bearing — kind-agnosticism is offered as *evidence* for the T3 design, not a coincidence. | Widen AC-998 from "the new words" to "the change the operator confirmed", and have its verification exercise one non-copy field (an image `src`) once, asserting the refreshed page shows the chosen image and the gesture is still live. `ac-add` (a separate image-save AC under STORY-101) is an acceptable alternative; do not restate AC-1026's write-path assertions either way. |
| 2 | info | consistency | AC-956 (STORY-98) | — | REQ-116 AC8 demanded the shipped channels be **byte-identical** before and after the ticket. AC-956 deliberately relaxes this to "no edit-channel artefacts + idempotence", because REQ-117 made the contact-form emit its seam marker in every channel — structural, inert markup that falsifies byte-identity without falsifying the invariant. The relaxation is stated in the AC itself and justified in STORY-98's technical context. Correctly reconciled; recorded so a future check does not re-open it. | none |
| 3 | info | consistency | AC-1001 (STORY-101) | — | REQ-117 AC1 says clicking a segment with no editable fields "opens nothing"; AC-1001 requires a plain message naming the region's kind. Verified as a deliberate, operator-endorsed divergence rather than drift: COMMENT-601 records the operator running the built loop, seeing "Nothing to edit on this box segment yet", and treating it as the expected answer while reporting only that it could not be dismissed — which is why AC-1002 exists as its own criterion. STORY-101's technical context records the same divergence. | none |
| 4 | info | exclusivity | AC-1028 (STORY-101) vs AC-1024/AC-1025 (story-37a3921b, CAP-86) | — | AC-1028's picker clauses (images only — no font, no stylesheet; images the page does not use; the current handle always among the options) restate AC-1024 and AC-1025 almost proposition for proposition, differing only in observation point (through the gesture vs. through the derivation surface). CAP-87's own "out of scope" assigns field derivation to Structured Copy Editing. Not raised as a warning because the duplication is inherited from STORY-101's body, which claims the picker property directly — at `ac` level the story body is the working reference, and second-guessing it is a story-level judgment. | none at this level; carry to the next story-level cycle for CAP-87/CAP-86 |
| 5 | info | exclusivity | AC-951 vs AC-952 (STORY-98) | — | Both touch "a region with nothing to edit is not outlined". Judged complementary, not duplicative: AC-951's criterion is the derivation table (which nodes become which region kind), AC-952's is the emitted stylesheet (exactly two treatments, selected on the stamp, painted outside layout). The shared clause is a consequence each states about its own subject. | none |

## Notes for the Editor

- **This level is clean.** One warning, no violations, no escalations. The AC
  layer of CAP-87 tracks both story bodies closely; the two stories' bodies are
  unusually explicit about their own divergences from intent (the byte-identity
  relaxation, the "opens nothing" → message change, the hover-treatment ownership
  split), and in every case the AC set follows the story body and the story body
  is corroborated by the intent record — including the operator dialogue in
  COMMENT-601, which is where three of STORY-101's criteria (AC-1001, AC-1002,
  AC-1003) actually originate. Anyone re-checking these should read the comment
  thread, not just the REQ-117 body, or they will read AC-1001 as drift.
- **The hover split is deliberate and documented** — STORY-98/AC-952 owns what a
  hot segment *looks like*; STORY-101/AC-993 owns *which* segment is hot. Both
  story bodies name the boundary explicitly. Not a duplicate pair.
- **Finding #1 is the only actionable item**, and it is small: AC-998 was written
  when copy was the only editable kind (REQ-117) and was never widened when
  REQ-118 made the loop kind-agnostic. REQ-118 §5 records that *no editor changes
  were needed* for images — which is exactly why the gap is easy to miss: nothing
  in the code changed, so nothing prompted the criterion to change either. Expect
  the same shape again when the next region kind gains fields.
- **Provenance caveat for anyone tracing by commit**: STORY-98's body warns that
  its code spans several commits and two intents (part swept into REQ-114's
  commit by a concurrent `git add -A`; the page stamp, hover rule, vocabulary
  move and contact-form seam marker committed under REQ-117). Attribution by
  commit will mislead; the ticket chain above is the reliable ledger.
