---
uid: comment-ad8884dc
id: COMMENT-521
type: comment
title: Comment on bug BUG-25
created_by: xgd
created_at: '2026-07-25T22:17:07.899619+00:00'
updated_at: '2026-07-25T22:29:32.892906+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-fe8af80a
  kind: chat_transcript
---

<!-- xgd-turn id="81d97ab9-f529-47a8-b875-7592a373056e-user" -->

<!-- xgd-chat role="user" ts="2026-07-25T22:17:05.337964+00:00" -->
#### You
Please implement this ticket

<!-- xgd-turn id="81d97ab9-f529-47a8-b875-7592a373056e-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-25T22:29:32.860239+00:00" -->
#### Claude
I'll start by reading the ticket and investigating the capture code.

There are pre-existing uncommitted changes (contact-form) unrelated to this ticket — I'll leave those alone. Let me find the capture code that splits text runs.

Now let me find where text runs are collected and split.

Now I'll implement the fix.

Now the two-pass run collection:

Now check the loop close and that no stale `while` remains:

Let me use a `Map` rather than linear scans (pages can carry thousands of runs):

Now let me write a UAT. First let me look at how existing capture tests are structured.

Now let me create the fixture and the UAT.

Backticks inside the template-string script terminated it — removing them:

Let me verify these were RED before the fix:

Note: other files changed in the tree that aren't mine (likely a concurrent session). Let me confirm my diff is isolated:

Now the gigabytealchemy no-regression check the ticket demands. Let me re-extract that bundle with and without the fix and compare manifests:

Real data. Now the same with the fix stashed:

Zero drift on gigabytealchemy (55 runs, identical geometry). Now verify the actual joyful hero:

All 133 pass. Now the version bump and commit:

Now update the ticket, preserving the existing body:

Done. BUG-25 is at `free_coded`, commit `0de621a`, version `0.0.204`.

## What changed

`runsUnder` in `tools/generate/src/cli/capture/extract.ts` now walks in two passes:

- **Pass 1** counts the qualifying text nodes per element.
- **Pass 2** reads `box` / `renderedTextBox` off the **element** when it owns exactly one run — byte-for-byte the old path — and off a `Range` over the **text node itself** (new `textNodeBox`) when it owns more than one.

I took ticket direction (1), but scoped by *ownership* rather than by line: the rule is "its own rect", not "one run per line". A single text node that wraps stays **one** run whose glyph box spans its lines, so the wrap decision REQ-88 closed is not re-opened. Two text nodes on the same line (split by an inline `<em>`) separate on `x`, not `y`.

## Evidence

| Check | Result |
|---|---|
| Joyful hero (offline re-extract) | `Dreaming…` `y=311.3 w=815.2`; `on your dinner table?` `y=386.7 w=631.2` — one line-height apart |
| Joyful line count | `97/75 → 1` per run (was `172.4/75 → 2` for the pair) |
| Joyful duplicate glyph boxes | 0 across all 65 runs |
| gigabytealchemy no-regression | offline re-extract **byte-identical**, all 55 runs |
| Regression scope | 133 tests (capture / values-diff / fold / 3-probe / e2e-repro) pass |

The gigabytealchemy result is the strongest form of that acceptance bullet — its values-diff and 3-probe numbers can't move because its manifest doesn't change at all.

5 UATs in `tests/bug25-multiline-run-geometry.test.ts` (4 real-Chromium against a committed fixture over loopback, 1 pure fold). I verified 3 of the 5 fail against the pre-fix extractor by stashing the change.

## Two things to flag

**Other sessions' edits are in the tree.** Partway through, `tools/generate/src/l1/fold.ts`, `tools/generate/src/cli/repro.ts`, `tests/req93-*.test.ts`, plus untracked `storage/sites/gendevlabs/` and `tests/req88-form-labelling-and-submit.test.ts` appeared — none of them mine. I staged only my four files, so the commit is clean, but you likely have a concurrent session working in this repo.

**Re-capture needed for the fix to reach downstream artifacts.** The committed `capture.json` / `l1.json` bundles under `storage/references/` still hold the old shared-box geometry — this change only affects captures taken (or re-extracted) from now on.

<!-- xgd-chat-end -->