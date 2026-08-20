---
uid: report-f9f7075d
id: REPORT-2358
type: report
title: 'Capability-Intent Alignment: 1c Capture & Diff Fidelity (level=story)'
created_by: xgd
created_at: '2026-08-20T04:09:11.045334+00:00'
updated_at: '2026-08-20T04:09:11.045334+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-aa030c83
  level: story
  violations: 1
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: 1c Capture & Diff Fidelity
# Level: story

**Result**: FAIL
**Violations**: 1
**Warnings**: 1
**Needs review**: 0

Attempt 10. **Attempt 9's repair is verified landed and, on its own terms,
correct** — the six drifted boolean flags are registered, the two new UATs exist,
and all five stale capability cross-references plus the STORY-116 `outline`
finding are genuinely fixed (see Verified-Resolved, info 1). Coverage was
re-derived independently and is still clean: no intent has reconciled into this
capability's scope since attempt 9.

The failure is **the same finding as attempt 9, one flag short of closed**.
`--assign` is a fourteenth boolean the CLI reads, it is not in the registry, and
it reproduces REQ-58's exact `Missing required <slug>` fault through the `colors`
verb. Attempt 9 enumerated the boolean reads by searching for `flags.X === true`;
`--assign` is read as `if (flags.assign)`, a bare truthy check, so the search did
not see it. The evidence added in the same attempt pins the registry against a
hardcoded literal rather than against the CLI's actual boolean reads, so it
cannot detect this class of drift either — that is warning 1, and it is the
reason the finding recurred rather than closed.

## Cumulative Intent Considered

The ledger is carried forward from report-cb71281a (attempt 9), which rebuilt it
from scratch — bundle membership parsed from bundle bodies, story references
collected matrix-wide — and converged on the prior attempt's in-scope set with
nothing new. I re-ran only the **delta** this attempt: every `request` and `bug`
created or re-statused since that ledger was built.

### Bundled intents (carried forward, unchanged)

| Intent ID | UID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|---|
| BUNDLE-1…5 | — | free_and_reconciled | 2026-06-30 … 07-13 | REQ-12/13 capture+shot, REQ-31 values-diff loop, REQ-35 tolerances, REQ-38 pixel diff, REQ-47/48 fidelity gate, REQ-51/53 object-grouped + exact-by-default | pre-matrix-genesis (contiguous unreferenced prefix, no interior hole) |
| BUNDLE-6 (REQ-58/59/61/62) | bundle-ab9e0cb6 | free_and_reconciled | 2026-07-17 | Viewport ladder; boolean-flag parse; `--json` stdout hygiene; gradient stop positions; panel surface gradients; `--size`; `responsive-diff` | YES — origin intent of STORY-75/76/77/78/79 |
| BUNDLE-7 (REQ-63 + REQ-79 + REQ-82…86) | bundle-31e474b9 | free_and_reconciled | 2026-07-22 | Coverage audit; fontLoad false-positive fix; `aligned-crops --sandbox` propagation | YES |
| BUNDLE-8 (BUG-7 + REQ-89…92 + 5 more) | bundle-cceaba25 | free_and_reconciled | 2026-07-29 | Pages-directory warning suppressed at source; Astro-free render path; painted-marker precondition | YES |
| BUNDLE-10 (BUG-12…25, REQ-88, REQ-93) | bundle-4ff83a8b | free_and_reconciled | 2026-07-29 | BUG-15/16/22/24/25 capture-spine members | YES — repaired attempt 7, re-verified |
| BUNDLE-11 (BUG-27 + REQ-94 + REQ-96 + 12 more) | bundle-ee56a66e | free_and_reconciled | 2026-08-05 | Painted band extent, document-wide backdrops, background-image axis, module-invariant exclusion | YES |
| BUNDLE-16 (REQ-117 + REQ-115 + REQ-44) | bundle-15c1f647 | free_and_reconciled | 2026-08-07 | Install preflight at dispatch | YES |
| BUNDLE-17 / BUNDLE-18 | bundle-e59210c5 / bundle-d9226698 | free_and_reconciled | 2026-08-10 / 08-13 | control-app, builder, palette | YES (no CAP-63 ask) |
| BUNDLE-19 | bundle-77b28def | **reconciling** (re-checked, unchanged) | 2026-08-18 | Editor/palette/workerd | imminent — no CAP-63-scope member (info 3) |
| BUNDLE-12, BUNDLE-15 | bundle-0e41ff44, bundle-7985e0d1 | abandoned | 2026-08-06 | superseded duplicates | NO |

### Unbundled intents — delta re-check this attempt

| Intent ID | UID | Status | When | Asked | In CAP-63 scope? |
|---|---|---|---|---|---|
| REQ-64 | request-07d0e3e1 | free_and_reconciled | 2026-07-17 | Noise audit, `--collapse`, Type-A/B repair order | YES — carried by STORY-116 (`intent_uid`) ✅ |
| REQ-76 | request-3a11304d | free_and_reconciled | 2026-07-18 | `--clusters` ranked causes + dispositions | YES — carried by STORY-116 (`updated_by`) ✅ |
| REQ-72 | request-0698bbdf | free_and_reconciled | 2026-07-18 | In-browser hexification of gradient stop colours | YES — carried by STORY-76 (`updated_by`) ✅ |
| REQ-73 | request-859652ae | free_and_reconciled | 2026-07-18 | Adjacent-gap axis + band-padding retirement | YES — carried by STORY-75 (`updated_by`) ✅ |
| REQ-66 | request-b94426f4 | free_and_reconciled | 2026-07-18 | `adopt-values` Type-A copy | Correctly absent — retired; STORY-84 records the supersession |
| REQ-74, REQ-78 | request-69ca5755, request-6ae3512a | free_and_reconciled | 2026-07-18/19 | `adopt-gaps` repair-writing; `aligned-crops` verb meaning | NO — repair-writing / verb meaning, per the CLI ownership rule |
| BUG-5 | bug-5b7153d2 | free_and_reconciled | 2026-07-23 | Text-leaf pairing in `sampleFidelityProbe` | NO — scoped under REQ-88 → CAP-71 (info 4) |
| **REQ-150** | request-34dd9049 | **free_coding** (re-checked, unchanged) | 2026-08-18 | Boot a plain Vite SSR server, not Astro's | Would retire STORY-79 §4 + part of §2. Still neither reconciled nor `ready_to_reconcile` → **does NOT count** (info 2) |
| REQ-143, 145, 146, 147, 148 | — | ready_to_reconcile | 2026-08-15 | Cloudflare SiteStore, workerd builder/AI host, Access | NO — other capabilities |
| REQ-149 | request-554ac441 | draft | 2026-08-17 | Cloud publish: revisions, history | NO — not active, and other capability |
| BUG-33, BUG-34 | bug-ede1fb8c, bug-13082cb4 | free_and_reconciled | 2026-08-08 / 08-12 | Builder chrome test suites; copy-modal gradient text preview | NO — builder/control-app capability |
| BUG-35 | bug-1bde3bf9 | bundled (BUNDLE-19) | 2026-08-13 | Copy modal capitalisation preview | NO — builder capability |

**Nothing new is in CAP-63 scope.** The most recent intent touching this
capability's declared surface remains BUNDLE-16 (2026-08-07) plus the four
unbundled requests already carried. Coverage at story level is clean.

## Alignment Ledger

| Element | Kind | Intents aligned to | Outcome |
|---|---|---|---|
| STORY-75 (capture blind spots) | upgrade | bundle-ab9e0cb6; updated_by bundle-31e474b9, bundle-cceaba25, bundle-4ff83a8b, bundle-ee56a66e, request-859652ae (REQ-73) | **aligned** — REQ-73 carried at §15; stale "1c Values-Diff Fidelity" cross-reference now reads "1c Capture & Diff Fidelity (CAP-63, `capability-aa030c83`, `1c_capture_diff_fidelity`)" (body line 60) ✅ |
| STORY-76 (gradients first-class) | feature | bundle-ab9e0cb6 (REQ-59 + REQ-62); updated_by request-0698bbdf (REQ-72) | **aligned** — REQ-72 carried at §3; both dangling `[[values_diff_fidelity]]` wiki-links now `[[1c_capture_diff_fidelity]]` (body line 21) ✅. Out-of-scope correctly excludes radial/conic, matching the capability's value-axis ownership rule that routes the live L1 gradient axis to CAP-70 |
| STORY-77 (size-aware diffing) | feature | bundle-ab9e0cb6 (REQ-61) | **aligned** — "Generalizes CAP-63 (1c Values-Diff Fidelity)" now "Generalizes this capability's single-fixed-width comparison — CAP-63 (`capability-aa030c83`, `1c_capture_diff_fidelity`)" (body line 22) ✅ |
| STORY-78 (responsive-diff N-way) | feature | bundle-ab9e0cb6 (REQ-61) | **aligned** — attempt 9's "most misleading" case fixed: "Belongs to CAP-65 (1c Size-Aware Diffing)" now "Belongs to CAP-63 (`capability-aa030c83`, `1c_capture_diff_fidelity`)", matching its own `capability_uid`; dependency line now names sibling STORY-77 (body line 18) ✅ |
| STORY-79 (1c CLI correctness) | upgrade | bundle-ab9e0cb6; updated_by bundle-31e474b9, bundle-cceaba25, bundle-15c1f647 | **gap** — §1 is correctly generalised from `--multi-viewport` to the flag set as a whole, but its Technical Context now asserts the registry "is now complete", and it is not: `--assign` is unregistered (violation 1). Guarantees 2–5 re-verified and unchanged; §4/§2's bootstrap clause still live because REQ-150 has not reconciled |
| STORY-116 (noise management / report surface) | feature | request-07d0e3e1 (REQ-64); updated_by request-3a11304d (REQ-76) | **aligned** — §5 now states REQ-76's two-member taxonomy (`shape + border`) and marks `outline` as a code-sourced extension, with a Technical Context bullet citing `tools/generate/src/cli/fidelity.ts:463-465` and the map's own shared-cause rule ✅. Boundaries against STORY-75 and STORY-79 remain explicit and non-overlapping |
| capability-aa030c83 | — | — | Body reads current this attempt (info 5). Scope's five bullets each map to exactly one story (§1→STORY-75, §2→STORY-76, §3→STORY-116, §4→STORY-77/78, §5→STORY-79). Scope §5's CLI-wide boolean claim is what violation 1 falsifies in code — the claim itself is right and should not be narrowed |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | **violation** | consistency | capability-aa030c83 (scope §5) + STORY-79 §1 | `code-issue` | The capability asserts CLI-wide that "boolean flags parse as boolean and do not swallow following positionals", and STORY-79's Technical Context now states the `BOOLEAN_FLAGS` registry "is now complete and pinned as a set in evidence". It is not complete. **`assign` is a fourteenth boolean read and is unregistered.** `tools/generate/src/cli/index.ts:987` reads it as `if (flags.assign)`, and the `--help` text at `:313` documents it as a bare toggle (`1c colors <slug> --assign [--names <derived>=<chosen>,…]`) — a value placeholder is given for `--names` but not for `--assign`. Because `assign` is absent from `BOOLEAN_FLAGS` (`cli/args.ts:21-35`), `parseArgs` falls to the value-taking branch (`args.ts:49-56`) and consumes the next non-`--` token. `colors` takes `const slug = requireSlug(rest[0])` at `:986`, so `1c colors --assign gigabytealchemy --names slate=text` parses to `flags.assign = 'gigabytealchemy'`, `positionals = ['colors']`, `rest = []`, and dies at `requireSlug` (`:1337-1341`) with `Missing required <slug> argument.` — the exact signature REQ-58 fixed, reached through a seventh verb. Attempt 9 enumerated the booleans by searching `flags.X === true`, which does not match this truthy-check form, so the sweep was one short. The `colors` verb's *meaning* is CAP-89's, but flag parsing is mechanism and the capability's own CLI ownership rule keeps it here | Add `'assign'` to `BOOLEAN_FLAGS` (`args.ts:21-35`) and to the pinned literal in `test_UAT_FC_REQ-58_boolean_flag_set_is_pinned_entire` (`tests/req58-multi-viewport.test.ts:119-133`); the parameterised `..._never_swallows_the_slug` UAT then covers it automatically. Re-enumerate booleans by **all** truthiness forms (`=== true`, bare `if (flags.X)`, `Boolean(flags.X)`, `!flags.X`), not `=== true` alone. Then drop or soften STORY-79's "is now complete" claim in favour of the pinning discipline, so the story asserts the invariant rather than a point-in-time count |
| 2 | warning | consistency | STORY-79 §1 evidence (`tests/req58-multi-viewport.test.ts:113-134`) | `uat-edit` | The assert-entire discipline STORY-79 §1 claims — "adding a boolean flag to a command without registering it is a visible regression rather than a silent reopening of the hole" — is not what the evidence delivers. `test_UAT_FC_REQ-58_boolean_flag_set_is_pinned_entire` compares `BOOLEAN_FLAGS` against a hardcoded 13-element literal, i.e. it pins the registry **to itself**. It goes red when someone edits the registry, and stays green when someone adds a boolean flag to a verb and forgets the registry — which is the actual failure mode, and is precisely how `--assign` and attempt 9's six survived. Contrast REQ-44's gated-set UAT, which the story cites as the model: `COMMAND_DEPS` is a dispatch-level map that a new verb must be added to, so its literal genuinely pins coverage | Add a UAT that derives the boolean reads from the CLI source (or from a single exported per-command flag spec) and asserts that set equals `BOOLEAN_FLAGS`, so an unregistered boolean fails a test rather than a user's invocation. Without it, this finding is likely to recur a third time |
| 3 | info | — | STORY-75, 76, 77, 78, 116, `cli/args.ts` | — | **Attempt 9 verified resolved.** All six drifted flags (`collapse`, `clusters`, `edit`, `dry-run`, `prune`, `apply`) are registered at `args.ts:29-34` with the doc comment stating the pinning discipline; `BOOLEAN_FLAGS` re-exported at `cli/index.ts:183`; two new UATs present at `tests/req58-multi-viewport.test.ts:113-150`. All five stale capability cross-references (finding 2 of attempt 9) and STORY-116's `outline` paraphrase (finding 3) are fixed — cited per-story in the ledger above | none |
| 4 | info | — | REQ-150 (`request-34dd9049`) | — | Re-checked this attempt: still `free_coding`, unchanged since 2026-08-18. It would retire STORY-79 §4 outright and rewrite §2's bootstrap clause, but `free_coding` is neither reconciled nor `ready_to_reconcile`, so it does not count in this cycle | none now — re-check STORY-79 §2/§4 the cycle after REQ-150 reconciles |
| 5 | info | — | BUNDLE-19 (`bundle-77b28def`), BUG-5 (`bug-5b7153d2`) | — | BUNDLE-19 re-checked: still `reconciling`, referenced by no story matrix-wide, but no member is CAP-63-scope (BUG-35 is a builder copy-modal defect) — the in-flight reconcile should attribute it. BUG-5 remains unstoried matrix-wide; its body scopes it under REQ-88, the fold/gate pipeline this capability puts out of scope → CAP-71 | File BUG-5 against CAP-71; no CAP-63 edit |
| 6 | info | — | capability-aa030c83 | — | **Attempt 9's read anomaly did not reproduce.** `xgd ticket get capability-aa030c83` returns the full 9959-char body this attempt, including the report-surface scope bullet and both new History paragraphs ("BUNDLE-10 attribution repair", "Unbundled-intent repair"). An editor may now safely read-modify-write this capability body | none |

## Notes for the Editor

**The one repair needed for this level to pass is a two-line change**: add
`'assign'` to `BOOLEAN_FLAGS` and to the pinned literal in the UAT. Finding 2 is
the durable fix and is what stops a third recurrence; it is a warning only
because the level can pass without it.

**This is the same finding twice, and the enumeration method is why.** Attempt 9
found six unregistered booleans by grepping `flags.X === true`. That form covers
most of the CLI but not `if (flags.assign)`. I re-enumerated from the other
direction — every `flags.*` and `flags['*']` read in `cli/index.ts` (the only
file in `tools/generate/src` that reads flags at all), 35 distinct names — and
classified each by how it is consumed. Fourteen are boolean; the other
twenty-one (`source`, `out`, `message`, `by`, `channel`, `port`, `ref`,
`actual-image`, `actual-manifest`, `size`, `url`, `viewport`, `actual`,
`ignore`, `sizes`, `box`, `areas`, `names`, `module`, `slot`, `values`) are all
guarded by `typeof … === 'string'` or passed to a parser, so they are genuinely
value-taking. The four computed `flags[name]` reads (`:685`, `:744`, `:846`,
`:1142`) are all inside string/number helpers. `assign` is the only remaining
gap; with it registered the registry is complete against the CLI as it stands
today.

**Coverage remains settled.** I did not rebuild attempt 9's full matrix-wide
sweep — it was independently re-derived that attempt and converged — but I did
re-check the delta since: all `request` and `bug` tickets created after
2026-08-14, plus the two tickets attempt 9 flagged as status-dependent (REQ-150,
BUNDLE-19). Nothing has moved into this capability's scope. Coverage should
stay clean unless a new intent reconciles.

**Still outstanding matrix-wide, unchanged from attempt 9's notes**: the
unbundled-intent sweep has been run for CAP-63 only. REQ-67/68/70/71/75/77/87
(CAP-70) and BUG-5/REQ-74/REQ-78 (CAP-71) remain reconciled, unbundled, and
referenced by no story anywhere. That is still the highest-yield next move
matrix-wide, and it is out of scope here.
