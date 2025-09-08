import { useStore } from '@/store/StoreContext';
import { isStoreOpen, getStoreHoursMessage } from '@/utils/storeUtils';

export const useStoreStatus = () => {
    const { storeInfo } = useStore();

    console.log('Store info within use store status: ', storeInfo);

    const isOpen = storeInfo ? isStoreOpen(storeInfo): false; 
    const storeMessage = storeInfo ? getStoreHoursMessage(storeInfo) : 'Loading store information...';

    return {
        isOpen, 
        storeMessage, 
        canAddToBasket: isOpen 
    };
};