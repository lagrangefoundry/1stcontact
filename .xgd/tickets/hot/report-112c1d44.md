---
uid: report-112c1d44
id: REPORT-4444
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-19T13:24:08.924802+00:00'
updated_at: '2026-09-19T13:24:08.924802+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/bug-360c5a44.md` — **UU**, index-only (path is outside the
  sparse-checkout cone, so there were no working-tree markers; three index
  stages only). Class **2e** (intent/bookkeeping ticket — `bug-*`).
  **Rule applied: one side is a strict superset of the other — keep the
  superset.** The superset is the OURS/HEAD side. Resolved with
  `git checkout --ours` + `git add --sparse`; staged blob is
  `c0b18a118a071b329094493542b14db97cca1afd`, byte-identical to stage 2.

### Why ours, not incoming

The enrichment rule for this file was "take the more recent commit by
timestamp." Both that rule and 2e's superset rule point the same way:

| | OURS (HEAD) | THEIRS (incoming `fd72594`) |
|---|---|---|
| commit date | 2026-09-16 | 2026-09-01 15:29 |
| `updated_at` | 2026-09-16T01:48:37 | 2026-09-01T22:29:53 |
| `status` | `bundled` | `draft` |
| `completed_at` | 2026-09-14T10:29:01 | `null` |
| `fields.commits` | `working_sha: 84cc117a…` | absent |
| `fields.version` | `0.2.40` | absent |
| `fields.bundled_in` | `bundle-8e1807f6` | absent |

Taking the incoming side would have regressed this ticket's lifecycle state
from `bundled` back to `draft` and dropped `completed_at`, `commits`,
`version` and `bundled_in` — including `bundled_in: bundle-8e1807f6`, this
bundle's own marker. No body content would have been gained in exchange (see
below).

## Incoming changes preserved

The incoming commit `fd72594eb0410ea0c51b51cce207c02e6691ef3a`
("xgd(ticket): update bug bug-360c5a44") made one frontmatter change
(`last_field_updated: status` → `body`, plus its own `updated_at` bump) and a
set of body edits. Every one of those body edits is **already present verbatim
in the resolved (HEAD) file**:

- Symptom — the appended "A manual browser refresh does show the change
  (confirmed by the operator)…" sentences. Present.
- Root cause — "**Nothing reloads the preview iframe when the assistant
  writes.**" (replacing "…when an assistant turn ends."). Present.
- The entire new `## What is wanted` section (both paragraphs). Present.
- Fix — "Give the turn a change signal, emit it as the writes happen, and
  reload on it." and the rewritten step 1 (per-`tool_activity` counter re-read,
  `{kind: 'site_changed', meta: {at, changes}}`, "One primary-key read per tool
  call…"). Present.
- Fix — "Only a counter that actually moved produces a signal, which is what
  keeps a read-only turn…". Present.
- Test plan — the expanded **workerd** bullet (two write tools, a frame after
  *each*, interleaved rather than collected at the end, read-only turn emits
  none). Present.

Verified mechanically: comparing the incoming body against the resolved file
line by line, exactly two incoming lines do not appear in the resolution —

    once per signal; one that does not, does not. The signal is not passed on to
    the chat component.

These are the tail of the incoming **panel** test-plan bullet. They are not
discarded content: HEAD carries a later restatement of the same fact by the
same author, extended rather than reverted —

    - **panel** — a turn whose stream carries `site_changed` invokes `onSiteChanged`
      once per signal, carrying the counter; one that does not, does not. The signal
      leaves no trace in the conversation, and a callback that throws does not cost
      the operator the assistant's answer.

"The signal is not passed on to the chat component" and "The signal leaves no
trace in the conversation" assert the same property; HEAD's wording adds
"carrying the counter" and the callback-throws assertion. HEAD further adds a
paragraph to `## Fix` ("Reloading a frame is the host's business…") and a third
test-plan bullet (**app**) that the incoming side never had. The HEAD side is
therefore a strict superset in substance: it contains the incoming commit's
intent plus the later refinements made when the fix was actually implemented
and bundled.

No code/implementation files were in conflict. No BUG-1301 precedence
exception was invoked — nothing was dropped.

## Net effect

The staged tree has no diff against HEAD (`git diff --cached HEAD` is empty):
this commit's content had already reached the reconcile branch by another
route and was then advanced past. Per STEP 4 this is the redundant-commit
case, not the discarded case — STEP 3's check passes, since the incoming
commit's key changes are demonstrably *present* in HEAD rather than absent.
`--skip` was not called; `CHERRY_PICK_HEAD` (`fd72594e`) is intact for
`cherry_pick_finalize_resolution`.
