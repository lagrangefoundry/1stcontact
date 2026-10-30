---
uid: report-c095803f
id: REPORT-5573
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T16:37:03.610248+00:00'
updated_at: '2026-09-29T16:37:03.610248+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `apps/control-app/wrangler.toml` — UU, config file (2g / 2c). Both sides'
  edits to the top-level `[vars]` block are DISJOINT, so both were kept; no
  scalar was actually contested.
  - **Ours (HEAD, 79eb3f7677 "fix(access): a service token is a person's
    automation, and the simulator is the edge")** emptied the top-level
    `ACCESS_TEAM_DOMAIN` / `ACCESS_AUD` and rewrote the surrounding comment to
    state that the emptiness is the control (`wrangler dev` serves on
    127.0.0.1, which no Access policy fronts; empty is what keeps
    `ACCESS_DEV_OPEN` reachable). The real identifiers moved to
    `[env.production.vars]`, where they remain. Kept.
  - **Theirs (incoming, bd06fc9894 "mail: derive a text part, and a
    per-template sending address")** changed `MAIL_FROM` only, adding the
    RFC 5322 display name: `1st Contact <no-reply@1stcontact.io>`. Kept.
  - Incoming's `ACCESS_TEAM_DOMAIN` / `ACCESS_AUD` lines inside the conflict
    hunk were unchanged CONTEXT on its side — `git show bd06fc9894 --
    apps/control-app/wrangler.toml` shows its only `[vars]` delta is the
    `MAIL_FROM` line. Taking HEAD's empties therefore discards nothing the
    developer wrote; taking incoming's values instead would have reverted
    HEAD's Access fix.
  - Incoming's other hunks in this file (the REQ-205 `IT CARRIES A DISPLAY
    NAME` / `REPLIES TO THIS ONE GO NOWHERE` comment paragraphs, and the
    `[env.production.vars]` `MAIL_FROM`) merged cleanly and are present.

## Incoming changes preserved

Verified with `git diff --cached bd06fc9894 -- apps/control-app/wrangler.toml`.
The remaining delta is entirely attributable to HEAD's own commit 79eb3f7677:
the Access comment rewrite, the two emptied top-level Access scalars, and the
`THE DEPLOYED GATE'S CONFIGURATION` header added above
`[env.production.vars]`. No incoming line appears as a `-`:

- `MAIL_FROM = "1st Contact <no-reply@1stcontact.io>"` appears as CONTEXT in
  the top-level hunk, and the `[env.production.vars]` occurrence does not
  appear in the diff at all — byte-identical to incoming.
- The REQ-205 comment paragraphs do not appear in the diff — byte-identical
  to incoming.

No hunk was dropped; the BUG-1301 precedence exception was not needed.

## Verification

- `tests/test_UAT_FC_REQ-196_mail_configuration.test.ts` — 6/6 pass. This is
  the UAT that pins `MAIL_FROM` present in both blocks and identical
  character-for-character, i.e. it is incoming's change under test.
- `tests/test_UAT_FC_REQ-147_access_gate.test.ts` — 27/27 pass. HEAD's side.
- `tests/test_UAT_FC_REQ-205_sending_address.workers.test.ts` sets
  `ACCESS_TEAM_DOMAIN` from its own in-test constant, not from wrangler.toml,
  so the emptied top-level value cannot affect it.
- Workers/wrangler suites (`vitest.workers.config.mts`) were NOT executed:
  they are unrunnable in the `stage_resolver` role (`listen EPERM` binding
  127.0.0.1). Only the two node-config UATs above were run.

Staging clean: `git status --porcelain` shows no conflict-class entries.
