'use client';

import { useCallback, useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';

/**
 * Accessible dialog.
 *
 * The previous modals were plain divs: no Escape key, no focus trap, no focus
 * restore, no `role="dialog"`, and the page behind them still scrolled. A keyboard
 * or screen-reader user could tab straight out of the dialog into the page
 * underneath without ever being told a dialog had opened.
 */

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/** Reference-counted so closing one of two stacked dialogs does not unlock the page. */
let scrollLocks = 0;
let savedOverflow = '';
let savedPaddingRight = '';

function lockScroll() {
  if (scrollLocks === 0) {
    const { body } = document;
    savedOverflow = body.style.overflow;
    savedPaddingRight = body.style.paddingRight;

    // Compensate for the scrollbar so the page does not visibly jump.
    const gap = window.innerWidth - document.documentElement.clientWidth;
    if (gap > 0) body.style.paddingRight = `${gap}px`;
    body.style.overflow = 'hidden';
  }
  scrollLocks++;
}

function unlockScroll() {
  scrollLocks = Math.max(0, scrollLocks - 1);
  if (scrollLocks === 0) {
    document.body.style.overflow = savedOverflow;
    document.body.style.paddingRight = savedPaddingRight;
  }
}

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Shown under the title, and announced as the dialog description. */
  subtitle?: string;
  children: React.ReactNode;
  /** `sheet` slides up from the bottom on phones; `dialog` stays centred. */
  variant?: 'dialog' | 'sheet';
  size?: 'sm' | 'md' | 'lg';
  /** Hide the default header when the content provides its own. */
  bareHeader?: boolean;
}

const SIZES = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-xl',
} as const;

export default function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  variant = 'dialog',
  size = 'md',
  bareHeader = false,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocusTo = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descId = useId();

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
        return;
      }

      if (event.key !== 'Tab' || !panelRef.current) return;

      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)
      ).filter((el) => el.offsetParent !== null || el === document.activeElement);

      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      // Wrap focus so Tab never escapes the dialog into the page behind it.
      if (event.shiftKey && (active === first || !panelRef.current.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (!open) return;

    restoreFocusTo.current = document.activeElement as HTMLElement | null;
    lockScroll();
    document.addEventListener('keydown', handleKeyDown, true);

    // Focus the first real control, falling back to the panel itself.
    const target =
      panelRef.current?.querySelector<HTMLElement>(FOCUSABLE) ?? panelRef.current;
    target?.focus();

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      unlockScroll();
      restoreFocusTo.current?.focus?.();
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  const isSheet = variant === 'sheet';

  return (
    <div
      className="fixed inset-0 z-50 flex animate-fade-in items-end justify-center bg-black/50 backdrop-blur-[2px] sm:items-center sm:p-4"
      onMouseDown={(e) => {
        // Only a press that starts on the backdrop closes — not a drag out of a field.
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={subtitle ? descId : undefined}
        tabIndex={-1}
        className={`flex max-h-[90dvh] w-full flex-col overflow-hidden bg-card shadow-2xl outline-none ${SIZES[size]} ${
          isSheet
            ? 'animate-sheet-up rounded-t-3xl sm:animate-rise sm:rounded-3xl'
            : 'animate-rise rounded-t-3xl sm:rounded-3xl'
        }`}
      >
        {/* Drag affordance — signals "this sheet can be dismissed" on touch. */}
        {isSheet && (
          <div className="flex justify-center pt-3 sm:hidden" aria-hidden="true">
            <span className="h-1.5 w-10 rounded-full bg-ink-faint/25" />
          </div>
        )}

        {bareHeader ? (
          // The content renders its own header, but the dialog still needs a name.
          <h2 id={titleId} className="sr-only">
            {title}
          </h2>
        ) : (
          <div className="flex items-start justify-between gap-3 border-b border-ink/5 px-6 pb-4 pt-5">
            <div className="min-w-0">
              <h2 id={titleId} className="truncate text-lg font-extrabold text-ink">
                {title}
              </h2>
              {subtitle && (
                <p id={descId} className="mt-0.5 truncate text-sm text-ink-soft">
                  {subtitle}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="-mr-1.5 shrink-0 rounded-xl p-2 text-ink-faint transition hover:bg-ink/5 hover:text-ink"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        )}

        {children}
      </div>
    </div>
  );
}
