// @vitest-environment jsdom
// The shared nesting chain for @dunky.dev/dom-layer-stack — the registry's
// topmost/containment behavior itself is covered in the util's own tests.
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { LayerPathContext, useLayerPath } from '@dunky.dev/react-use-layer-stack'

// The consumption pattern every overlay root follows: read, append own id,
// provide.
function Layer({ id, children }: { id: string; children?: ReactNode }) {
  const path = [...useLayerPath(), id]
  return (
    <LayerPathContext.Provider value={path}>
      <span data-testid={id}>{path.join(',')}</span>
      {children}
    </LayerPathContext.Provider>
  )
}

// RTL auto-cleanup needs vitest globals; this repo runs with globals: false.
afterEach(cleanup)

describe('useLayerPath', () => {
  it('starts empty outside any layer', () => {
    render(<Layer id='root' />)
    expect(screen.getByTestId('root').textContent).toBe('root')
  })

  it('reflects logical nesting across portals, where DOM order inverts it', () => {
    render(<Layer id='outer'>{createPortal(<Layer id='inner' />, document.body)}</Layer>)
    expect(screen.getByTestId('inner').textContent).toBe('outer,inner')
  })
})
