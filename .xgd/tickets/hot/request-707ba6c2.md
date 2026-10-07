---
uid: request-707ba6c2
id: REQ-392
type: request
title: 'Dev tooling: bin/copy-repro-to-dev'
created_by: EPIC-16
created_at: '2026-10-07T17:55:37.258581+00:00'
updated_at: '2026-10-07T18:17:30.843829+00:00'
completed_at: null
last_field_updated: status
status: free_coded
fields:
  priority: high
  epic_parent: epic-96d8aca6
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-8186fcc1
  commits:
  - working_sha: 5254790206a9a4f14f8b86c58ed84c8886a9c8e5
    reconcile_sha: null
    main_sha: null
  - working_sha: 1dfcc4d1d710a0b9a78a7b758d33f80a3f397307
    reconcile_sha: null
    main_sha: null
  version: 0.2.497
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

## Design (decided at implementation)

**Name resolution reuses existing routes — no new Worker route.** `resolveBusiness` (shared by the copy pair) matches the argument against a business's name OR its id, first in `/api/businesses` (memberships, plus the `entered` business), then — only when that finds nothing — in the platform directory `GET /api/admin/sites` (REQ-298), which lists every business that holds a site with its name. Provisioning mints a site for every business (REQ-236), so that directory covers every business an import can target. A caller the directory refuses (its 404 gate — not the platform owner) simply gets the membership answer. Two businesses answering to one name is still refused; "not found" still names everything the side offered (memberships ∪ directory). The copy pair inherits the same fix.

**The rights record is a bundle member, `rights.json`.** Written by a new verb, `1c rights assert <bundle> --basis "<why>" [--by <who>]`, and read back by `1c rights show [<bundle>]` (no bundle: every bundle that carries one). The record is `{ republishable: true, bundle, assertedBy, assertedAt, basis }`; `--by` defaults to `git config user.email`, then the OS user. It is refused for a bundle that does not exist (no `capture.json`) and for a bundle that already carries one (shown instead — a recorded decision is not silently rewritten). `--basis` is required: the record states why, not only that.

**The gate reads it through the `ReferenceStore` port, so both halves honour it** (`readSitePayload` on the laptop's `storage/references/`, `POST /api/import` on the tenant's R2 bundles). A bundle carrying a *valid* record is skipped by `assertNotCaptureMirrored`; every other bundle is scanned exactly as before. Valid means `republishable === true`, `bundle` equals the bundle's own name (a record copied into another bundle's directory does not transfer), and `assertedBy` / `assertedAt` / `basis` are non-empty strings. A malformed record, or bytes that also appear in a bundle with no record, are refused as today. There is still no flag that skips the check.

**The command** is `1c copy-repro-to-dev` (in `copy.ts`, beside the copy pair; `bin/copy-repro-to-dev` execs it). It resolves the destination first, then reads the draft through the file-backed sandbox store with `readSitePayload` (so the CLI-side gate runs against `storage/references/`), then posts with `postSitePayload` to `/b/<id>/api/import` — the same transport, refusals and 409/`--force` handling the copy pair uses. Default origin is the simulator, `http://127.0.0.1:8799`; credentials are `--local-client-id/--local-client-secret`, else `LOCAL_ACCESS_CLIENT_ID/_SECRET`, else the simulator's own pair (`local-dev.access` / `local-dev-secret`). A rights refusal from this command adds the one line that says how to record the decision with `1c rights assert`.

Scope limit: `1c rights assert` writes laptop bundles (`storage/references/`). Cloud (R2) bundles honour a `rights.json` member if one is present, but writing one there is not built here.

## Interim

A stop-gap `storage/tmp/copy-repro-to-dev.mjs` (gitignored, laptop only) does the copy by building the payload by hand and posting it, which skips the CLI-side gate; the Worker-side gate passes only because the tenant holds no cloud capture bundles. It was used on 2026-10-07 to load `repro-faelan-com` into the dev `faelan.com` business. Delete it when this lands.

## Test plan

UATs (`test_UAT_FC_REQ-392_*`): a repro copied into an existing dev business by name and by id lands its pages and assets at `/b/<id>/api/import`; a name only the platform directory knows (not a membership) resolves; a business that does not exist is refused naming what exists, with nothing posted; a 409 is reported with `--force` as the answer, and `--force` is sent when given; a capture-mirrored asset is refused without a rights record and accepted with one (both the CLI half and the shared gate the Worker uses); a malformed record or a record naming another bundle does not count; `1c rights assert` writes the record (who, when, which bundle, why) and `1c rights show` reads it back; asserting twice or on a non-existent bundle is refused.