// React 19's concurrent renderer (what test-renderer drives under RNTL) gates
// act() on this global. jest-expo doesn't set it, so establish it once for the
// whole run — without it, renders after the first cleanup silently mount
// nothing ("not configured to support act(...)").
globalThis.IS_REACT_ACT_ENVIRONMENT = true
