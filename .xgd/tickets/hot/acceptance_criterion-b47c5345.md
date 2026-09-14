---
uid: acceptance_criterion-b47c5345
id: AC-1775
type: acceptance_criterion
title: Offline re-extraction takes its members from the stored bundle but stays a
  local-operator verb, still driving a real browser navigation of mirrored bytes
created_by: martin-github@westhead.me
created_at: '2026-09-14T04:50:05.591601+00:00'
updated_at: '2026-09-14T05:00:54.772589+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-0cb7f25b
  kind: behavior
  regression_only: false
---

## Criterion
Offline re-extraction of a stored bundle reads the bundle's members through the
same storage contract every other verb uses — so it is fed by bytes rather than
by scanning a directory — while remaining available only where the operator runs
it, and not in the deployed serverless runtime.

The reason is the verb's own behaviour, not an unfinished port: re-extraction
serves the bundle's mirrored bytes over an ephemeral local address so the browser
performs a **real navigation** of the mirrored page, and that navigation is the
point of the verb. The serverless runtime cannot stand up a local server for a
browser to navigate to, so the verb stays where it can.

## Verification
Assert that re-extraction obtains its members from the bundle rather than from the
filesystem — it runs against a bundle whose bytes were never on disk — and that it
still performs the real navigation against a locally served mirror. Assert the verb
is not offered inside the serverless runtime, so a later change cannot quietly
"finish the port" by dropping the navigation.