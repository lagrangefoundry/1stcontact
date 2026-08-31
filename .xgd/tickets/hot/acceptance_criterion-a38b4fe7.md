---
uid: acceptance_criterion-a38b4fe7
id: AC-1403
type: acceptance_criterion
title: A workspace that cannot start says so in the page, naming the cause and a fix,
  and never overwrites one that started slowly
created_by: xgd
created_at: '2026-08-31T10:13:04.798231+00:00'
updated_at: '2026-08-31T10:13:04.798231+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-e674c60a
  kind: behavior
  regression_only: false
---

## Criterion

A workspace that cannot start says so **in the page**, rather than serving a page
that loaded perfectly and does nothing.

The document itself always arrives successfully, so three unrelated faults used to
produce one indistinguishable symptom: a build artifact the client imports is
missing or stale; the store the client asks for the site listing refuses; or the
client throws while mounting. In every case the browser showed a blank page with
the reason reachable only in a developer console.

The guard that closes this is carried **inline in the document**, because serving
it as a separate file would make the diagnostic depend on the very artifact layer
most likely to be broken when it is needed. It is registered before the client it
watches, so it is already listening when that client fails to load.

What it shows: what actually went wrong, the live answer the site listing gives
when asked at that moment, and a named fix for the two causes an operator can act
on — a missing build artifact (naming the command that builds it) and a store
that holds no account for this deployment (naming what registers one). A generic
"check the console" would be the same non-answer the blank page already gave.

It never hides a working workspace: it checks the mount point is still empty
immediately before every write, so a workspace that mounted slowly but
successfully is not replaced by an error panel that raced it. It asks the listing
for its status only once the page is already known to be broken, so a healthy load
costs nothing.

## Verification

Load the workspace document into a real document environment three times, with a
different fault arranged each time: an artifact the client imports failing to
load; the site listing refusing because the store holds no account; and the client
throwing during mount. Assert in each case that the mount point ends up carrying
a visible explanation naming what failed, and that the artifact case and the
no-account case each carry their own named fix.

Then arrange a mount that succeeds *after* the guard's deadline has passed and
assert the guard writes nothing — the mounted workspace must survive. Assert also
that a healthy load never asks the listing at all.
