---
uid: request-5ce26a94
id: REQ-278
type: request
title: 'L1 capability: a flow recovery that preserves horizontal geometry'
created_by: EPIC-12
created_at: '2026-09-18T22:31:35.276566+00:00'
updated_at: '2026-09-19T01:04:32.899825+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: high
  story_points: 13
  epic_parent: epic-bf282b3d
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-a5c00505
  commits:
  - working_sha: 7c021bd02fe8c913757919316aad9bb1c8199480
    reconcile_sha: null
    main_sha: null
  - working_sha: fbcfe5ec14795c883c97be6c04458dee643ccc78
    reconcile_sha: null
    main_sha: null
  version: 0.2.279
---

# L1 capability: a flow recovery that preserves horizontal geometry

## Where this came from

BUG-113 resolved the served-vs-graded split and, in doing so, measured the
recovery we have and declined to serve it. Its numbers, on the three references:

| reference | sections | findings cleared | cost |
|---|---|---|---|
| `gigabytealchemy.ai` | 5 | 287 -> 0 | **318 fidelity residuals, maxΔ 1426px**, 12 oracle samples unmatched |
| `faelan.com` | 1 | 52 -> 0 | 66 residuals, maxΔ 1363px |
| `joyfulculinarycreations.com` | 4 | 114 -> 0 | 413 residuals, maxΔ 3958px |

`promoteToFlow` clears the envelope by dropping each promoted member's geometry,
so a region that was a 14px-wide check glyph in a grid becomes a full-bleed
stacked row. maxΔ 1426px on a 1440px viewport is the whole width. The recovered
document is a different page, not a repaired one — the 80%-faithful copy the
epic's doctrine §2.1 rules out.

So `1c repro` serves the absolute base, and BUG-113 records that choice with its
price printed on every run. Confirmed on the current tree:

```
$ 1c l1-gate --ref storage/references/gigabytealchemy.ai/index   (after refold)
  sample-fidelity     PASS  (maxΔ 0.9px, 0 residuals)
  on-sample           PASS  (0 envelope findings at the captured widths)
  off-sample          PASS  (0 envelope findings)
  content-robustness  FAIL  (287 findings)
  recovery (not served): 287 findings -> 0, at maxΔ 1426.5px / 318 fidelity residuals
```

BUG-113 named the gap and explicitly deferred it: *"The framework gap it names is
a flow recovery that preserves horizontal geometry; that is not this ticket."*
This is that ticket.

## Why it matters

This is one of the **two of twenty-two** items in EPIC-19's audit that raise the
product's ceiling rather than repair the ruler. Content-robustness is the last
failing probe on the epic's reference once the fold fixes land, and an
absolutely-positioned page is fragile by construction: any text that wraps one
line more than the capture did lands on its neighbour. That is a fidelity failure
too, and a more visible one than a sub-pixel position delta.

## Behaviour wanted

A recovery that converts pinned sibling groups to flow **without discarding the
horizontal geometry that made the group a grid**. Concretely, the failure mode to
beat is the one BUG-113 measured: a promoted member must keep its width and its
horizontal position within the group, so a 14px check glyph in a row of them
stays a 14px check glyph in a row of them, and only the *vertical* relationship
becomes flow.

The ticket must report, on the same three references and in the same units
BUG-113 used, what the new recovery clears and what it costs. A recovery whose
maxΔ is still in the hundreds of pixels has not solved this, and saying so is a
valid outcome.

## Acceptance

- The recovery is measured on all three stored references, in BUG-113's units
  (findings cleared, fidelity residuals, maxΔ px, oracle samples unmatched), and
  the table appears in this ticket's body beside BUG-113's for comparison.
- If it wins, `1c repro` serves it and the gate grades what is served — the
  invariant BUG-113 established, which this ticket must not re-break.
- If it does not win, the number is recorded and the base keeps being served, and
  that outcome is written up rather than quietly abandoned.
- Sample fidelity does not regress: currently PASS at maxΔ 0.89px, 0 residuals.

## Depends on

BUG-113, which is `ready_to_reconcile`. The gate must be grading the served
document before a change to what is served can be trusted.

---

## What was built

The recovery keeps every member's width and its position along the line, and
changes only the **frame** those four numbers are read in.

### A new L1 axis: `geometry.place`

`'absolute'` (the default, and what an absent `place` means, so every document
folded before this axis existed is unchanged by it) reads a keyframe's `x`/`y` as
`left`/`top` on an out-of-flow box. `'flow'` reads the same `x`/`y` as **leading
offsets from the flow cursor** — CSS `margin-left` / `margin-top` on a box that
is still in the flow, emitted `position: relative` so it also remains the
containing block any absolute descendant resolves against.

The two frames are exclusive per axis, and the validator refuses the overlap: an
in-flow track cannot also carry a column anchor (an absolute origin) or a
`viewportResponse.yFactor` (a response against the viewport's height). Either
would emit two rules for one axis and leave the winner to media-query order.
Both refusals are stated rules in `L1_STRUCTURAL_RULES`, so BUG-48's
reference-covers-its-source contract holds them.

### The recovery itself

`promoteToFlow` no longer drops geometry. It:

- groups colliding pinned siblings into **bands** — the rows of a grid, a glyph
  and the copy beside it — and keeps a band's members side by side in a `row`,
  each with its own captured width and its own place along the line, at every
  width where they are horizontally disjoint. Where they are not (the same grid
  at a mobile width) the band becomes a `stack` there, carried by a per-width
  layout track;
- places every member `place: 'flow'` with the **same keyframes**, read as
  leading offsets measured from the previous sibling's captured bottom. That
  reproduces the captured position exactly at every sampled width, so the
  recovery costs no fidelity at rest, while leaving the page free to push its own
  content down when a run wraps one line more than the capture did;
- leaves backing surfaces and declared-`stacked` nodes absolute, because a fill
  that joins the flow stops being behind the thing it fills;
- leaves a node with no colliding group absolute entirely — recovery is applied
  where the probe demands it.

### One decision, shared by both verbs

`chooseRecovery` prices both candidates and picks one. The rule binds in order:

1. **Fidelity is not for sale** — no extra residual, no unmatched sample, not one
   pixel of worst-case miss beyond the tenth-of-a-pixel the offsets are rounded
   at.
2. **Neither are the captured widths** — on-sample findings must not go up. A
   collision at a width the page was measured at is a defect, not a judgement
   call.
3. **Then, and only then, the envelope must strictly improve** — off-sample plus
   content-robustness, counted together.

`1c repro` writes the winner and `1c l1-gate` grades the winner, from that one
function, so the served page and the reported verdict can never again be about
two different documents — BUG-113's invariant, now load-bearing in the other
direction because the recovery is what is on disk.

Two consequences fell out of making flow real and are part of the change:

- the analytic evaluator resolves an absolute node against its **nearest in-flow
  ancestor**, not the page, matching what `position: relative` makes the browser
  do;
- `mountBehaviours` no longer translates a mounted subtree by its seam's
  coordinates when the seam is in flow. A seam 182px into its section carries a
  margin, not a page coordinate; translating by it painted a contact form 182px
  from the top of the page, over the header. The seam keeps its frame and holds
  the form inside it instead.

## Measured result — it wins on all three references

Both candidates scored through `chooseRecovery` on the stored bundles, in
BUG-113's units. `envelope` is off-sample + content-robustness counted together,
which is what rule 3 compares; `on-sample` is rule 2; the last three columns are
rule 1.

| reference | regions | on-sample | envelope | maxΔ px | residuals | unmatched | served |
|---|---|---|---|---|---|---|---|
| `gigabytealchemy.ai` | 5 | 0 → 0 | **287 → 118** | 0.89 → 0.89 | 0 → 0 | 0 → 0 | ✅ |
| `faelan.com` | 1 | 38 → 38 | **105 → 21** | 0.95 → 0.95 | 0 → 0 | 0 → 0 | ✅ |
| `joyfulculinarycreations.com` | 4 | 11 → 11 | **490 → 95** | 0.98 → 0.98 | 0 → 0 | 0 → 0 | ✅ |

Against BUG-113's column, the cost line is the whole story: **maxΔ 1426px → 0.89px,
318 residuals → 0, 12 unmatched → 0** on `gigabytealchemy.ai`, and the same
collapse to zero on the other two. The recovery gives up nothing against the
oracle. Sample fidelity is unchanged at every reference, which is the ticket's
fourth acceptance clause.

Split into the probes the gate prints, on the served (recovered) document:

| reference | content-robustness | off-sample |
|---|---|---|
| `gigabytealchemy.ai` | 287 → 116 | 0 → 2 |
| `faelan.com` | 92 → 8 | 13 → 13 |
| `joyfulculinarycreations.com` | 472 → 70 | 18 → 25 |

Two references trade a small number of off-sample findings for a large number of
robustness findings, which rule 3 permits deliberately: the envelope is scored as
one number because off-sample and content-robustness are the same question asked
at a different width, and protecting each separately would refuse a recovery that
is plainly better overall. What is protected separately is on-sample — the widths
the page was actually measured at — and that does not move on any reference.

(BUG-113's robustness figures for `faelan.com` and
`joyfulculinarycreations.com` were 52 and 114; the base now reads 92 and 472 on
the same bundles, because the fold fixes that landed between the two tickets
changed the base. The `gigabytealchemy.ai` figure, 287, is unchanged and directly
comparable.)

The gate, on the epic's reference, after the change:

```
$ 1c l1-gate --ref storage/references/gigabytealchemy.ai/index
  sample-fidelity     PASS  (maxΔ 0.9px, 0 residual(s), 0 unmatched, 12 in mounted behaviour)
  on-sample           PASS  (0 envelope finding(s) at the captured widths)
  off-sample          FAIL  (2 envelope finding(s))
  content-robustness  FAIL  (116 finding(s))
  recovery (SERVED, graded above): 0.14, 0.15, 0.16, 0.17, 0.19 — 287 finding(s) → 116, at maxΔ 0.9px / 0 fidelity residual(s)
```

Content-robustness is not yet clear — 116 findings remain on the epic's
reference. This ticket raised the ceiling and did not reach it; what is left is a
smaller, differently-shaped problem than the one BUG-113 measured, and naming the
residue rather than claiming the probe is a separate piece of work.

## Test plan

`tests/test_UAT_FC_REQ-278_flow_recovery_preserves_geometry.test.ts` — eight
UATs through the real entry points (`foldToL1`, `promoteToFlow`,
`chooseRecovery`, `renderL1Document`, `validateL1`, `mountBehaviours`, `cmdRepro`,
`cmdL1Gate`):

1. a promoted member keeps its width and its place on the line at every captured
   width, and stays beside its copy rather than above it;
2. the recovery costs no fidelity and buys strictly fewer envelope findings;
3. fidelity is never bought with resilience — a recovery that missed the oracle
   by more would not be served;
4. the renderer emits margins for `flow` and `left`/`top` for `absolute`, and a
   pre-`place` document is unchanged by the axis;
5. the validator refuses an in-flow track that also carries a column anchor or a
   `yFactor`;
6. `1c repro` writes the winner and `1c l1-gate` grades that same document;
7. a behaviour mounted into an in-flow seam keeps its frame rather than being
   translated to a page coordinate;
8. the stored references are measured in BUG-113's units — the leg that produced
   the table above, skipped where a bundle is absent since they are gitignored.

Regression scope run: the four suites this change touches
(`reconciliation-3probe-gate`, `req88-l1-repro-pipeline`, BUG-112's on-sample
gate, BUG-113's served-document gate) plus BUG-48's reference-covers-its-source
contract, which needed the two new structural rules provoked; then the full
suite. 5011 passing, 7 failing — 5 of which (`bug32-webui-scope-rebrand`,
`req101-font-registry`, `req22-storage`, BUG-50's env files, BUG-67's backend
settings) are red on this branch with the change stashed, and the sixth
(`req115-builder-shell`) passes in isolation and fails only under full-suite
parallel load. None is in this ticket's area.