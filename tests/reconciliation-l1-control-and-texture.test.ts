/**
 * Reconciliation UATs — story-d0a8cfad "L1 layout substrate rendered safe by
 * construction", the criteria added by the REQ-96 control-leaf inversion and the
 * REQ-103 texture / radial-gradient upgrade.
 *
 *   AC-806  a control leaf renders the module's element painted entirely by L1
 *   AC-807  the safety envelope survives the L1-wraps-module inversion
 *   AC-829  a node paints a repeating texture from a typed axis with no asset
 *   AC-830  a gradient is linear or radial and the branches cannot be mixed
 *   AC-831  texture composes with fill, gradient, scrim and image in layer order
 *   AC-832  the envelope bounds the texture through the shared surface check
 *
 * The story's other criteria are pinned in `reconciliation-l1-substrate.test.ts`
 * (AC-682/683/684/685/686/687/688/723), `reconciliation-l1-language.test.ts`
 * (AC-725/726/727/728) and `reconciliation-l1-shared-axis-groups.test.ts`
 * (AC-801…AC-805); this file covers only the ones those three do not. Every probe
 * here is engine-free — the schema, the envelope validator and the sole emitter
 * are all pure.
 */
import { describe, expect, it } from 'vitest'
import { readFileSync, globSync } from 'node:fs'
import {
  l1GradientSchema,
  l1NodeSchema,
  l1PatternSchema,
  validateL1,
  type L1Document,
  type L1Node,
  type L1SurfaceAxes,
} from '../packages/site-schema/src/index'
import {
  renderL1Document,
  renderL1Fragment,
  type L1ControlElement,
} from '../packages/framework/src/index'
import { contactFormControls, controlId } from '../packages/framework/src/modules/contact-form/controls'
import { assertSafeUrl, ContentSafetyError } from '../packages/framework/src/modules/safety'

const WIDTHS = [320, 768, 1440]

// ── shared probes ─────────────────────────────────────────────────────────────

/**
 * The declarations of one class's **axis** rule — the last un-media-queried rule
 * for that selector (a node with geometry emits its position rule for the same
 * selector first; the axis rule the emitter builds is always last). The `\s*\{`
 * tail keeps `::placeholder` / `:focus-visible` rules for the same class out.
 */
function baseDecls(css: string, cls: string): string[] {
  const head = css.split('@media')[0]
  const rules = [...head.matchAll(new RegExp(`\\.${cls}\\s*\\{([^}]*)\\}`, 'g'))]
  const last = rules[rules.length - 1]
  return last ? last[1].split(';').map((d) => d.trim()).filter(Boolean) : []
}

/** One declaration's value by property name (`background-image`), or undefined. */
function decl(decls: string[], prop: string): string | undefined {
  return decls.find((d) => d.startsWith(`${prop}:`))?.slice(prop.length + 1).trim()
}

/** The class of the first element rendered with `tag` (the emitter puts it first). */
function tagClass(html: string, tag: string): string {
  const m = new RegExp(`<${tag} class="([^"]+)"`).exec(html)
  expect(m, `a <${tag}> rendered carrying an L1 class`).toBeTruthy()
  return m![1]
}

/** The class of the rendered element carrying `id`. */
function classOf(html: string, id: string): string {
  const m = new RegExp(`<\\w+ class="([^"]+)" id="${id}"`).exec(html)
  expect(m, `an element with id="${id}" rendered`).toBeTruthy()
  return m![1]
}

/** Split a comma-separated CSS list, respecting `fn(a, b)` nesting. */
function commaList(value: string): string[] {
  const out: string[] = []
  let depth = 0
  let cur = ''
  for (const ch of value) {
    if (ch === '(') depth++
    if (ch === ')') depth--
    if (ch === ',' && depth === 0) {
      out.push(cur.trim())
      cur = ''
      continue
    }
    cur += ch
  }
  if (cur.trim()) out.push(cur.trim())
  return out
}

/** A one-band document whose single painted container is the subject under test. */
function docWithBand(axes: L1SurfaceAxes, extra: Record<string, unknown> = {}): L1Document {
  return {
    widths: WIDTHS,
    root: {
      kind: 'container',
      id: 'root',
      layout: 'stack',
      children: [{ kind: 'container', id: 'band', layout: 'stack', children: [], axes, ...extra }],
    },
  } as L1Document
}

/** The band's base declarations for a document carrying `axes`. */
function bandDecls(axes: L1SurfaceAxes): string[] {
  const { html, css } = renderL1Document(docWithBand(axes))
  return baseDecls(css, classOf(html, 'band'))
}

/** The band's `background-image` layers, in emitted (top-most first) order. */
function bandLayers(axes: L1SurfaceAxes): string[] {
  const image = decl(bandDecls(axes), 'background-image')
  expect(image, 'a background layer was painted').toBeTruthy()
  return commaList(image!)
}

/** Every error path a rejected document reports. */
function errorPaths(doc: unknown): string[] {
  const report = validateL1(doc)
  expect(report.ok, 'the document was expected to be REJECTED by the envelope').toBe(false)
  return report.ok ? [] : report.errors.map((e) => e.path)
}

/** The two-field contact-form roster the reference's own config produces. */
function referenceControls(): Record<string, L1ControlElement> {
  return contactFormControls(
    [
      { name: 'email', label: 'Your email', labelMode: 'placeholder', type: 'email', required: true },
      { name: 'message', label: 'Your message', labelMode: 'placeholder', type: 'textarea', required: false },
    ],
    'Send',
  )
}

/** The L1 subtree those controls are painted by — one heading run plus three controls. */
function controlSubtree(): L1Node {
  return {
    kind: 'container',
    layout: 'stack',
    gapPx: 12,
    children: [
      { kind: 'text', text: 'Get in touch', axes: { color: '#0f172b', fontSizePx: 24 } },
      {
        kind: 'control',
        control: 'email',
        axes: {
          color: '#0f172b',
          fontSizePx: 16,
          surfaceFill: '#ffffff',
          border: { widthPx: 1, color: '#334155' },
          borderRadiusPx: 8,
        },
        sizing: { height: { mode: 'fixed', px: 50 } },
        geometry: { keyframes: [{ at: 320, x: 0, y: 0, width: 280, height: 50 }] },
      },
      {
        kind: 'control',
        control: 'message',
        axes: { color: '#0f172b', surfaceFill: '#ffffff', border: { widthPx: 1, color: '#334155' } },
      },
      {
        kind: 'control',
        control: 'submit',
        axes: { color: '#ffffff', surfaceFill: '#0f172b', borderRadiusPx: 24 },
      },
    ],
  } as L1Node
}

// ── AC-806: a control leaf renders the module's element, painted by L1 ─────────

describe('AC-806 a control leaf renders the module element painted entirely by L1', () => {
  it('test_UAT_AC806_module_attributes_survive_while_l1_paints_the_element', () => {
    const { htmls, css } = renderL1Fragment([controlSubtree()], 'cf', referenceControls())
    const html = htmls[0]

    // ── The MODULE's half: the tag and the behavioural attribute bundle. ──────
    // A void element (`<input>`) is exactly the case no presentation slot could
    // ever reach, which is why the inversion exists at all.
    expect(html).toMatch(/<input class="[^"]+" id="cf-email" name="email" type="email" required placeholder="Your email" \/>/)
    // A textarea is not void — it must close, or the rest of the form is swallowed.
    expect(html).toMatch(/<textarea class="[^"]+" id="cf-message" name="message" placeholder="Your message"><\/textarea>/)
    expect(html).toMatch(/<button class="[^"]+" type="submit">Send<\/button>/)

    // ── L1's half: the class, the geometry and every paint axis. ──────────────
    const field = tagClass(html, 'input')
    const fieldDecls = baseDecls(css, field)
    expect(fieldDecls).toContain('color: #0f172b')
    expect(fieldDecls).toContain('font-size: 16px')
    expect(fieldDecls).toContain('background-color: #ffffff')
    expect(fieldDecls).toContain('border: 1px solid #334155')
    expect(fieldDecls).toContain('border-radius: 8px')
    expect(fieldDecls).toContain('height: 50px')
    // The geometry rule is the node's own, emitted for the same class.
    const geometry = css.split('@media')[0].match(new RegExp(`\\.${field}\\s*\\{[^}]*\\}`, 'g'))!
    expect(geometry[0]).toContain('position: absolute')
    expect(geometry[0]).toContain('width: 280px')

    // ── The zero-look baseline, ahead of the authored axes. ───────────────────
    // A form control arrives with UA chrome that would paint *through* an L1
    // subtree which simply declined to set those axes. The emitter neutralises it
    // once — and because the reset is emitted FIRST, any axis the instance did
    // author still wins in the declaration list.
    for (const reset of ['appearance: none', 'padding: 0', 'font: inherit']) {
      expect(fieldDecls, `the reset declaration '${reset}'`).toContain(reset)
    }
    for (const pair of [
      ['border: 0', 'border: 1px solid #334155'],
      ['background: transparent', 'background-color: #ffffff'],
    ] as const) {
      const [reset, authored] = pair
      expect(fieldDecls, `reset '${reset}'`).toContain(reset)
      expect(fieldDecls, `authored '${authored}'`).toContain(authored)
      expect(fieldDecls.indexOf(reset), `${reset} ahead of ${authored}`).toBeLessThan(
        fieldDecls.indexOf(authored),
      )
    }
    // …and no module carries a reset stylesheet: the button, which authored no
    // border at all, still gets the same neutralised baseline.
    expect(baseDecls(css, tagClass(html, 'button'))).toContain('appearance: none')

    // ── The placeholder follows the authored colour. ──────────────────────────
    // A placeholder is painted by a pseudo-element that does NOT inherit `color`,
    // so a placeholder-labelled field would keep the browser's grey inside the box.
    const placeholder = new RegExp(`\\.${field}::placeholder\\s*\\{([^}]*)\\}`).exec(css)
    expect(placeholder, 'the field emitted a ::placeholder rule').toBeTruthy()
    expect(placeholder![1]).toContain('color: inherit')

    // ── Inert degradation. ───────────────────────────────────────────────────
    // A control naming an element no mounted module declares renders NOTHING —
    // not a bare, UA-styled input collecting a field nothing submits.
    const empty = renderL1Fragment([controlSubtree()], 'cf', {})
    expect(empty.htmls[0]).not.toContain('<input')
    expect(empty.htmls[0]).not.toContain('<textarea')
    expect(empty.htmls[0]).not.toContain('<button')
    expect(empty.css).not.toContain('::placeholder')
    // …and no rule at all for the unbound nodes: nothing survives but the run and
    // its container, so the rest of the subtree is entirely unaffected.
    expect(empty.htmls[0]).toContain('Get in touch')
    expect(baseDecls(empty.css, tagClass(empty.htmls[0], 'p'))).toContain('color: #0f172b')

    // The same holds for ONE undeclared name inside an otherwise-bound roster.
    const partial = referenceControls()
    delete partial.message
    const some = renderL1Fragment([controlSubtree()], 'cf', partial)
    expect(some.htmls[0]).not.toContain('<textarea')
    expect(some.htmls[0]).toContain('name="email"')
    expect(some.htmls[0]).toContain('type="submit"')
  })
})

// ── AC-807: the safety envelope survives the inversion ────────────────────────

describe('AC-807 the safety envelope survives the L1-wraps-module inversion', () => {
  it('test_UAT_AC807_control_attributes_are_refused_or_escaped_and_nothing_goes_live', () => {
    // Whoever declared the element — the modules are framework code, but the sole
    // emitter is where the guarantee is *constructed*, not assumed.
    const hostile: Record<string, L1ControlElement> = {
      field: {
        tag: 'input',
        attrs: {
          class: 'module-owned',
          style: 'background:red',
          onfocus: 'alert(1)',
          'not a name': 'weird',
          name: 'email',
          type: 'email',
          placeholder: '"><img onerror=steal() src=x>',
        },
      },
      send: {
        tag: 'button',
        attrs: { type: 'submit' },
        text: '</button><script>steal()</script>',
      },
    }
    const { htmls } = renderL1Fragment(
      [
        { kind: 'control', control: 'field' },
        { kind: 'control', control: 'send' },
      ],
      'cf',
      hostile,
    )
    const out = htmls.join('')

    // The refused names are absent outright — the class is L1's, a `style`
    // attribute would hand presentation back to the module (the whole point of
    // the inversion), and an `on*` handler is a script sink.
    expect(out).not.toContain('module-owned')
    expect(out).not.toContain('background:red')
    expect(out).not.toContain('onfocus')
    expect(out).not.toContain('not a name')
    expect(out).not.toContain('weird')
    // The legitimate behavioural attributes still land.
    expect(out).toContain('name="email"')
    expect(out).toContain('type="email"')
    expect(out).toContain('type="submit"')

    // Every surviving value and every element's text is HTML-escaped, so a
    // payload arriving through a placeholder or a button's words is inert. Pinned
    // as the EXACT emitted form: every `"`, `<` and `>` in the payload is an
    // entity, so it can neither close its attribute nor open an element.
    expect(out).toContain('placeholder="&quot;&gt;&lt;img onerror=steal() src=x&gt;"')
    expect(out).toMatch(/>&lt;\/button&gt;&lt;script&gt;steal\(\)&lt;\/script&gt;<\/button>/)

    // …so nothing went live: no injected element exists in the markup at all,
    // and L1's class is the only class on each control.
    expect(out).not.toContain('<img')
    expect(out).not.toContain('<script')
    expect(out.match(/<input |<button /g)).toHaveLength(2)
    expect(out.match(/class="/g)).toHaveLength(2)
    expect(out).toMatch(/<input class="cf-l1-\d+"/)

    // A control node stays inside the numeric/enum envelope like every other
    // kind: an unknown key is rejected, so no freeform axis smuggles CSS in
    // beside the typed ones.
    expect(l1NodeSchema.safeParse({ kind: 'control', control: 'x', style: 'color:red' }).success).toBe(false)
    expect(l1NodeSchema.safeParse({ kind: 'control', control: 'x', axes: { css: 'color:red' } }).success).toBe(false)
    expect(l1NodeSchema.safeParse({ kind: 'control', control: 'x', axes: { fontSizePx: 16 } }).success).toBe(true)
    expect(
      errorPaths({
        widths: WIDTHS,
        root: {
          kind: 'container',
          layout: 'stack',
          children: [{ kind: 'control', control: 'x', axes: { backgroundImageUrl: 'javascript:steal()' } }],
        },
      }),
    ).toContain('/root/children/0/axes/backgroundImageUrl')

    // The behavioural half of the guarantee stays where it was: the submission
    // endpoint still passes the URL-scheme allowlist and degrades exactly as an
    // unsafe endpoint always has…
    expect(() => assertSafeUrl('javascript:steal()', 'contact-form action')).toThrow(ContentSafetyError)
    expect(assertSafeUrl('/api/contact', 'contact-form action')).toBe('/api/contact')

    // …and the label↔control association is module-authored, so nothing the L1
    // subtree declares can move it.
    const controls = referenceControls()
    expect(controls.email.attrs?.id).toBe(controlId('email'))
    const labelled = renderL1Fragment(
      [{ kind: 'control', control: 'email', axes: { surfaceFill: '#ffffff' } }],
      'cf',
      controls,
    )
    expect(labelled.htmls[0]).toContain(`id="${controlId('email')}"`)
  })
})

// ── AC-829: a node paints a repeating texture from a typed axis, no asset ──────

describe('AC-829 a node paints a repeating texture from a typed axis with no asset', () => {
  it('test_UAT_AC829_each_shape_is_drawn_by_the_renderer_from_its_typed_fields', () => {
    // `dots` — one repeating disc layer, tiled on the declared period, the disc's
    // radius half the declared width (which is its DIAMETER).
    const dots = { shape: 'dots', spacingPx: 24, thicknessPx: 6, color: '#8b5c2a' } as const
    const dotDecls = bandDecls({ pattern: dots })
    const dotLayers = commaList(decl(dotDecls, 'background-image')!)
    expect(dotLayers).toHaveLength(1)
    expect(dotLayers[0]).toContain('radial-gradient(circle at center')
    expect(dotLayers[0]).toContain('#8b5c2a')
    expect(dotLayers[0]).toContain('3px')
    expect(decl(dotDecls, 'background-size')).toBe('24px 24px')
    expect(decl(dotDecls, 'background-repeat')).toBe('repeat')

    // `grid` — two repeating layers, one rule set per axis (a CSS gradient runs
    // along a single axis, so a grid cannot be one layer), both on ONE period.
    const gridDecls = bandDecls({
      pattern: { shape: 'grid', spacingPx: 32, thicknessPx: 1, color: '#ffffff' },
    })
    const gridLayers = commaList(decl(gridDecls, 'background-image')!)
    expect(gridLayers).toHaveLength(2)
    expect(gridLayers[0]).toContain('to bottom')
    expect(gridLayers[1]).toContain('to right')
    expect(commaList(decl(gridDecls, 'background-size')!)).toEqual(['32px 32px', '32px 32px'])

    // `lines` — a single SELF-PERIODIC layer that carries its own period, so it
    // tilts at the declared angle without the tile shearing.
    const lineDecls = bandDecls({
      pattern: { shape: 'lines', spacingPx: 8, thicknessPx: 2, color: '#101014', angleDeg: 45 },
    })
    const lineLayers = commaList(decl(lineDecls, 'background-image')!)
    expect(lineLayers).toHaveLength(1)
    expect(lineLayers[0]).toContain('repeating-linear-gradient(45deg')
    expect(lineLayers[0]).toContain('8px')
    expect(decl(lineDecls, 'background-size')).toBe('auto')

    // Every layer carries the declared hex colour and NO layer references an
    // asset — the texture costs no binary and distorts at no viewport.
    for (const layers of [dotLayers, gridLayers, lineLayers]) {
      for (const layer of layers) expect(layer).not.toContain('url(')
    }
    for (const layer of gridLayers) expect(layer).toContain('#ffffff')
    expect(lineLayers[0]).toContain('#101014')

    // The line width is optional: 2px for dots, 1px otherwise.
    expect(bandLayers({ pattern: { shape: 'dots', spacingPx: 24, color: '#8b5c2a' } })[0]).toContain('1px')
    expect(bandLayers({ pattern: { shape: 'grid', spacingPx: 32, color: '#ffffff' } })[0]).toContain('1px')

    // The tilt applies to `lines` only, and is inert on the other shapes —
    // exactly as a mask's feather width is inert on a circular crop.
    expect(bandLayers({ pattern: { ...dots, angleDeg: 45 } })).toEqual(dotLayers)

    // The period is whatever the author declares; nothing about the axis is a
    // fixed tile.
    expect(decl(bandDecls({ pattern: { ...dots, spacingPx: 40 } }), 'background-size')).toBe('40px 40px')

    // …and the whole document clears the envelope end to end.
    const report = validateL1(docWithBand({ pattern: dots }))
    expect(report.ok, JSON.stringify(report.ok ? [] : report.errors)).toBe(true)
  })
})

// ── AC-830: a gradient is linear or radial; the branches cannot be mixed ───────

describe('AC-830 a gradient is linear or radial and the branches cannot be mixed', () => {
  it('test_UAT_AC830_radial_carries_its_own_axes_and_linear_stays_the_default', () => {
    // A radial paints the soft-falloff glow that had no representation at all
    // while the only gradient was linear. Both keywords come from closed enums.
    expect(
      decl(
        bandDecls({
          surfaceGradient: {
            kind: 'radial',
            origin: 'top-left',
            extent: 'closest-side',
            stops: [{ color: '#3a2a1a', position: 0 }, { color: '#0b0b0f', position: 100 }],
          },
        }),
        'background-image',
      ),
    ).toBe('radial-gradient(closest-side at left top, #3a2a1a 0%, #0b0b0f 100%)')

    // An omitted origin/extent falls through to the browser's own defaults rather
    // than being pinned by the renderer.
    expect(
      decl(
        bandDecls({
          surfaceGradient: { kind: 'radial', stops: [{ color: '#000000' }, { color: '#ffffff' }] },
        }),
        'background-image',
      ),
    ).toBe('radial-gradient(#000000, #ffffff)')

    // An origin is never a freeform position string — no instance value reaches
    // the stylesheet as syntax.
    expect(
      l1GradientSchema.safeParse({
        kind: 'radial',
        origin: 'at 30% 40%',
        stops: [{ color: '#000000' }, { color: '#ffffff' }],
      }).success,
    ).toBe(false)

    // The branches do not mix: a radial declaring a linear-only axis is REJECTED
    // by the schema, not silently ignored by the renderer, so a document cannot
    // express a gradient that means nothing.
    expect(
      l1GradientSchema.safeParse({
        kind: 'radial',
        angleDeg: 90,
        stops: [{ color: '#000000' }, { color: '#ffffff' }],
      }).success,
    ).toBe(false)
    expect(
      errorPaths({
        widths: WIDTHS,
        root: {
          kind: 'box',
          axes: {
            surfaceGradient: {
              kind: 'radial',
              angleDeg: 90,
              stops: [{ color: '#000000' }, { color: '#ffffff' }],
            },
          },
        },
      }).length,
    ).toBeGreaterThan(0)

    // Linear is what a gradient IS when it does not say otherwise: declaring the
    // discriminator is optional, so an angle plus stops still paints the same
    // linear wash it always did — with or without the explicit `kind`.
    const wash = 'linear-gradient(90deg, #000000, #ffffff)'
    expect(
      decl(
        bandDecls({ surfaceGradient: { angleDeg: 90, stops: [{ color: '#000000' }, { color: '#ffffff' }] } }),
        'background-image',
      ),
    ).toBe(wash)
    expect(
      decl(
        bandDecls({
          surfaceGradient: { kind: 'linear', angleDeg: 90, stops: [{ color: '#000000' }, { color: '#ffffff' }] },
        }),
        'background-image',
      ),
    ).toBe(wash)
    // …and a linear may not borrow the radial-only axes either.
    expect(
      l1GradientSchema.safeParse({
        kind: 'linear',
        origin: 'center',
        stops: [{ color: '#000000' }, { color: '#ffffff' }],
      }).success,
    ).toBe(false)
  })
})

// ── AC-831: texture composes in a defined layer order ─────────────────────────

describe('AC-831 texture composes with fill, gradient, scrim and image in a defined layer order', () => {
  it('test_UAT_AC831_five_axes_paint_as_ordered_layers_and_untextured_pages_are_byte_identical', () => {
    const decls = bandDecls({
      surfaceFill: '#0b0b0f',
      pattern: { shape: 'dots', spacingPx: 24, color: '#8b5c2a' },
      surfaceGradient: { kind: 'radial', origin: 'top', stops: [{ color: '#3a2a1a' }, { color: '#0b0b0f' }] },
      overlay: { color: '#000000', opacity: 0.2 },
      backgroundImageUrl: '/assets/hero.png',
    })

    // All five paint, and the solid fill stays BEHIND everything as a background
    // colour rather than as a layer.
    expect(decl(decls, 'background-color')).toBe('#0b0b0f')

    // The other four are ordered background layers, top-most first:
    // scrim → texture → gradient wash → image.
    const layers = commaList(decl(decls, 'background-image')!)
    expect(layers).toHaveLength(4)
    expect(layers[0]).toContain('#00000033') // the scrim, alpha-folded
    expect(layers[1]).toContain('radial-gradient(circle at center') // the texture's disc
    expect(layers[2]).toContain('radial-gradient(at top') // the gradient wash
    expect(layers[3]).toBe('url("/assets/hero.png")')

    // Because a tiled texture and a `cover` backdrop want different treatment,
    // the sizing triple is emitted POSITIONALLY — one value per layer, in layer
    // order — so each layer keeps its own tile, origin and repetition.
    expect(commaList(decl(decls, 'background-size')!)).toEqual(['auto', '24px 24px', 'auto', 'cover'])
    expect(commaList(decl(decls, 'background-position')!)).toEqual(['0% 0%', '0% 0%', '0% 0%', 'center'])
    expect(commaList(decl(decls, 'background-repeat')!)).toEqual(['repeat', 'repeat', 'repeat', 'no-repeat'])

    // A document declaring NO texture renders exactly as it did before: a
    // backdrop image still emits the single-valued cover/center/no-repeat triple…
    const backdrop = bandDecls({ backgroundImageUrl: '/assets/hero.png' })
    expect(decl(backdrop, 'background-size')).toBe('cover')
    expect(decl(backdrop, 'background-position')).toBe('center')
    expect(decl(backdrop, 'background-repeat')).toBe('no-repeat')

    // …and a surface with no layer that cares about sizing emits no sizing
    // declarations at all.
    const wash = bandDecls({
      surfaceFill: '#0b0b0f',
      overlay: { color: '#000000', opacity: 0.4 },
      surfaceGradient: { stops: [{ color: '#000000' }, { color: '#ffffff' }] },
    })
    expect(decl(wash, 'background-size')).toBeUndefined()
    expect(decl(wash, 'background-position')).toBeUndefined()
    expect(decl(wash, 'background-repeat')).toBeUndefined()

    // This holds across every shipped page: no untextured page's rendered CSS
    // changes by a byte — every `background-size` is still a single value.
    const pages = globSync('storage/sites/*/draft/pages/*.json')
    expect(pages.length, 'shipped L1 pages to re-render').toBeGreaterThan(0)
    let checked = 0
    for (const file of pages) {
      const page = JSON.parse(readFileSync(file, 'utf8')) as { l1?: L1Document }
      if (!page.l1 || patternedNodes(page.l1.root) > 0) continue
      checked++
      const { css } = renderL1Document(page.l1)
      for (const [, value] of css.matchAll(/background-size:\s*([^;}]+)/g)) {
        expect(commaList(value.trim()), `${file} background-size`).toHaveLength(1)
      }
    }
    expect(checked, 'at least one shipped page declares no texture').toBeGreaterThan(0)
  })
})

/** How many nodes in the tree declare the texture axis. */
function patternedNodes(node: L1Node): number {
  const self = node.axes && 'pattern' in node.axes && node.axes.pattern ? 1 : 0
  const children = 'children' in node ? (node.children ?? []) : []
  return children.reduce((n: number, c: L1Node) => n + patternedNodes(c), self)
}

// ── AC-832: the envelope bounds the texture through the shared surface check ───

describe('AC-832 the envelope bounds the texture period, width and colour', () => {
  it('test_UAT_AC832_texture_violations_are_rejected_with_the_offending_path', () => {
    const ok = { shape: 'dots', spacingPx: 24, thicknessPx: 2, color: '#8b5c2a' } as const
    expect(validateL1(docWithBand({ pattern: ok })).ok).toBe(true)

    const SPACING = '/root/children/0/axes/pattern/spacingPx'
    const THICKNESS = '/root/children/0/axes/pattern/thicknessPx'
    const ANGLE = '/root/children/0/axes/pattern/angleDeg'

    // The FLOOR is a robustness rule, not taste: a sub-pixel period tiles a
    // full-bleed band millions of times and is a way to hang a compositor.
    expect(errorPaths(docWithBand({ pattern: { ...ok, spacingPx: 0.05 } }))).toContain(SPACING)
    expect(errorPaths(docWithBand({ pattern: { ...ok, spacingPx: 50_000 } }))).toContain(SPACING)
    // A line width outside [0, 1000], and a tilt outside the effect-length bounds.
    expect(errorPaths(docWithBand({ pattern: { ...ok, thicknessPx: 90_000 } }))).toContain(THICKNESS)
    expect(errorPaths(docWithBand({ pattern: { ...ok, angleDeg: 99_999 } }))).toContain(ANGLE)

    // A shape outside the closed set (`noise` is not a texture), a colour that is
    // not a hex literal, a missing period, and any unknown key on the object — so
    // no freeform CSS can be smuggled in beside a typed field.
    expect(l1PatternSchema.safeParse(ok).success).toBe(true)
    expect(l1PatternSchema.safeParse({ ...ok, shape: 'noise' }).success).toBe(false)
    expect(l1PatternSchema.safeParse({ ...ok, color: 'rgba(0,0,0,.2)' }).success).toBe(false)
    expect(l1PatternSchema.safeParse({ ...ok, backgroundImage: 'url(x)' }).success).toBe(false)
    expect(l1PatternSchema.safeParse({ shape: 'dots', color: '#000000' }).success).toBe(false)
    // …and each of those is rejected through the document envelope too.
    for (const bad of [
      { ...ok, shape: 'noise' },
      { ...ok, color: 'rgba(0,0,0,.2)' },
      { ...ok, styleHack: 'color:red' },
      { shape: 'dots', color: '#000000' },
    ]) {
      expect(errorPaths(docWithBand({ pattern: bad } as unknown as L1SurfaceAxes)).length).toBeGreaterThan(0)
    }

    // Because the check is SHARED, an interaction-state texture delta is bounded
    // by the identical rule as the base node — a hole that opened only on
    // pointer-over is exactly where nothing would notice it.
    expect(
      errorPaths(
        docWithBand({}, { interaction: { hover: { pattern: { ...ok, spacingPx: 0.05 } } } }),
      ),
    ).toContain('/root/children/0/interaction/hover/pattern/spacingPx')
    expect(
      errorPaths(
        docWithBand({}, { interaction: { hover: { pattern: { ...ok, thicknessPx: 90_000 } } } }),
      ),
    ).toContain('/root/children/0/interaction/hover/pattern/thicknessPx')

    // Where a value is in range but geometrically degenerate the renderer
    // SATURATES rather than misdraws: a rule wider than its own period is a fill,
    // not a texture, so its width clamps at the period.
    const saturated = bandLayers({ pattern: { shape: 'grid', spacingPx: 4, thicknessPx: 9, color: '#ffffff' } })
    for (const layer of saturated) {
      expect(layer).toContain('4px')
      expect(layer).not.toContain('9px')
    }
  })
})
