---
uid: comment-f8244b30
id: COMMENT-2415
type: comment
title: Claude response for fix_structural_validation report
created_by: xgd
created_at: '2026-09-10T00:58:35.929409+00:00'
updated_at: '2026-09-10T00:58:35.929409+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-f2288e93
  kind: note
---

Report filed as `report-f2288e93`, with `needs_more_work: false` — handing back to the assessor.

## What I did

Closed three more pending ACs, each in a new browser-free file:

- **AC-1607** — drives the real `reextractFromBundle` with a fake browser seam doing real loopback HTTP. Asserts what the offline server actually hands back, and that the mirrored font resolves at the rewritten path.
- **AC-1608** — the veil captured as its own overlay value, plus the section-level `overlay` diff axis.
- **AC-1611** — one test per clause of the gradient ancestor-selection rule.

Three mutation tests, each with the FC siblings as control:

| Mutant | Result |
|---|---|
| `reextract.ts` serves text verbatim | Caught by the new tests; the only sibling that would have caught it **skipped** (browser-gated) |
| `overlayOf` drops the alpha gate | Caught; all 4 BUG-24 siblings stayed green — they're fold tests taking the overlay as *input* |
| `surfaceGradientOf` drops the text-fill skip and opaque stop | Caught; all 4 gradient siblings green — they cover the compare, never the selection |

That last one is what AC-1611 itself predicts: "the one place the capture can be silently wrong in a way the diff cannot detect."

`Test Files 15 passed | Tests 108 passed | 11 skipped`. Production untouched — two reverts left a comment em-dash mangled by my patch script; both were caught by `git status` and restored with `git checkout`.

## Why I stopped here

Finding 10 is **12 of 13**. AC-1612 is the last AC in the 648-AC store still at `uat_coverage: missing`, and it isn't authorable browser-free: its Criterion requires the stop list be "resolved to `#rrggbb` **in-browser**" and explicitly rules out "colour-space maths reimplemented in the tool". Making a test pass under jsdom would mean reimplementing exactly the thing the AC forbids. Where a clause needed a browser I said so in the test header rather than quietly asserting less — same for AC-1607's `fontLoaded` clauses and AC-1608's modern-syntax veil.

So the three remaining items all share one blocker:

| Item | Blocker |
|---|---|
| Finding 3 (AC-720) | Your call: browser-gated e2e leg vs `ac-edit` dropping the clause |
| Finding 4 (AC-815) | No Chromium — authored in call 1, reports SKIPPED |
| AC-1612 | No Chromium |

**One decision unblocks most of this**: running the loop on a host with Chromium would clear finding 4 and AC-1612, and let AC-720 take branch (a). Absent that, AC-720 needs your choice — removing an assertion from an AC isn't mine to make, and it's now on its ninth filing.

Also still outstanding for an ac-level pass: AC-1610 and AC-1605 each have a Verification sentence that overreaches its own Criterion (details in the earlier reports).
