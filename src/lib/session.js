// A simple, non-React global state for session management
let onSessionTimeout = null;

export const setSessionTimeoutHandler = (handler) => {
  onSessionTimeout = handler;
};

export const triggerSessionTimeout = () => {
  if (onSessionTimeout) {
    onSessionTimeout();
  }
};
