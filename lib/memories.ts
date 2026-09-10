export type MemoryMood =
  | 'celebration'
  | 'exam_relief'
  | 'midnight_run'
  | 'chill_latte'
  | 'laughing_fit'
  | 'study_crunch'
  | 'golden_hour';

export interface Memory {
  id: string;
  title: string;
  venueId?: string;
  venueName: string;
  authorName: string;
  faculty?: string;
  date: string;
  story: string;
  mood: MemoryMood;
  photoUrl?: string;
  photoCaption?: string;
  cheersCount: number;
  tags: string[];
  createdAt: string;
}

export const MEMORY_MOODS: Record<
  MemoryMood,
  {
    label: string;
    emoji: string;
    bgClass: string;
    textClass: string;
    borderClass: string;
    accentClass: string;
  }
> = {
  celebration: {
    label: 'Celebration',
    emoji: '🎉',
    bgClass: 'bg-amber-100/80',
    textClass: 'text-amber-900',
    borderClass: 'border-amber-300',
    accentClass: 'from-amber-400 to-orange-400',
  },
  exam_relief: {
    label: 'Post-Exam Relief',
    emoji: '☕',
    bgClass: 'bg-emerald-100/80',
    textClass: 'text-emerald-900',
    borderClass: 'border-emerald-300',
    accentClass: 'from-emerald-400 to-teal-400',
  },
  midnight_run: {
    label: 'Midnight Run',
    emoji: '🌙',
    bgClass: 'bg-indigo-100/80',
    textClass: 'text-indigo-900',
    borderClass: 'border-indigo-300',
    accentClass: 'from-indigo-400 to-purple-400',
  },
  chill_latte: {
    label: 'Chill & Chat',
    emoji: '🧋',
    bgClass: 'bg-rose-100/80',
    textClass: 'text-rose-900',
    borderClass: 'border-rose-300',
    accentClass: 'from-rose-400 to-pink-400',
  },
  laughing_fit: {
    label: 'Unstoppable Laughs',
    emoji: '😂',
    bgClass: 'bg-yellow-100/80',
    textClass: 'text-yellow-900',
    borderClass: 'border-yellow-300',
    accentClass: 'from-yellow-400 to-amber-400',
  },
  study_crunch: {
    label: 'Study Hangout',
    emoji: '📚',
    bgClass: 'bg-blue-100/80',
    textClass: 'text-blue-900',
    borderClass: 'border-blue-300',
    accentClass: 'from-blue-400 to-cyan-400',
  },
  golden_hour: {
    label: 'Golden Hour',
    emoji: '🌅',
    bgClass: 'bg-orange-100/80',
    textClass: 'text-orange-900',
    borderClass: 'border-orange-300',
    accentClass: 'from-orange-400 to-red-400',
  },
};

/** The initial student outing memory */
export const INITIAL_MEMORIES: Memory[] = [
  {
    id: 'mem-1',
    title: 'The Pizza Hut Hangout Disaster 🍕💀',
    venueId: 'fue-pizza-hut-americana',
    venueName: 'Pizza Hut - Americana Plaza',
    authorName: 'Mariam Ahmed & The CS Crew',
    faculty: 'Faculty of Computers & Information Technology',
    date: '2026-09-08',
    story:
      'We went out to Pizza Hut at Americana Plaza thinking we would have a fun hangout after a brutal day of lectures, but it turned out to be an absolute disaster. The order took forever, the crust was totally dry, and quote unquote Mariam Ahmed said "the pizza was bread with bbq" with practically zero cheese or toppings on it! We ended up laughing uncontrollably the whole night at how bad the food was.',
    mood: 'laughing_fit',
    photoUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80',
    photoCaption: 'Americana Plaza table laughing in shock: "the pizza was bread with bbq" 💀',
    cheersCount: 28,
    tags: ['Pizza Hut', 'Americana Plaza', 'Disaster Hangout', 'Bread With BBQ', 'Mariam Ahmed', 'CS Crew'],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
  },
];

/** In-memory store for runtime */
let inMemoryMemories: Memory[] = [...INITIAL_MEMORIES];

export function getInMemoryMemories(mood?: string, venueId?: string): Memory[] {
  let list = [...inMemoryMemories];
  if (mood && mood !== 'all') {
    list = list.filter((m) => m.mood === mood);
  }
  if (venueId) {
    list = list.filter((m) => m.venueId === venueId);
  }
  return list.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function addInMemoryMemory(memory: Omit<Memory, 'id' | 'createdAt' | 'cheersCount'>): Memory {
  const newMemory: Memory = {
    ...memory,
    id: `mem-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    cheersCount: 1,
    createdAt: new Date().toISOString(),
  };
  inMemoryMemories = [newMemory, ...inMemoryMemories];
  return newMemory;
}

export function cheerInMemoryMemory(id: string): { id: string; cheersCount: number } | null {
  const mem = inMemoryMemories.find((m) => m.id === id);
  if (!mem) return null;
  mem.cheersCount += 1;
  return { id: mem.id, cheersCount: mem.cheersCount };
}
