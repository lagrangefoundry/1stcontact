---
uid: acceptance_criterion-8c0a4f23
id: AC-2466
type: acceptance_criterion
title: A capture that succeeds on the alternate host uses it for every subsequent
  pass, and an unresolvable host is reported in words that say what the caller can
  do
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T15:29:42.347161+00:00'
updated_at: '2026-11-08T15:29:42.347161+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-31204812
  kind: behavior
  regression_only: false
---

## Criterion
**The host that answered is the host the capture uses.** When a capture succeeds on the alternate host, the capture record's `url` and `host`, the bundle name, and the `url` that `capture_site` returns all carry the alternate. So do the three later navigation passes: the viewport-ladder projection, the per-width screenshots and the structural hints. None of them navigates the typed host again.

**An unresolvable host is reported as an address problem, not a dead site.** When every host form tried failed to resolve, `capture_site` fails with a message that:
- says there is **no such host** for the typed address;
- **names every form tried** (for example `Tried https://www.example.com/ and https://example.com/`), or only the typed form when no alternate existed or the alternate was refused by the egress rule;
- says the **hostname did not resolve**, which is a fact about the address and not about the site, and tells the caller to check the spelling or try a different host form;
- does **not** just pass on the raw browser code as the explanation.

Any other failure, including an alternate that resolved but then timed out, is reported as before: `Capture failed for <last URL tried> after <n> attempt(s): <driver message>`.

## Verification
1. With a browser double where `www.<host>` does not resolve and `<host>` succeeds, assert that the returned `url`, the capture record's `url`/`host` and the bundle name use `<host>`. Assert that every navigation by the ladder, screenshot and hint passes targets `<host>`, not `www.<host>`.
2. With a double where both forms raise `ERR_NAME_NOT_RESOLVED`, assert that the error contains "no such host", both URLs tried, "did not resolve" and the spelling/host-form advice.
3. For a host with no alternate (e.g. `intranet`) that does not resolve, assert that the message names only the typed form.
