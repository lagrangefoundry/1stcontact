---
uid: request-1b56fccd
id: REQ-110
type: request
title: 'R2 artifact store + 1c deploy: ship rendered snapshots to Cloudflare'
created_by: xgd
created_at: '2026-07-30T19:34:53.952227+00:00'
updated_at: '2026-08-06T19:46:28.605844+00:00'
completed_at: '2026-08-06T19:46:28.605844+00:00'
last_field_updated: status
status: free_and_reconciled
fields:
  priority: high
  story_points: 3
  auto_merge_back: true
  needs_review: false
  commits:
  - working_sha: e045ea6cf6c6663068ab155694842f63b72c1e6f
    reconcile_sha: null
    main_sha: null
  version: 0.1.6
  bundled_in: bundle-e0143ffa
  chat_comment: comment-b97d8fa1
---

## The gap

Sites exist only on the laptop. `1c render` writes to
`storage/dist/<root>/<slug>/<channel>/` and `1c publish` snapshots `draft/` into
`revisions/NNNN/`, but there is no way to put either where anyone else can see
it. `gigabytealchemy` and `xgd` are close to ready and cannot be shared.

R2 is now enabled on the account and the bucket exists:

```
$ wrangler r2 bucket create 1stcontact-sites
✅ Created bucket '1stcontact-sites' with default storage class of Standard.
```

## Design frame — serving, not storing

This ticket migrates **serving**, not the canonical store. Site definitions stay
canonical on the laptop and authoring is unchanged. Moving canonical storage to
D1 while authoring is local would create a bidirectional sync problem that no
end state has; the store moves when a server-side builder needs to read and
write it, not before ([[REQ-7]], [[DOC-5]]).

What crosses the wire is the artifact [[DOC-12]] already defines: an immutable,
complete snapshot. `source/` is uploaded alongside `out/` so the R2 revision is a
*complete* DOC-12 revision — which makes the eventual D1 migration an import
from R2 rather than a re-derivation from a laptop.

## R2 layout

```
r2://1stcontact-sites/
  sites/<slug>/manifest.json
  sites/<slug>/preview/<sha>/out/       rendered artifact (index.html, theme.css, assets/…)
  sites/<slug>/preview/<sha>/source/    site.json, pages/, assets/  — the DOC-12 snapshot
  sites/<slug>/rev/<NNNN>/out/
  sites/<slug>/rev/<NNNN>/source/
```

```json
{
  "slug": "gigabytealchemy",
  "live": 1,
  "revisions": [{ "id": 1, "publishedAt": "…", "message": "launch", "sha": "…" }],
  "previews": [{ "sha": "a1b2c3d4e5f6", "createdAt": "…", "basedOn": 1 }]
}
```

### Preview snapshots are not revisions

A draft deploy produces an immutable, garbage-collectable **preview snapshot**.
It never enters `history.json` and never mints a revision number, preserving
DOC-12's mutable-draft / immutable-revision split — so previews can be shared
freely without polluting publish history.

### Snapshot id

SHA-256 over a canonical listing of `(relative path, file sha256)` pairs sorted
by path, truncated to **12 hex chars** (48 bits). Content-addressed, so
redeploying identical content is a no-op that returns the same URL.

Accepted v1 trade-off: because the id is derived from content rather than random,
it is *theoretically* computable by someone who can reproduce the exact rendered
bytes. Impractical in practice, and previews are unguessable-URL-private by
deliberate decision (real ACLs arrive with login). If it ever matters, the fix is
a random token in the manifest mapping to the content-addressed key — no layout
change.

## `1c deploy`

```
1c deploy <slug> [--channel draft|published] [--dry-run] [--prune]
```

Renders first, always — there must be no way to ship stale bytes. Output names
each stage explicitly:

```
$ 1c deploy gigabytealchemy
  render     storage/dist/sites/gigabytealchemy/draft      9 files   2.7 MB
  hash       a1b2c3d4e5f6
  upload     preview/a1b2c3d4e5f6/out                      9 files   2.7 MB
  upload     preview/a1b2c3d4e5f6/source                   7 files   340 KB
  manifest   + preview a1b2c3d4e5f6 (basedOn rev 1)

  →  https://1stcontact.io/site/gigabytealchemy/draft/a1b2c3d4e5f6/
```

Unchanged content short-circuits and says so rather than silently re-uploading:

```
  hash       a1b2c3d4e5f6  (already deployed — nothing to upload)
  →  https://1stcontact.io/site/gigabytealchemy/draft/a1b2c3d4e5f6/
```

`--channel published` uploads the current latest revision to `rev/<NNNN>/` and
sets `manifest.live`. It refuses if `history.json` has no revisions, directing
the operator to `1c publish` first — publish mints the revision, deploy ships it.
`--dry-run` prints the full plan and uploads nothing. `--prune` deletes preview
snapshots not referenced by the manifest, reporting each deletion.

## Upload mechanism

Shell out to `wrangler r2 object put` per file. Sites are 4–13 files, so this is
a few seconds and **zero new dependencies**. The S3 API via `@aws-sdk/client-s3`
would need a separate R2 access key and a dependency install; not warranted at
this scale.

## Manifest concurrency

Read-modify-write on `manifest.json` uses R2's conditional write (`onlyIf` etag)
so a lost update fails loudly rather than silently clobbering. Single-operator
today; D1 removes the concern in phase 2.

## Non-goals

- No D1, no canonical-store move.
- No custom domains. `gigabytealchemy.ai` is live with the original site being
  reproduced; this ticket touches only `1stcontact.io`, so there is zero exposure.
- No subdomain routing (`<slug>.1stcontact.io`) — later, additive.

## Acceptance

- `test_UAT_FC_<TICKET>_deploy_draft_uploads_snapshot` — deploy places `out/` and
  `source/` under `preview/<sha>/` and appends a manifest preview entry.
- `test_UAT_FC_<TICKET>_deploy_is_content_addressed` — identical content twice
  yields one upload and the same URL; changed content yields a new `<sha>` and
  leaves the prior snapshot intact and readable.
- `test_UAT_FC_<TICKET>_deploy_renders_before_upload` — a stale `dist/` is
  re-rendered; uploaded bytes match the current definition.
- `test_UAT_FC_<TICKET>_deploy_published_requires_revision` — `--channel published`
  on a site with empty `history.json` fails with a message naming `1c publish`.
- `test_UAT_FC_<TICKET>_deploy_output_names_each_stage` — output contains a
  labelled line per stage and terminates in the shareable URL.
- `test_UAT_FC_<TICKET>_dry_run_uploads_nothing` — `--dry-run` mutates no R2 state.
- `test_UAT_FC_<TICKET>_prune_removes_unreferenced` — `--prune` deletes only
  snapshots absent from the manifest.

R2 is faked at the upload-boundary seam in tests; no network in the suite.

## Dependencies

Needs the relocatable-output ticket for the path-based URL to resolve. Pairs with
the public-site Worker ticket, which consumes this layout — the two can be built
in parallel against this spec.

-

-