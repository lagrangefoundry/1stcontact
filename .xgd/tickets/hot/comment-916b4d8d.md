---
uid: comment-916b4d8d
id: COMMENT-8001
type: comment
title: Claude response for fix_plan report
created_by: xgd
created_at: '2026-11-08T14:51:10.968713+00:00'
updated_at: '2026-11-08T14:51:10.968713+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-0f13d2a4
  kind: note
---

I filed the iteration-2 fix plan for STORY-99 as **REPORT-11483** (`report-0f13d2a4`). It has one batch, and it grants a narrow `code_frozen` override for one line of CSS.

**Where things stand.** The 10 failures in this prompt come from the quality run at 14:31, which was before the iteration-1 builder pass. That builder fixed 9 of them. All 9 were stale tests that the code had moved past (the `account`→`person` rename, `site_assets` keyed by `site_id`, the three Contacts dialogs, and so on). Those 9 stay in the batch only so the validation gate re-checks them.

**The one real defect: AC-2232.** In the Contacts invite composer, the Subject, To-list and Body fields are sized with a literal `font-size: 13px` instead of `var(--builder-control-font-size)`. The rule is in `apps/control-app/src/builder/builder.css:2041-2053` in the working tree. AC-2232 says outright that no control may restate the size as a literal, and it names the Contacts dialog inputs. So the test is right and the CSS is wrong. The builder had diagnosed this but was blocked because the code is frozen in this pass.

**How the ladder decided it:**
- **Rung 1:** no intent in scope says anything about the composer fields' font size.
- **Rung 2:** at the reference ref the composer is also a literal 13px (lines 4082–4094). That is exactly what the token resolves to (line 118), and the neighbouring dialog inputs already use the token (3951–3965). The user sees the same size either way, so the reference doesn't settle literal vs token.
- **Rung 3:** the test stands. The override allows editing `builder.css` only, to replace that one declaration with the token.

**Other suites that must stay green:** AC2463, AC2336, AC2339, AC2367, AC2409, BUG-53, BUG-58 and REQ-199. These are the other tests that mount the composer or check control typography.

**Not batched:** the AC965 test times out because wrangler tries to reach `api.cloudflare.com`, which the sandbox blocks. That's the environment, not the code, and it isn't in this subject's failure set.

I also flagged two passing tests as weak evidence:
- The two "invite composer fits" tests never check the fields' size, so the typography test is the only thing covering it.
- The AC2144 test's name still says "account", though the test and the AC now say `person`.

One thing to know: while filing, the sandbox blocked an outbound connection to `github.com:22`. The report was created locally (the CLI confirmed it), but anything xgd tried to sync to the remote at that moment didn't go through.