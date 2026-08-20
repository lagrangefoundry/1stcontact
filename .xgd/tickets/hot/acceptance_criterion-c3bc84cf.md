---
uid: acceptance_criterion-c3bc84cf
id: AC-1306
type: acceptance_criterion
title: Indexing is refused without embedding credentials, naming them; the map's prose
  needs none
created_by: xgd
created_at: '2026-08-20T04:17:12.140009+00:00'
updated_at: '2026-08-20T04:37:22.449784+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-c4f329d3
  kind: behavior
  regression_only: false
---

## Criterion

The two external models are asked for on different terms, and the difference is visible to the operator:

- **Indexing needs embedding credentials.** With them absent, the build is refused with a message that names both credentials and says why the index needs them. There is deliberately no local stand-in — a substitute model would make locally built vectors incomparable with production ones, and the failure mode of two models is not an error but plausible-looking nonsense.
- **The map's prose needs no credentials of its own**: with no model API key set, the describing step still resolves a backend and the map is written.

The usage text states both facts, so an operator knows what each form of the command will ask of them before running it.

## Verification

Run a build with the embedding credentials removed and assert it fails naming both of them. Run the map step with no model API key present and assert it completes and reports which backend wrote the prose. Assert the usage text names the embedding credentials and states that the map needs none.