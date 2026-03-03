/**
 * Accessibility Layer
 * ARIA helpers, focus management, and keyboard navigation
 */

import React, { useEffect, useRef, useCallback, useState } from 'react';

// ============================================================================
// Focus Management
// ============================================================================

export function useFocusTrap(isActive) {
  const containerRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    if (isActive) {
      previousFocusRef.current = document.activeElement;
      
      // Focus first focusable element
      const focusable = getFocusableElements(containerRef.current);
      if (focusable.length) {
        focusable[0].focus();
      }
    } else if (previousFocusRef.current) {
      previousFocusRef.current.focus();
    }
  }, [isActive]);

  const handleKeyDown = useCallback((e) => {
    if (e.key !== 'Tab' || !containerRef.current) return;

    const focusable = getFocusableElements(containerRef.current);
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }, []);

  return { containerRef, handleKeyDown };
}

function getFocusableElements(container) {
  if (!container) return [];
  
  const selectors = [
    'button:not([disabled])',
    'a[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable]',
  ].join(', ');

  return Array.from(container.querySelectorAll(selectors))
    .filter(el => isVisible(el));
}

function isVisible(element) {
  return !!(element.offsetWidth || element.offsetHeight || element.getClientRects().length);
}

// ============================================================================
// Announcements for Screen Readers
// ============================================================================

export function announce(message, priority = 'polite') {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

export function useAnnouncer() {
  return useCallback((message, priority) => {
    announce(message, priority);
  }, []);
}

// ============================================================================
// Keyboard Navigation
// ============================================================================

export const KeyboardKeys = {
  Enter: 'Enter',
  Escape: 'Escape',
  Space: ' ',
  ArrowUp: 'ArrowUp',
  ArrowDown: 'ArrowDown',
  ArrowLeft: 'ArrowLeft',
  ArrowRight: 'ArrowRight',
  Home: 'Home',
  End: 'End',
  Tab: 'Tab',
};

export function useKeyboardNavigation(options = {}) {
  const {
    onSelect,
    onClose,
    itemCount,
    orientation = 'vertical',
  } = options;

  const [focusedIndex, setFocusedIndex] = useState(-1);

  const handleKeyDown = useCallback((e) => {
    const isVertical = orientation === 'vertical';
    const nextKey = isVertical ? KeyboardKeys.ArrowDown : KeyboardKeys.ArrowRight;
    const prevKey = isVertical ? KeyboardKeys.ArrowUp : KeyboardKeys.ArrowLeft;

    switch (e.key) {
      case nextKey:
        e.preventDefault();
        setFocusedIndex((prev) => 
          prev < itemCount - 1 ? prev + 1 : 0
        );
        break;
      case prevKey:
        e.preventDefault();
        setFocusedIndex((prev) => 
          prev > 0 ? prev - 1 : itemCount - 1
        );
        break;
      case KeyboardKeys.Home:
        e.preventDefault();
        setFocusedIndex(0);
        break;
      case KeyboardKeys.End:
        e.preventDefault();
        setFocusedIndex(itemCount - 1);
        break;
      case KeyboardKeys.Enter:
      case KeyboardKeys.Space:
        e.preventDefault();
        if (focusedIndex >= 0) {
          onSelect?.(focusedIndex);
        }
        break;
      case KeyboardKeys.Escape:
        onClose?.();
        break;
    }
  }, [focusedIndex, itemCount, orientation, onSelect, onClose]);

  return { focusedIndex, setFocusedIndex, handleKeyDown };
}

// ============================================================================
// Reduced Motion
// ============================================================================

export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersReducedMotion;
}

// ============================================================================
// High Contrast Mode
// ============================================================================

export function useHighContrast() {
  const [isHighContrast, setIsHighContrast] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    setIsHighContrast(mediaQuery.matches);

    const handler = (e) => setIsHighContrast(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return isHighContrast;
}

// ============================================================================
// Skip Link
// ============================================================================

export function SkipLink({ targetId, children = 'Skip to main content' }) {
  const handleClick = (e) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      target.scrollIntoView();
    }
  };

  return (
    <a
      href={`#${targetId}`}
      onClick={handleClick}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-indigo-600 focus:text-white focus:rounded"
    >
      {children}
    </a>
  );
}

// ============================================================================
// ARIA Helpers
// ============================================================================

export function generateAriaId(prefix = 'aria') {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

export function useAriaDescribedBy(description) {
  const idRef = useRef(generateAriaId('desc'));
  
  return {
    'aria-describedby': description ? idRef.current : undefined,
    descriptionId: idRef.current,
    description: description ? (
      <span id={idRef.current} className="sr-only">{description}</span>
    ) : null,
  };
}

export function useAriaLabelledBy(label) {
  const idRef = useRef(generateAriaId('label'));
  
  return {
    'aria-labelledby': label ? idRef.current : undefined,
    labelId: idRef.current,
    label: label ? (
      <span id={idRef.current} className="sr-only">{label}</span>
    ) : null,
  };
}

// ============================================================================
// Live Regions
// ============================================================================

export function LiveRegion({ id, assertive = false }) {
  return (
    <div
      id={id}
      role="status"
      aria-live={assertive ? 'assertive' : 'polite'}
      aria-atomic="true"
      className="sr-only"
    />
  );
}

// ============================================================================
// Focus Visible
// ============================================================================

export function useFocusVisible() {
  const [focusVisible, setFocusVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleFocus = (e) => {
      if (e.type === 'keydown' || !e.relatedTarget) {
        setFocusVisible(true);
      }
    };

    const handleBlur = () => {
      setFocusVisible(false);
    };

    const handleMouseDown = () => {
      setFocusVisible(false);
    };

    element.addEventListener('focus', handleFocus);
    element.addEventListener('blur', handleBlur);
    element.addEventListener('mousedown', handleMouseDown);

    return () => {
      element.removeEventListener('focus', handleFocus);
      element.removeEventListener('blur', handleBlur);
      element.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  return { ref, focusVisible };
}

// ============================================================================
// Accessible Components HOC
// ============================================================================

export function withAccessibility(Component, options = {}) {
  return function AccessibleComponent(props) {
    const { role, label, description } = options;
    const ariaLabelledBy = useAriaLabelledBy(label);
    const ariaDescribedBy = useAriaDescribedBy(description);

    return (
      <Component
        {...props}
        role={role}
        aria-label={label}
        aria-labelledby={ariaLabelledBy['aria-labelledby']}
        aria-describedby={ariaDescribedBy['aria-describedby']}
      />
    );
  };
}
