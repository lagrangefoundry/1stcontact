---
uid: comment-901e60ad
id: COMMENT-7964
type: comment
title: Claude response for reconciliation_uat_generation report
created_by: xgd
created_at: '2026-11-08T04:16:39.370571+00:00'
updated_at: '2026-11-08T04:16:39.370571+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-82e5b13f
  kind: note
---

I wrote 7 UATs for story-7d255580 in two new files, and all 7 pass. Two older tests for this story now fail because they still check the behaviour REQ-205 replaced. The rules for this step don't let me edit existing tests, so the fix-it loop has to deal with them.

```
UATs generated for story story-7d255580 (plan item 1 of 6)

Story: story-7d255580
Test file(s) created:
  - tests/test_reconciliation_outgoing_messages_text_part_and_sender.workers.test.ts
  - tests/test_reconciliation_outgoing_messages_fallback_from.test.ts

Tests written: 7
Tests passed: 7
Tests failed: 0

test_files_created:
  - "tests/test_reconciliation_outgoing_messages_text_part_and_sender.workers.test.ts"
  - "tests/test_reconciliation_outgoing_messages_fallback_from.test.ts"
```

**What each test covers:**

| AC | Test | What it checks |
|---|---|---|
| AC-2369 (new) | `test_UAT_AC2369_every_message_carries_a_text_part_that_keeps_every_href` | For all three default templates, every link in the HTML part also appears in the text part the provider received. Also checks how links, `<style>`/`<title>`/`<script>`/`<head>`, wrapped paragraphs and `&amp;`/`&#8212;` come out in the text. |
| AC-2370 (new) | `test_UAT_AC2370_a_body_yielding_no_text_is_refused_by_both_senders_before_anything_happens` | `<p></p>` and `<style>p{}</style>` are refused by the sender that has a credential and by the one that doesn't, with no request to the provider and nothing recorded. A body that does have text is accepted, and the text sent is the text the shared check derived. |
| AC-2371 (new) | `test_UAT_AC2371_sender_is_the_template_address_else_mail_from_resolved_once_and_not_editable` | The invite goes out from `1st Contact <invite@1stcontact.io>` on both the message and the outgoing record. A template with no `from`, or a blank one, falls back to `MAIL_FROM`. Sign-in links use `MAIL_FROM`. Through the Worker's routes, the invite form's data shows the template's address, and a `from: attacker@example.com` on the send request is ignored. |
| AC-2281 (changed) | `…_html_beside_a_derived_text_part` | The provider gets the HTML body unchanged plus a non-empty text part with no tags. The template type has no text field. |
| AC-2282 (changed) | `…_with_optional_placeholders_and_from` | `from` is an optional string in the type definition. All four valid writes succeed and all four invalid ones are refused. |
| AC-2286 (changed) | `…_and_invite_names_its_sender` | The three default templates keep their earlier checks (no business name in the copy, only `cta_url`, a button plus a URL to copy and paste). The invite default names the invite address; sign-in and lapsed name none. |
| AC-2279 (changed) | `test_UAT_AC2279_mail_from_is_the_named_fallback_in_both_sections_and_absent_refuses` | `wrangler.toml` sets `MAIL_FROM` to `1st Contact <no-reply@1stcontact.io>` in both the default and production sections. The value is trimmed; a missing or blank value is refused; the display-name form reaches the provider unchanged. |

I made one correction along the way. My check for "no HTML tags in the text part" also caught the `<https://…>` address form, which AC-2369 actually requires, so I narrowed it to real tags.

**Fails, for the fix-it loop:** these two tests in the earlier files fail now, and both still check the replaced behaviour:
- `test_UAT_AC2281_message_body_reaches_the_provider_as_html` in `tests/test_reconciliation_outgoing_messages.workers.test.ts` checks that there is no text part.
- `test_UAT_AC2279_from_address_is_configured_on_both_sides_and_absent_refuses` in `tests/test_reconciliation_outgoing_messages.test.ts` checks for the bare `no-reply@1stcontact.io`.

The code matches the updated ACs, so the right fix is to delete those two tests in favour of the new ones, not to change any code. Until that happens, AC-2279 and AC-2281 each have one passing and one failing test.

**Not checked:**
- **Lint:** ESLint isn't installed in this checkout, and fetching it from the npm registry was blocked by the sandbox.
- **Type-check:** there's no root `tsconfig.json`, so `tsc` didn't cover the new files; vitest compiled and ran them without errors.
- **Invite form in the browser:** for AC-2371, I tested the read-only address through the form's data route and the send route, not by rendering the form.