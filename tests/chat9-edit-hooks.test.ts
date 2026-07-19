import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { cmdNew, cmdRender } from '../tools/generate/src/cli/commands'

/**
 * CHAT-9 M1 — render edit-hooks. The Weber editor's preview overlay maps a
 * hovered/clicked region in the iframe back to the module instance to edit via
 * the `data-fc-module` / `data-fc-type` hook stamped per instance at render time.
 * These UATs pin that hook onto every module's *root* element, once per instance,
 * with the instance id (not the module type) as the addressable key.
 */
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
    const { outDir } = await cmdRender('acme', { cwd })
    const html = readFileSync(path.join(outDir, 'index.html'), 'utf8')

    // The hook is the first attribute on the module's own root tag (a <section>
    // band, the <header>, or the <footer>) — so a click anywhere in the block
    // resolves to one instance via a single closest('[data-fc-module]') lookup.
    expect(html).toMatch(/<section data-fc-module="[^"]+" data-fc-type="[^"]+"/)
    expect(html).toMatch(/<header data-fc-module="header" data-fc-type="header"/)
    expect(html).toMatch(/<footer data-fc-module="footer" data-fc-type="footer"/)
  })
})
