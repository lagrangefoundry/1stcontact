---
uid: comment-d2355940
id: COMMENT-7779
type: comment
title: Claude response for fix_reconciliation_review report
created_by: xgd
created_at: '2026-11-04T19:44:22.645105+00:00'
updated_at: '2026-11-04T19:44:22.645105+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-81e52435
  kind: note
---

I've addressed all eight gaps (G1–G8) from the review, but I haven't run the tests, as instructed. The workflow's next suite run is the first real check of the new UATs. I filed the completion report as REPORT-10918 with `progress_made=true` and `needs_more_work=false`.

**Story and AC changes:**
- **G1 (STORY-117):** I retired BUG-55's "indexed, not primed" bullet with a recorded decision rather than raising a code issue. The awareness map is left out of the index by design (AC-2101), so "primed not indexed" is the correct label. What BUG-55 actually saw was a stale map from a build that died at the map stage, and AC-2235 fixes that. If you do want the map indexed, that needs a new intent.
- **G2 (STORY-146, AC-2115):** I recorded a code issue: nothing checks that a grant's subject is a real account, so any string is stored. AC-2115 now only claims what the code does: grants are looked up by account key, and the capacity grant keeps an empty subject.
- **G3 (AC-2182):** Restated to say "Who they are" shows the primary address and no name; the name lives in the "Their name" section.
- **G4:** AC-2249, 2250, 2251, 2252, 2255 and 2256 are now active, each with new UATs (details below).
- **G6 (AC-2239, STORY-121):** "Nothing depends on the key prefix" now has a behavioural test. "Only one function mints keys" is labelled as a structural claim proved by a source scan, the same treatment the review accepted for AC-2257.
- **G7 (AC-2274):** Restated to say styling is proved by matching stylesheet rules against the rendered elements.
- **G8 (STORY-168, AC-2281):** The stale "fix never landed" text is replaced with a resolved entry; the HTML-body fix did land.

**Test changes** (tests only, no production code):
- **New UATs:**
  - AC-2249, 2251 and 2252 go through the real record route against a real D1 database.
  - AC-2255 and 2256 cover account ownership and provisioning refusals.
  - A new node file checks that the configured platform business id matches across both deployment configs and the baseline seed (AC-2255).
  - AC-2250 is added to the contacts-tab suite.
  - A new jsdom file covers the name pane for AC-2251 and 2252.
- **G5:** a new workers file applies the baseline to a fresh database and counts the rows (AC-2238).
- **G6:** the prefix test now registers two businesses whose keys differ only in prefix and checks they behave identically and can't see each other's sites.
- **G7:** the AC-2274 test now loads `builder.css` into the page and checks that a real rule matches each element. Before, it just searched the file text. I confirmed jsdom parses all 240 rules in the stylesheet.
- **G8:** the AC-2281 test now also asserts no plain-text part is sent.

A typecheck of the changed files showed no errors in the new code; the remaining errors are in older lines or come from the check not loading the Workers type definitions.

**Risks for the suite run:**
- The name-pane tests assume the fields widget sends an empty value when a non-required box is cleared.
- The baseline-seed test assumes each workers test file starts with an empty database. The test library's README says it isolates storage per test, so I expect that holds.

**Not done:**
- The `test_UAT_FC_*` files are still on disk. There's no orphan-check report for this bundle yet, so renaming them wasn't part of this call; that check will flag them later.
- I skipped the review's minor wording notes (AC-2237, AC-2293/2298, the STORY-167 sentence, a mislabelled test name, stale comments). It also flagged the `vitest.node.config.mts` setup edit for you to look at.