'use client';

import { useTranslate } from '../hooks/useLocale';

/** First tab stop, so keyboard users can jump the header and filters. */
export default function SkipLink() {
  const { t } = useTranslate();

  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:z-[60] focus:rounded-xl focus:bg-brand-700 focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-white focus:start-4"
    >
      {t('app.skipToContent')}
    </a>
  );
}
