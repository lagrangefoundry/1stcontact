---
uid: acceptance_criterion-6b0e6567
id: AC-2362
type: acceptance_criterion
title: A wrong or half service-token pair never reaches the builder; a CF_Authorization
  cookie is forwarded untouched; no credential is sent to /login
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T02:03:54.079910+00:00'
updated_at: '2026-11-08T02:03:54.079910+00:00'
completed_at: null
last_field_updated: created_at
status: active
fields:
  story_uid: story-5b5be809
  kind: behavior
  regression_only: false
---

## Criterion
On any proxied path (anything other than the simulator's own `/cdn-cgi/access/certs`, `/login`, `/mint` and `/cdn-cgi/access/logout`, which are always answered by the simulator and never forwarded):

- **Wrong pair.** A request carrying both `CF-Access-Client-Id` and `CF-Access-Client-Secret` that do not match the simulator's pair is answered 403 with a message pointing at `--print-token`. The builder receives nothing.
- **Half a pair is no pair.** A request carrying only one of the two headers is handled exactly as if it carried neither.
- **Cookie.** A request carrying a `CF_Authorization` cookie (and no complete pair) is forwarded with the cookie byte-for-byte as it arrived and no `cf-access-jwt-assertion` added.
- **No credential.** A request with neither a complete pair nor a `CF_Authorization` cookie is answered 302 to the simulator's `/login`. The builder receives nothing.

## Verification
Drive a real `bin/access-sim` in front of a stub builder that records every request. Assert: wrong secret → 403 and the stub saw nothing; id without secret and no cookie → 302 to `/login` and the stub saw nothing; cookie → forwarded unchanged with no assertion header; no credential → 302 to `/login`. Assert `/cdn-cgi/access/certs` and `/login` are answered by the simulator and never reach the stub.
