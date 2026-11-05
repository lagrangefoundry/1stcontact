---
uid: comment-3c1f0a58
id: COMMENT-7872
type: comment
title: Claude response for reconciliation_uat_generation report
created_by: xgd
created_at: '2026-11-05T21:33:14.991541+00:00'
updated_at: '2026-11-05T21:33:14.991541+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-f062f8cf
  kind: note
---

I wrote 4 UATs for the account-chrome criteria this cycle added to story-179b8c06 (AC-2329 to AC-2332). Three pass. One fails, and the failure is a real code defect, not a bad test. ESLint did not run on the new file: it isn't installed in the worktree and the sandbox blocked downloading it.

The story's other criteria (AC-697 through AC-704 and the rest) were already marked `uat_coverage: pass`, so I didn't duplicate them.

```
UATs generated for story story-179b8c06 (plan item 2 of 7)

Story: story-179b8c06
Test file(s) created:
  - tests/reconciliation-behavior-account-chrome.test.ts

Tests written: 4
Tests passed: 3
Tests failed: 1
```

⚠️ TESTS FAILING — downstream fix-it loop required

Failures:
  - `test_UAT_AC2329_declared_site_publishes_every_state_and_undeclared_publishes_none`: a site whose `config.capabilities` holds the misspelt key `acounts: true` still passes `validateSite`. The criterion says an unknown capability key must fail validation. `siteCapabilitiesSchema` (`packages/site-schema/src/schema.ts:910`) is a plain `z.object` without `.strict()`, so the bad key is silently dropped. The story's Technical Context already names this as a code issue for `fix_uat_coverage`. The fix is to add `.strict()` to that schema; I left the assertion as the criterion states it. Every other part of AC-2329 passes.

What each test covers, all through the real render pipeline (`renderSiteFiles` → published `home.html` / `theme.css`), the site validator, the catalog and preset library, and the shipped `client.js` driven in JSDOM with an injected `fetch`:
- **AC-2329:** a site that declares accounts publishes the chrome with all three states, marked signed-out. A site that doesn't declare it, or declares `false`, publishes nothing. Two sites with different identities render the same chrome bytes. The misspelt-key check is the one that fails.
- **AC-2330:** without script, the form is an open POST to the sign-in endpoint. Script folds it, opens it with focus on the email field, closes it, and sends the address with `fetch`. A 202, 404 and 500 leave the page in the same state and the response is never read. A network failure shows the "could not reach the server" message and leaves the form usable. The edit channel drops the form's `action`.
- **AC-2331:** the module resolves from both the main and worker entry points beside contact-form. Its config, slots and invariant label match the contract, the preset is fetched by behavior id, and the five conformance dimensions are declared. Placement and paint follow L1, and two instances on one page don't share classes. The stylesheet holds no paint, and a bad binding on one slot costs only that slot.
- **AC-2332:** the portal and builder controls are real `<a>` elements carrying L1's styled class and an allowlisted `href`. A `javascript:` URL is refused at render, and the Sign In, submit and close controls stay buttons.

No runtime code or existing tests were changed.

```
test_files_created:
  - "tests/reconciliation-behavior-account-chrome.test.ts"
```