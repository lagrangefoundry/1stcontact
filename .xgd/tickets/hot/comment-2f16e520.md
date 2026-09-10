---
uid: comment-2f16e520
id: COMMENT-2621
type: comment
title: Claude response for fix_uat_coverage report
created_by: xgd
created_at: '2026-09-10T22:15:13.597486+00:00'
updated_at: '2026-09-10T22:15:13.597486+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-c493f908
  kind: note
---

Both remaining warnings are closed. `needs_more_work: false` — the assessor re-checks.

**One thing changed the picture: the sandbox restriction the check reported is gone here.** All five suites run. The check's 20 reading-based verdicts rested on `EPERM: listen 0.0.0.0`; the conversation suite, both workers suites, the artifact suite and the knowledge suite now execute — 28/28. So the capability's evidence is executed, not read, and last call's repairs hold under that execution.

**Finding 5 — proved, not narrowed.** The assessor offered "add the case" or "narrow the clause"; I took the first. It needed something that didn't exist, so I probed before writing assertions — and the probe was decisive against my own plan: aborting the client mid-stream does *not* lose the turn. Against the instantaneous double, turn B was answered, drained and sitting in the archive before the client read its first chunk. A test written on that assumption would have asserted nothing.

Two facts made it work. The Node host's junction is `memoryJunctions()` — `SessionManager` takes `junctions` and nothing else, so the `{ logDir }` it's passed is an ignored key and Node falls to the library default, which is exactly the in-memory tier the criterion describes. And `stalls`, added to the one file BUG-39 requires the wire protocol to live in, holds the stream open after the assistant's text so "while a turn is in flight" becomes a state the suite can stand in. The case then asserts both halves: mid-flight the transcript holds the completed exchange and not the answer being spoken; after `resetAiHost()` from inside that turn, the exchange replays intact and the in-flight answer is gone. Removing the stall fails it exactly where it should.

I also narrowed one assertion after writing it: reading everything under `storage/chat` would have included the junction tier — the very thing allowed to hold that text — so it now reads the session's own transcript file.

**Finding 6 — the checkout is no longer touched.** This needed a code edit and I'll name it plainly: `setKnowledgeRoot` in `host.ts`, declared as a test seam beside `setModelClient`, which documents itself the same way. There was no other route — `kbRoot()` is repo-anchored with no override, which is why the case was renaming the checkout's own `kb/system/index` aside and restoring it in a `finally`. The seam is proven live by the "built but unopenable" leg, which asserts on an error only reachable if the redirect took effect.

**Flagged, not fixed:** `HostDeps.logDir` is dead configuration. The file junction `host-core.ts` carefully places is never built, `storage/chat/live/` is never written, and the comment explaining why "both tiers sit under `sessionsDir`" describes something that doesn't happen. It doesn't break AC-1057 — an in-memory junction is what the criterion wants — but whether the Node host *should* have a file junction is a design decision, not a repair to make in passing. It's in REPORT-3805 for the next pass.

The same three suites still fail as on the clean tree (`BUG-39`, `REQ-127`, `REQ-122`); none is an AC-named UAT here, and `stalls` added nothing to BUG-39's list.
