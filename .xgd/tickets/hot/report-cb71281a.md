---
uid: report-cb71281a
id: REPORT-2356
type: report
title: 'Capability-Intent Alignment: 1c Capture & Diff Fidelity (level=story)'
created_by: xgd
created_at: '2026-08-20T03:54:33.132049+00:00'
updated_at: '2026-08-20T03:54:33.132049+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-aa030c83
  level: story
  violations: 1
  warnings: 2
  needs_review_count: 0
---

# Capability-Intent Alignment: 1c Capture & Diff Fidelity
# Level: story

**Result**: FAIL
**Violations**: 1
**Warnings**: 2
**Needs review**: 0

Attempt 9. **The attempt-8 repair is verified complete and correct** — all four
of its violations are genuinely resolved and the two ownership warnings are
recorded in the capability body (see Verified-Resolved). The unbundled-intent
sweep that attempt 8 introduced was re-run independently this attempt and found
**no further unstoried in-scope intent**; coverage at story level is now clean.

The failure at this attempt is a **consistency** finding, not a coverage one, and
it is newly *detectable* rather than newly *introduced*: attempt 8's STORY-116 put
`--collapse` and `--clusters` into the matrix for the first time, and those two
flags are live counter-examples to the CLI-mechanism guarantee this capability
declares for the whole command set. The guarantee is implemented as an allowlist
that has drifted four flags behind the CLI.

## Cumulative Intent Considered

### Bundled intents

| Intent ID | UID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|---|
| BUNDLE-1…5 | — | free_and_reconciled | 2026-06-30 … 07-13 | REQ-12/13 capture+shot, REQ-31 values-diff loop, REQ-35 tolerances, REQ-38 pixel diff, REQ-47/48 fidelity gate, REQ-51/53 object-grouped + exact-by-default | pre-matrix-genesis — see Notes |
| BUNDLE-6 (REQ-58 + REQ-59 + REQ-62 + REQ-61) | bundle-ab9e0cb6 | free_and_reconciled | 2026-07-17 | Multi-viewport ladder; boolean-flag parse; `--json` stdout hygiene; gradient stop positions; panel surface gradients; `--size`; `responsive-diff` | YES — origin intent of STORY-75/76/77/78/79 |
| BUNDLE-7 (REQ-63 + REQ-79 + REQ-82…86) | bundle-31e474b9 | free_and_reconciled | 2026-07-22 | REQ-63 coverage audit (STORY-75 §4/§7/§8); REQ-79 fontLoad false-positive fix, verbatim `"9ca73953 (part) values-diff fontLoad false-positive fix — capture/values-diff (measurement spine). KEEP"` (STORY-75 §10); `aligned-crops --sandbox` propagation (STORY-79 §3) | YES |
| BUNDLE-8 (BUG-7 + REQ-89 + REQ-90 + REQ-91 + REQ-92 + 5 more) | bundle-cceaba25 | free_and_reconciled | 2026-07-29 | REQ-89 pages-directory warning suppressed at source + Astro-free render path (STORY-79 §2/§4); BUG-10 painted-marker precondition (STORY-75 §7) | YES |
| BUNDLE-10 (BUG-12…BUG-25, REQ-88, REQ-93) | bundle-4ff83a8b | free_and_reconciled | 2026-07-29 | BUG-15 all-collapse fallback; BUG-16 font settling; BUG-22 surface-bearing box; BUG-24 modern-syntax scrim; BUG-25 per-text-node run geometry | YES — repaired attempt 7, re-verified |
| BUNDLE-11 (BUG-27 + REQ-94 + REQ-96 + 12 more) | bundle-ee56a66e | free_and_reconciled | 2026-08-05 | BUG-27 painted band extent, document-wide backdrops, background-image axis (STORY-75 §11–§13); REQ-96 module-invariant exclusion (§14) | YES |
| BUNDLE-16 (REQ-117 + REQ-115 + REQ-44) | bundle-15c1f647 | free_and_reconciled | 2026-08-07 | REQ-44 install preflight at dispatch (STORY-79 §5) | YES |
| BUNDLE-17 / BUNDLE-18 | bundle-e59210c5 / bundle-d9226698 | free_and_reconciled | 2026-08-10 / 08-13 | control-app, builder, palette. No capture/diff or CLI-mechanism ask | YES (no CAP-63 ask) |
| BUNDLE-19 (REQ-133 + BUG-35 + REQ-131 + REQ-139/140/123/141/142/144) | bundle-77b28def | **reconciling** | 2026-08-18 | Editor/palette/workerd. No CAP-63-scope member | imminent (no CAP-63 ask) — info 3 |
| BUNDLE-12, BUNDLE-15 | bundle-0e41ff44, bundle-7985e0d1 | abandoned | 2026-08-06 | superseded duplicates | NO |

### Unbundled intents — sweep re-run independently this attempt

Method: all 141 `request` + all 34 `bug` tickets, minus every ID appearing as a
member of any bundle, minus every UID appearing in any story's
`intent_uid`/`updated_by` **matrix-wide** (31 stories, 18 distinct intents
referenced). 28 live requests and 3 live bugs remain unreferenced matrix-wide.
Triaged against this capability's declared scope:

| Intent ID | UID | Status | When | Asked | In CAP-63 scope? |
|---|---|---|---|---|---|
| REQ-64 | request-07d0e3e1 | free_and_reconciled | 2026-07-17 | Noise audit — per-axis noise layer over an exact capture, `--collapse` per-defect dedup, Type-A/Type-B repair order | YES — **now carried by STORY-116** (`intent_uid`) ✅ |
| REQ-76 | request-3a11304d | free_and_reconciled | 2026-07-18 | `--clusters` ranked causes with fix/review/accept dispositions, viewport-aware | YES — **now carried by STORY-116** (`updated_by`) ✅ |
| REQ-72 | request-0698bbdf | free_and_reconciled | 2026-07-18 | In-browser hexification of gradient stop colours | YES — **now carried by STORY-76** (`updated_by`) ✅ |
| REQ-73 | request-859652ae | free_and_reconciled | 2026-07-18 | Adjacent-gap axis + band-padding retirement | YES — **now carried by STORY-75** (`updated_by`) ✅ |
| REQ-66 | request-b94426f4 | free_and_reconciled | 2026-07-18 | `adopt-values` Type-A copy | Correctly absent — retired; STORY-84 records the supersession |
| REQ-74 | request-69ca5755 | free_and_reconciled | 2026-07-18 | `adopt-gaps` writes a repair into a site | NO — repair-writing; STORY-116's out-of-scope now names it explicitly |
| REQ-78 | request-6ae3512a | free_and_reconciled | 2026-07-19 | `1c aligned-crops` verb meaning | NO — verb *meaning*; CLI ownership rule keeps it with the owning capability |
| BUG-5 | bug-5b7153d2 | free_and_reconciled | 2026-07-23 | L1 fidelity gate pairs text leaves by string → phantom deltas (`tools/generate/src/l1/probes.ts`) | NO — scoped under REQ-88, the fold/gate pipeline this capability puts out of scope → CAP-71. Info 2 |
| REQ-150 | — | **free_coding** | 2026-08-18 | Boot a plain Vite SSR server, not Astro's — deletes the inline Astro logger config, the pages-directory WARN it suppresses, and possibly the stdout→stderr diversion | Would retire STORY-79 §4 + part of §2. Status `free_coding` is neither reconciled nor `ready_to_reconcile` → **does NOT count yet**. Info 1 |
| REQ-9, REQ-11, REQ-21, REQ-36, REQ-41, REQ-42, REQ-49, REQ-50 | — | free_and_reconciled / legacy_done | 2026-06-30 … 07-10 | CLI storage, structured-edit, reproduction milestones, conformance harness, framework dials | NO — other capabilities and/or pre-genesis |
| REQ-67, REQ-68, REQ-70, REQ-71, REQ-75, REQ-77, REQ-87 | — | free_and_reconciled | 2026-07-18 … 07-21 | Module dials, styled runs, responsive TextRun typography, behavior-module rename | NO — framework/module capabilities. Unstoried matrix-wide — see Notes |
| REQ-95, REQ-125, REQ-132, REQ-135, REQ-138 | — | free_and_reconciled / legacy_done | 2026-07-25 … 08-12 | Authoring probe, DOC-30, page editor | NO — other capabilities |
| REQ-143, REQ-145, REQ-146, REQ-147, REQ-148 | — | ready_to_reconcile | 2026-08-15 | Cloudflare SiteStore, workerd builder/AI host, Access | NO — imminent, other capabilities |
| BUG-2, BUG-3 | — | legacy_done | 2026-07-09 | Sandbox asset subset; `1c shot` lazy below-fold images | NO — pre-genesis; superseded by BUG-27 (STORY-75 §12), which is storied |
| BUG-4, BUG-29 | — | legacy_done / fixed | 2026-07-19 / 07-28 | XGD resync + ticket-store repairs | NO — XGD tooling, not this product |

**Matrix-genesis boundary confirmed mechanically this attempt.** BUNDLE-1…5
(2026-06-30 → 2026-07-13) are referenced by no story anywhere in the matrix;
*every* bundle from BUNDLE-6 (2026-07-17) onward is referenced by at least one
story. A contiguous unreferenced prefix with no interior hole is a genesis
boundary, not skipped intent — the same test that correctly identified BUNDLE-10
as a *hole* in attempt 7 (BUNDLE-8 reconciled the same day and was attributed).
REQ-31/35/38/47/48/51/53/12/13 are therefore pre-history and not coverage gaps.

## Alignment Ledger

| Element | Kind | Intents aligned to | Outcome |
|---|---|---|---|
| STORY-75 (capture blind spots) | upgrade | bundle-ab9e0cb6; updated_by bundle-31e474b9, bundle-cceaba25, bundle-4ff83a8b, bundle-ee56a66e, **request-859652ae (REQ-73)** | **aligned** — REQ-73 now carried at §15 (gap axis + band-padding retirement), with the retirement correctly stated as capture-yes/compare-no. §10 fontLoad reverse direction verified against REQ-79's body. §1–§14 map cleanly to BUNDLE-7/8/10/11 |
| STORY-76 (gradients first-class) | feature | bundle-ab9e0cb6 (REQ-59 + REQ-62); updated_by **request-0698bbdf (REQ-72)** | **aligned** — REQ-72 now carried at §3 (in-browser stop hexification), correctly framed as the precondition without which §1/§2's stops capture empty. The legacy authoring half remains live and correctly scoped: `resolveSurfaceGradient` at `packages/framework/src/modules/text-style.ts:223`, exported via `packages/framework/src/index.ts:33` — overlap-cluster-4's ownership rule holds |
| STORY-77 (size-aware diffing) | feature | bundle-ab9e0cb6 (REQ-61) | aligned (warning 1 — stale capability cross-reference) |
| STORY-78 (responsive-diff N-way) | feature | bundle-ab9e0cb6 (REQ-61) | aligned (warning 1 — stale capability cross-reference) |
| STORY-79 (1c CLI correctness) | upgrade | bundle-ab9e0cb6; updated_by bundle-31e474b9, bundle-cceaba25, bundle-15c1f647 | **gap** — guarantee 1 is accurate to REQ-58 but the capability body generalises it CLI-wide, and the code does not deliver the general form (violation 1). Guarantee 5's gated set re-verified verbatim against `cli/preflight.ts` |
| STORY-116 (noise management / report surface) | feature | **request-07d0e3e1 (REQ-64)**; updated_by **request-3a11304d (REQ-76)** | **aligned** — every one of its six items traces to a counted intent. §1 ← REQ-64 "Approach" + "Notes"; §2 ← REQ-64 noise source #3 + REQ-76 preamble; §3 ← REQ-76 "After the false-positive kills (position derived, text-box-size)"; §4 ← REQ-64's repair order, quoted verbatim by BUG-22 (`repair order (REQ-64): A-flat 2 -> A-structural 1 -> B 14`) and by REQ-66 ("the 'copy' half of the REQ-64 repair order"); §5/§6 ← REQ-76 Requirements + Evidence. Live in code at `cli/index.ts:272,274,790-802` and `cli/fidelity.ts:309,318,379,507,513`. Boundaries against STORY-75 (gap axis, capture-side preconditions) and STORY-79 (stdout hygiene, flag parsing) are explicit and non-overlapping |
| capability-aa030c83 | — | — | scope's five bullets each map to exactly one story (§1→STORY-75, §2→STORY-76, §3→STORY-116, §4→STORY-77/78, §5→STORY-79). No `intent_uid`/`updated_by` on the capability itself (info 4, as prior attempts) |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | **violation** | consistency | capability-aa030c83 (scope §5) + STORY-79 §1 | `code-issue` | The capability asserts, for the *whole* command set, that "boolean flags parse as boolean and do not swallow following positionals". It is implemented as a single allowlist — `BOOLEAN_FLAGS = new Set(['sandbox','force','json','tolerant','compare-years','multi-viewport','classify'])` at `tools/generate/src/cli/args.ts:11` — which has drifted behind the CLI. **Six** flags are read as booleans but unregistered: `collapse` and `clusters` (`cli/index.ts:794-795`, REQ-64/REQ-76 — the two flags STORY-116 now documents), `edit` (`:469`), `dry-run` and `prune` (`:498-499`), `apply` (`:978`). For an unregistered name, `args.ts:26-32` consumes the next non-`--` token as the flag's value. Every one of those commands then takes `slug = requireSlug(rest[0])`, so `1c values-diff --multi-viewport --collapse <slug> --ref <dir>`, `1c deploy --prune <slug>`, `1c render --edit <slug>` and `1c adopt-gaps --apply <slug>` all lose the slug and die with the exact `Missing required <slug>` signature REQ-58 fixed for `--multi-viewport`. This is newly *detectable*, not newly introduced: attempt 8's STORY-116 is what first put `--collapse`/`--clusters` in the matrix | Register every boolean flag (or invert `args.ts` to a value-taking allowlist so a new flag is boolean by default), and pin the boolean set entire in evidence — the same "asserted entire, so a gap is a visible regression rather than a silent hole" discipline the capability already applies to guarantee 5's gated command set. Generalise STORY-79 §1 from the single `--multi-viewport` example to the flag set as a whole |
| 2 | warning | consistency | STORY-75, STORY-76, STORY-77, STORY-78, STORY-79 | `story-body-edit` | Five story bodies name capabilities retired by the 2026-08-05 structural rebalance. CAP-64/CAP-65/CAP-66 are `deprecated` and CAP-63 was renamed from "1c Values-Diff Fidelity" to "1c Capture & Diff Fidelity". Occurrences: STORY-75 Technical Context "Belongs to capability **1c Values-Diff Fidelity** (`capability-aa030c83`)"; STORY-76 `[[values_diff_fidelity]]` ×2 (dangling — CAP-63's `fields.name` is now `1c_capture_diff_fidelity`); STORY-77 "Generalizes CAP-63 (1c Values-Diff Fidelity)"; STORY-78 "Belongs to CAP-65 (1c Size-Aware Diffing)"; STORY-79 "Related capabilities: CAP-63 (1c Values-Diff Fidelity), CAP-65 (1c Size-Aware Diffing)". No behavioural claim is wrong; the cross-references are stale | Retarget each to CAP-63 / `1c_capture_diff_fidelity` (or drop the parenthetical name). STORY-78's "Belongs to CAP-65" is the most misleading — its `capability_uid` is `capability-aa030c83` |
| 3 | warning | consistency | STORY-116 | `story-body-edit` | STORY-116 §5 states the cause map merges "shape + border + outline = control styling", but REQ-76's cause taxonomy lists only "shape + border -> control styling (fix)" — `outline` is not in the intent's table. `outline` is a real captured axis (STORY-75 §8), so folding it into control styling is plausible, but no counted intent asks for it | Either cite the code as the source for the third member, or drop `outline` from the §5 example so the story matches REQ-76's taxonomy |
| 4 | info | — | STORY-116, STORY-76, STORY-75 | — | Attempt 8's four coverage violations verified genuinely resolved: REQ-64/REQ-76 → STORY-116 (created 2026-08-20, `story_kind: feature`, `capability_uid` correct); REQ-72 → STORY-76 `updated_by`; REQ-73 → STORY-75 `updated_by`. Capability body carries the "Unbundled-intent repair (2026-08-19)" note and the extended scope bullet for the report surface | none |
| 5 | info | — | REQ-150 | — | REQ-150 (`free_coding`, 2026-08-18) replaces Astro's Vite bootstrap with a plain Vite SSR server and explicitly deletes "the inline Astro config passed solely to gate Astro's logger, and the 'Missing pages directory' WARN it exists to suppress", and possibly the stdout→stderr diversion. That retires STORY-79 §4 outright and rewrites §2's bootstrap clause. `free_coding` is neither reconciled nor `ready_to_reconcile`, so it does not count in this cycle | none now — re-check STORY-79 §2/§4 the cycle after REQ-150 reconciles |
| 6 | info | — | BUG-5 | — | BUG-5 (`free_and_reconciled`, 2026-07-23) is in no bundle and referenced by no story matrix-wide. It fixes text-leaf pairing in `sampleFidelityProbe` (`tools/generate/src/l1/probes.ts`) and its own body scopes it under REQ-88, so it is CAP-71's (the fold/gate pipeline this capability puts out of scope), not a CAP-63 gap. Same class attempt 8 found here | File against CAP-71 — no CAP-63 edit |
| 7 | info | — | BUNDLE-19 | — | `bundle-77b28def` (BUNDLE-19, `reconciling`, 2026-08-18) is referenced by no story matrix-wide, but no member is CAP-63-scope; the in-flight reconcile should attribute it | none |

## Notes for the Editor

**The one repair needed for this level to pass is finding 1**, and it is a code
change plus a one-sentence story-body generalisation — not a matrix restructure.
Findings 2 and 3 are warnings and can ride along or wait.

**Coverage is now clean and was independently re-derived, not inherited.** I
rebuilt attempt 8's sweep from scratch (bundle membership parsed from bundle
bodies; story references collected from all 31 stories' `intent_uid` +
`updated_by`) rather than trusting the prior report, and it converged on the same
in-scope set with nothing new. Combined with the mechanically-confirmed
BUNDLE-1…5 genesis boundary, the coverage question for this capability should now
be considered settled unless a *new* intent reconciles.

**The systemic pattern attempt 8 found is much wider than CAP-63, and CAP-63 is
now the only capability repaired for it.** 28 live `request` tickets and 3 live
`bug` tickets are reconciled, unbundled, and referenced by no story anywhere in
the matrix. Clear non-CAP-63 clusters worth filing against their owners:

- **Framework / module capabilities (CAP-70)** — REQ-67 (contact-form field
  styling dials), REQ-68 (footer `copyrightOpacity` + services-grid card
  fill/gradient/badge), REQ-70 (responsive TextRun typography), REQ-71 (styled
  inline runs in markdown prose), REQ-75 (overlay wordmark anchoring), REQ-77
  (services-grid card margin), REQ-87 (behavior-module rename). All
  `free_and_reconciled` 2026-07-18 → 07-21, all post-genesis.
- **CAP-71 (fold / gate)** — BUG-5, plus REQ-74 and REQ-78 whose *verb meaning*
  the CLI ownership rule assigns away from here.
- **Editor / control-app capabilities** — REQ-132, REQ-135, REQ-138.

Every one of these postdates BUNDLE-6, so the genesis exemption does not cover
them. The mechanical cause is the same one attempt 8 identified here: matrix
genesis consumed *bundle* reconciliations, and an intent that free-codes and
reconciles without ever being bundled was never enumerated. Running the unbundled
sweep against CAP-70 and CAP-71 is likely to be the highest-yield next move
matrix-wide.

**On finding 1's classification.** I reached for `code-issue` reluctantly, per the
"use sparingly" rule, but the evidence is a 27-line pure function with no
ambiguity (`args.ts:14-40`) and six named call sites, and the alternative repair —
narrowing the capability's scope claim to "the `--multi-viewport` flag" — would
contradict the capability's own stated reason for owning CLI mechanism wholesale
("its evidence is only meaningful pinned across the verb set as a whole"). The
guarantee is meant to hold CLI-wide; the allowlist is what has fallen behind.
