---
uid: request-707ba6c2
id: REQ-392
type: request
title: 'Dev tooling: bin/copy-repro-to-dev'
created_by: EPIC-16
created_at: '2026-10-07T17:55:37.258581+00:00'
updated_at: '2026-10-07T18:10:27.143278+00:00'
completed_at: null
last_field_updated: title
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

## The capture-mirror check is skipped — operator decision (2026-10-07)

Every asset `1c repro` puts in a draft is byte-for-byte a capture-mirrored subresource, so BUG-84's sender-side check (`readSitePayload` → `assertNotCaptureMirrored`) would refuse every reproduction. This command does NOT run that check: it reads the draft directly (as `readSiteDraft` does) and posts it.

The operator's reasoning, recorded so the next reader doesn't reinstate it: this is a single-operator tool that moves a draft into the operator's own dev builder; it publishes nothing, and getting from a dev draft to a published site is a long, deliberate road. No ownership record, flag or prompt is wanted.

Unchanged: the Worker-side gate in `POST /api/import` (checks the tenant's cloud capture bundles) and BUG-84's check on `bin/copy-to-cloud` / `readSitePayload` for every other caller. This command must not weaken those — it simply does not call the sender-side one.

## Interim

A stop-gap `storage/tmp/copy-repro-to-dev.mjs` (gitignored, laptop only) does the copy by building the payload by hand and posting it, which skips the CLI-side gate; the Worker-side gate passes only because the tenant holds no cloud capture bundles. It was used on 2026-10-07 to load `repro-faelan-com` into the dev `faelan.com` business. Delete it when this lands.

## Test plan

UATs (`test_UAT_FC_REQ-392_*`): a repro copied into an existing dev business by name and by id lands its pages and assets; a business name that is not a membership of the signed-in identity still resolves when the operator can import into it; a business that does not exist is refused naming what exists; a 409 is reported with `--force` as the answer; a draft whose assets are capture-mirrored copies successfully.
