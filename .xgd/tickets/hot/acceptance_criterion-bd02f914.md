---
uid: acceptance_criterion-bd02f914
id: AC-2358
type: acceptance_criterion
title: A mapped service token is admitted as the person it names, under that person's
  membership, entitlement, terms and revocation
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T01:41:08.690091+00:00'
updated_at: '2026-11-08T01:41:08.690091+00:00'
completed_at: null
last_field_updated: created_at
status: active
fields:
  story_uid: story-182e8cb9
  kind: behavior
  regression_only: false
---

## Criterion

A service token authenticates as a machine name and carries no address. When
the deployment's service-token mapping lists that machine name, the request is
admitted **as the person the mapping names** — the token is that person's
automation, and nothing about admission is different from that person signing
in themselves:

- the businesses it reaches are exactly the businesses that person would be
  admitted with, decided by that person's memberships;
- each business is selectable or not by that person's grants, with the same
  lapse reasons;
- the terms gate applies to the person: if they have not accepted the current
  terms, the automation meets the same terms refusal they would;
- revoking the person (or their membership or grant) revokes the automation;
  revocation is also achieved by deleting the token at the identity gateway or
  by removing its mapping entry, and either alone is sufficient;
- the person's arrival is what is recorded — no separate presence is invented
  for the automation.

The machine name is matched case-insensitively and with surrounding whitespace
ignored, and the mapped address is casefolded the same way stored addresses are,
so a mapping written `Name=Person@Example.com` admits the person stored as
`person@example.com`.

**The mapping names a person; it does not create one.** A mapped name whose
address belongs to nobody is refused exactly as any unknown address is (no
person), and nothing is provisioned. There is no second authorisation path: the
mapping only decides *which address* is presented to admission, and admission
then applies its ordinary rules.

## Verification

Through the application's own request handling, against real storage and a
gate that verifies real signed tokens: configure a mapping from a machine name
to a person who holds a membership and grant, present a service token carrying
that machine name and no email, and observe it is admitted with the same set of
businesses that person is admitted with when presenting their own address.
Repeat with the mapping's name and address in different case and observe the
same admission. Map a name to an address with no person behind it and observe
the refusal for an unknown person, with nothing created.
