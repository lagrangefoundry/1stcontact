---
uid: bug-84ed4e40
id: BUG-112
type: bug
title: 'gate: a reproduction that paints text over text passes — on-sample layout
  collisions are computed and discarded'
created_by: EPIC-12
created_at: '2026-09-18T02:25:29.092070+00:00'
updated_at: '2026-09-18T03:42:49.393161+00:00'
completed_at: null
last_field_updated: status
status: free_coding
fields:
  priority: high
  epic_parent: epic-bf282b3d
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-af2a66dc
---

# The gate cannot see text painted over text

## What is wrong

Iteration 3 of the `gigabytealchemy.ai` reproduction returned:

```
verdict: "pass"   l1Pass: true   meanDiff: 0.31 (floor 8)   pctOverThreshold: 0.1% (floor 25%)
diagnosis: "The perceptual eye and the structural gate agree the reproduction is faithful."
```

The document that console iteration actually served
(`storage/tmp/repro-console/repro-gigabytealchemy-ai/iteration-3/page.json` →
`data.page.l1`), evaluated with the engine's own `evaluateLayout`, reports **five
text-on-text collisions at 1280px** — the exact width the gate photographs — and
four to five at every other captured width:

```
375   overlap=4
768   overlap=5
1280  overlap=5     <- the width the gate photographs
1440  overlap=5
  "Intentional Software" overlaps "Tools for clarity, presence, and positive connection"
  "Designed for developers building AI-enhanced workflows" overlaps "Open source and community-driven"
  "Completely on-device—your thoughts never leave your phone" overlaps "Creates space for deeper reflection and insight"
```

The operator sees this in the browser as form controls painted over the prose
above them. The gate calls it faithful, so the AI round spends its budget on
fourteen sub-pixel value deltas instead.

## Why the gate cannot see it

The detector already exists and already fires. `evaluateLayout` in
`tools/generate/src/l1/probes.ts` emits `kind: 'overlap'` for any two solid leaf
boxes that intersect. Two independent reasons the finding never reaches a
verdict:

1. **`sampleFidelityProbe` throws the findings away.** It calls
   `evaluateLayout(doc, width)` at every captured width — on the served document
   — and destructures only `leaves`. The overlap findings are computed and
   discarded on the same line.

2. **The two probes that do report findings grade a document nobody serves.**
   `gate-core.ts` builds `recovered = promoteToFlow(base)` and runs the
   off-sample and content-robustness probes against `recovered`. On this bundle
   `recovered` has **zero findings at every width**. The document `1c repro`
   writes is the absolute base, not `recovered` — see the sibling ticket.

So the only probe that looks at the served document discards its findings, and
the only probes that report findings look at a different document.

## Behaviour wanted

A reproduction that paints text over text is wrong regardless of how the pixels
average out, so this is a **structural gate failure, not a ranked region**.

1. The gate evaluates the **document the reproduction actually serves** at every
   captured width and surfaces the resulting `LayoutFinding`s.
2. Any `overlap` finding at a captured width fails the gate. The verdict names
   the colliding leaves and the widths, in the same shape a coverage finding is
   already named, so the AI round's brief carries it without a new format.
3. `clip` findings at a captured width are surfaced the same way. The existing
   off-sample and content-robustness probes are unchanged — this adds the
   on-sample, unperturbed case they never covered.
4. The synthesized-backing-surface exemption already in `evaluateLayout`
   (`section-band-*` / `section-bg-*` / `card-*`) still applies: a fill painted
   behind its own runs is by design and is not a collision.
5. Where an overlap is genuinely intended — a deliberate stacked composition —
   it must be **explicitly chosen and recorded on the node**, never a silent
   default. The engine must not emit an unmarked overlap.

## Testable

- Run the gate against `storage/references/gigabytealchemy.ai/index` as it
  stands today: it currently returns `pass`; after this it must **fail and name
  the five colliding pairs at 1280**.
- A reproduction with no collisions still passes — the gate does not become
  unconditionally red.
- Both directions must be demonstrated, per the epic's rail principle (§8.4).