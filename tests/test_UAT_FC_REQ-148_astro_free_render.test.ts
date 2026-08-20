import { describe, expect, it } from 'vitest'
import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getModule, latestModuleVersion } from '../packages/framework/src/worker'
import { MODULE_CSS } from '../packages/framework/src/modules/module-assets'
import { cmdNew, cmdRender } from '../tools/generate/src/cli/commands'
import { contactFormProps, contactFormSeed } from './support/behavior-site'

/**
 * REQ-148 — Astro is GONE from the render path, and the module render is one
 * function both runtimes call.
 *
 * The workerd half of this ticket lives in
 * `test_UAT_FC_REQ-148_behavior_in_workerd.workers.test.ts`, where a behavior
 * module is rendered inside a Worker. These are its Node-side counterparts: the
 * same component, called the same way, plus the structural claims that keep the
 * property from silently regressing — because the failure mode is not a wrong
 * pixel, it is one `.astro` import reintroducing a transform nothing in a Worker
 * can run.
 */

const repoRoot = fileURLToPath(new URL('..', import.meta.url))

/** Every source file under `dir`, skipping build output and dependencies. */
function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === 'dist' || entry.startsWith('.')) continue
    const full = path.join(dir, entry)
    if (statSync(full).isDirectory()) sourceFiles(full, out)
    else out.push(full)
  }
  return out
}

describe('REQ-148 — the render path is Astro-free', () => {
  it('test_UAT_FC_REQ-148_no_astro_component_exists_anywhere', () => {
    // AC-2. An `.astro` file is the whole problem: it cannot be parsed without
    // Astro's transform, so ONE of them anywhere on the render path re-confines
    // the render to Node. The check is repo-wide rather than scoped to the
    // framework, because the conformance fixtures were `.astro` too and would
    // have dragged the transform back in through the test suite.
    const astro = sourceFiles(repoRoot).filter((f) => f.endsWith('.astro'))
    expect(astro).toEqual([])
  })

  it('test_UAT_FC_REQ-148_the_render_graph_names_no_astro_specifier', () => {
    // AC-2, the other direction: no `.astro` file to import, and nothing that
    // imports Astro's runtime either. A bundler resolves a static specifier
    // whether or not the branch runs, so a dynamic `import('astro/container')`
    // behind an untaken branch would fail the Worker build just as hard.
    const scanned = [
      path.join(repoRoot, 'packages/framework/src'),
      path.join(repoRoot, 'tools/generate/src/render'),
      path.join(repoRoot, 'apps/control-app/src'),
    ].flatMap((dir) => sourceFiles(dir))
    expect(scanned.length).toBeGreaterThan(0)

    const offenders = scanned.filter((file) =>
      /from\s+['"]astro[/'"]|import\(['"]astro[/']/.test(readFileSync(file, 'utf8')),
    )
    expect(offenders.map((f) => path.relative(repoRoot, f))).toEqual([])
  })

  it('test_UAT_FC_REQ-148_a_behavior_is_a_plain_function_of_its_props', () => {
    // AC-3. The mechanism is not per-module: both catalog behaviors resolve to a
    // plain function through the same registry lookup, and calling one IS the
    // render. `carousel` is the proof that nothing about this was special-cased
    // for the one module three real sites happen to use.
    for (const id of ['contact-form', 'carousel']) {
      const { Component } = getModule(id, latestModuleVersion(id)!)
      expect(typeof Component).toBe('function')
      // No container, no await, no transform: props in, HTML out.
      expect(Component({ config: {}, slots: {} })).toContain('<section')
    }
  })

  it('test_UAT_FC_REQ-148_the_node_render_emits_the_components_own_output', async () => {
    // AC-1's Node half. The workerd suite asserts the served page contains the
    // component's own output as computed INSIDE workerd; this asserts the same of
    // the same props, on the same seed, through the real `1c render`. Both hosts
    // execute the same function, so this is what "byte-identical across hosts"
    // reduces to once the second render path is gone.
    const cwd = mkdtempSync(path.join(tmpdir(), 'req148-'))
    try {
      const seed = contactFormSeed('req148-node')
      cmdNew(seed.slug, { cwd })
      const home = path.join(cwd, 'storage', 'sites', seed.slug, 'draft', 'pages', 'home.json')
      writeFileSync(home, JSON.stringify(seed.pages['home.json'], null, 2))

      const { outDir } = await cmdRender(seed.slug, { cwd })
      const html = readFileSync(path.join(outDir, 'index.html'), 'utf8')

      const { Component } = getModule('contact-form', latestModuleVersion('contact-form')!)
      const direct = Component(contactFormProps())
      // Everything but the module root's opening tag, which the renderer stamps
      // the editor's hook onto.
      expect(html).toContain(direct.slice(direct.indexOf('>') + 1))
      expect(html).toContain('action="https://forms.example/contact"')
      // The invariant chrome is folded into theme.css, not inlined per instance.
      const themeCss = readFileSync(path.join(outDir, 'theme.css'), 'utf8')
      expect(themeCss).toContain('.contact-form__label')
    } finally {
      rmSync(cwd, { recursive: true, force: true })
    }
  })

  it('test_UAT_FC_REQ-148_the_module_escapes_every_value_it_interpolates', () => {
    // THE ONE THING THE CONVERSION COULD HAVE LOST. An `.astro` component's
    // `{expression}` was escaped by the compiler; a template literal is not, so
    // every sink is now explicit (`modules/html.ts`) and this is what proves the
    // explicit version did not miss one. A module is the sanitization boundary
    // for its own config (DOC-25 §10.4), and these values arrive as config.
    const { Component } = getModule('contact-form', latestModuleVersion('contact-form')!)
    const html = Component({
      config: {
        action: 'https://forms.example/x',
        submitLabel: 'Send',
        successMessage: '<script>window.__pwned=1</script>',
        fields: [
          { name: 'name', label: '"><img src=x onerror=alert(1)>', type: 'text', required: true },
        ],
      },
      slots: {},
      instanceId: 'esc',
    })
    // No executable markup and no attribute break-out survives. The assertions
    // are on the TAGS, not on the word `onerror`: the escaped text still spells
    // it, which is the point — the payload is present as copy and inert as markup.
    expect(html).not.toMatch(/<script/)
    expect(html).not.toMatch(/<img/)
    // … because both values were escaped rather than dropped: the copy is still
    // there, inert.
    expect(html).toContain('&lt;script&gt;')
    expect(html).toContain('&quot;&gt;&lt;img src=x onerror=alert(1)&gt;')
  })

  it('test_UAT_FC_REQ-148_an_unsafe_endpoint_is_refused_loud', () => {
    // The other half of the same boundary, unchanged by the conversion: a
    // `javascript:` action is not escaped into harmlessness, it is REFUSED
    // (REQ-46). Failing loud is the contract the conformance security dimension
    // credits, so the conversion must not have softened it into an escape.
    const { Component } = getModule('contact-form', latestModuleVersion('contact-form')!)
    expect(() =>
      Component({ config: { action: 'javascript:alert(1)', fields: [] }, slots: {} }),
    ).toThrow()
  })

  it('test_UAT_FC_REQ-148_module_css_is_only_the_invariant_chrome', () => {
    // AC-5. The conversion moved each module's `<style>` block into a real
    // `styles.css` verbatim — it must neither add rules nor entrench the ones
    // REQ-96 is removing. The precompiled constant is therefore exactly the two
    // files, and nothing else.
    const dir = path.join(repoRoot, 'packages/framework/src/modules')
    for (const id of ['contact-form', 'carousel']) {
      const css = readFileSync(path.join(dir, id, 'styles.css'), 'utf8').trim()
      expect(MODULE_CSS).toContain(`/* module: ${id} */\n${css}`)
    }
    // Nothing beyond the two blocks and their headers.
    expect(MODULE_CSS.split('/* module: ')).toHaveLength(3)
    // The aesthetic rules REQ-96 removed have not come back with the move. The
    // pattern anchors on a DECLARATION, not the word: both stylesheets name
    // `flex-basis` in a comment explaining why they do not set it.
    expect(MODULE_CSS).not.toMatch(/^\s*flex-basis\s*:/m)
    expect(MODULE_CSS).not.toMatch(/\.contact-form__field\b/)
  })
})
