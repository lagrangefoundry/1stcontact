---
uid: report-66dec27f
id: REPORT-11269
type: report
title: Claude batch_fix_assessment report
created_by: xgd
created_at: '2026-11-08T04:27:29.974304+00:00'
updated_at: '2026-11-08T04:27:29.974304+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: batch_fix_assessment
  subject_uid: story-7d255580
  parent_report_uid: report-2186404b
  batch_index: '0'
---

Both failing tests in this batch now pass. Production code was not changed, and no AC or story needed editing, because both ACs already describe the REQ-205 behaviour. Only the two tests were out of date.

**`tests/test_reconciliation_outgoing_messages.test.ts`, test `test_UAT_AC2279_…`**
- The expected sending address is now `1st Contact <no-reply@1stcontact.io>`, matching `wrangler.toml` in both the top-level and production sections. I kept the section-by-section parse and the checks that a padded value is trimmed and an absent or blank one is refused.
- I added the send the AC asks for: a message through `mailerFor` with a credential and a recording fetch double. The test asserts exactly one request, the returned provider id, and that the provider's `from` field equals the display-name string exactly.

**`tests/test_reconciliation_outgoing_messages.workers.test.ts`, test `test_UAT_AC2281_…`**
- I removed the "no text part" assertion, which REQ-205 replaces.
- The test now asserts:
  - `html` equals the rendered body, including the `cta_url` anchor.
  - `text` is a non-empty string.
  - `text` contains no HTML tags. The tag pattern deliberately allows the `<https://…>` form that links take in the text part.
  - `text` contains `cta_url` exactly as written, the check REQ-205 names.
  - The template has no separate `text` field, so only one body is authored.
- The test names are unchanged.

**Verification:** I ran the two reconciliation files plus the REQ-196 and REQ-205 suites (`mail`, `mail_configuration`, `text_part`, `sending_address`): 40 of 40 passed, covering AC2275–AC2286 and every REQ-196/REQ-205 test. None of those older suites still expected the bare address or a send without a text part, so none needed editing. I could not run a separate lint or typecheck. The project has no ESLint dependency, the sandbox blocks fetching it from npm, and there is no root `tsconfig.json`. Vitest compiled both edited files without errors.

```yaml
## Assessment
status: fixed
fixed:
  - tests/test_reconciliation_outgoing_messages.test.ts::test_UAT_AC2279_from_address_is_configured_on_both_sides_and_absent_refuses
  - tests/test_reconciliation_outgoing_messages.workers.test.ts::test_UAT_AC2281_message_body_reaches_the_provider_as_html
production_code_changed: false
upstream_ticket_changes: none (AC-2279 and AC-2281 bodies already match the code per REQ-205)
verification: "vitest run on both reconciliation files + FC_REQ-196 (mail, mail_configuration) + FC_REQ-205 (text_part, sending_address): 6 files, 40/40 passed"
```