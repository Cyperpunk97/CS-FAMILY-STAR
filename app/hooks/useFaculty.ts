'use client';

import { useCallback } from 'react';
import { FUE_FACULTIES, type FacultyLocation } from '@/lib/geo';
import { createLocalStore, useLocalStore } from './useLocalStore';

const facultyStore = createLocalStore<string>({
  key: 'fue_selected_faculty_id',
  fallback: 'fcit-cs',
  parse: (raw) => {
    if (!raw) return 'fcit-cs';
    const found = FUE_FACULTIES.some((f) => f.id === raw);
    return found ? raw : 'fcit-cs';
  },
  serialize: (value) => value,
});

/** Faculty building selection hook. Keeps distance & walking estimates tailored to the student's faculty. */
export function useFaculty() {
  const facultyId = useLocalStore(facultyStore);
  const faculty: FacultyLocation =
    FUE_FACULTIES.find((f) => f.id === facultyId) || FUE_FACULTIES[0];

  const setFacultyId = useCallback((id: string) => {
    if (FUE_FACULTIES.some((f) => f.id === id)) {
      facultyStore.set(id);
    }
  }, []);

  return { faculty, facultyId, setFacultyId, faculties: FUE_FACULTIES };
}
