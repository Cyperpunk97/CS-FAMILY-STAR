'use client';

import { Check, Compass, MapPin, X } from 'lucide-react';
import { FUE_FACULTIES, type FacultyLocation } from '@/lib/geo';

interface FacultyModalProps {
  isOpen: boolean;
  onClose: () => void;
  faculties?: FacultyLocation[];
  selectedFacultyId: string;
  onSelectFaculty: (id: string) => void;
}

export default function FacultyModal({
  isOpen,
  onClose,
  faculties = FUE_FACULTIES,
  selectedFacultyId,
  onSelectFaculty,
}: FacultyModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="faculty-modal-title"
    >
      <div
        className="relative w-full max-w-md max-h-[90vh] overflow-hidden rounded-2xl bg-card shadow-2xl border border-hairline flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-hairline px-6 py-4 bg-surface">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
              <Compass className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 id="faculty-modal-title" className="text-base font-bold text-ink">
                Your Faculty Building
              </h2>
              <p className="text-xs text-ink-soft">
                Get tailored walking times from your lectures
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-ink-faint transition hover:bg-ink/5 hover:text-ink"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Faculties list */}
        <div className="overflow-y-auto p-4 space-y-2">
          {faculties.map((fac) => {
            const isSelected = fac.id === selectedFacultyId;
            return (
              <button
                key={fac.id}
                type="button"
                onClick={() => {
                  onSelectFaculty(fac.id);
                  onClose();
                }}
                className={`w-full text-left p-3.5 rounded-xl border transition flex items-center justify-between ${
                  isSelected
                    ? 'border-brand-500 bg-brand-50/70 text-brand-950 shadow-xs'
                    : 'border-hairline bg-card hover:bg-surface hover:border-brand-200 text-ink'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                      isSelected
                        ? 'bg-brand-600 text-white'
                        : 'bg-surface text-ink-soft border border-hairline'
                    }`}
                  >
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold leading-snug">{fac.shortName}</p>
                    <p className="text-xs text-ink-soft mt-0.5">{fac.name}</p>
                    <span className="inline-block mt-1 text-[11px] font-medium text-ink-faint">
                      {fac.building}
                    </span>
                  </div>
                </div>

                {isSelected && (
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white ml-2">
                    <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="border-t border-hairline px-6 py-3 bg-surface/50 text-center">
          <p className="text-[11px] text-ink-faint">
            Walking minutes and Google Maps routes adapt automatically based on your faculty choice.
          </p>
        </div>
      </div>
    </div>
  );
}
