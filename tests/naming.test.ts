import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'

// Guards against the `first-contact` → `1stcontact` identifier drift recurring.
// Code identifiers must align with the 1stcontact.io domain (no `first-contact`).
describe('identifier naming consistency', () => {
  const files = [
    'apps/public-site/wrangler.toml',
    'apps/control-app/wrangler.toml',
    'package.json',
  ]

  it('test_UAT_FC_REQ-1_identifiers_use_1stcontact_not_first_contact', () => {
    for (const f of files) {
      const txt = readFileSync(f, 'utf8')
      expect(txt, `${f} must not contain the legacy 'first-contact' identifier`).not.toMatch(
        /first[-_]contact/i,
      )
    }
  })

  it('test_UAT_FC_REQ-1_worker_names_are_1stcontact_prefixed', () => {
    expect(readFileSync('apps/public-site/wrangler.toml', 'utf8')).toContain(
      'name = "1stcontact-public-site"',
    )
    expect(readFileSync('apps/control-app/wrangler.toml', 'utf8')).toContain(
      'name = "1stcontact-control-app"',
    )
  })
})
