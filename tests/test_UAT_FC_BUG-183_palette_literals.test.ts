import { describe, expect, it } from 'vitest'
import { l1Operations } from '../tools/generate/src/cli/ai/toolbox-core'
import l1Surface from '../tools/generate/src/cli/ai/l1-surface.json'
import { makeMemorySite } from './support/site-factory'

/**
 * [[BUG-183]] — **a palette colour written out by hand is `inconsistent`, even
 * on a page that references none of its palette.**
 *
 * WHAT WENT WRONG. A builder created six palette entries and then wrote every
 * element with those same colours as literal hex. The palette rule was purely
 * proportional — literals were only a finding where references outnumbered
 * them — so a page with zero references reported `inconsistent: 0`, and the
 * `broken = 0 / inconsistent = 0` gate passed on a page that used none of its
 * palette.
 *
 * WHAT THESE PIN. Read off `describe_page` over a real store, as a session
 * calls it: each literal equal to a palette entry (in any hex spelling) is
 * flagged and named; a literal that matches no entry on that same page stays
 * quiet, because nothing decidable says it is wrong.
 */

type Tier = 'broken' | 'inconsistent' | 'worth_a_look'
interface PageMap {
  attention: Record<Tier, number>
  segments: { label: string; attention?: { tier: Tier; says: string[] } }[]
}

const FACE = 'Satoshi, Helvetica Neue, Arial, sans-serif'
const PALETTE = { ink: { value: '#1f2937' }, sand: { value: '#f5efe6' }, accent: { value: '#bb5500' } }

const run = (text: string, axes: Record<string, unknown>) => ({
  kind: 'text',
  text,
  axes: { fontFamily: FACE, fontSizePx: 18, ...axes },
})

async function describeHome(children: Record<string, unknown>[]): Promise<PageMap> {
  const site = makeMemorySite({
    pages: {
      'home.json': {
        id: 'home',
        slug: 'home',
        title: 'Home',
        modules: [],
        l1: {
          widths: [320, 768, 1280],
          background: '#f5efe6',
          textColor: '#1f2937',
          root: { kind: 'container', layout: 'stack', children },
        },
      },
    },
    patchSiteJson: { palette: PALETTE },
  })
  try {
    const ops = l1Operations(site.slug, site.opts) as Record<string, (p: Record<string, unknown>) => Promise<unknown>>
    return (await ops.describe_page({ page: 'home' })) as PageMap
  } finally {
    await site.dispose()
  }
}

describe('BUG-183 — palette colours written by hand', () => {
  it('test_UAT_FC_BUG-183_palette_values_as_literals_are_inconsistent_on_a_page_with_no_references', async () => {
    const map = await describeHome([
      run('Exact ink', { color: '#1f2937' }),
      run('Shouting accent', { color: '#BB5500' }),
      run('Short accent', { color: '#b50' }),
      run('Opaque eight', { surfaceFill: '#f5efe6ff' }),
      run('Off palette', { color: '#0f172b' }),
    ])
    const at = (label: string) => map.segments.find((s) => s.label === label)!.attention

    expect(at('Exact ink')?.tier).toBe('inconsistent')
    expect(at('Exact ink')!.says.join(' ')).toContain("palette's 'ink'")
    expect(at('Shouting accent')!.says.join(' ')).toContain("palette's 'accent'")
    expect(at('Short accent')!.says.join(' ')).toContain("palette's 'accent'")
    expect(at('Opaque eight')!.says.join(' ')).toContain("palette's 'sand'")
    // Matches no entry, on a page that does not use its palette: not decidable.
    expect(at('Off palette')).toBeUndefined()
    expect(map.attention.inconsistent).toBe(4)
  })

  it('test_UAT_FC_BUG-183_the_declaration_names_a_palette_colour_written_out', () => {
    const op = l1Surface.operations.find((o) => o.op === 'describe_page')!
    expect(op.description).toMatch(/one of the palette's own colours written out/)
  })
})
