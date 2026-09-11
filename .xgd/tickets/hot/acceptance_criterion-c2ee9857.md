---
uid: acceptance_criterion-c2ee9857
id: AC-1701
type: acceptance_criterion
title: Addresses that mean something only inside the platform's own network are refused,
  and ordinary public addresses are permitted
created_by: martin-github@westhead.me
created_at: '2026-09-11T04:42:27.854103+00:00'
updated_at: '2026-09-11T04:58:07.667252+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-77f8fc9e
  kind: behavior
  regression_only: false
---

## Criterion

An address that means something only from **inside** the network the platform runs in is refused,
with a message saying the address is on a private network and naming the host. The refused
families are:

- loopback, and the unspecified address;
- the three private address blocks;
- link-local — which is where a cloud metadata service lives, and is the reason this family is on
  the list at all;
- carrier-grade NAT;
- multicast and reserved space;
- the IPv6 equivalents: the loopback and unspecified forms, unique-local, link-local, and any
  IPv4-mapped form of an address already refused above (so a mapped loopback cannot be smuggled
  past the rule);
- names that are not resolvable from the public internet: the local hostname itself, the mDNS
  suffix, and the conventional private-zone suffix.

Ordinary public addresses — a public hostname, a public IPv4 literal, a public IPv6 literal — are
**not** refused by this rule.

**Scope**: the rule is applied to the address as written. It is not a claim about a name that
resolves to a private address; see the story's technical context for why that cannot be closed
here.

## Verification

For each refused family, request a retrieval of a secure address on such a host and assert it is
refused as a private address with the host named in the message, and that no network retrieval of
that address was attempted. Include, at minimum, one loopback literal, one address from each
private block, the metadata link-local address, a carrier-grade-NAT address, the IPv6 loopback, a
unique-local and a link-local IPv6 address, an IPv4-mapped loopback, the bare local hostname, an
mDNS name, and a private-zone name. Then assert that a public hostname, a public IPv4 literal and
a public IPv6 literal are all permitted by this rule.