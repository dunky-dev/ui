// jsdom doesn't implement Element.checkVisibility() — the platform's
// rendered-element check, which @dunky.dev/dom-focus-trap relies on — so every
// suite that tabs through a trap needs this shim. It reproduces the CSS
// checks: jsdom's UA stylesheet maps the `hidden` attribute to
// `display: none`, and jsdom does no layout, so computed values only reflect
// declared styles. `visibility` is inherited, so the element's own computed
// value suffices; `display` is not, so ancestors are walked. The `Element`
// guard keeps this a no-op for node-environment test files.
if (typeof Element !== 'undefined' && typeof Element.prototype.checkVisibility !== 'function') {
  Element.prototype.checkVisibility = function (this: Element): boolean {
    const style = getComputedStyle(this)
    if (style.visibility === 'hidden' || style.visibility === 'collapse') return false
    if (style.display === 'none') return false
    for (let ancestor = this.parentElement; ancestor; ancestor = ancestor.parentElement) {
      if (getComputedStyle(ancestor).display === 'none') return false
    }
    return true
  }
}
