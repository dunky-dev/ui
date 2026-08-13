---
'@dunky.dev/dialog': patch
'@dunky.dev/react-dialog': patch
'@dunky.dev/native-dialog': patch
---

Update the state-machine runtime packages to 0.3.2.

For `@dunky.dev/native-dialog` this fixes a native crash on Android: the runtime's `normalize` used to emit the machine's `role: 'dialog'` as the legacy `accessibilityRole` prop, which Android rejects at mount (`Invalid accessibility role value: dialog`). It now emits React Native's web-aligned `role` prop, which also restores the intended semantics on iOS (VoiceOver previously got no dialog traits at all). `hidden` now lands on `aria-hidden` instead of being silently ignored.
