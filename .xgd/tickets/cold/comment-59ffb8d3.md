---
uid: comment-59ffb8d3
id: COMMENT-524
type: comment
title: Comment on request REQ-94
created_by: xgd
created_at: '2026-07-25T23:41:05.204318+00:00'
updated_at: '2026-07-25T23:54:35.834151+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-16253634
  kind: chat_transcript
---

<!-- xgd-turn id="0a84c3a5-e3b0-4f4f-be3c-90c8c96f2e1b-user" -->

<!-- xgd-chat role="user" ts="2026-07-25T23:41:03.072970+00:00" -->
#### You
Please free code a fix to this

<!-- xgd-turn id="0a84c3a5-e3b0-4f4f-be3c-90c8c96f2e1b-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-25T23:54:35.804689+00:00" -->
#### Claude
I'll start by getting the current ticket state and investigating the pipeline code.

Now let me write the reconciliation module.

Now wire it into the CLI.

Now the USAGE entry and the dispatch case.

Exit code 1, JSON mode clean. Now the regression scope.

Now I'll update the ticket body (preserving the existing content) and move it to `free_coded`.

Done. REQ-94 is at `free_coded` with commit `bb7bf22b`.

## What landed

A new verb, `1c gate <slug> --ref <captureBundleDir>` (`tools/generate/src/cli/gate.ts`), that runs all three gates and — for the first time — compares them.

**1. Perceptual floor.** `meanDiff > 8` or `pctOverThreshold > 25` fails the run regardless of what the value gates say. Overridable via `--mean-floor` / `--pct-floor`. The defaults are provisional and I've said so in code and ticket: DOC-21 §4 wants them calibrated against a human-labelled anchor set that doesn't exist, so I bracketed them between the only two reproductions we have numbers for (gigabytealchemy 2.12/2.6%, joyful 106.84/80.3%). Anything between is unclassified, not wrongly passed.

**2. Reference coverage**, reported every run from numbers the pipeline already had: mirrored image assets no reference element references, and page height per captured section.

**3. A named verdict** so "the reproduction is wrong" and "the capture is incomplete" stop looking identical — `capture-incomplete` / `reproduction-wrong` / `unexplained-disagreement` / `structural-failure` / `pass`. Coverage is consulted *before* the delta count, deliberately: a delta count measured against an impoverished reference isn't evidence.

## One design call worth flagging

**Value-gate deltas are evidence, not part of the exit code.** gigabytealchemy carries 25 values-diff deltas at mean 2.12 — folding them in would have failed it and broken your second acceptance criterion. `1c values-diff` already exits non-zero on any delta and stays the sharp instrument for a text-led page; this verb exists to catch what those gates *miss*.

## Verified live

```
1c gate joyful --ref …/joyfulculinarycreations.com/index --sandbox   → exit 1
  FAIL — capture-incomplete
  l1-gate PASS · values-diff 59 deltas/69 matched · perceptual 106.84, 80.3%  ✗ over floor
  images 4 of 7 referenced · unreferenced: JCC-WEBSITE-LOGO, market-vegetables, HERO-AdobeStock
  sections 2 across 4803px (2402 px/section)
  → "This is a CAPTURE defect, not a reproduction defect."

1c gate gigabytealchemy --ref …/gigabytealchemy.ai/index             → exit 0  PASS
```

The joyful failure names the exact three images BUG-27 is about — hero, logo, produce.

8 UATs in `tests/req94-cross-gate-reconciliation.test.ts`, browser-free through the existing `--actual-image` / `--actual-manifest` seams. Full suite green (115 files / 807 tests); `tsc --noEmit` clean across all five packages.

Two pre-existing dirty paths (`storage/sites/gigabytealchemy/draft/pages/home.json`, untracked `storage/sites/gendevlabs/`) were yours from before this session — I left them alone.

<!-- xgd-chat-end -->