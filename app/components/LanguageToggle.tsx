'use client';

import { Languages } from 'lucide-react';
import { LOCALE_LABELS } from '@/lib/i18n';
import { useDocumentLocale, useLocale, useTranslate } from '../hooks/useLocale';

/**
 * Language switch.
 *
 * Also the single place that syncs `<html lang>` and `<html dir>`, since it is
 * mounted once in the root layout on every page.
 */
export default function LanguageToggle({ className = '' }: { className?: string }) {
  useDocumentLocale();

  const { locale, toggleLocale } = useLocale();
  const { t } = useTranslate();

  const next = locale === 'ar' ? 'en' : 'ar';

  return (
    <button
      type="button"
      onClick={toggleLocale}
      // The label names the language being switched *to*, and is written in that
      // language — someone who cannot read the current UI can still find the way out.
      aria-label={`${t('nav.language')}: ${LOCALE_LABELS[next]}`}
      title={LOCALE_LABELS[next]}
      className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-bold text-ink-soft ring-1 ring-hairline transition hover:bg-surface hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 ${className}`}
    >
      <Languages className="h-4 w-4" aria-hidden="true" />
      <span lang={next}>{LOCALE_LABELS[next]}</span>
    </button>
  );
}
