---
uid: bug-54eee0e0
id: BUG-113
type: bug
title: 1c repro serves the absolute base while the gate certifies the recovered document
created_by: EPIC-12
created_at: '2026-09-18T02:25:34.264842+00:00'
updated_at: '2026-09-18T02:25:34.264842+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: high
  epic_parent: epic-bf282b3d
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-9b245eb4
---

# `1c repro` serves the absolute base while the gate certifies the recovered document

## What is wrong

`tools/generate/src/cli/gate-core.ts` builds two documents:

```
const { doc: recovered, promoted } = promoteToFlow(base, { scale: CONTENT_SCALE })
const report = threeProbeGate(base, multiState, { recovered, contentScale: CONTENT_SCALE })
```

`promoteToFlow` is the machinery that converts pinned sibling groups into flow so
they cannot collide, and on the `gigabytealchemy.ai` bundle it works: `recovered`
reports **zero layout findings at every captured width**, where `base` reports
four to five overlaps.

`tools/generate/src/cli/repro.ts` imports `promoteToFlow` and never calls it. The
page it writes is `localized.doc` — the absolute base. The served
`home.html` for console iteration 3 carries **78 `position: absolute` rules**.

So the envelope probes certify a flowed document that is never served, and the
browser renders a pinned document that was never envelope-checked. The gate's
verdict is about a different artifact from the one the operator is looking at.

## Why this is not obviously a one-line fix

There is a real design tension here and this ticket must resolve it with
evidence rather than assume the answer.

- REQ-88's **absolute-base / structure-overlay** split exists on purpose:
  fidelity is a property of the absolute base — it reproduces the oracle
  exactly — while the envelope probes measure the recovered overlay. Serving the
  base is the maximum-fidelity choice.
- The epic's doctrine §2.1 says an 80%-faithful copy is worse than no copy, which
  argues for the base.
- But an absolutely-positioned page is fragile by construction: any text that
  wraps to one more line than the capture did lands on its neighbour. That is a
  fidelity failure too, and a far more visible one than a sub-pixel position
  delta.

## Behaviour wanted

Resolve the split, and make the gate's verdict describe the served artifact
either way. Two admissible outcomes:

**(a) Serve the recovered document.** `1c repro` writes
`promoteToFlow(base).doc`. The fidelity residual this introduces must be
measured and reported, not assumed negligible — if promotion costs fidelity, the
number says how much.

**(b) Keep serving the base, and say why.** The reason is recorded in the code
and in this ticket, and the envelope probes are additionally run against the
base so the served document is envelope-checked rather than exempt.

In both cases the invariant is the same: **whatever document is served is the
document the gate's verdict is about.** No probe may grade an artifact that is
not written to disk.

## Testable

- `evaluateLayout` over the document `1c repro` writes for
  `storage/references/gigabytealchemy.ai/index` reports **zero `overlap`
  findings at every captured width** — under (a) because the served document is
  flowed, under (b) because the base was repaired once the probes could see it.
- The measured fidelity residual between base and served document is reported as
  a number, so the trade made is visible rather than implicit.
- Open the reproduction in a browser at a width that is not 1280 and the form
  controls no longer paint over the prose above them.