/**
 * The **edit bridge's client half** (REQ-117; DOC-28 §5.2, §7.1, §11).
 *
 * The renderer stamps each editable region with its address (REQ-116); this
 * turns a clicked pixel back into that address. It lives beside the emitter on
 * purpose: stamp and read are one contract, and a client in another package
 * would be free to drift from the markup it depends on.
 *
 * It is deliberately small, and it does **not** own the loop. It answers exactly
 * one question — *which segment is this, and where in the definition does it
 * live?* — and hands the answer to a host. Opening the modal (`mountFields`),
 * reading the draft, and committing the diff are the host's, because they are
 * where the app's chrome and its server live. That split is what lets this ship
 * and be tested against real rendered bytes before the shell exists.
 *
 * There is no `postMessage` protocol: the preview iframe is same-origin
 * ([[DOC-8]] §4.2), so the host passes this the iframe's own `Document`.
 */
import {
  L1_EDIT_HOT_CLASS,
  L1_EDIT_MARKER_ATTR,
  L1_EDIT_MODULE_ATTR,
  L1_EDIT_PATH_ATTR,
  L1_EDIT_SEGMENT_ATTR,
  L1_EDIT_SLOT_ATTR,
  parseL1Path,
  type L1EditTarget,
  type L1SegmentKind,
} from '@1stcontact/site-schema'

/** A resolved click: the segment, what kind it is, and the element it came from. */
export interface L1EditHit {
  target: L1EditTarget
  kind: L1SegmentKind
  element: Element
}

/**
 * The segment a pointer event landed in, or `null` if it landed on nothing
 * editable.
 *
 * **Innermost wins.** Segments nest — copy inside a painted container inside a
 * module — and `closest` walks outward from the deepest element under the
 * pointer, so the nearest segment is found first with no hit-testing and no
 * geometry. The occluded-parent case DOC-28 §6.5 measures as rare (1 of 10
 * containers on `xgd/home`) is left alone for now; shift-hover is the fix if it
 * ever bites, and it is a UI treatment rather than a change to this rule.
 */
export function resolveEditTarget(from: Element | null): L1EditHit | null {
  const element = from?.closest(`[${L1_EDIT_PATH_ATTR}]`) ?? null
  if (!element) return null

  const path = parseL1Path(element.getAttribute(L1_EDIT_PATH_ATTR) ?? '')
  const kind = element.getAttribute(L1_EDIT_SEGMENT_ATTR) as L1SegmentKind | null
  // A stamp is only half an address without its kind, and both are read off the
  // DOM — untrusted by construction. Fail closed rather than guess.
  if (!path || !kind) return null

  // Which address space? A path inside a behavior module's markup indexes that
  // instance's slot subtrees, not the page's document; the two reuse the same
  // short paths by design (REQ-116), so the scope is what tells them apart.
  const moduleRoot = element.closest(`[${L1_EDIT_MODULE_ATTR}]`)
  if (!moduleRoot) return { target: { path }, kind, element }

  const moduleId = moduleRoot.getAttribute(L1_EDIT_MODULE_ATTR) ?? undefined
  // The nearest slot marker counts only if it is INSIDE the instance. The page's
  // own `slot` node also carries one — it is the seam the module mounted into —
  // but it is an ancestor of the instance and names a document slot, not one of
  // the module's.
  const slotEl = element.closest(`[${L1_EDIT_SLOT_ATTR}]`)
  const slot =
    slotEl && moduleRoot.contains(slotEl)
      ? (slotEl.getAttribute(L1_EDIT_SLOT_ATTR) ?? undefined)
      : undefined

  return { target: { moduleId, slot, path }, kind, element }
}

/** What a mounted bridge gives the host back. */
export interface L1EditBridge {
  /** Unbind every listener and clear the hover treatment. */
  destroy(): void
}

/**
 * Bind click-to-edit and the hover treatment on an edit render.
 *
 * **Refuses to bind on anything else.** View mode is the same page without the
 * `data-fc-edit` marker, and it must behave exactly as published — links work,
 * nothing is intercepted, no modal can open (DOC-28 §7.1). Making that a
 * property of the bridge rather than of the host's discipline means a host that
 * forgets to unmount on a mode switch still cannot break View mode.
 */
export function mountL1EditBridge(
  doc: Document,
  onSegment: (hit: L1EditHit) => void,
): L1EditBridge {
  if (!doc.body?.hasAttribute(L1_EDIT_MARKER_ATTR)) {
    return { destroy() {} }
  }

  let hot: Element | null = null
  const setHot = (next: Element | null): void => {
    if (next === hot) return
    hot?.classList.remove(L1_EDIT_HOT_CLASS)
    hot = next
    hot?.classList.add(L1_EDIT_HOT_CLASS)
  }

  const onClick = (ev: Event): void => {
    const hit = resolveEditTarget(ev.target as Element | null)
    if (!hit) return
    // The edit render already emits no link target and no form action, so there
    // is nothing left to navigate — but a click is now an editor gesture, and a
    // gesture that also does something else is a gesture the user cannot trust.
    ev.preventDefault()
    onSegment(hit)
  }
  const onOver = (ev: Event): void => setHot(resolveEditTarget(ev.target as Element | null)?.element ?? null)
  const onLeave = (): void => setHot(null)

  doc.addEventListener('click', onClick)
  doc.addEventListener('pointerover', onOver)
  doc.addEventListener('pointerleave', onLeave)

  return {
    destroy() {
      doc.removeEventListener('click', onClick)
      doc.removeEventListener('pointerover', onOver)
      doc.removeEventListener('pointerleave', onLeave)
      setHot(null)
    },
  }
}
