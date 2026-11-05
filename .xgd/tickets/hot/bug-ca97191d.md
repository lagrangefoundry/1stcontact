---
uid: bug-ca97191d
id: BUG-270
type: bug
title: Builder delegations repeatedly land partial or no changes, then Delegate refuses
  further builds (idle_builds)
created_by: xgd
created_at: '2026-10-24T03:07:08.670820+00:00'
updated_at: '2026-10-24T19:12:44.992410+00:00'
completed_at: null
last_field_updated: status
status: wont_fix
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-ce372149
---

**What I was doing:** I was commissioning builder sessions through `Delegate` (role `builder`) to fix layout on one page and the shared header. The fixes were: removing an empty top band above the first section, serving a heading font with use_font and referencing it from text styles, stacking two buttons full-width at phone width, removing nav links that were duplicated at phone width, and evening out section spacing. Scope was `site.json`, `home.json` and `header.json`.

**What happened:** Over several requests, consecutive builder runs came back with no changes at all, or with only part of the brief applied. Before that, earlier runs with similar briefs had partly landed. In particular, the hero rebuild landed, but the empty top gap and the font rendering did not. In the latest request `Delegate` refused before opening a worker: `idle_builds`, "THE LAST 3 BUILDS CHANGED NOTHING. Do not start another build for this; a further one is refused in this request."

**Expected:** A builder scoped to those files can make these edits, or reports a concrete refusal saying why it can't (missing tool, validation error).

**Also observed:** A heading text style names Alfa Slab One, but headings render in a generic sans-serif on screen. This suggests the font is either not served or not resolved through the text style.

**Impact:** The client-facing page can't be corrected. The consultant session has no write tools of its own, so there is no fallback once Delegate refuses.

**Repro:** Delegate a builder with a multi-part layout brief on one page plus the header and site.json, three times in one request. Observe that the runs end with no changes, and the fourth Delegate is refused with idle_builds.

Follow-up: a later turn's narrower Delegate (two fixes, same scope) was also refused with idle_builds ("THE LAST 4 BUILDS CHANGED NOTHING"). The refusal persists across turns, not just within one request. The session has no remaining path to change the site, and an open review finding can't honestly be marked fixed.


---

## Diagnosis (2026-10-24, BUG-270 session) — duplicate of fixes already landed; no code change

Evidence: Dina's Diner (`site_b314db907afa1d53d93f3c6af2b3b902`, chat-e227e23b), read from the dev junction DO stream and the local D1 tool transcript (comment-6ca06ade).

**The builds did write.** Every builder that ran returned `wrote: true`: 01:18Z (versions 6→37), 01:23Z (37→66), the three parallel builds at 02:56Z, and 03:05Z. The host still counted each one as "changed nothing". So after two builds, every further Delegate in the message was refused. This is the whole of the "no changes / idle_builds" symptom.

**Every symptom traces to a fix the running dev server doesn't have.** Dev serves the snapshot deployed at 2026-10-23T23:26Z (`9d4f299ba1`). All three of these commits came after it:

| Symptom here | Cause | Fixed by |
|---|---|---|
| Builds that wrote were counted idle; refused after 2 | The idle tally read `account.changed.differences`, which BUG-252 empties for a large build | **BUG-266**, `144c846527` (ready_to_reconcile) |
| Count climbed "LAST 3 … LAST 8" on refusals alone; refusal carried into later host holds ("later turn") | A refused Delegate was tallied as one more idle build, and the host kept holding the reply after an idle stop | **BUG-268**, `9b2cf572c7` (free_coded) |
| Heading style names Alfa Slab One but paints a fallback | site.json has no `fonts` entry: `use_font` never ran (that fix was in a refused brief), and the old host look did not report an unserved font | **BUG-260**, `151ad9126e` and others: the host look now reports "paints in 'X', which nothing on the site serves … serve it with use_font" |

The "partial landing" (the hero landed, the top gap didn't) followed from the same thing. The follow-up brief that would have fixed the gap, the font and the buttons was one of the refused ones.

**Verified on xgd-working:** the BUG-260, BUG-266 and BUG-268 UATs pass (8 passed; the 2 skipped are BUG-260's browser-render cases).

**Action:** redeploy dev (`bin/deploy --env dev`, then `bin/dev restart dev`) and re-run the consultant's t5 brief. No code is owed on this ticket. Close as a duplicate of BUG-266 and BUG-268 unless the re-run shows something new.

---

## Resolution (2026-10-24): won't fix — no code owed

Closed as won't fix. There is no defect left in the code for this ticket to fix:

- Every symptom reported here is already fixed on `xgd-working` by other tickets: **BUG-266** (`144c846527`, builds that wrote no longer count as idle), **BUG-268** (`9b2cf572c7`, a refused Delegate is no longer counted as another idle build, and the refusal no longer carries into later turns), and **BUG-260** (`151ad9126e`, the host now reports a font that nothing on the site serves). Their UATs pass on `xgd-working`.
- The report came from the dev environment, which serves a frozen snapshot that predates all three commits. That is why the session kept hitting `idle_builds`.

Remedy is operational, not code: run `bin/deploy --env dev`, then `bin/dev restart dev`, and re-run the consultant's pending brief. If the re-run shows a new failure, file it as a new bug with that evidence.