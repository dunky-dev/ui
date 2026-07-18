import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Switch, type SwitchProps } from '@dunky.dev/react-switch'

const meta: Meta<typeof Switch> = {
  title: 'Primitives/Switch',
  component: Switch,
}

export default meta
type StoryType = StoryObj<typeof Switch>

// The primitive ships headless — the story is the consumer, so it brings the
// styles. `data-state` / `data-disabled` on every part are the real styling
// hooks, so the story styles through a stylesheet rather than inline objects.
const styles = `
  .switch {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font: 14px system-ui, sans-serif;
  }
  .switch-control {
    position: relative;
    width: 44px;
    height: 24px;
    padding: 0;
    border: none;
    border-radius: 12px;
    background: #cbd0d9;
    cursor: pointer;
    transition: background 120ms ease;
  }
  .switch-control[data-state='checked'] {
    background: #4a63e7;
  }
  .switch-control[data-disabled] {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .switch-thumb {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: white;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
    transition: transform 120ms ease;
  }
  .switch-thumb[data-state='checked'] {
    transform: translateX(20px);
  }
  .switch-label {
    cursor: pointer;
  }
  .switch-label[data-disabled] {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const DemoSwitch = ({ label, ...props }: SwitchProps & { label: string }) => (
  <>
    <style>{styles}</style>
    <Switch {...props}>
      <span className='switch'>
        <Switch.Control className='switch-control'>
          <Switch.Thumb className='switch-thumb' />
        </Switch.Control>
        <Switch.Label className='switch-label'>{label}</Switch.Label>
      </span>
    </Switch>
  </>
)

export const standard: StoryType = {
  render: () => <DemoSwitch label='Airplane mode' onCheckedChange={console.log} />,
}

export const checked: StoryType = {
  render: () => <DemoSwitch label='Notifications' defaultChecked />,
}

export const disabled: StoryType = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <DemoSwitch label='Disabled off' disabled />
      <DemoSwitch label='Disabled on (keeps its value)' disabled defaultChecked />
    </div>
  ),
}

// No Label part — the accessible name comes from an aria-label on the control.
export const noLabel: StoryType = {
  render: () => (
    <>
      <style>{styles}</style>
      <Switch>
        <Switch.Control className='switch-control' aria-label='Mute'>
          <Switch.Thumb className='switch-thumb' />
        </Switch.Control>
      </Switch>
    </>
  ),
}

const ControlledSwitch = () => {
  const [checked, setChecked] = useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start' }}>
      <DemoSwitch
        label={checked ? 'Dark theme on' : 'Dark theme off'}
        checked={checked}
        onCheckedChange={setChecked}
      />
      <button type='button' onClick={() => setChecked(next => !next)}>
        Toggle from outside
      </button>
    </div>
  )
}

export const controlled: StoryType = {
  render: () => <ControlledSwitch />,
}
