import { useCallback, useState, useRef } from 'react';
import { ViewToken } from 'react-native';

export const useViewabilityTracking = () => {
    const [vIndex, setVIndex] = useState(0);

    /* mutable ref for currently visible restaurant id */
  const currentRestaurantIdRef = useRef<string | null>(null);

  /* horizontal index for the *visible* restaurant only */
  const [visibleHIndex, setVisibleHIndex] = useState(0);

    /* viewability callback – recreated safely on every render */
  const onViewableChange = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (!viewableItems.length) return;

      const first = viewableItems[0];
      currentRestaurantIdRef.current = first.item.id as string;
      setVIndex(first.index ?? 0);
      /* when vertical row changes, reset visibleHIndex to 0 */
      setVisibleHIndex(0);
    },
    [],
  );

    /* called inside RestaurantCard; only updates overlay when
     the index belongs to the *currently* visible row            */
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