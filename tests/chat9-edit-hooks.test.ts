import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { cmdNew, cmdRender } from '../tools/generate/src/cli/commands'

/**
 * CHAT-9 M1 — render edit-hooks. The Weber editor's preview overlay maps a
 * hovered/clicked region in the iframe back to the module instance to edit via
 * the `data-fc-module` / `data-fc-type` hook stamped per instance at render time.
 * These UATs pin that hook onto every module's *root* element, once per instance,
 * with the instance id (not the module type) as the addressable key.
 *
 * Since the framework pivot (REQ-84) the catalog holds only the capability
 * modules `carousel` and `contact-form`, and `1c new` seeds an EMPTY page — so
 * these fixtures author a page of surviving-module instances to exercise the
 * hook. Both render to a `<section>` band, so the hook lands on that root.
 */

/**
 * Repoint the (now-empty) starter home page onto two surviving-module instances
 * so there is real rendered output to stamp hooks onto.
 */
function seedModules(cwd: string, slug: string): Array<{ id: string; type: string }> {
  const homePath = path.join(cwd, 'storage', 'sites', slug, 'draft', 'pages', 'home.json')
  const home = JSON.parse(readFileSync(homePath, 'utf8'))
  home.modules = [
    {
      id: 'gallery',
      type: 'carousel',
      version: 2,
      config: { view: 'single' },
      slots: { slide: [{ kind: 'text', text: 'A great experience.' }] },
    },
    {
      id: 'get-in-touch',
      type: 'contact-form',
      version: 3,
      config: {
        action: 'https://example.com/submit',
        fields: [{ name: 'email', label: 'Email', type: 'email', required: true }],
      },
    },
  ]
  writeFileSync(homePath, JSON.stringify(home, null, 2))
  return home.modules.map((m: { id: string; type: string }) => ({ id: m.id, type: m.type }))
}

describe('CHAT-9 — builder edit-hooks in rendered output', () => {
  let cwd: string
  beforeEach(() => {
    cwd = mkdtempSync(path.join(tmpdir(), 'chat9-'))
  })
  afterEach(() => {
    rmSync(cwd, { recursive: true, force: true })
  })

  it('test_UAT_FC_CHAT-9_every_module_instance_is_addressable', async () => {
    cmdNew('acme', { cwd })
    seedModules(cwd, 'acme')
    const page = JSON.parse(
      readFileSync(path.join(cwd, 'storage', 'sites', 'acme', 'draft', 'pages', 'home.json'), 'utf8'),
    )
    const { outDir } = await cmdRender('acme', { cwd })
    const html = readFileSync(path.join(outDir, 'index.html'), 'utf8')

    // Every instance is addressable by its *id* (the stable edit key), paired
    // with its module type — one hook per instance, in document order.
    for (const m of page.modules as Array<{ id: string; type: string }>) {
      expect(html).toContain(`data-fc-module="${m.id}" data-fc-type="${m.type}"`)
    }

    // Exactly one hook per module instance — the hook lands on the module root,
    // not on every inner element (which would make the overlay ambiguous).
    const hookCount = (html.match(/data-fc-module="/g) ?? []).length
    expect(hookCount).toBe(page.modules.length)
  })

  it('test_UAT_FC_CHAT-9_hook_sits_on_module_root_element', async () => {
    cmdNew('acme', { cwd })
    seedModules(cwd, 'acme')
    const { outDir } = await cmdRender('acme', { cwd })
    const html = readFileSync(path.join(outDir, 'index.html'), 'utf8')

    // The hook is the first attribute on the module's own root tag — every
    // surviving capability module renders as a <section> band — so a click
    // anywhere in the block resolves to one instance via a single
    // closest('[data-fc-module]') lookup.
    expect(html).toMatch(/<section data-fc-module="[^"]+" data-fc-type="[^"]+"/)
    expect(html).toMatch(/<section data-fc-module="gallery" data-fc-type="carousel"/)
    expect(html).toMatch(/<section data-fc-module="get-in-touch" data-fc-type="contact-form"/)
  })
})
