---
uid: request-ad980a0a
id: REQ-487
type: request
title: 'Opening: ask for the business or project name, and let the Site consultant
  record it'
created_by: EPIC-19
created_at: '2026-10-29T21:14:38.172835+00:00'
updated_at: '2026-10-29T21:45:29.030590+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: medium
  parent_uid: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-082f0837
  commits:
  - working_sha: 78781ad413eba9060eae9a96ae339929b5f755fc
    reconcile_sha: null
    main_sha: null
  - working_sha: 91515290b6f2ad017f8c66e690dedafec95544ab
    reconcile_sha: null
    main_sha: null
  version: 0.2.707
  story_points: 3
---

## Why

A new client's business starts as the placeholder `Unnamed business`. The operator (2026-10-29) wants the opening to encourage the client to name their business or project.

Before this, only the **Settings assistant** could rename a business: `rename_business` in `settings-surface.json`, granted solely to the business session. `host-core.ts` deliberately keeps the settings surface out of site conversations. The **Site consultant**, which sends the opening, had only `set_client_name`, which records the person's name. So it could hear the business name but couldn't save it.

## What

1. **The opening asks for the name when it's still the placeholder.** While the business is `Unnamed business` (or a numbered variant such as `Unnamed business-2`), the opening's closing question (`opening` in `plan-seed.json`, REQ-481's text) becomes `opening_unnamed`: "So, to start: what's your business — or your project — called, and what do you do? And who are your customers?" When the business already has a real name (from an import, an invitation, or Settings), the closing question is `opening_named` and uses the name: "So, to start: tell me about {name}. What do you do, and who are your customers?" It never asks for the name again. The rest of the opening is unchanged. A host with no business record (the `1c` CLI) sends today's text unchanged (`OPENING_MESSAGE`).
2. **The Site consultant can rename the business.**
   - The Site consultant has the business rename alone: the same operation and the same effects as the Settings tab's rename and the Settings assistant's `rename_business`. It is one code path (`settingsOperations`, then `business.ts`'s rename), not a second implementation.
   - Only that operation is granted. The consultant gets a declaration cut from `settings-surface.json` that holds only the `RenameBusiness` group, its operation, shapes and refusals, so REQ-237's separation still holds for hostnames, addresses and domains. The cut declaration has no overview, sequences or absences: that prose is about the whole surface and would not fit the consultant's priming budget.
   - Its description is the settings surface's own: rename when the client gives or corrects the name, including replacing the placeholder; then read the effects back and offer them one at a time (the site's title, and pages whose copy still names the old name). Note: no hostname is ever assigned from the placeholder (`hostname.ts`: chosen, never assigned), so there is no `unnamedbusiness` address to offer to fix.
3. **The consultant is told so in a single line,** folded into the existing per-turn `client.name` reminder rather than the priming (whose budget is full). While the business is still unnamed, the reminder adds: "Their business is still called "Unnamed business", a placeholder: its real name is the first fact to record from their answer, with rename_business." Once it has a real name, the line is gone.

## Test plan

`tests/test_UAT_FC_REQ-487_the_opening_asks_for_the_name.workers.test.ts` (real router, host, D1 and rename; scripted model client):

- `test_UAT_FC_REQ-487_opening_asks_for_the_name_while_unnamed`: for a business named `Unnamed business-2`, the opening asks what the business or project is called and never prints the placeholder. For a named business it doesn't ask, and the closing question says "tell me about <name>". The rest of the opening is identical between the two.
- `test_UAT_FC_REQ-487_site_consultant_can_rename_the_business`: the Site consultant's request carries `rename_business` and the placeholder reminder line. Calling the tool renames the business through the same path Settings uses (the record, read with the function `/api/business/name` reads, shows the new name; the tool result carries `previous_name`). On the next turn the reminder line is gone.
- `test_UAT_FC_REQ-487_site_consultant_has_no_other_settings_tools`: of the settings surface's tools, only `rename_business` is offered to the Site consultant, and the settings surface's hostname prose is not in its system prompt.

Also updated: `test_UAT_FC_REQ-403_first_entry.workers.test.ts` now expects the name-aware opening for its business (named `req403`).