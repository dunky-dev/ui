// @vitest-environment jsdom
// The shared depth scale for @dunky.dev/dom-layer-stack — the registry's
// topmost/containment behavior itself is covered in the util's own tests.
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { LayerDepthContext, useLayerDepth } from '@dunky.dev/react-use-layer-stack'

// The consumption pattern every overlay root follows: read, add 1, provide.
function Layer({ name, children }: { name: string; children?: ReactNode }) {
  const depth = useLayerDepth() + 1
  return (
    <LayerDepthContext.Provider value={depth}>
      <span data-testid={name}>{depth}</span>
      {children}
    </LayerDepthContext.Provider>
  )
}

// RTL auto-cleanup needs vitest globals; this repo runs with globals: false.
afterEach(cleanup)

describe('useLayerDepth', () => {
  it('starts at 0 outside any layer', () => {
    render(<Layer name='root' />)
    expect(screen.getByTestId('root').textContent).toBe('1')
  })

  it('reflects logical nesting across portals, where DOM order inverts it', () => {
    render(<Layer name='outer'>{createPortal(<Layer name='inner' />, document.body)}</Layer>)
    expect(screen.getByTestId('inner').textContent).toBe('2')
  })
})
