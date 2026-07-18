import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Tabs } from '@dunky.dev/react-tabs'

const meta: Meta<typeof Tabs> = {
  title: 'Primitives/Tabs',
  component: Tabs,
}

export default meta
type StoryType = StoryObj<typeof Tabs>

// The primitive ships headless — the story is the consumer, so it brings the
// styles. `data-state` / `data-orientation` on every part are the real
// styling hooks.
const styles = `
  .tabs-list {
    display: flex;
    gap: 4px;
    border-bottom: 1px solid #ccc;
  }
  .tabs-list[data-orientation='vertical'] {
    flex-direction: column;
    border-bottom: none;
    border-inline-end: 1px solid #ccc;
    width: max-content;
  }
  .tabs-trigger {
    padding: 8px 14px;
    border: none;
    border-bottom: 2px solid transparent;
    background: transparent;
    font: inherit;
    cursor: pointer;
  }
  .tabs-trigger[data-orientation='vertical'] {
    border-bottom: none;
    border-inline-end: 2px solid transparent;
    text-align: start;
  }
  .tabs-trigger[data-state='active'] {
    border-color: #0b65c2;
    color: #0b65c2;
  }
  .tabs-trigger:disabled {
    color: #999;
    cursor: default;
  }
  .tabs-content {
    padding: 16px 4px;
  }
  .tabs-vertical {
    display: flex;
    gap: 8px;
  }
`

const Sheet = () => <style>{styles}</style>

export const standard: StoryType = {
  render: () => (
    <>
      <Sheet />
      <Tabs defaultValue='overview'>
        <Tabs.List className='tabs-list' aria-label='Board settings'>
          <Tabs.Trigger className='tabs-trigger' value='overview'>
            Overview
          </Tabs.Trigger>
          <Tabs.Trigger className='tabs-trigger' value='members'>
            Members
          </Tabs.Trigger>
          <Tabs.Trigger className='tabs-trigger' value='billing'>
            Billing
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content className='tabs-content' value='overview'>
          Arrow keys move focus along the strip and select as they go — automatic activation is the
          default.
        </Tabs.Content>
        <Tabs.Content className='tabs-content' value='members'>
          Everyone with access to this board.
        </Tabs.Content>
        <Tabs.Content className='tabs-content' value='billing'>
          Plan, invoices, and payment method.
        </Tabs.Content>
      </Tabs>
    </>
  ),
}

export const manualActivation: StoryType = {
  render: () => (
    <>
      <Sheet />
      <Tabs defaultValue='code' activationMode='manual'>
        <Tabs.List className='tabs-list' aria-label='Snippet'>
          <Tabs.Trigger className='tabs-trigger' value='code'>
            Code
          </Tabs.Trigger>
          <Tabs.Trigger className='tabs-trigger' value='preview'>
            Preview
          </Tabs.Trigger>
          <Tabs.Trigger className='tabs-trigger' value='console'>
            Console
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content className='tabs-content' value='code'>
          Manual activation: arrow keys only move focus — Enter or Space selects the focused tab.
        </Tabs.Content>
        <Tabs.Content className='tabs-content' value='preview'>
          The rendered result.
        </Tabs.Content>
        <Tabs.Content className='tabs-content' value='console'>
          Logs and errors.
        </Tabs.Content>
      </Tabs>
    </>
  ),
}

export const vertical: StoryType = {
  render: () => (
    <>
      <Sheet />
      <Tabs defaultValue='profile' orientation='vertical'>
        <div className='tabs-vertical'>
          <Tabs.List className='tabs-list' aria-label='Account'>
            <Tabs.Trigger className='tabs-trigger' value='profile'>
              Profile
            </Tabs.Trigger>
            <Tabs.Trigger className='tabs-trigger' value='security'>
              Security
            </Tabs.Trigger>
            <Tabs.Trigger className='tabs-trigger' value='notifications'>
              Notifications
            </Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content className='tabs-content' value='profile'>
            A vertical strip navigates with ArrowDown/ArrowUp.
          </Tabs.Content>
          <Tabs.Content className='tabs-content' value='security'>
            Password and sessions.
          </Tabs.Content>
          <Tabs.Content className='tabs-content' value='notifications'>
            What we email you about.
          </Tabs.Content>
        </div>
      </Tabs>
    </>
  ),
}

export const disabledTab: StoryType = {
  render: () => (
    <>
      <Sheet />
      <Tabs defaultValue='general'>
        <Tabs.List className='tabs-list' aria-label='Project'>
          <Tabs.Trigger className='tabs-trigger' value='general'>
            General
          </Tabs.Trigger>
          <Tabs.Trigger className='tabs-trigger' value='integrations' disabled>
            Integrations
          </Tabs.Trigger>
          <Tabs.Trigger className='tabs-trigger' value='danger'>
            Danger zone
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content className='tabs-content' value='general'>
          The disabled tab is skipped by arrow keys and can&apos;t be selected.
        </Tabs.Content>
        <Tabs.Content className='tabs-content' value='integrations'>
          Unreachable while disabled.
        </Tabs.Content>
        <Tabs.Content className='tabs-content' value='danger'>
          Delete the project.
        </Tabs.Content>
      </Tabs>
    </>
  ),
}

const ControlledTabs = () => {
  const [value, setValue] = useState('inbox')
  return (
    <>
      <Sheet />
      <p>
        Selected: <strong>{value}</strong>{' '}
        <button type='button' onClick={() => setValue('archive')}>
          Jump to archive
        </button>
      </p>
      <Tabs value={value} onValueChange={setValue}>
        <Tabs.List className='tabs-list' aria-label='Mail'>
          <Tabs.Trigger className='tabs-trigger' value='inbox'>
            Inbox
          </Tabs.Trigger>
          <Tabs.Trigger className='tabs-trigger' value='sent'>
            Sent
          </Tabs.Trigger>
          <Tabs.Trigger className='tabs-trigger' value='archive'>
            Archive
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content className='tabs-content' value='inbox'>
          The consumer owns the value and every change reports back.
        </Tabs.Content>
        <Tabs.Content className='tabs-content' value='sent'>
          Messages you sent.
        </Tabs.Content>
        <Tabs.Content className='tabs-content' value='archive'>
          Archived threads.
        </Tabs.Content>
      </Tabs>
    </>
  )
}

export const controlled: StoryType = {
  render: () => <ControlledTabs />,
}
