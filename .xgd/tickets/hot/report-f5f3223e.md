---
uid: report-f5f3223e
id: REPORT-2337
type: report
title: 'Resync resolve conflicts: 7292af8f63220275216b82416fc441658a744e02'
created_by: xgd
created_at: '2026-08-20T03:03:20.332910+00:00'
updated_at: '2026-08-20T03:03:20.332910+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-db1949d9
---

## Files resolved

- **`package.json`** — UU, config scalar. Sole conflict was the version scalar: ours `0.1.59` (main-rooted resync branch), theirs `0.1.51`. The incoming commit's only change to this file is the free-coded bookkeeping bump `0.1.50 → 0.1.51`; main is already past it. Kept `0.1.59` (the more recent side). No functional incoming content exists in this file to discard. Resolution equals HEAD, so `package.json` shows no net staged change — expected, not a dropped resolution.

- **`tests/reconciliation-beyond-l1-authoring.test.ts`** — UU, code file (`tests/**`), rule 2c: incoming is authoritative, non-overlapping changes keep BOTH. Four conflict hunks. Diffing base→theirs showed the incoming change to this file is *purely* the sync→async conversion of the `Box`/`json` toolbox helpers (`run` returns `Promise<string>`, `json` is `async`); ours is main's substantially richer test body (1129 lines vs 926) still written synchronously. The two sides are not competing on content — they are the same tests at different content revisions, one of which is being ported to async. Resolved by keeping **ours' content** and applying **theirs' async conversion** to it:
  - hunk 1 (`AC1099` component read/write): kept ours' `MapSegment` interface, the `expect(node).toEqual(readPage()...slots.form)` identity assertion, and the whole `set_l1` label-rewrite block that theirs does not have; awaited `json`/`box.run` throughout, wrapping `(await json<...>({...})).node` per theirs' style.
  - hunk 2 (`AC1107` image replace): kept ours' module-level `REDRAWN` constant — the post-conflict common line 863 asserts against `REDRAWN`, so theirs' inline `const redrawn` would have left the assertion referring to an undefined binding. Added `await`.
  - hunk 3/4 (`AC1109` CLI/surface parity): kept ours' `configure_component` / `add_component` `spare` / `remove_component` / `write_image` replace sequence — theirs' thinner version omits it while the shared tail (lines 1112–1114) asserts on `REDRAWN` bytes and the replace behaviour. Awaited all six calls.

### Escaped-conversion sweep (same file)

A file-wide sync→async conversion only conflicts where both sides touched the same lines; main-added call sites merge clean and silently stay synchronous. Two such sites in this file were left un-awaited by the automatic merge and were converted as part of this resolution:

- line ~239 `set_config` / `tagline` (`AC1096`)
- line ~477 `add_component` / `reviews` carousel presentation (`AC1103`)

Both are main-added regions absent from base, so git applied theirs' conversion nowhere near them. Leaving them would have compared a `Promise<string>` against `.not.toContain(...)` — a silent always-pass. The incoming commit message names exactly this class of defect ("their un-awaited `Toolbox.run` was a race this ticket lost").

Sibling staged files (`reconciliation-page-composition-surface`, `reconciliation-assistant-control-surface`, `test_UAT_FC_REQ-126`, `test_UAT_FC_REQ-129`) also contain un-awaited `box.run` calls, but those are **not** escapes: the incoming commit touches each of them only to swap `{ cwd }` for `fsOpts(cwd)` and never converts their locally-declared sync `Box`. They are part of the pre-existing failure set the commit message records, unchanged by this resync, and were deliberately left alone.

## Incoming changes preserved

Verified against the staged blob (`git show :tests/reconciliation-beyond-l1-authoring.test.ts`):

- `interface Box { run: ... => Promise<string> }` present at line 46 — theirs' signature.
- `const json = async <T,>(...): Promise<T>` present at line 53 — theirs' signature.
- 56 awaited toolbox call sites (`await box.run` / `await json<`); a grep for un-awaited `box.run(` or `json<` in the resolved file returns nothing.
- `package.json`: incoming's only hunk is the version bump, superseded by main's higher version; nothing else in the incoming blob to preserve.

Main-side content also confirmed intact in the staged blob: `REDRAWN` (line 150), `interface MapSegment` (367), the `set_l1` label rewrite ("How can we help?", 406–421), and the `remove_component` parity calls (576, 584, 1081).

No UAT function was deleted from either side. No conflict-class lines remain; `CHERRY_PICK_HEAD` is untouched.

## Flagged for post-merge review

`package.json` — resolved under the "intent unknown, take the more recent side" rule, as the enrichment directed.
