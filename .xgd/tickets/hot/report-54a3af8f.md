---
uid: report-54a3af8f
id: REPORT-7180
type: report
title: Claude reconciliation_uat_generation report
created_by: xgd
created_at: '2026-11-01T01:17:08.567800+00:00'
updated_at: '2026-11-01T01:17:08.567800+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_uat_generation
  subject_uid: STORY-106
---

I wrote 7 UATs for STORY-106. Five pass. Two fail because the code drops part of what AC-2069 and AC-2072 require the refusal to say, so the fix-it loop needs to handle them.

```
⚠️ TESTS FAILING — downstream fix-it loop required

Story: STORY-106
Test file(s) created:
  - tests/reconciliation-page-composition-document.test.ts

Tests written: 7
Tests passed: 5
Tests failed: 2

Failures:
  - test_UAT_AC2069_page_style_write_merges_top_level_replaces_whole_removes_null_and_validates:
      Through the assistant's surface, a set_page_style refusal for an unknown key does
      not list the writable keys, and a refusal for `root` does not point to set_l1.
  - test_UAT_AC2072_a_reference_to_an_asset_the_site_does_not_hold_is_refused_naming_it:
      The broken-asset refusal does not say "reference something the site holds, or add
      it to the site first".

test_files_created:
  - "tests/reconciliation-page-composition-document.test.ts"
```

**Why they fail:** this is the code falling short of the ACs, not a wrong test. `editDocumentSet` and `validateOrThrow` in `tools/generate/src/cli/edit.ts` put that text in the error's `hint`. The toolbox's `describeFailure` (in `@lagrangefoundry/ai`, `toolbox/runtime.js:654`) passes on only the `message`, so the hint never reaches the caller. AC-1090's strategy for a broken reference is affected the same way. The fix is either to put the guidance in the message or to have the toolbox render the hint. I didn't touch runtime code.

Everything else in those two tests passes:
- merging at the top level, whole-value replacement and null removal;
- the element tree staying identical;
- the reply naming the changed keys;
- refusals for a stranded width, wrong-shape value, empty write, unknown key, `root` and column removal, each leaving the draft unchanged;
- refusals that name the asset and list the held assets;
- a cache-busting `?v=3`, a `#frag` suffix, a bare name or an absolute `https://` reference all accepted.

I made the hint assertions soft so they don't stop the rest of each test running.

**Passing, one test each:**
- **AC-2068:** the style read is verbatim and its key set is derived from the schema.
- **AC-2070:** `describe_page` carries the style keys and its element map has no styling.
- **AC-2071:** the font-stack rule holds, including on `set_page_style`.
- **AC-2073:** a broken reference already on the page doesn't block a write, even when it moves; a newly introduced one is refused.
- **AC-2074:** every page in the reproduction corpus round-trips unchanged.

**Other things to know:**
- **Gap in AC-2073:** I can't test that a *new page* carrying a broken reference is refused. `add_page` creates a page with no element tree, so no public entry point can make one.
- **AC-1090 and AC-1092:** these ACs were extended, but their existing tests in `tests/reconciliation-page-composition-surface.test.ts` don't cover the new parts. I wasn't allowed to change existing tests. AC-2071 and AC-2072 cover the broken-reference refusal content from AC-1090. The requirement that the page-style write lives in the authoring group is still only covered by the free-coded `test_UAT_FC_REQ-175_*` file.
- **Not checked:**
  - **Lint:** I couldn't run it, because eslint isn't installed locally and the sandbox blocked the npm registry.
  - **Setup step:** the tests only ran after I ran `bin/1c assets`. It generates `apps/control-app/src/generated/`, which is gitignored, and no tracked files changed.
