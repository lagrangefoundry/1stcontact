---
uid: report-defbd762
id: REPORT-4601
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-21T00:53:35.943860+00:00'
updated_at: '2026-09-21T00:53:35.943860+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/request-b88b79fe.md` — **UU**, intent/bookkeeping ticket (`request-*`), rule **2e**. Incoming commit `60dd71c0533f493ff8a9dee945f5201af056d393` (Fri Aug 28 09:40:51 2026). Four conflict hunks: one in YAML frontmatter, three in the document body.

  Resolved by **composing both sides**, not by picking a winner:

  **Body (hunks 2, 3, 4) — took INCOMING as a structural superset.**
  A whitespace-insensitive word-diff of the two stages (`git diff --word-diff-regex='[^[:space:]]+'` between `:2:` and `:3:`) shows the prose is **word-for-word identical**. The sides differ only in markdown structure, and HEAD's copy is strictly degraded:
  - **Markdown tables destroyed on HEAD.** Both the "Files" table (9 rows) and the "AC status" table (6 rows) are flattened into bare alternating lines on HEAD, with no `|` delimiters and no `|---|---|` separator. Incoming carries them intact.
  - **Blockquote broken on HEAD.** The DOC-13 §2 quote lost its `>` prefix on both continuation lines, so only the first line renders as a quote. Incoming has all three.
  - **Bold markers mangled on HEAD.** `` `storage/references/`** bytes have not moved to R2.** `` and `**vs. option 3 (**`setContent`**/**`data:`**)**` — malformed emphasis spans. Incoming has the well-formed `` **`storage/references/` bytes have not moved to R2.** `` and ``**vs. option 3 (`setContent`/`data:`)**``.
  - Emphasis style `_x_` (HEAD) vs `*x*` (incoming) — cosmetically equivalent.

  HEAD's body arrived via commit `0897d894045661ea3ab68e2857ba56fab22278c5` (Sun Aug 30 17:52:48 2026), whose diff changes **zero words** while reflowing every paragraph and flattening both tables. That is a markdown-normalizer round-trip, not authorial intent — no editorial decision flattens a table into bare lines or strips a blockquote prefix. Under 2e ("one side a strict superset: keep the superset") the incoming body wins: same words, intact structure.

  **Frontmatter (hunk 1) — took HEAD, per fact:**
  - `status`: HEAD `bundled` vs incoming `free_coded`. Genuinely contested; later-positioned intent wins. HEAD-side commit `afd199743a83e4644f8058597f487b7edf98347b` (Mon Aug 31 12:21:41 2026, `updated_at 2026-08-31T05:05:09`) is ~3 days after incoming's `2026-08-28T16:40:51`, and `free_coded → bundled` is forward lifecycle motion. HEAD.
  - `updated_at`: carried with the winning `status` fact → `2026-08-31T05:05:09.416379+00:00`.
  - `last_field_updated`: HEAD `status` vs incoming `story_points`. Carried with the winning fact → `status`. Nothing is lost: `story_points: 8` is identical on both sides, so incoming's marker pointed at an unchanged value.
  - `bundled_in: bundle-8eef3846`: HEAD-only, absent from incoming. Non-overlapping → kept.
  - `commits:` block + `version: 0.2.16`: identical on both sides → kept.

  Staged with `git add --sparse` (path is outside the sparse-checkout cone on this resync branch, DOC-986 §2/§4.1).

## Incoming changes preserved

Verified against `git show 60dd71c0533f493ff8a9dee945f5201af056d393 -- .xgd/tickets/hot/request-b88b79fe.md`.

The incoming commit is `+156 / -3`. Its substantive contribution is the entire `# What was built` section — the AC3 fourth-option rationale, the browser/context lease design, the `1c shot` runtime split, the CF driver's deliberate omissions, the Files table, the 25-UAT test plan, and the AC status table.

**That body is preserved byte-exact.** `git diff --no-index` between the incoming blob and the resolved working file reports *only* the four intended frontmatter lines (`updated_at`, `last_field_updated`, `status`, `+bundled_in`). Every body line is identical. Structural spot-checks on the resolved file: 19 table rows (`^|`) = 11 Files + 8 AC status, and 3 blockquote lines (`^>`) — all recovered from incoming, all absent from HEAD's flattened copy.

The three superseded frontmatter facts (`updated_at` bump to `16:40:51`, `last_field_updated → story_points`, `status` remaining `free_coded`) are not discarded content but earlier positions on the same lifecycle, overtaken by HEAD's later `bundled` transition. Taking them would have rewound the ticket three days and orphaned `bundled_in`.

No hunk was dropped under the BUG-1301 precedence exception — it does not apply. No code, test, or UAT file was involved in this conflict.

Staged result: `M .xgd/tickets/hot/request-b88b79fe.md`, `+156 / -118` vs HEAD. `CHERRY_PICK_HEAD` left intact at `60dd71c0` for the finalize step.
