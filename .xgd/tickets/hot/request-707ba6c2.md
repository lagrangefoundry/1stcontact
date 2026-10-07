---
uid: request-707ba6c2
id: REQ-392
type: request
title: 'Dev tooling: bin/copy-repro-to-dev, with an owned-capture rights record'
created_by: EPIC-16
created_at: '2026-10-07T17:55:37.258581+00:00'
updated_at: '2026-10-07T17:55:37.258581+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: high
  epic_parent: epic-96d8aca6
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-8186fcc1
---

## What the operator wants

`bin/copy-repro-to-dev <repro-slug> <business>` — put a reproduction's draft (`storage/sandbox/<repro-slug>/draft`: `site.json`, `pages/*.json`, `assets/**`) into an existing business in the local dev builder, in one command, the way `bin/copy-to-cloud` moves a business between builders.

A reproduction exists to become a site you can edit in the builder. Since REQ-290 retired `1c push` there is no supported path from `storage/sandbox/` into the dev store at all.

## Behaviour

- `<business>` is the business's name, or its `biz_…` id. Name resolution must find any business the operator can import into, not only those the signed-in identity is a *member* of — `/api/businesses` lists memberships only, so a platform operator's import into `faelan.com` succeeded by id while the same name was "not found".
- The target business must already exist; the command never creates one.
- Copies the draft only. Nothing is published.
- Goes through the Worker's `/b/<id>/api/import` (via `bin/access-sim` by default, `--origin` overrides), with the local credential pair from BUG-134 (`LOCAL_ACCESS_CLIENT_ID` / `_SECRET`, defaulting to the simulator's own pair).
- BUG-51's 409 (target holds builder-authored changes) is reported as such, and `--force` is the answer.
- Prints the business, the pages and asset count that landed.

## The rights question this ticket must answer, not route around

Every asset `1c repro` puts in a draft is byte-for-byte a capture-mirrored subresource, so BUG-84's gate (`asset-rights.ts`, enforced in `readSitePayload` and in `POST /api/import`) refuses the whole copy. That gate deliberately has NO override: "an escape hatch on a rights gate is the gate not existing".

But the operator can genuinely own the captured site: faelan.com is the operator's son's site, and reproducing it was the point. The current gate can only say "mirrored → refused"; it has no way to record "the operator holds the rights to this capture".

The fix must be a *recorded* rights decision, not a flag that skips the check — e.g. the capture bundle (or the reference it came from) carrying an operator-asserted ownership/republishable record that both halves of the gate read. A capture with no such record must still be refused exactly as today. Whatever the mechanism, it must be visible after the fact (who asserted it, when, for which bundle).

## Interim

A stop-gap `storage/tmp/copy-repro-to-dev.mjs` (gitignored, laptop only) does the copy by building the payload by hand and posting it, which skips the CLI-side gate; the Worker-side gate passes only because the tenant holds no cloud capture bundles. It was used on 2026-10-07 to load `repro-faelan-com` into the dev `faelan.com` business. Delete it when this lands.

## Test plan

UATs (`test_UAT_FC_<id>_*`): a repro copied into an existing dev business by name and by id lands its pages and assets; a business that does not exist is refused naming what exists; a 409 is reported with `--force` as the answer; a capture-mirrored asset is refused without a rights record and accepted with one; the rights record is readable afterwards.