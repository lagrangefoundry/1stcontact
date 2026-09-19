---
uid: story-0cb7f25b
id: STORY-147
type: story
title: 'Reference bundle storage: a capture bundle is addressed through a storage
  contract, on the laptop or in the cloud'
created_by: martin-github@westhead.me
created_at: '2026-09-14T04:47:56.716212+00:00'
updated_at: '2026-09-19T13:43:06.597933+00:00'
completed_at: null
last_field_updated: status
status: completed
fields:
  intent_uid: bundle-8e1807f6
  capability_uid: capability-aa030c83
  story_kind: feature
  story_points: 3
---

## Story
**As an** operator capturing reference sites with the `1c` toolchain, **I want** a
capture bundle to be addressed as a named set of members through a storage
contract rather than as a directory on my own disk, **so that** the same capture
runs to completion and lands the same artifact whether it is driven from my
laptop or from the cloud, every verb that reads a bundle keeps working against
the tree I already have, and one client's captured material cannot be reached
from another client's account.

## Description
[[REQ-154]] gave the cloud a browser; it did not give it anywhere to put what the
browser produced. This story is the somewhere.

A capture bundle stops being a directory tree and becomes a **named set of
members addressed by key** — `capture.json`, `screenshot.full.png`, the
`screenshot-<width>.png` ladder, `rendered.html`, `raw.html`, `assets/<name>`,
`multistate.json`, `l1.json`, `forms.json`, `hints.json`. The same contract is
served by three backings, chosen by injection: the operator's `storage/references/`
tree, the client-private cloud bucket, and an in-memory one for tests and for the
shared contract body. The capture pipeline itself no longer knows which it has,
which is what lets `1c capture page <url>` run to completion inside the deployed
serverless runtime.

**This is a port, not a redesign.** [[DOC-13]] §8: *"`storage/references/` bytes
move to R2. The capture pipeline, schema, and bundle are unchanged."* A bundle
written by the laptop and one written by the cloud are the same artifact, member
for member, readable by either. Every `--ref <dir>` verb addresses exactly the
tree it always did.

**In scope**: the bundle/store/tenant-root contract and its three backings;
`1c capture page` landing a complete bundle in the cloud; equivalence between a
locally written and a cloud written bundle of the same URL; `1c refold --ref`
re-deriving `l1.json` and `forms.json` from a stored bundle over either backing
without re-hitting the site; tenant scoping and key isolation in the cloud;
unchanged `--ref <dir>` behaviour on the filesystem.

**Out of scope, by the operator's explicit decision**: re-pointing the
*reproduction* verbs (`repro`, `adopt-gaps`, `gate`, `responsive-diff`) at a
non-filesystem backing — they read through the contract because their dependency
moved, but the CLI hands them the filesystem backing and nothing else; they are
the framework-growth loop ([[DOC-21]]), operated by a developer at a CLI.
`refold` is the exception, because the intent names it. Offline re-extraction
stays a local-operator verb. A cloud route streaming members to a public browser
is a different design. Bundle retention and sweeping ([[DOC-38]] §12) is a
lifecycle policy above this layer; there is no delete verb.

## Technical Context
- Same seam, same shape and same separation rationale as the `SiteStore` port
  ([[REQ-142]], [[REQ-143]], STORY-118): a storage contract buried inside a
  feature change is a storage contract nobody reviewed. The cloud tenant barrier
  reuses site storage's registry check and its `UnknownTenantError` outright,
  rather than growing a second error type for one condition.
- Client-private bucket, not the public-site bucket. A capture bundle is the
  client's private material — their old site, and competitors' sites they will
  never hold the right to republish ([[DOC-38]] §4.2, §7.1) — so it lives beside
  the ticket store's attachments under the tenant prefix `t/<tenant>/ref/<name>/<member>`
  ([[DOC-38]] §7.2), never in the bucket a public Worker serves by path. The
  barrier is structural: a handle composes every key from its own tenant's
  prefix, so a cross-tenant read is not refused, it is unaddressable.
- **Async totally.** Every verb is async, including ones the filesystem could
  answer synchronously, so a caller cannot learn which backing it got. The
  operator priced this cascade in the intent: the repro, refold, gate, coverage
  and responsive-diff entry points all became async because their dependency did.
- **No paths across the contract.** Members move as bytes. Filesystem locations
  live in the filesystem backing alone, where a path is a legitimate thing to
  have; the `--ref` argument's polymorphism (a bundle directory *or* a loose PNG)
  stays a command-line resolution above the contract, because a store has no
  answer to "is this a directory".
- The ladder-screenshot accessor was **split, not ported**: the contract returns
  bytes, the path helper moved to the filesystem backing. This is the one place
  this work and [[REQ-156]] touch, and the split is what stops either eating the
  other's change.
- **Non-determinism is stated, not discovered.** A locally captured and a cloud
  captured bundle of the same URL are not byte-equal — capture time, what the live
  site served at each moment, font-load and layout settle timing, per-engine
  ladder differences, and outright different PNG encoders between the two
  browsers. The claim is therefore same member set, same schemas, geometry within
  the existing gate's tolerance. No PNG is compared byte-wise.
- **The filesystem write is carried forward unimproved.** A bundle write is a
  sequence of writes and is not atomic: a crash midway leaves it half-written,
  exactly as before the contract existed. Deliberately not fixed here — the
  correctness claim of this work is that nothing changed, and improving it would
  have made that claim uncheckable. Deliberately **not** formalized as an AC.
- Equivalence across the runtime boundary is proved in two composing halves,
  because no single suite can hold both the filesystem backing (node only) and
  the cloud one (workerd only): the node suite asserts filesystem ≡ memory, the
  workers suite asserts memory ≡ cloud, over the same capture driven by the same
  fake browser. Equivalence is transitive and the shared in-memory backing is
  what carries it.

## Reconciliation Decisions
The intent specifies the contract's verbs (`read`, `write`, `list`, `bundle`,
`forTenant`) but is silent on several semantics the landed code commits to. Each
is formalized now, in this session, rather than left open:

- **Absent members are answers, not faults** (decided at reconciliation,
  2026-09-13): the intent names the verbs but not what an absent member does.
  The landed code returns "absent" rather than erroring, because a bundle
  predating a member is the ordinary case — [[REQ-48]], [[REQ-83]] and [[REQ-93]]
  each added one — while the capture record is the single member a bundle cannot
  be without and its absence is refused by name. Formalized as AC-1768, with the
  width-keyed case — an unshot ladder width reading absent so a size-aware
  comparison fails loudly rather than falling back to the desktop shot — as
  AC-1774.
- **A rewritten member replaces rather than accumulates** (decided at
  reconciliation, 2026-09-13): intent is silent, but `refold` rewriting `l1.json`
  and `forms.json` in place against a bundle it did not create is only correct if
  the store replaces. Formalized as AC-1769.
- **A store lists only bundles that hold something** (decided at reconciliation,
  2026-09-13): intent gives `list()` with no semantics. The landed code makes
  taking a handle total and free — a capture's first act is to write into a
  bundle that does not exist — so merely asking for a handle must not conjure one
  into the listing, and on the operator's tree a loose file at the references
  root and a bare host directory are not bundles. Formalized as AC-1770.
- **Member keys are sorted and forward-slashed on every backing** (decided at
  reconciliation, 2026-09-13): the intent's "NO PATHS" principle implies it but
  never states it. A member key is a key, not a path, and it must not vary with
  the host's separator or two backings would enumerate the same bundle
  differently. Formalized as AC-1771.

No contradiction between intent and code was found for this plan item.

## Dependencies
None.

## Story Points
3