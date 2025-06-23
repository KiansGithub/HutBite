import { useState, useRef } from 'react';
import { ViewToken } from 'react-native';

export const useViewabilityTracking = () => {
    const [hIndex, setHIndex] = useState<Record<string, number>>({});
    const [vIndex, setVIndex] = useState(0);

    const onViewableChange = useRef(
        ({ viewableItems}: { viewableItems: ViewToken[]}) => {
            if (viewableItems.length) {
                setVIndex(viewableItems[0].index ?? 0);
            }
        }
    ).current; 

    const updateHorizontalIndex = (restaurantId: string, index: number) => {
        setHIndex(prev => ({ ...prev, [restaurantId]: index }));
    };

    return {
        hIndex, 
        vIndex, 
        onViewableChange, 
        updateHorizontalIndex
    };
};