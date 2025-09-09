import { StyleSheet } from 'react-native';

export const basketStyles = StyleSheet.create({
    container: {
        flex: 1, 
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    emptyText: {
        marginTop: 8, 
        textAlign: 'center',      
        opacity: 0.7, 
    },
    footer: {
        padding: 16, 
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
});

export const basketItemStyles = StyleSheet.create({
    container: {
        padding: 16, 
        marginVertical: 8, 
        borderRadius: 8,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    titleContainer: {
        flex: 1,
    },
    price: {
        marginTop: 8,
    },
    optionsContainer: {
        marginTop: 12,
    },
    optionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 4,
    },
    controls: {
        marginTop: 16, 
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 4,
    },
    quantityControls: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    quantity: {
        marginHorizontal: 8,
    },
});