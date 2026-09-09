'use client';

import { useCallback } from 'react';
import { LIMITS } from '@/lib/types';
import { createLocalStore, useLocalStore } from './useLocalStore';

const nameStore = createLocalStore<string>({
  key: 'fue_student_name',
  fallback: '',
  parse: (raw) => (raw ?? '').slice(0, LIMITS.userNameMax),
  serialize: (value) => value,
});

/** The display name attached to a student's reviews. Browser-local, no account. */
export function useStudentName() {
  const name = useLocalStore(nameStore);

  const setName = useCallback((value: string) => {
    nameStore.set(value.trim().slice(0, LIMITS.userNameMax));
  }, []);

  return { name, setName };
}
