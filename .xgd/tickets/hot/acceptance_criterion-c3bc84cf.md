---
uid: acceptance_criterion-c3bc84cf
id: AC-1306
type: acceptance_criterion
title: Indexing is refused without embedding credentials, naming them; the map's prose
  needs none
created_by: xgd
created_at: '2026-08-20T04:17:12.140009+00:00'
updated_at: '2026-10-28T20:54:39.200507+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-c4f329d3
  kind: behavior
  regression_only: false
  uat_coverage: pass
  title: Indexing is refused without the API token, naming it as required and the
    account id as an optional override; the map's prose needs none
---

## Criterion

The two external models are asked for on different terms, and the difference is visible to the operator:

- **Indexing needs the Cloudflare API token — and only the token.** With `CLOUDFLARE_API_TOKEN` absent, the build is refused with a message that names the token as the thing to set and names `CLOUDFLARE_ACCOUNT_ID` only as an optional override (the account is otherwise discovered from the token). It does not demand both. There is deliberately no local stand-in — a substitute model would make locally built vectors incomparable with production ones, and the failure mode of two models is not an error but plausible-looking nonsense.
- **The map's prose needs no credentials of its own**: with no model API key set, the describing step still resolves a backend and the map is written.

The usage text states the same facts: indexing needs `CLOUDFLARE_API_TOKEN`, the account is discovered from it, `CLOUDFLARE_ACCOUNT_ID` is set only when the token sees more than one account or is too narrowly scoped to list them, and the map needs no credentials — so an operator knows what each form of the command will ask of them before running it.

## Verification

Run a build with no `CLOUDFLARE_API_TOKEN` (and no named-embedder override) and assert it fails with a message that names `CLOUDFLARE_API_TOKEN` as required and presents `CLOUDFLARE_ACCOUNT_ID` as an optional override rather than as a second required value. Run the map step with no model API key present and assert it completes and reports which backend wrote the prose. Assert the usage text names `CLOUDFLARE_API_TOKEN`, states that the account is discovered from the token with `CLOUDFLARE_ACCOUNT_ID` as the override, and states that the map needs no credentials.
