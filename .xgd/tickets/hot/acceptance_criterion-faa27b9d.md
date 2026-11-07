---
uid: acceptance_criterion-faa27b9d
id: AC-2342
type: acceptance_criterion
title: Accepting from /terms itself goes to the builder root, where the Site tab is
  the default; accepting elsewhere reloads the requested URL
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-07T08:09:49.429556+00:00'
updated_at: '2026-11-07T23:28:05.303822+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-0cd18650
  kind: behavior
  regression_only: false
---

## Criterion

After a successful acceptance, the terms interstitial sends the person to the builder,
where the Site tab is the default tab. Because the interstitial is served at whatever
URL was requested, accepting from any builder URL reloads that URL, which now answers
normally. Accepting from `/terms` itself goes to the builder root (`/`) instead, because
reloading `/terms` would only show the terms again (it stays readable after
acceptance). This would leave a new member reading the document they have just
accepted. If the acceptance is refused, the page does not navigate: the control is
re-enabled and the error note is shown.

## Verification

**Executed check (node project, jsdom)**: `tests/reconciliation-terms-accept-navigation.test.ts`.
Call `guardTerms` with a navigation request from an unaccepted contact, at `/terms` and
at builder URLs (`/`, `/people`, a business-prefixed path). Load each served page into a
DOM at the URL it was served at and run its own inline script, with only `fetch` and
`location` doubled (jsdom cannot navigate). Click `#accept` and assert:
- exactly one POST to `TERMS_ACCEPT_PATH` with a JSON content type and body
  `{version: TERMS_VERSION}`, with the control disabled while it is in flight;
- at `/terms`, `location.assign('/')` is called and `reload()` is not;
- at every builder URL, `location.reload()` is called and `assign` is not;
- when the POST answers non-ok, there is no navigation, the button is re-enabled and
  `#error` is revealed.

**Server half (workerd)**: `tests/test_reconciliation_terms_signup_provisioning.workers.test.ts`.
Serve the interstitial at a builder URL and the terms at `/terms` to an unaccepted
contact, and assert both carry the accept control. The served-script shape check stays
as a structural extra; it is not the evidence. Accept through the JSON POST, then assert
the builder root loads the builder (not the terms) and that the Site tab is the first,
default tab. Assert `/terms` still answers with the terms and the acceptance record
instead of the control.
