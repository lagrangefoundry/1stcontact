---
uid: comment-78f2e910
id: COMMENT-6239
type: comment
title: Claude response for reconciliation_uat_generation report
created_by: xgd
created_at: '2026-11-01T20:55:23.275033+00:00'
updated_at: '2026-11-01T20:55:23.275033+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-d0cf7c88
  kind: note
---

I wrote the UATs for plan item 8. All three pass, and none of them was skipped: the shared shell components are installed in this worktree, so they ran against the real ones.

```
UATs generated for story story-e674c60a (plan item 8 of 8)

Story: story-e674c60a
Test file(s) created:
  - tests/reconciliation-builder-session-and-control-sizing.test.ts

Tests written: 3
Tests passed: 3
Tests failed: 0

test_files_created:
  - "tests/reconciliation-builder-session-and-control-sizing.test.ts"
```

Item 8 adds three acceptance criteria to the story. Each has one test:

- **`test_UAT_AC2230_…`: an ended session is reported, not drawn as an empty account.**
  - **At load:** if the opening calls get a 401, the "session has ended" notice is the only thing in the mount point and no shell is mounted. Its *Sign in again* button calls the injected sign-in exactly once.
  - **Fetch that fails outright:** gives the "could not reach the server" wording and keeps the original error as the cause.
  - **Other load failures:** are still thrown.
  - **Mid-session:** the test mounts the real builder with the Invite dialog open and an email typed in, then has several calls refused. Exactly one strip appears, above the shell rather than inside it. Nothing is made inert or dimmed, and the typed text is unchanged and still editable.
  - **Refused site listing:** a business switch whose listing gets a 401 leaves the displayed site, the frame address, the Library rows and the Contacts rows as they were, and nothing re-reads them.
- **`test_UAT_AC2231_…`: failures other than a 401 behave as before.**
  - **A 500 on the status and businesses calls:** the builder still mounts, with no session notice, no switcher, no business selected and no block on the shell.
  - **A 500 on the site listing:** treated as an empty list.
  - **A working session:** loaded twice, it never notifies a session-ended subscriber.
  - **Copy save:** a validator rejection still reports the validator's sentence. A 401 still reaches the caller in the same error form as before, and now also raises the strip.
  - **Assistant stream:** a refusal still turns into a frame in the conversation.
- **`test_UAT_AC2232_…`: every chrome control takes one font size.**
  - **Stylesheet walk:** the sheets are walked in the order the workspace document loads them: the shell component sheets from the generated import map, then the builder's own stylesheet. The test checks that order against `chrome.ts`.
  - **Controls covered:** Theme and About, the search box and filter selects, Invite, *Provision a business*, and all four dialog buttons. For each one, the last font declaration that applies is the control size token. It is at least as specific as the rules it overrides, and wherever a rule resets the font, the token comes next.
  - **The token itself:** declared once, as 13px.
  - **Filter row:** shares one padding.
  - **Dialog buttons:** use the canonical class. The confirming button also carries the primary modifier, and the dialog buttons keep their own larger padding.
  - **Class sweep:** every `builder-*` class the Contacts tab and its two dialogs emit is matched by a rule in the builder stylesheet.

**Not done:**
- **No lint run.** ESLint isn't installed locally, and fetching it was blocked because the npm registry isn't on the sandbox's network allow list.
- **No type check of the file.** The repo root has no `tsconfig.json`, so the tests aren't covered by one.
- **No failure-mode check.** I didn't confirm the tests fail when the behaviour breaks, because that would mean editing runtime code, which this step doesn't allow.

**Two choices worth knowing about:**
- **Skip behaviour:** like the other mounted suites, all three tests skip when the shared components aren't installed. That includes the load-time checks in the AC-2230 test, which don't need them.
- **Font resolution:** the AC-2232 test works out which font declaration wins by approximation. It uses source order plus a simple specificity count, and treats rules inside media queries as always applying.

No runtime code, existing tests or tickets were changed. The old `test_UAT_FC_BUG-52_*` and `test_UAT_FC_BUG-53_*` files are still in `tests/`; renaming or deleting them is a later reconcile step.
