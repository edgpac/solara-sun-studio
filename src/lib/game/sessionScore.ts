// Module-level running total for the current play session.
// Persists across route navigations within the same browser tab.
let _base = 0;

export const getSessionBase = () => _base;
export const advanceSession = (earned: number) => { _base += earned; };
export const resetSession = () => { _base = 0; };
