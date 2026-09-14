'use client';

import { useCallback, useState } from 'react';
import { getMenuForRestaurant } from '@/lib/menus';
import type { MenuItem, RestaurantMenu } from '@/lib/types';

const STORAGE_PREFIX = 'fue_custom_menu_';

function getInitialMenu(restaurantId: string, restaurantName: string): RestaurantMenu {
  const fallback = getMenuForRestaurant(restaurantId, restaurantName);
  if (typeof window === 'undefined') {
    return fallback;
  }
  try {
    const stored = localStorage.getItem(`${STORAGE_PREFIX}${restaurantId}`);
    if (stored) {
      const parsed = JSON.parse(stored) as RestaurantMenu;
      if (parsed && Array.isArray(parsed.items)) {
        return parsed;
      }
    }
  } catch {
    // Ignore JSON errors
  }
  return fallback;
}

export function useRestaurantMenu(restaurantId: string, restaurantName: string) {
  const [currentRestaurantId, setCurrentRestaurantId] = useState(restaurantId);
  const [menu, setMenu] = useState<RestaurantMenu>(() =>
    getInitialMenu(restaurantId, restaurantName)
  );

  // If the restaurant ID prop changes, update state during render per React guidelines
  if (restaurantId !== currentRestaurantId) {
    setCurrentRestaurantId(restaurantId);
    setMenu(getInitialMenu(restaurantId, restaurantName));
  }

  const saveMenu = useCallback(
    (updatedMenu: RestaurantMenu) => {
      setMenu(updatedMenu);
      try {
        localStorage.setItem(`${STORAGE_PREFIX}${restaurantId}`, JSON.stringify(updatedMenu));
      } catch (err) {
        console.error('Failed to save custom menu to storage:', err);
      }
    },
    [restaurantId]
  );

  const addMenuItem = useCallback(
    (item: Omit<MenuItem, 'id'>) => {
      const newItem: MenuItem = {
        ...item,
        id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      };

      const updatedCategories = menu.categories.includes(item.category)
        ? menu.categories
        : [...menu.categories, item.category];

      const updated: RestaurantMenu = {
        ...menu,
        categories: updatedCategories,
        items: [newItem, ...menu.items],
        lastUpdated: new Date().toISOString().split('T')[0],
      };

      saveMenu(updated);
      return newItem;
    },
    [menu, saveMenu]
  );

  const updateMenuItem = useCallback(
    (itemId: string, updates: Partial<MenuItem>) => {
      const updatedItems = menu.items.map((it) => (it.id === itemId ? { ...it, ...updates } : it));
      const updatedCategories = Array.from(new Set(updatedItems.map((it) => it.category)));

      const updated: RestaurantMenu = {
        ...menu,
        categories: updatedCategories,
        items: updatedItems,
        lastUpdated: new Date().toISOString().split('T')[0],
      };

      saveMenu(updated);
    },
    [menu, saveMenu]
  );

  const deleteMenuItem = useCallback(
    (itemId: string) => {
      const updatedItems = menu.items.filter((it) => it.id !== itemId);
      const updatedCategories = Array.from(new Set(updatedItems.map((it) => it.category)));

      const updated: RestaurantMenu = {
        ...menu,
        categories: updatedCategories,
        items: updatedItems,
      };

      saveMenu(updated);
    },
    [menu, saveMenu]
  );

  const resetToDefault = useCallback(() => {
    try {
      localStorage.removeItem(`${STORAGE_PREFIX}${restaurantId}`);
    } catch {
      // Ignore storage errors
    }
    setMenu(getMenuForRestaurant(restaurantId, restaurantName));
  }, [restaurantId, restaurantName]);

  return {
    menu,
    saveMenu,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    resetToDefault,
  };
}
