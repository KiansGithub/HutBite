import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function useViewportHeight() {
    const { height: windowH } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    return windowH - insets.top - insets.bottom; 
}