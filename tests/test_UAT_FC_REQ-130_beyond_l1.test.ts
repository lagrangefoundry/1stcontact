/**
 * REQ-130 — **everything a real site carries that is not the element tree**.
 *
 * REQ-129 closed the L1 half of authoring. What remained was measurable and had
 * one cause per row: `storage/sites/xgd` needs a palette and a theme (both
 * objects, and `set_config`'s value was typed `string`), a `contact-form`
 * instance on two pages (nothing declared touched `modules`), `seoMeta` per page
 * (nothing wrote it), and four generated marks (`add_asset` takes a file path).
 *
 * The four are tested as the ticket states them, plus the two invariants it
 * requires be demonstrated rather than assumed:
 *
 * - the operator's click-to-edit modal still works, including inside a component
 *   the assistant instantiated;
 * - the generated-image channel is closed by CONTENT, not by extension — which
 *   is the one part of this ticket that widens the attack surface, so it carries
 *   the most evidence.
 *
 * Nothing here mocks `edit.ts` or stubs the Toolbox. The draft on disk and the
 * rendered bytes are the only evidence that counts.
 */

import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync, existsSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { cmdNew, cmdRender, startBuilder, type BuilderHandle } from '../tools/generate/src/cli'
import {
  createL1Toolbox,
  l1Operations,
  nodeOperations,
  L1_DECLARATION,
  L1_INSTANCES,
} from '../tools/generate/src/cli/ai/toolbox'
// By path rather than by package name: the workspace links live under each
// package, and a suite at the repo root resolves neither. Every other test here
// reaches source the same way.
import { validateSvg } from '../packages/site-schema/src/svg'
import { fsOpts } from './support/site-factory'

const SLUG = 'studio'

let cwd: string

const draftDir = (): string => path.join(cwd, 'storage', 'sites', SLUG, 'draft')
const sitePath = (): string => path.join(draftDir(), 'site.json')
const pagePath = (page = 'home'): string => path.join(draftDir(), 'pages', `${page}.json`)

function readSite(): Record<string, any> {
  return JSON.parse(readFileSync(sitePath(), 'utf8'))
}
function readPage(page = 'home'): Record<string, any> {
  return JSON.parse(readFileSync(pagePath(page), 'utf8'))
}

/**
 * Put a mounting seam on the starter page.
 *
 * A component mounts at a `slot` node, and the scaffold has none — the schema
 * enforces the binding, so this is what a session would do with `set_l1` before
 * calling `add_component`. Seeded directly here so the component suite measures
 * instantiation rather than re-measuring REQ-129's write path.
 */
function seedSlot(name = 'signup-form'): void {
  const page = readPage()
  page.l1.root.children.push({ kind: 'slot', name, behavior: 'contact-form' })
  writeFileSync(pagePath(), JSON.stringify(page, null, 2))
}

/** A read's payload, with the provenance markers a consumer strips after reading them. */
function unwrap(answer: string): string {
  return answer.replace(/^<<<untrusted>>>\n/, '').replace(/\n<<<\/untrusted>>>$/, '')
}

interface Box {
  run: (tool: string, input: Record<string, unknown>) => Promise<string>
  toolNames: () => string[]
  manual: () => string
}

function caretaker(): Promise<Box> {
  return createL1Toolbox(SLUG, { cwd })
}

async function json<T>(
  box: Box,
  tool: string,
  input: Record<string, unknown> = {},
): Promise<T> {
  return JSON.parse(unwrap(await box.run(tool, input))) as T
}

function fresh(prefix: string): void {
  cwd = mkdtempSync(path.join(tmpdir(), prefix))
  cmdNew(SLUG, { cwd })
}

/**
 * The XGD palette the ticket names — warm bone and petrol teal. An object of
 * objects, which is the shape the `string` parameter could not carry.
 *
 * REQ-137 deleted the named `steps` each family used to hold: an entry is one
 * colour, and its light↔dark family comes off the reference's `shade`.
 */
const XGD_PALETTE = {
  surface: { value: '#f7f4ed' },
  'surface-raised': { value: '#fffdf8' },
  ink: { value: '#101822' },
  primary: { value: '#2e86a3' },
}

// ── 1. structured config ─────────────────────────────────────────────────────

describe('REQ-130 — settings are structured values, not strings', () => {
  beforeEach(() => fresh('req130-config-'))
  afterEach(() => rmSync(cwd, { recursive: true, force: true }))

  it('test_UAT_FC_REQ_130_writes_a_whole_palette_in_one_call', async () => {
    const box = await caretaker()

    // The ticket's first acceptance case. Before this the `value` parameter was
    // declared `string`, so a palette family — an object of objects — had no
    // shape that could carry it, and the only thing that worked was a JSON
    // document smuggled through a string parameter and re-read downstream.
    const answer = await box.run('set_config', { key: 'palette', settings: XGD_PALETTE })
    expect(answer).not.toContain('SCHEMA_INVALID')

    expect(readSite().palette).toEqual(XGD_PALETTE)

    // And the site still validates as a whole — the palette shape was already
    // described by `siteSchema`, which is why nothing new is validated here.
    const theme = { typography: { baseSizePx: 17 } }
    await box.run('set_config', { key: 'theme', settings: theme })
    expect(readSite().theme.typography.baseSizePx).toBe(17)
  })

  it('test_UAT_FC_REQ_130_naming_one_setting_leaves_its_siblings_alone', async () => {
    const box = await caretaker()
    await box.run('set_config', { key: 'palette', settings: XGD_PALETTE })

    // The property that makes an object-valued write safe rather than dangerous.
    // Under replace-at-key semantics this call would delete `ink` and `surface`,
    // and nothing would say so until someone looked at the site.
    await box.run('set_config', { key: 'palette', settings: { primary: { value: '#1d5f77' } } })

    const palette = readSite().palette
    expect(palette.primary.value).toBe('#1d5f77')
    expect(palette.ink).toEqual(XGD_PALETTE.ink)
    expect(palette.surface).toEqual(XGD_PALETTE.surface)
    expect(palette['surface-raised']).toEqual(XGD_PALETTE['surface-raised'])

    // Merged at every depth, not just the first. A palette entry is one colour
    // deep since REQ-137, so the deeper case is shown where the depth actually
    // lives: naming one typography field leaves the rest of the group standing.
    const before = readSite().theme.typography
    await box.run('set_config', { key: 'theme', settings: { typography: { baseSizePx: 19 } } })
    const after = readSite().theme.typography
    expect(after.baseSizePx).toBe(19)
    expect({ ...after, baseSizePx: before.baseSizePx }).toEqual(before)
  })

  it('test_UAT_FC_REQ_130_writes_nav_entries_the_conversation_could_not_reach', async () => {
    const box = await caretaker()

    // The failure that produced this ticket: the assistant could not add a nav
    // entry, because an entry is an object in a list and the parameter was a
    // string. A list replaces rather than merges — there is no sane merge of two
    // ordered lists — which is why the whole set is sent.
    const entries = [
      { label: 'How it works', target: { kind: 'anchor', pageId: 'home', moduleId: 'how' } },
      { label: 'Home', target: { kind: 'page', pageId: 'home' } },
    ]
    const answer = await box.run('set_config', {
      key: 'nav',
      settings: { pattern: 'in-page-anchors', entries },
    })
    // Asserted before the state, so a refusal cannot pass as "nothing changed".
    expect(answer).not.toContain('SCHEMA_INVALID')

    const nav = readSite().nav
    expect(nav.pattern).toBe('in-page-anchors')
    expect(nav.entries).toEqual(entries)
  })

  it('test_UAT_FC_REQ_130_a_setting_the_site_does_not_accept_is_refused_whole', async () => {
    const box = await caretaker()
    const before = readFileSync(sitePath(), 'utf8')

    // Widening the parameter must not widen what the site accepts. The shared
    // validator runs over the whole resulting definition exactly as before, so a
    // structured value is checked as strictly as a scalar ever was.
    expect(await box.run('set_config', { key: 'nav', settings: { pattern: 'carousel' } })).toContain(
      'SCHEMA_INVALID',
    )
    expect(await box.run('set_config', { key: 'palette', settings: { ink: { value: 'red' } } })).toContain(
      'SCHEMA_INVALID',
    )
    expect(readFileSync(sitePath(), 'utf8')).toBe(before)
  })
})

// ── 2. component instantiation ───────────────────────────────────────────────

const SIGNUP_CONFIG = {
  action: '/api/lead',
  fields: [
    { name: 'email', label: 'Email address', labelMode: 'placeholder', type: 'email', required: true },
  ],
  submitLabel: 'Join the waitlist',
}

describe('REQ-130 — components are instantiated, never authored', () => {
  beforeEach(() => {
    fresh('req130-module-')
    seedSlot()
  })
  afterEach(() => rmSync(cwd, { recursive: true, force: true }))

  it('test_UAT_FC_REQ_130_the_catalog_is_closed_and_says_what_a_component_needs', async () => {
    const box = await caretaker()
    const { behaviors } = await json<{ behaviors: any[] }>(box, 'list_behaviors')

    const form = behaviors.find((b) => b.type === 'contact-form')
    expect(form).toBeDefined()
    // The contract, in the shape a caller needs to get the first call right:
    // which settings are required, and what a field entry accepts.
    expect(form.config.action.required).toBe(true)
    expect(form.config.fields.items.type.values).toContain('email')
    expect(form.hasDefaultPresentation).toBe(true)

    // The module's invariant elements are its own to paint (DOC-25 §10.3), so
    // offering them here would invite a caller to bind one and be refused for a
    // reason that reads as a bug.
    expect(Object.keys(form.controls)).not.toContain('honeypot')
    expect(Object.keys(form.controls)).not.toContain('turnstile')

    // Authoring a NEW kind is development with a vetting bar, so the catalog is
    // closed and a miss says what it holds rather than inventing an instance.
    const refused = await box.run('add_component', {
      page: 'home',
      name: 'x',
      behavior: 'payments',
      slot: 'signup-form',
      config: {},
    })
    expect(refused).toContain('NOT_FOUND')
  })

  it('test_UAT_FC_REQ_130_adds_a_form_that_validates_and_renders', async () => {
    const box = await caretaker()

    // The ticket's second acceptance case, in one call — because L2 supplies the
    // look from the config, and the look is then ordinary L1.
    const answer = await box.run('add_component', {
      page: 'home',
      name: 'signup',
      behavior: 'contact-form',
      slot: 'signup-form',
      config: SIGNUP_CONFIG,
    })
    expect(answer).not.toContain('SCHEMA_INVALID')

    const instance = readPage().modules[0]
    expect(instance).toMatchObject({ id: 'signup', type: 'contact-form', slot: 'signup-form' })
    expect(instance.config.action).toBe('/api/lead')
    // The presentation is real L1, not a placeholder: the field's control node
    // is what the module binds its attribute bundle to.
    expect(JSON.stringify(instance.slots.form)).toContain('"control":"email"')

    // Evidence that it is a working form and not a validated record: the module
    // is the sole `<form>` sink, so a rendered form means the instance mounted.
    const { outDir } = await cmdRender(SLUG, { cwd })
    const html = readFileSync(path.join(outDir, 'index.html'), 'utf8')
    expect(html).toMatch(/<form[^>]+action="\/api\/lead"/)
    expect(html).toMatch(/type="email"/)
  }, 120000)

  it('test_UAT_FC_REQ_130_a_component_missing_a_required_setting_is_refused', async () => {
    const box = await caretaker()
    const before = readFileSync(pagePath(), 'utf8')

    // `config` is checked against the behavior's OWN declared contract, not just
    // the site schema — which is the whole reason a caller can be handed a
    // component to configure at all.
    const answer = await box.run('add_component', {
      page: 'home',
      name: 'signup',
      behavior: 'contact-form',
      slot: 'signup-form',
      config: { fields: SIGNUP_CONFIG.fields },
    })
    expect(answer).toContain('SCHEMA_INVALID')
    expect(readFileSync(pagePath(), 'utf8')).toBe(before)
  })

  it('test_UAT_FC_REQ_130_configures_and_removes_an_instance', async () => {
    const box = await caretaker()
    await box.run('add_component', {
      page: 'home',
      name: 'signup',
      behavior: 'contact-form',
      slot: 'signup-form',
      config: SIGNUP_CONFIG,
    })

    // Merged, like a settings group: changing the button's words must not lose
    // the endpoint the form posts to.
    await box.run('configure_component', {
      page: 'home',
      name: 'signup',
      config: { submitLabel: 'Get early access' },
    })
    const config = readPage().modules[0].config
    expect(config.submitLabel).toBe('Get early access')
    expect(config.action).toBe('/api/lead')
    expect(config.fields).toHaveLength(1)

    // The page map is where a caller sees what is already there.
    const map = await json<{ components: any[] }>(box, 'describe_page', { page: 'home' })
    expect(map.components).toHaveLength(1)
    expect(map.components[0]).toMatchObject({ id: 'signup', type: 'contact-form', slot: 'signup-form' })

    await box.run('remove_component', { page: 'home', name: 'signup' })
    expect(readPage().modules).toEqual([])
    // The seam survives its occupant, so another component can go there.
    expect(JSON.stringify(readPage().l1.root)).toContain('"name":"signup-form"')
  })
})

// ── 3. page metadata ─────────────────────────────────────────────────────────

describe('REQ-130 — a page can describe itself to a search engine', () => {
  beforeEach(() => fresh('req130-seo-'))
  afterEach(() => rmSync(cwd, { recursive: true, force: true }))

  it('test_UAT_FC_REQ_130_seo_metadata_is_written_on_add_and_merged_on_update', async () => {
    const box = await caretaker()

    await box.run('add_page', {
      page: 'about',
      title: 'About',
      seo: { title: 'About XGD', description: 'Who builds it and why.' },
    })
    expect(readPage('about').seoMeta).toEqual({
      title: 'About XGD',
      description: 'Who builds it and why.',
    })

    // Merged: an operator asking for a better description must not lose the
    // title they already have.
    await box.run('update_page', { page: 'about', seo: { description: 'The people behind XGD.' } })
    expect(readPage('about').seoMeta).toEqual({
      title: 'About XGD',
      description: 'The people behind XGD.',
    })
  })

  it('test_UAT_FC_REQ_130_seo_metadata_reaches_the_rendered_page', async () => {
    const box = await caretaker()
    await box.run('update_page', {
      page: 'home',
      seo: { title: 'XGD — AI writes it.', description: 'A living spec of intended behaviour.' },
    })

    // The reason it is worth a parameter at all: it is the only page-level
    // content nothing else on the surface could write, and it is visible.
    const { outDir } = await cmdRender(SLUG, { cwd })
    const html = readFileSync(path.join(outDir, 'index.html'), 'utf8')
    expect(html).toContain('<title>XGD — AI writes it.</title>')
    expect(html).toMatch(/name="description"[^>]*content="A living spec of intended behaviour\."/)
  }, 120000)
})

// ── 4. generated images: the closed grammar ──────────────────────────────────

const MARK = [
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">',
  '<title>Wireframe mark</title>',
  '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">',
  '<stop offset="0" stop-color="#2e86a3"/><stop offset="1" stop-color="#7fc3d6"/>',
  '</linearGradient></defs>',
  '<rect x="4" y="4" width="40" height="40" rx="6" fill="url(#g)"/>',
  '<path d="M12 34 L24 14 L36 34 Z" fill="none" stroke="#f7f4ed" stroke-width="2"/>',
  '</svg>',
].join('')

/**
 * Every shape the validator exists to refuse. Each is legal SVG that a browser
 * would honour, and each is a stored-XSS or exfiltration vector once the bytes
 * are composed by a model rather than placed by a person.
 */
const HOSTILE: Array<[string, string]> = [
  ['a script element', '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'],
  ['an event handler', '<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"><rect/></svg>'],
  [
    'an event handler on a shape',
    '<svg xmlns="http://www.w3.org/2000/svg"><circle cx="1" cy="1" r="1" onclick="alert(1)"/></svg>',
  ],
  [
    'embedded HTML',
    '<svg xmlns="http://www.w3.org/2000/svg"><foreignObject><p>hi</p></foreignObject></svg>',
  ],
  [
    'an external reference',
    '<svg xmlns="http://www.w3.org/2000/svg"><image href="https://evil.example/x.png"/></svg>',
  ],
  [
    'a linked use element',
    '<svg xmlns="http://www.w3.org/2000/svg"><use xlink:href="https://evil.example/x#y"/></svg>',
  ],
  ['a stylesheet', '<svg xmlns="http://www.w3.org/2000/svg"><style>*{x:y}</style></svg>'],
  [
    'raw CSS in a style attribute',
    '<svg xmlns="http://www.w3.org/2000/svg"><rect style="background:url(https://evil.example/x)"/></svg>',
  ],
  [
    'an external paint reference',
    '<svg xmlns="http://www.w3.org/2000/svg"><rect fill="url(https://evil.example/x#g)"/></svg>',
  ],
  [
    'an entity declaration',
    '<!DOCTYPE svg [<!ENTITY x SYSTEM "file:///etc/passwd">]><svg xmlns="http://www.w3.org/2000/svg"><title>&x;</title></svg>',
  ],
  [
    'an escaped script',
    '<svg xmlns="http://www.w3.org/2000/svg"><title>&#x3c;script&#x3e;</title></svg>',
  ],
  [
    'an escaped script behind an allowed entity',
    '<svg xmlns="http://www.w3.org/2000/svg"><text x="&amp;&#x3c;script&#x3e;">hi</text></svg>',
  ],
  [
    'an external paint reference behind an allowed entity',
    '<svg xmlns="http://www.w3.org/2000/svg"><rect fill="&amp;url&#x28;http://evil.example/x&#x29;"/></svg>',
  ],
  [
    'a CDATA section',
    '<svg xmlns="http://www.w3.org/2000/svg"><title><![CDATA[<script>alert(1)</script>]]></title></svg>',
  ],
  ['an unquoted attribute', '<svg xmlns="http://www.w3.org/2000/svg"><rect onload=alert(1)/></svg>'],
  ['a link', '<svg xmlns="http://www.w3.org/2000/svg"><a href="javascript:alert(1)"><rect/></a></svg>'],
  ['no svg root at all', '<html><body>hi</body></html>'],
]

describe('REQ-130 — the generated image is closed by content, not by extension', () => {
  beforeEach(() => fresh('req130-image-'))
  afterEach(() => rmSync(cwd, { recursive: true, force: true }))

  it('test_UAT_FC_REQ_130_a_drawing_is_written_and_referenced_from_a_page', async () => {
    const box = await caretaker()

    const written = await json<{ asset: { id: string; src: string } }>(box, 'write_image', {
      name: 'wordmark',
      svg: MARK,
      alt: 'The XGD wireframe mark',
    })
    expect(written.asset.id).toBe('wordmark.svg')
    // The handle it hands back is the one an L1 image node takes, so a caller
    // can use the answer directly rather than composing a path.
    expect(written.asset.src).toBe('/assets/wordmark.svg')
    expect(readFileSync(path.join(draftDir(), 'assets', 'wordmark.svg'), 'utf8')).toBe(MARK)

    // It is a first-class asset: the listing every picker reads reports it.
    const listed = await json<{ assets: { src: string; kind: string }[] }>(box, 'list_assets')
    expect(listed.assets.find((a) => a.src === '/assets/wordmark.svg')?.kind).toBe('image')

    // ...and it reaches the page through the ordinary L1 write path.
    const root = (await json<{ node: any }>(box, 'get_l1', { page: 'home', path: '0' })).node
    await box.run('set_l1', {
      page: 'home',
      path: '0',
      node: {
        ...root,
        children: [{ kind: 'image', src: '/assets/wordmark.svg', alt: 'The XGD wireframe mark' }],
      },
    })
    // Emitted document-relative, as every asset reference is: a published
    // snapshot holds no absolute self-reference, which is what makes it
    // content-addressable and relocatable (DOC-12 §7).
    const { outDir } = await cmdRender(SLUG, { cwd })
    expect(readFileSync(path.join(outDir, 'index.html'), 'utf8')).toMatch(
      /<img[^>]+src="assets\/wordmark\.svg"/,
    )
    // ...and the bytes shipped with it, unaltered — the drawing is an asset, not
    // a special case the renderer has to know about.
    expect(readFileSync(path.join(outDir, 'assets', 'wordmark.svg'), 'utf8')).toBe(MARK)
  }, 120000)

  it('test_UAT_FC_REQ_130_every_executable_svg_is_refused_and_no_byte_is_written', async () => {
    const box = await caretaker()
    const assetsDir = path.join(draftDir(), 'assets')
    const before = readFileSync(sitePath(), 'utf8')

    // The ticket's fourth acceptance case, and the reason this capability was
    // allowed to ship at all. Each of these is legal SVG that a browser honours,
    // served same-origin from the site's own /assets/ — so the renderer's
    // URL-scheme allowlist neither applies nor helps.
    for (const [what, hostile] of HOSTILE) {
      const answer = await box.run('write_image', { name: 'attack', svg: hostile })
      expect(answer, what).toContain('SCHEMA_INVALID')
    }

    // A refusal is never a partial write, and never leaves a file behind.
    expect(existsSync(assetsDir) ? readdirSync(assetsDir) : []).toEqual([])
    expect(readFileSync(sitePath(), 'utf8')).toBe(before)
  })

  it('test_UAT_FC_REQ_130_the_grammar_refuses_what_it_does_not_recognise', async () => {
    // The property that makes the allowlist worth having: there is no
    // skip-what-we-do-not-know branch, so a construct nobody anticipated is a
    // refusal rather than a pass. Tested at the validator, because that is where
    // the closure lives and a sample of payloads cannot demonstrate it.
    expect(validateSvg(MARK).ok).toBe(true)
    for (const [what, hostile] of HOSTILE) {
      expect(validateSvg(hostile).ok, what).toBe(false)
    }
    // Bounded, like L1's own envelope: a document that renders is not the same
    // as a document that renders quickly.
    const huge = `<svg xmlns="http://www.w3.org/2000/svg">${'<rect x="0"/>'.repeat(5000)}</svg>`
    expect(validateSvg(huge).ok).toBe(false)
    expect(
      validateSvg(`<svg xmlns="http://www.w3.org/2000/svg">${'x'.repeat(70000)}</svg>`).ok,
    ).toBe(false)

    // A real diagram sits well inside both caps, and the scan is a single pass
    // over the source — so being close to the limit is not itself a refusal.
    const detailed = `<svg xmlns="http://www.w3.org/2000/svg">${'<rect x="1"/>'.repeat(1500)}</svg>`
    expect(validateSvg(detailed).ok).toBe(true)
  })

  it('test_UAT_FC_REQ_130_an_allowed_entity_does_not_vouch_for_the_ones_after_it', async () => {
    // The rule is per-`&`, not per-value. A check that looked only at the first
    // `&` would let one legitimate entity stand surety for every entity behind
    // it — and the payload that exploits it is not the obvious one. `&#x28;` and
    // `&#x29;` are `(` and `)`, so `fill="&amp;url&#x28;…&#x29;"` carries no
    // literal `(` for the reference guard to see; the external reference only
    // exists after the browser decodes it.
    for (const smuggled of [
      '<svg xmlns="http://www.w3.org/2000/svg"><text x="&amp;&#x3c;script&#x3e;">hi</text></svg>',
      '<svg xmlns="http://www.w3.org/2000/svg"><rect fill="&amp;url&#x28;http://evil.example/x&#x29;"/></svg>',
      '<svg xmlns="http://www.w3.org/2000/svg"><rect clip-path="&quot;&#x75;rl(#a)"/></svg>',
    ]) {
      expect(validateSvg(smuggled).ok, smuggled).toBe(false)
    }

    // ...and the rule stays a rule rather than a ban: a document whose every `&`
    // opens one of the five XML entities is still a document that passes, in an
    // attribute value as much as in character data.
    expect(validateSvg('<svg xmlns="http://www.w3.org/2000/svg"><title>Bea &amp; Co</title></svg>').ok).toBe(
      true,
    )
    expect(
      validateSvg(
        '<svg xmlns="http://www.w3.org/2000/svg"><text font-family="Bea &amp; Co &amp; Sons">hi</text></svg>',
      ).ok,
    ).toBe(true)
  })

  it('test_UAT_FC_REQ_130_the_filename_is_generated_and_never_taken_from_the_caller', async () => {
    const box = await caretaker()

    // Not a file-write primitive pointed at a directory: there is no path to
    // traverse because there is no path, and the one extension is the one text
    // format a model can actually produce.
    for (const name of ['../../etc/passwd', 'a/b', 'mark.png', '.hidden', 'Mark Two']) {
      expect(await box.run('write_image', { name, svg: MARK }), name).toContain('SCHEMA_INVALID')
    }

    // An existing name is a conflict rather than a silent overwrite; replacing
    // one is a deliberate act.
    await box.run('write_image', { name: 'wordmark', svg: MARK })
    expect(await box.run('write_image', { name: 'wordmark', svg: MARK })).toContain('CONFLICT')

    const redrawn = MARK.replace('#2e86a3', '#1d5f77')
    await box.run('write_image', { name: 'wordmark', svg: redrawn, replace: true })
    expect(readFileSync(path.join(draftDir(), 'assets', 'wordmark.svg'), 'utf8')).toBe(redrawn)
  })
})

// ── the surface stays in correspondence with itself ──────────────────────────

describe('REQ-130 — declaration, implementation and grant agree', () => {
  beforeEach(() => fresh('req130-surface-'))
  afterEach(() => rmSync(cwd, { recursive: true, force: true }))

  it('test_UAT_FC_REQ_130_every_declared_operation_is_implemented_and_granted', async () => {
    const declared = (L1_DECLARATION.operations as { op: string }[]).map((o) => o.op)
    for (const op of [
      'list_behaviors',
      'add_component',
      'configure_component',
      'remove_component',
      'write_image',
    ]) {
      expect(declared).toContain(op)
    }
    // A method with no declaration is a capability nothing documents, validates
    // or audits; a declaration with no method is a startup failure on an
    // operator's machine with a turn in flight.
    // Both halves — the agnostic core and the two operations that need a disk
    // (REQ-146). Node's surface is their union.
    const opsUnion = {
      ...l1Operations(SLUG, fsOpts(cwd)),
      ...nodeOperations(SLUG, fsOpts(cwd)),
    }
    expect(Object.keys(opsUnion).sort()).toEqual([...declared].sort())

    const groups = (L1_DECLARATION.groups as { group: string }[]).map((g) => g.group)
    const granted = (L1_INSTANCES.caretaker as { l1: { groups: string[] } }).l1.groups
    for (const group of granted) expect(groups).toContain(group)
    expect(granted).toEqual(expect.arrayContaining(['ManageComponents', 'DrawImages']))

    const box = await caretaker()
    expect(box.toolNames()).toEqual(
      expect.arrayContaining(['add_component', 'write_image', 'list_behaviors']),
    )
    // Drawing is its own capability precisely so it can be withheld; the manual
    // has to describe what it refuses, or the model learns by being refused.
    expect(box.manual()).toMatch(/no script, no event handler/i)
  })

  it('test_UAT_FC_REQ_130_the_surface_states_what_it_still_cannot_do', async () => {
    const box = await caretaker()
    const manual = box.manual()

    // An absence is what stops the model flailing at a wall. Drawing an image is
    // now possible and uploading one is not, which is a distinction fine enough
    // that leaving it implicit would guarantee the wrong conclusion.
    expect(manual).toMatch(/cannot take a file from a conversation/i)
    expect(manual).toMatch(/new one is built by a developer/i)
  })
})

// ── the operator's editor is untouched ───────────────────────────────────────

/**
 * The invariant the ticket requires be PROVEN: a page carrying a component the
 * ASSISTANT instantiated must behave in the click-to-edit modal exactly as a
 * hand-authored one does. Module slots are L1 subtrees and `pageSegments`
 * already walks them, so copy inside an AI-added form has to stay clickable —
 * "has to" is the claim, and the claim is what gets tested, over the same
 * `/api/copy` transport the browser uses.
 */
describe('REQ-130 — the modal still reaches copy inside an AI-added component', () => {
  let builder: BuilderHandle

  beforeAll(async () => {
    fresh('req130-modal-')
    seedSlot()
    const box = await caretaker()
    await box.run('add_component', {
      page: 'home',
      name: 'signup',
      behavior: 'contact-form',
      slot: 'signup-form',
      config: {
        ...SIGNUP_CONFIG,
        fields: [{ name: 'email', label: 'Email address', type: 'email', required: true }],
      },
    })
    builder = await startBuilder({ cwd })
  }, 180000)

  afterAll(async () => {
    await builder?.close()
    if (cwd) rmSync(cwd, { recursive: true, force: true })
  })

  it('test_UAT_FC_REQ_130_copy_inside_the_component_is_addressable_and_editable', async () => {
    const box = await caretaker()

    // The map is the modal's own idea of where things are, and it must reach
    // inside the instance the assistant created.
    const map = await json<{ segments: { path: string; kind: string; module?: string; slot?: string }[] }>(
      box,
      'describe_page',
      { page: 'home' },
    )
    const inside = map.segments.filter((s) => s.module === 'signup')
    expect(inside.length).toBeGreaterThan(0)

    const label = inside.find((s) => s.kind === 'text')
    expect(label, 'the visible field label is a text run inside the slot').toBeDefined()

    const url = new URL(
      `/api/copy?slug=${SLUG}&page=home&path=${label!.path}&module=signup&slot=${label!.slot}`,
      builder.url,
    )
    const read = (await (await fetch(url)).json()) as {
      kind: string
      values: Record<string, string>
    }
    expect(read.kind).toBe('text')

    const saved = await fetch(new URL('/api/copy', builder.url), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        slug: SLUG,
        page: 'home',
        path: label!.path,
        module: 'signup',
        slot: label!.slot,
        values: { text: 'Your work email' },
      }),
    })
    expect(saved.status).toBe(200)
    expect(JSON.stringify(readPage().modules[0].slots.form)).toContain('Your work email')
  })
})
