import { useCallback, useState, useRef } from 'react';
import { ViewToken } from 'react-native';

export const useViewabilityTracking = () => {
  const [vIndex, setVIndex] = useState(0);
  const [visibleHIndex, setVisibleHIndex] = useState(0);

  // keeps the ID of the row currently filling most of the screen
  const currentRestaurantIdRef = useRef<string | null>(null);

  /* ---------- changed block ---------- */
  const onViewableChange = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (!viewableItems.length) return;

      // choose the token with the largest visible percentage
      const best = viewableItems.reduce(
        (max, v) =>
          getPct(v) > getPct(max) ? v : max,  // helper below
        viewableItems[0],
      );

      currentRestaurantIdRef.current = best.item.id as string;
      setVIndex(best.index ?? 0);      // ← updates vertical index
      setVisibleHIndex(0);             // reset horizontal rail
    },
    [],
  );
  /* ----------------------------------- */

  const updateHorizontalIndex = useCallback(
    (restaurantId: string, index: number) => {
      if (restaurantId === currentRestaurantIdRef.current) {
        setVisibleHIndex(index);
      }
    },
    [],
  );

  return { vIndex, visibleHIndex, onViewableChange, updateHorizontalIndex };
};

/* helper – ViewToken exposes the % on different fields per platform */
function getPct(v: ViewToken) {
  // @ts-ignore – private field on iOS / new Android
  if (typeof v.cellPercentVisible === 'number') return v.cellPercentVisible;
  // @ts-ignore – private field on old Android
  if (typeof v.viewablePercent === 'number')    return v.viewablePercent;
  return 0;
}
