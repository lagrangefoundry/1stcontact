/**
 * REQ-275 — the completeness probe's page script.
 *
 * It answers one question: **which CSS properties and DOM facts does this page
 * demonstrably use?** Not "which ones might a page use" — the list is derived
 * from the page itself, so it grows when a site does something we have never
 * seen, which is the whole reason the probe exists. `CAPTURE_SCHEMA_AXES` only
 * ever learned an axis after a $7 reproduction round paid to discover it was
 * missing; this enumerates the surface in one pass instead.
 *
 * HOW "DEMONSTRABLY USES" IS DECIDED, and why it is neither of the two obvious
 * answers:
 *
 *   - *Not* "every property in the page's stylesheets". A framework stylesheet
 *     (Elementor, Tailwind's preflight) declares thousands of properties in
 *     rules that match nothing on this page. That list is noise, and triaging it
 *     would be triaging the framework rather than the page.
 *   - *Not* "every computed property whose value differs from the UA default".
 *     Most of a computed style is resolved LAYOUT — `width`, `perspective-origin`,
 *     `inset-*` — which differs from the default on virtually every element
 *     without anyone having authored it. That list is also noise, and it is
 *     noise that looks like signal.
 *
 * So: **a longhand is in use when some rule declaring it matches a visible
 * element**, plus whatever visible elements carry in an inline `style`. Both
 * halves are read off this page; neither is a list anybody maintains.
 *
 * SHORTHANDS ARE EXPANDED BY THE BROWSER, not by a table here. A rule declaring
 * `background: url(x) center/cover no-repeat` is set on a scratch element and
 * its longhands read back, so the expansion is exactly the one the engine
 * performs and cannot drift from it. A table would be a fixed wishlist in the
 * one place this file exists to avoid having one.
 *
 * DYNAMIC PSEUDO-CLASSES ARE STRIPPED BEFORE MATCHING. A `:hover` rule matches
 * nothing at rest, so leaving it in would silently under-report exactly the
 * treatments the multi-state capture exists to record. Stripping `:hover` from
 * `.btn:hover` evaluates the rule against `.btn`, which is the element the
 * treatment belongs to. Pseudo-ELEMENTS are stripped for a duller reason:
 * `el.matches('a::before')` throws.
 *
 * The script is authored as a raw string, never a stringified TS function, so
 * the exact source below is what the browser evaluates — the same convention,
 * and the same reason, as `EXTRACT_SCRIPT`.
 */

/** One property the page uses, with enough of its authored values to triage it. */
export interface ObservedProperty {
  /** A CSS longhand (`border-bottom-width`) or a DOM fact (`dom:href`). */
  property: string
  /** Matching declarations for a CSS property; carrying elements for a DOM fact. */
  count: number
  /** Up to six distinct authored values, so a reader can see what is at stake. */
  values: string[]
}

/** What {@link AUDIT_SCRIPT} returns from page scope. */
export interface RawAudit {
  /** Visible elements walked — the population every count below is drawn from. */
  elements: number
  css: ObservedProperty[]
  dom: ObservedProperty[]
}

export const AUDIT_SCRIPT = `(() => {
  // A rule that only applies while the pointer is down / the field is focused
  // still describes a treatment this page HAS. Strip the state so the rule is
  // evaluated against the element it decorates.
  var DYNAMIC = /:(hover|focus|focus-visible|focus-within|active|visited|target|checked|disabled|enabled|placeholder-shown)\\b/g
  var PSEUDO_EL = /::[a-zA-Z-]+(\\([^)]*\\))?/g

  var visible = []
  var all = document.body ? document.body.querySelectorAll('*') : []
  for (var i = 0; i < all.length; i++) {
    var el = all[i]
    var r = el.getBoundingClientRect()
    if (r.width <= 0 || r.height <= 0) continue
    var cs = getComputedStyle(el)
    if (cs.visibility === 'hidden' || cs.display === 'none') continue
    visible.push(el)
  }

  // Shorthand -> longhands, performed by the engine itself (see the header).
  var scratch = document.createElement('div')
  var expanded = {}
  function longhands(name, value) {
    if (expanded[name]) return expanded[name]
    scratch.style.cssText = ''
    try { scratch.style.setProperty(name, value) } catch (e) {}
    var out = []
    for (var j = 0; j < scratch.style.length; j++) out.push(scratch.style[j])
    if (!out.length) out = [name]
    expanded[name] = out
    return out
  }

  // The CSS-wide keywords. A declaration of one of these carries no information
  // about what the page paints — it explicitly asks for the value the property
  // would have had anyway — so counting it as USE produces exactly the wrong
  // report: a framework reset that writes \`text-decoration-color: inherit\` on
  // every anchor would be indistinguishable from a page that paints a coloured
  // underline. The list is the CSS spec's, not a per-property judgement, so it
  // stays as mechanical as the rest of the walk.
  var NO_OP = { initial: 1, inherit: 1, unset: 1, revert: 1, 'revert-layer': 1 }

  var seen = {}
  function note(prop, value) {
    // A custom property moves no pixels by itself: it reaches the page only
    // through the longhand that consumes it, and that longhand is observed on
    // its own terms. Admitting them would bury the report under a hundred
    // site-specific --tw-* / --e-global-* names that mean nothing to a capture.
    if (prop.indexOf('--') === 0) return
    if (value != null && NO_OP[String(value).trim().toLowerCase()]) return
    var e = seen[prop] || (seen[prop] = { property: prop, count: 0, values: {} })
    e.count++
    var v = value == null ? '' : String(value).slice(0, 80)
    if (v && Object.keys(e.values).length < 6) e.values[v] = 1
  }

  function walk(rules) {
    for (var i = 0; i < rules.length; i++) {
      var rule = rules[i]
      // @media / @supports / @layer — recurse; their own condition is a
      // mechanism, and what matters is the declarations inside.
      if (rule.cssRules && !rule.selectorText) { walk(rule.cssRules); continue }
      if (!rule.style || !rule.selectorText) continue
      var selector = rule.selectorText.replace(PSEUDO_EL, '').replace(DYNAMIC, '')
      var matched = false
      try {
        for (var k = 0; k < visible.length; k++) {
          if (visible[k].matches(selector)) { matched = true; break }
        }
      } catch (e) { matched = false }
      if (!matched) continue
      for (var p = 0; p < rule.style.length; p++) {
        var name = rule.style[p]
        var value = rule.style.getPropertyValue(name)
        var longs = longhands(name, value)
        for (var q = 0; q < longs.length; q++) note(longs[q], value)
      }
    }
  }

  for (var s = 0; s < document.styleSheets.length; s++) {
    // A cross-origin sheet throws on .cssRules. Offline the bundle is served
    // same-origin so this is defensive, not expected.
    try { walk(document.styleSheets[s].cssRules) } catch (e) {}
  }

  for (var v = 0; v < visible.length; v++) {
    var inline = visible[v].style
    for (var p2 = 0; p2 < inline.length; p2++) {
      var n2 = inline[p2]
      var val2 = inline.getPropertyValue(n2)
      var longs2 = longhands(n2, val2)
      for (var q2 = 0; q2 < longs2.length; q2++) note(longs2[q2], val2)
    }
  }

  // DOM facts. A capture is not only paint: \`href\`, the control's submission
  // \`name\`, the form's \`method\` are page truths no computed style holds, and
  // REQ-269 found two of them the expensive way.
  var attrs = {}
  for (var w = 0; w < visible.length; w++) {
    var el2 = visible[w]
    for (var a = 0; a < el2.attributes.length; a++) {
      var raw = el2.attributes[a].name
      if (raw === 'class' || raw === 'style' || raw === 'id') continue
      // Per-site \`data-\` names are framework bookkeeping, not page facts; they
      // are collapsed to one row so the report says "this page uses data
      // attributes" without listing four hundred of them.
      var name2 = raw.indexOf('data-') === 0 ? 'data-*' : raw
      var rec = attrs[name2] || (attrs[name2] = { property: 'dom:' + name2, count: 0, values: {} })
      rec.count++
      var av = el2.getAttribute(raw)
      if (av && Object.keys(rec.values).length < 6) rec.values[String(av).slice(0, 80)] = 1
    }
  }

  function rows(bag) {
    return Object.keys(bag)
      .map(function (k) {
        return { property: bag[k].property, count: bag[k].count, values: Object.keys(bag[k].values) }
      })
      .sort(function (x, y) { return y.count - x.count || (x.property < y.property ? -1 : 1) })
  }

  return { elements: visible.length, css: rows(seen), dom: rows(attrs) }
})()`
