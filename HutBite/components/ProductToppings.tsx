import React, { useState, useEffect, useCallback, Component } from 'react';
import { View, StyleSheet, ScrollView, Image } from 'react-native';
import { Card, Checkbox, HelperText, ActivityIndicator, useTheme, Text, TouchableRipple, IconButton, Button, Modal, Portal } from 'react-native-paper';
import { ITopping, IToppingSelection, IToppingValidationState } from '@/types/toppings';
import { ToppingPortionControl } from './ToppingPortionControl';
import { ToppingGroupHeader } from './ToppingGroupHeader';
import { ToppingGroup } from './ToppingGroup';
import { processToppingSelections } from '@/utils/toppingUtils';
import { groupToppingsByDisplayGroup } from '@/utils/toppingGroupUtils';
import { buildImageUrl } from '@/utils/imageUtils';
import { useStore } from '@/store/StoreContext';
import { Colors } from '@/constants/Colors';
import { translate } from '@/constants/translations';
import { ErrorBoundary } from './ErrorBoundary';

const baseColors = Colors.light;

interface ProductToppingsProps {
    toppings: ITopping[];
    onToppingsChange?: (selectedToppings: IToppingSelection[]) => void;
    initialToppings?: ITopping[];
    initialSelections?: IToppingSelection[];
    maxAllowedToppings?: number;
}

// Error boundary for handling topping processing failures 
class ProductToppingsErrorBoundary extends Component<{children: React.ReactNode}, {hasError: boolean}> {
    state = { hasError: false };

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    render() {
        if (this.state.hasError) {
            return <HelperText type="error">{translate('failedToLoadToppings')}</HelperText>;
        }
        return this.props.children;
    }
}

interface ToppingItemProps {
    topping: ITopping; 
    selected: boolean; 
    portions: number;
    onToggle: (id: string) => void; 
    onPortionChange: (id: string, portions: number) => void; 
    isInvalid?: boolean; 
}

const ToppingItem = React.memo<ToppingItemProps>(({
    topping, 
    selected, 
    portions, 
    onToggle, 
    onPortionChange, 
    isInvalid
}) => {
    const theme = useTheme();
    const { urlForImages } = useStore();

    const imageSource = topping.ImgUrl
      ? { uri: topping.ImgUrl.startsWith('http') ? topping.ImgUrl : buildImageUrl(urlForImages, topping.ImgUrl)}
      : null;

    // Handle cycling through 0 → 1 → 2 → 0
    const handlePress = () => {
        let nextPortion;
        if (portions === 0) {
            nextPortion = 1;
        } else if (portions === 1) {
            nextPortion = 2;
        } else {
            nextPortion = 0;
        }
        onPortionChange(topping.ID, nextPortion);
    };

    return (
        <TouchableRipple onPress={handlePress}>
            <View style={[
                styles.toppingItem, 
                portions > 0 && styles.selectedToppingItem,
                isInvalid && { borderColor: theme.colors.error, borderWidth: 1 }
            ]}>
                <View style={styles.toppingInfo}>
                    <View style={styles.toppingImageContainer}>
                        {imageSource ? (
                            <Image 
                                source={imageSource}
                                style={styles.toppingImage}
                                resizeMode="cover"
                            />
                        ) : (
                            <View style={[styles.toppingImage, styles.placeholderImage]} />
                        )}
                    </View>
                        <View style={styles.toppingDetails}>
                            <Text style={styles.toppingName}>{topping.Name}</Text>
                        </View>
                </View>
                <ToppingPortionControl 
                    value={portions}
                    onChange={(value) => onPortionChange(topping.ID, value)}
                />
            </View>
        </TouchableRipple>
    );
});

export const ProductToppings: React.FC<ProductToppingsProps> =({
    toppings, 
    onToppingsChange, 
    initialToppings, 
    initialSelections,
    maxAllowedToppings
}) => {
    const theme = useTheme();
    const colors = theme.colors;
    const { urlForImages } = useStore();
    const [selections, setSelections] = useState<IToppingSelection[]>(
        initialSelections || processToppingSelections(initialToppings, toppings)
    );
    const [validationState, setValidationState] = useState<IToppingValidationState>({
        isValid: true, 
        invalidSelections: []
    });
    const [modalVisible, setModalVisible] = useState(false);

    console.log('ProductToppings - toppings:', toppings.length);
    console.log('ProductToppings - first few toppings:', toppings.slice(0, 3));
    console.log('ProductToppings - selections:', selections);
    const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
 
    // Group toppings by DisplayGrp
    const groupedToppings = groupToppingsByDisplayGroup(toppings);
    console.log('ProductToppings - groupedToppings:', groupedToppings);
    console.log('ProductToppings - groupedToppings:', groupedToppings.length);
 
    // Set initial selected group to first group
    useEffect(() => {
        if (groupedToppings.length > 0 && !selectedGroup) {
            setSelectedGroup(groupedToppings[0].groupInfo.originalGroup);
        }
    }, [groupedToppings, selectedGroup]);

    // Update selections when initialSelections or initialToppings change 
    useEffect(() => {
        if (initialSelections) {
            setSelections(initialSelections);
        } else if (initialToppings) {
            setSelections(processToppingSelections(initialToppings, toppings))
        }
    }, [initialSelections, initialToppings, toppings]);


    useEffect(() => {
        onToppingsChange?.(selections);
    }, [selections, onToppingsChange]);

    const handleToppingToggle = useCallback((id: string) => {
        setSelections(prev => {
            const existing = prev.find(s => s.id === id);
            if (existing) {
                return prev.filter(s => s.id !== id);
            }
            if (maxAllowedToppings && prev.length >= maxAllowedToppings) {
                return prev; 
            }
            const topping = toppings.find(t => t.ID === id);
            if (!topping) return prev; 

            return [...prev, { id, name: topping.Name, portions: 1}];
        });
    }, [maxAllowedToppings, toppings]);

    const handlePortionChange = useCallback((id: string, newPortions: number) => {
        setSelections((prev) => {
            // Find which group this topping belongs to 
            const topping = toppings.find(t => t.ID === id);
            if (!topping) return prev; 
            
            const toppingGroup = groupedToppings.find(group => group.toppings.some(t => t.ID === id)
            );

            // If portions is 0, remove the topping from selections
            if (newPortions === 0) {
                return prev.filter(s => s.id !== id);
            }
 
            // Check if this is a OneChoice group 
            if (toppingGroup?.groupInfo.isOneChoice) {
                // For OneChoice groups, remove all other selections from the same group 
                const otherToppingsInGroup = toppingGroup.toppings 
                    .filter(t => t.ID !== id)
                    .map(t => t.ID);
                
                // Remove other selections from this group 
                const filteredPrev = prev.filter(s => !otherToppingsInGroup.includes(s.id));

                // Add or update the current selection 
                const existing = filteredPrev.find(s => s.id === id);
                if (!existing) {
                    return [...filteredPrev, { id, name: topping.Name, portions: newPortions }];
                } else {
                    return filteredPrev.map(s => s.id === id ? { ...s, portions: newPortions } : s);
                }
            } else {
                // For multi-choice groups, use existing logic 
                const existing = prev.find((s) => s.id === id);
                if (!existing) {
                    return [...prev, { id, name: topping.Name, portions: newPortions }];
                } else {
                    return prev.map((s) => s.id === id ? {...s, portions: newPortions } : s);
                }
            }
        });
    }, [toppings, groupedToppings]);

    const handleConfirm = () => {
        onToppingsChange?.(selections);
        setModalVisible(false);
    };

    const handleCancel = () => {
        if (initialSelections) {
            setSelections(initialSelections);
        } else {
            setSelections(processToppingSelections(initialToppings, toppings));
        }
        setModalVisible(false);
    }

    const renderModalContent = () => {
        const currentGroup = groupedToppings.find(g => g.groupInfo.originalGroup === selectedGroup);

        console.log('renderModalContent - selectedGroup:', selectedGroup);
        console.log('renderModalContent - currentGroup:', currentGroup);

        if (groupedToppings.length === 0) {
            return (
                <View style={styles.modalContentContainer}>
                    <Text style={styles.groupTitle}>{translate('noToppingGroupsAvailable')}</Text>
                </View>
            );
        }
 
        return (
            <View style={styles.modalContentContainer}>
                <ToppingGroupHeader
                    groups={groupedToppings.map(g => g.groupInfo)}
                    selectedGroup={selectedGroup}
                    onGroupSelect={setSelectedGroup}
                />
                <ScrollView style={styles.modalScrollContainer}>
                    {currentGroup ? (
                        <ToppingGroup
                            toppings={currentGroup.toppings}
                            selections={selections}
                            onToppingToggle={handleToppingToggle}
                            onPortionChange={handlePortionChange}
                            invalidSelections={validationState.invalidSelections}
                        />
                    ) : (
                        <View style={styles.modalContentContainer}>
                            <Text style={styles.groupTitle}>{translate('noToppingsFoundForGroup')}</Text>
                        </View>
                    )}
                </ScrollView>
            </View>
        );
    };

    if (!toppings || toppings.length === 0) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    // If grouping fails, don't render the component
    if (groupedToppings.length === 0) {
        console.log('ProductToppings - No grouped toppings available');
        return null;
    }

    return (
        <ErrorBoundary 
            fallback={<HelperText type="error">{translate('failedToLoadToppings')}</HelperText>}
            resetKeys={[toppings.length, selections.length]}
        >
            <Card 
              style={[
                styles.groupCard,
              ]}
            >
                <TouchableRipple 
                    onPress={() => setModalVisible(true)}
                    style={styles.button}
                    testID="toppings-button"
                >
                    <View style={styles.groupContent}>
                        <View style={styles.groupText}>
                        <Text style={styles.groupTitle}>
                        {translate('addToppings')}
                        </Text>
                        {/* Shows how many toppings are selected */}
                        <Text style={[styles.selectedOption, selections.length === 0 && styles.placeholderText]}>
                            {selections.length > 0 ? translate('selectedCount', { count: selections.length.toString() }) : translate('noneSelected')}
                        </Text>
                    </View>
                    <IconButton 
                            icon="chevron-right"
                            size={20}
                        />
                    </View>
                </TouchableRipple>

                <Portal>
                    <Modal 
                        visible={modalVisible}
                        onDismiss={() => setModalVisible(false)}
                        contentContainerStyle={styles.modalContainer}>
                            <Card style={styles.modalCard}>
                                {renderModalContent()}
                                <View style={styles.modalActions}>
                                <Button onPress={handleCancel}>{translate('cancel')}</Button>
                                <Button onPress={handleConfirm}>{translate('confirm')}</Button>
                                </View>
                            </Card>
                        </Modal>
                </Portal>
            </Card>
        </ErrorBoundary>
    );
    };

const styles = StyleSheet.create({
    groupCard: {
        marginBottom: 20,
        borderRadius: 12,
        backgroundColor: baseColors.background,
        borderWidth: 1,
        borderColor: baseColors.border,
        elevation: 2,
        marginHorizontal: 7,
        overflow: 'visible'
    },
    cardWrapper: {
        overflow: 'hidden',
        borderRadius: 12, 
    },
    groupHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: baseColors.background,
    },
    groupContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        flex: 1,
    },
    groupText: {
        flex: 1,
    },
    groupTitle: {
        fontWeight: 'bold',
        fontSize: 16, 
        marginBottom: 4,
    },
    selectedOption: {
        fontSize: 14,
        color: baseColors.primary,
        fontWeight: '500',
    },
    placeholderText: {
        color: baseColors.text,
        fontStyle: 'italic',
        opacity: 0.7
    },
    loadingContainer: {
        flex: 1, 
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32, 
    },
    button: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: baseColors.surface,
        borderBottomLeftRadius: 12,
        borderBottomRightRadius: 12,
    },
    buttonContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
    },
    buttonText: {
        fontSize: 16,
    },
    chevron: {
        margin: 0
    },
    modalContainer: {
        flex: 1, 
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 16, 
        paddingVertical: 32, 
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    fullScreenModal: {
        flex: 1, 
        justifyContent: 'center',
        backgroundColor: 'white',
    },
    modalCard: {
        width: '90%',
        maxWidth: 480, 
        maxHeight: '100%',
        borderRadius: 12,
        overflow: 'hidden',
        flexDirection: 'column',
    },
    modalScrollView: {
        paddingHorizontal: 8,
    },
    modalErrorText: {
        margin: 16
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '600'
    },
    closeIcon: {
        marginRight: 8
    },
    toppingsCard: {
        borderRadius: 8,
        backgroundColor: baseColors.surface,
        elevation: 2,
    },
    toppingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: baseColors.background,
    },
    selectedToppingItem: {
        backgroundColor: baseColors.accent + '20',
        borderLeftWidth: 4, 
        borderLeftColor: baseColors.primary
    },
    toppingInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1
    },
    toppingImageContainer: {
        width: 64,
        height: 64,
        borderRadius: 12, 
        overflow: 'hidden',
        marginRight: 16,
    },
    toppingImage: {
        width: '100%',
        height: '100%'
    },
    placeholderImage: {
        backgroundColor: baseColors.border
    },
    toppingDetails: {
        flex: 1, 
    },
    toppingName: {
        fontSize: 16,
        fontWeight: '500',
    },
    toppingPrice: {
        fontSize: 14, 
        color: '#666',
        marginTop: 4,
    },
    errorText: {
        marginTop: 8,
        marginHorizontal: 16,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: baseColors.border,
        marginTop: 'auto',
    },
    modalContentContainer: {
        flexGrow: 1, 
        flexShrink: 1, 
        minHeight: 0,
    },
    modalScrollContainer: {
        flexGrow: 1, 
        minHeight: 0, 
    },
});