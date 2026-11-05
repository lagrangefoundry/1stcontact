---
uid: request-bc6087e4
id: REQ-443
type: request
title: 'Deploy probe: check the pinned image model exists and is not about to be retired'
created_by: BUG-261
created_at: '2026-10-24T00:49:05.240599+00:00'
updated_at: '2026-10-24T15:59:36.717584+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: medium
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-4437d85a
  commits:
  - working_sha: c5e3e863da9c6d3c45e1a7a1c1a828307023b2bc
    reconcile_sha: null
    main_sha: null
  - working_sha: 88c85a20d7715ea78df81493184afb40599d48aa
    reconcile_sha: null
    main_sha: null
  version: 0.2.609
  story_points: 2
---

## What changes

The deploy-time capability probe for `OPENAI_API_KEY` (`bin/deploy.d/lib/probe.mjs`, REQ-264 "presence is not capability") also checks **the model the image plugin is actually pinned to**, not just that the key authenticates:

- `GET /v1/models/<pinned model>` → 404, or a `shutdown_date` already passed: verdict **invalid**, and the deploy fails, the same as a refused key. The tool would be offered and every call would fail.
- A `shutdown_date` within 30 days: verdict **capable, with a warning row** naming the model and the date, so the operator re-pins before it breaks.
- No `shutdown_date`, or one further out: capable, as today.

The pinned model name is **read from the image plugin/backend** (the same source `imagegen.ts` reads `surface.backend().model` from), never written out a second time in the probe.

## Why

BUG-261: OpenAI retired `gpt-image-1` on 2026-10-23, and every `CreateImage`/`EditImage` failed with a misleading `generator_unavailable`. OpenAI publishes `shutdown_date` on `/v1/models/<id>` in advance, so a probe that asked would have flagged it weeks earlier. Today's probe only lists `/v1/models`, and a retired model passes that.

## Dependency

**Blocked by lagrange-framework BUG-94 (bug-1bc5aaff)**, which re-pins the openai backend from `gpt-image-1` to `gpt-image-2`. Until BUG-94 ships and the shared store is reinstalled, this probe would correctly fail every deploy that carries an OpenAI key. Implement it after BUG-94 lands.

## Test plan

UATs drive the probe through an injected fetch, with no live key:
- the pinned model answers 404 → invalid, and the deploy-failing effect is stated;
- `shutdown_date` in the past → invalid;
- `shutdown_date` within 30 days → capable, with a warning naming the model and the date;
- `shutdown_date` null → capable, no warning;
- the model the probe asks about equals the plugin backend's own `model`, so a re-pin upstream needs no edit here.


## Implementation (as landed on branch free-REQ-443)

- `PROBES.OPENAI_API_KEY` now makes **one** read, `GET /v1/models/<pinned model>`, in place of `GET /v1/models`. That single request still proves the key (401/403 → invalid, as before) and adds the model check: 404 → invalid; `shutdown_date` at or before now → invalid; `shutdown_date` within `EXPIRY_WARNING_DAYS` (30) → capable with `expiring: true` and an expiry line `` `<model>` retires on <date> — N days away ``; null or further out → capable, no warning. `shutdown_date` is accepted as a date string or epoch seconds.
- **Where the model comes from:** the new exported `pinnedImageModel(credential)` imports `apps/control-app/src/generated/ai-imagegen.js` (the shim `1c assets` writes, which `imagegen.ts` also imports). It picks the plugin `PROVIDERS` entry whose `secret` is the probed credential, builds that backend with an unused fetch, and reads `.model`. `probe.mjs` contains no model name of its own. If the shim can't be imported (e.g. `1c assets` hasn't run), the verdict is `unreachable` ("nothing was proven … run `1c assets`") and nothing is claimed about the key.
- **The warning is shown in two places:** `oneLine` (the line printed while the deploy runs) appends `— WARNING: <expiry>` for any capable row with `expiring`, and the final report marks the row "← inside the warning window". `oneLine` is shared by all probes, so the DNS token's expiry warning also shows mid-deploy now.
- **Hook:** the `30-openai-api-key` refusal message now covers a retired or missing model as well as a refused key. It still says "does not accept it", which the REQ-264 hook UAT checks for.
- `secret.sh`'s `capability_probe` sets `NODE_OPTIONS=--disable-warning=MODULE_TYPELESS_PACKAGE_JSON`. Without it, Node prints a typeless-package warning when it loads the generated shim. It goes through `NODE_OPTIONS` so the hook's argument list stays the same, because the REQ-264 hook harness stubs `node` by argument position.

UATs: `tests/test_UAT_FC_REQ-443_probe_pinned_image_model.test.ts` (5 cases, matching the test plan above). The REQ-264 probe and hook suites still pass unchanged.


## Landing decision (2026-10-24)

The operator chose to land this ahead of lagrange-framework BUG-94 rather than wait. The Dependency note above describes the effect: until BUG-94 re-pins the openai backend and the shared store is reinstalled, a deploy that exports `OPENAI_API_KEY` fails at this probe (the pinned `gpt-image-1` is retired). Deploying without exporting the key still works, because a key already stored on the Worker is not probed. Merged into xgd-working as version 0.2.609 (commits c5e3e863, 88c85a20).