import { describe as suite, expect, it } from 'vitest'
import { describe as describeMaterial } from '../apps/control-app/src/describe'

/**
 * BUG-184 — **a library title is never raw markup**.
 *
 * Markdown admits inline HTML, and a letterhead or invoice template commonly
 * opens with its logo as an `<img …>` tag. The "first substantial line" rule took
 * that tag verbatim, so `list_library` and the client's Library tab named the
 * document `<img src="images/logo.png" …>`. The title is now read from the text
 * the markup surrounds; with no text at all, an `alt` stands in before the
 * filename does. No describer is configured: the title is not the model's.
 */

async function titleOf(markdown: string, filename: string): Promise<string> {
  const described = await describeMaterial({
    bytes: new TextEncoder().encode(markdown),
    kind: 'document',
    contentType: 'text/markdown',
    filename,
  })
  return described.title
}

suite('BUG-184 — markup is stripped from a derived title', () => {
  it('UAT_FC_BUG-184 a logo line is skipped and the first heading titles the document', async () => {
    const title = await titleOf(
      '<img src="images/logo.png" alt="Acme Plumbing logo" width="180">\n\n# Invoice template\n\nBill to: …\n',
      'invoice.md',
    )
    expect(title).toBe('Invoice template')
    expect(title).not.toContain('<')
  })

  it('UAT_FC_BUG-184 markup wrapping text leaves only the text', async () => {
    const title = await titleOf(
      '<p align="center">\n<!-- header -->\n<h1>Acme <small>Letterhead</small></h1>\n</p>\n',
      'letterhead.md',
    )
    expect(title).toBe('Acme Letterhead')
  })

  it('UAT_FC_BUG-184 a document with no text is titled by its image alt', async () => {
    expect(await titleOf('<img src="logo.png" alt="Acme Plumbing logo">\n<br>\n', 'logo.md')).toBe(
      'Acme Plumbing logo',
    )
  })

  it('UAT_FC_BUG-184 markup with neither text nor alt falls back to the filename', async () => {
    expect(await titleOf('<img src="logo.png">\n<div></div>\n', 'letterhead.md')).toBe('letterhead.md')
  })
})
