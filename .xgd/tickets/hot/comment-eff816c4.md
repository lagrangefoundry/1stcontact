---
uid: comment-eff816c4
id: COMMENT-1432
type: comment
title: Comment on request REQ-151
created_by: xgd
created_at: '2026-08-21T20:08:00.121949+00:00'
updated_at: '2026-08-21T20:32:09.180524+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-4fcbd354
  kind: chat_transcript
---

<!-- xgd-turn id="cab4b347-9e03-4311-bfeb-67f6a8e00608-user" -->

<!-- xgd-chat role="user" ts="2026-08-21T20:07:56.292581+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="cab4b347-9e03-4311-bfeb-67f6a8e00608-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-21T20:32:09.085533+00:00" -->
#### Claude
Now export the module and wire the renderers.

Now the generator renderer and the behavior-module render context.

Now the UAT suite.

Now add a UAT proving the resolved locale reaches behavior modules.

Now merge back into `xgd-working`.

Now verify the merged `xgd-working` tree (which now also carries REQ-150's Astro removal) still passes.

Implemented and landed on `xgd-working`. REQ-151 is at `free_coded`.

**What shipped**

- `packages/site-schema/src/locale.ts` (new) — `COUNTRY_DEFAULTS`, a 66-country data table (locale/currency/timezone, RTL countries included), plus `resolveSiteLocale`, `localeDirection`, and the four validators. Adding a country is one row.
- `siteConfigSchema` — four optional fields (`country`, `locale`, `currency`, `timezone`), each refined so a bad value is a validation error at `/config/<field>`. Timezone is checked against the runtime's own tz database via ICU, not a regex.
- Both renderers (`renderL1Page`, `tools/generate` `renderPage`) now emit `lang`/`dir` from the *same* `resolveSiteLocale` call — the literal `<html lang="en">` is gone from both.
- `BehaviorProps.locale` carries the resolved locale to behavior modules.
- 9 UATs in `tests/test_UAT_FC_REQ-151_site_locale.test.ts`, all passing.

**One judgment call you should know about.** The ticket's AC-1 wanted `lang="en"` when nothing is declared, while "what to change" said `country` defaults to `US` — which derives `en-US`. I honoured both on a principle: a *declared* `country: 'US'` is a fact → `en-US`; declaring nothing is the absence of a fact → the region-free `en`. Stamping a region nobody stated into an attribute screen readers and search indexes act on isn't a default, it's an assertion. Currency and timezone still fall back to the US row, since there's no region-free EUR or clock. It's documented in the ticket body under "Design decision made during implementation" — say the word if you'd rather have `en-US`.

**Test results.** REQ-151 UATs 9/9. Full workers project green (7 files, 58 tests). Full node project: 20 failures, all pre-existing — I verified by re-running the seven failing files with my changes stashed and got an identical 23 failures.

**Unrelated breakage worth your attention:** REQ-150's `tools/generate/bin/1c.mjs` (commit `258381e2d`) imports `vite`, but `vite` isn't in the root `package.json` dependencies. `node tools/generate/bin/1c.mjs help` dies with `ERR_MODULE_NOT_FOUND`, failing `test_UAT_AC875` and `test_UAT_FC_REQ-89_cli_boots_no_missing_pages_warning`. It predates my merge and belongs to REQ-150, so I left it alone and noted it in the ticket body.

Version bumped to `0.2.3` (0.2.2 was already claimed by REQ-150). Commits `ced4356a6` + `38e4a3cf2`, merged into `xgd-working`, branch cleaned up.

<!-- xgd-chat-end -->