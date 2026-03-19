/**
 * useInactivityTimeout
 * Logs the user out after `timeoutMs` of no interaction.
 * Shows a visible warning `warningMs` before the timeout fires.
 */
import { useEffect, useRef, useCallback, useState } from 'react';

const TIMEOUT_MS = 10 * 60 * 1000;  // 10 minutes
const WARNING_MS =  1 * 60 * 1000;  //  1 minute warning before logout

// Events that count as "activity"
const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];

export function useInactivityTimeout(onLogout, active = true) {
  const [showWarning, setShowWarning] = useState(false);
  const logoutTimer  = useRef(null);
  const warningTimer = useRef(null);

  const clearTimers = useCallback(() => {
    clearTimeout(logoutTimer.current);
    clearTimeout(warningTimer.current);
  }, []);

  const resetTimers = useCallback(() => {
    if (!active) return;
    clearTimers();
    setShowWarning(false);

    // Warning fires 1 min before logout
    warningTimer.current = setTimeout(() => {
      setShowWarning(true);
    }, TIMEOUT_MS - WARNING_MS);

    // Logout fires after full timeout
    logoutTimer.current = setTimeout(() => {
      setShowWarning(false);
      onLogout();
    }, TIMEOUT_MS);
  }, [active, clearTimers, onLogout]);

  // Start timers when active, clear when inactive (logged out)
  useEffect(() => {
    if (!active) { clearTimers(); setShowWarning(false); return; }
    resetTimers();
    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, resetTimers, { passive: true }));
    return () => {
      clearTimers();
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, resetTimers));
    };
  }, [active, resetTimers, clearTimers]);

  const dismissWarning = useCallback(() => {
    resetTimers(); // user clicked "keep me logged in" — restart the clock
  }, [resetTimers]);

  return { showWarning, dismissWarning };
}
