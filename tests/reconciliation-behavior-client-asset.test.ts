import { describe, expect, it } from 'vitest'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { JSDOM } from 'jsdom'

import { CATALOG } from '../packages/framework/src/worker'
import { cmdNew, cmdRender } from '../tools/generate/src/cli/commands'
import { composeModuleAssets, scopeBehaviorJs } from '../tools/generate/src/cli/module-assets'

/**
 * Reconciliation UATs for story-179b8c06 (BUNDLE-42 / BUG-75): the composed
 * client-behaviour asset `capabilities.js` must be a valid ES module, with every
 * behavior scoped apart from the others.
 *
 * "Valid" is checked by actually loading the asset as an ES module (a `data:`
 * import). That uses the same module grammar and the same duplicate-binding rule
 * a browser applies, so a text pattern cannot stand in for it.
 */

const REPO_ROOT = path.resolve(__dirname, '..')
const MODULES_DIR = path.join(REPO_ROOT, 'packages/framework/src/modules')

let nonce = 0
/** Load `src` as an ES module. A per-call nonce defeats the module cache so each load runs. */
async function loadAsModule(src: string): Promise<unknown> {
  const body = `${src}\n// load ${++nonce}`
  return import(`data:text/javascript;base64,${Buffer.from(body, 'utf8').toString('base64')}`)
}

/** Catalog ids (deduplicated, in catalog order) whose behavior ships a non-empty client.js. */
function clientBehaviorIdsInCatalogOrder(): string[] {
  const ids: string[] = []
  for (const meta of CATALOG) {
    if (ids.includes(meta.id)) continue
    const file = path.join(MODULES_DIR, meta.id, 'client.js')
    if (existsSync(file) && readFileSync(file, 'utf8').trim()) ids.push(meta.id)
  }
  return ids
}

/** Render a real site whose home page mounts a contact-form, and return its shipped capabilities.js. */
async function renderShippedAsset(): Promise<string> {
  const cwd = mkdtempSync(path.join(tmpdir(), 'bug75-'))
  try {
    cmdNew('acme', { cwd })
    const homePath = path.join(cwd, 'storage', 'sites', 'acme', 'draft', 'pages', 'home.json')
    const home = JSON.parse(readFileSync(homePath, 'utf8'))
    home.modules = [
      {
        id: 'get-in-touch',
        type: 'contact-form',
        version: 4,
        slot: 'get-in-touch',
        config: {
          action: 'https://example.com/submit',
          fields: [{ name: 'email', label: 'Email', type: 'email', required: true }],
        },
        slots: {
          form: {
            kind: 'container',
            layout: 'stack',
            children: [
              { kind: 'control', control: 'email' },
              { kind: 'control', control: 'submit' },
            ],
          },
        },
      },
    ]
    home.l1.root.children.push({ kind: 'slot', name: 'get-in-touch' })
    writeFileSync(homePath, JSON.stringify(home, null, 2))

    const { outDir } = await cmdRender('acme', { cwd })
    const assetPath = path.join(outDir, 'capabilities.js')
    expect(existsSync(assetPath)).toBe(true)
    return readFileSync(assetPath, 'utf8')
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
}

/** Install a JSDOM page (plus the given globals) as the globals a loaded asset sees; returns a restore fn. */
function installGlobals(dom: JSDOM, extra: Record<string, unknown>): () => void {
  const globals: Record<string, unknown> = {
    document: dom.window.document,
    FormData: dom.window.FormData,
    ...extra,
  }
  const saved = new Map<string, PropertyDescriptor | undefined>()
  for (const [key, value] of Object.entries(globals)) {
    saved.set(key, Object.getOwnPropertyDescriptor(globalThis, key))
    Object.defineProperty(globalThis, key, { value, configurable: true, writable: true })
  }
  return () => {
    for (const [key, descriptor] of saved) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor)
      else delete (globalThis as Record<string, unknown>)[key]
    }
  }
}

/** Let pending promise continuations (an async submit handler, a rejected fetch) settle. */
async function flush(): Promise<void> {
  for (let i = 0; i < 10; i++) await new Promise((resolve) => setTimeout(resolve, 0))
}

/** Wait for the page's DOMContentLoaded if it has not fired yet (bounded). */
async function domReady(dom: JSDOM): Promise<void> {
  const doc = dom.window.document
  if (doc.readyState !== 'loading') return
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('DOMContentLoaded never fired')), 2000)
    doc.addEventListener('DOMContentLoaded', () => {
      clearTimeout(timer)
      resolve()
    })
  })
}

describe('story-179b8c06 — the composed client-behaviour asset (BUG-75)', () => {
  it('test_UAT_AC702_shipped_asset_loads_as_an_es_module_with_one_scoped_block_per_behavior_in_catalog_order', async () => {
    // The asset as a real render ships it.
    const shipped = await renderShippedAsset()

    // It loads as an ES module. Before BUG-75 this threw
    // "Identifier 'ERROR_SELECTOR' has already been declared".
    await expect(loadAsModule(shipped)).resolves.toBeDefined()

    // Non-vacuous: the catalog really ships several behaviors' client code.
    const ids = clientBehaviorIdsInCatalogOrder()
    expect(ids.length).toBeGreaterThan(1)
    expect(ids).toEqual(expect.arrayContaining(['contact-form', 'carousel']))

    // Every contributing behavior appears as `/* behavior: <id> */` followed by
    // its own block, in catalog order, and no other behavior marker appears.
    let last = -1
    for (const id of ids) {
      const marker = `/* behavior: ${id} */\n{\n`
      const at = shipped.indexOf(marker)
      expect(at, `marker + block for ${id}`).toBeGreaterThan(last)
      expect(shipped.indexOf(marker, at + 1), `${id} appears once`).toBe(-1)
      last = at
    }
    expect(shipped.match(/\/\* behavior: [^*]+ \*\//g)?.length).toBe(ids.length)

    // No statement-leading `export` survives composition, though the sources export.
    expect(shipped).not.toMatch(/^\s*export\s/m)
    const contactSource = readFileSync(path.join(MODULES_DIR, 'contact-form', 'client.js'), 'utf8')
    expect(contactSource).toMatch(/^export\s/m)

    // The shipped bytes are the composition of the sources (fresh), and fresh alone
    // is not what made them valid: the module load above is the validity check.
    expect(shipped.trim()).toBe(composeModuleAssets(REPO_ROOT).clientJs.trim())
  })

  it('test_UAT_AC2476_behaviors_sharing_a_top_level_name_each_run_against_their_own_value', async () => {
    // ── Part 1: the real catalog, which carries a three-way ERROR_SELECTOR collision ──
    const real = composeModuleAssets(REPO_ROOT).clientJs
    const declarations = real.match(/^const ERROR_SELECTOR = /gm) ?? []
    expect(declarations.length).toBeGreaterThanOrEqual(3)

    // Each colliding behavior's mount carries its OWN error element plus decoys
    // matching the other behaviors' ERROR_SELECTOR values. After a failed request
    // only the element matching that behavior's own value may be revealed.
    const decoys = (except: string) =>
      ['data-contact-error', 'data-account-error', 'data-account-chrome-error']
        .filter((a) => a !== except)
        .map((a) => `<p ${a} hidden></p>`)
        .join('')
    const dom = new JSDOM(`<!doctype html><html><body>
      <div data-contact-form-root id="cf">
        <form data-contact-form action="https://example.com/submit" method="post">
          <input name="email" value="a@example.com">
          <p data-contact-error hidden></p>${decoys('data-contact-error')}
        </form>
      </div>
      <section data-account-portal data-account-src="/api/me" id="ap">
        <p data-account-error hidden></p>${decoys('data-account-error')}
      </section>
      <section data-account-chrome="signed-out" id="ac">
        <button type="button" data-account-chrome-open aria-expanded="true">Sign in</button>
        <form data-account-chrome-dialog action="/api/sign-in" method="post">
          <input type="email" name="email" data-account-chrome-email value="a@example.com">
          <button type="submit">Send</button>
        </form>
        <p data-account-chrome-error hidden></p>${decoys('data-account-chrome-error')}
      </section>
      <section data-carousel data-carousel-autoplay id="car">
        <div class="carousel__track"><div class="carousel__slide"></div><div class="carousel__slide"></div></div>
      </section>
    </body></html>`)
    const doc = dom.window.document

    // Thin mocks at the external boundaries: the network never answers, and the
    // timer is recorded rather than run.
    const fetchCalls: string[] = []
    const timers: number[] = []
    const restore = installGlobals(dom, {
      fetch: (url: string) => {
        fetchCalls.push(String(url))
        return Promise.reject(new TypeError('network down'))
      },
      setInterval: (_fn: () => void, ms: number) => {
        timers.push(ms)
        return 0
      },
    })
    try {
      await loadAsModule(real)
      await domReady(dom)
      await flush()

      // carousel (no colliding names) ran: its autoplay timer was scheduled.
      expect(timers.length).toBe(1)
      // account-chrome ran: it took over and folded its form away.
      const chrome = doc.getElementById('ac')!
      expect(chrome.hasAttribute('data-account-chrome-enhanced')).toBe(true)
      expect(chrome.querySelector('[data-account-chrome-open]')!.getAttribute('aria-expanded')).toBe('false')
      // account-portal ran: it requested its account and, on failure, revealed ITS error only.
      expect(fetchCalls).toContain('/api/me')
      const portal = doc.getElementById('ap')!
      expect((portal.querySelector('[data-account-error]') as HTMLElement).hidden).toBe(false)
      expect((portal.querySelector('[data-contact-error]') as HTMLElement).hidden).toBe(true)
      expect((portal.querySelector('[data-account-chrome-error]') as HTMLElement).hidden).toBe(true)

      // contact-form: a submit that cannot reach the server reveals ITS error only.
      const cfForm = doc.querySelector('form[data-contact-form]')!
      cfForm.dispatchEvent(new dom.window.Event('submit', { cancelable: true }))
      await flush()
      expect(fetchCalls).toContain('https://example.com/submit')
      expect((cfForm.querySelector('[data-contact-error]') as HTMLElement).hidden).toBe(false)
      expect((cfForm.querySelector('[data-account-error]') as HTMLElement).hidden).toBe(true)
      expect((cfForm.querySelector('[data-account-chrome-error]') as HTMLElement).hidden).toBe(true)

      // account-chrome: the same, against its own value.
      chrome.querySelector('form')!.dispatchEvent(new dom.window.Event('submit', { cancelable: true }))
      await flush()
      expect(fetchCalls).toContain('/api/sign-in')
      expect((chrome.querySelector('[data-account-chrome-error]') as HTMLElement).hidden).toBe(false)
      expect((chrome.querySelector('[data-contact-error]') as HTMLElement).hidden).toBe(true)
      expect((chrome.querySelector('[data-account-error]') as HTMLElement).hidden).toBe(true)
    } finally {
      restore()
      dom.window.close()
    }

    // ── Part 2: two synthetic behaviors declaring the same top-level const, plus a third ──
    // Each initialises by marking its own mount with the value of its own `MARK`.
    const behavior = (id: string, decl: string) =>
      scopeBehaviorJs(
        id,
        `${decl}\nexport function init() {\n` +
          `  document.querySelector('[data-mount="${id}"]').setAttribute('data-ran', MARK)\n}\n` +
          `if (typeof document !== 'undefined') init()`,
      )
    const alpha = behavior('alpha', "const MARK = 'alpha-own'")
    const beta = behavior('beta', "const MARK = 'beta-own'")
    // The third's own private name collides with nothing.
    const gamma = behavior('gamma', "const GAMMA_ONLY = 'gamma-own'\nlet MARK = GAMMA_ONLY")
    const composed = [alpha, beta, gamma].join('\n\n')

    const fixture = new JSDOM(
      '<!doctype html><body><div data-mount="alpha"></div><div data-mount="beta"></div><div data-mount="gamma"></div></body>',
    )
    const restoreFixture = installGlobals(fixture, {})
    try {
      await expect(loadAsModule(composed)).resolves.toBeDefined()
      const d = fixture.window.document
      expect(d.querySelector('[data-mount="alpha"]')!.getAttribute('data-ran')).toBe('alpha-own')
      expect(d.querySelector('[data-mount="beta"]')!.getAttribute('data-ran')).toBe('beta-own')
      expect(d.querySelector('[data-mount="gamma"]')!.getAttribute('data-ran')).toBe('gamma-own')
    } finally {
      restoreFixture()
      fixture.window.close()
    }

    // Non-vacuous: the same names spliced into one scope do not even parse.
    await expect(
      loadAsModule("const MARK = 'alpha-own'\nconst MARK = 'beta-own'"),
    ).rejects.toThrow(/already been declared/)
  })
})
