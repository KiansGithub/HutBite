import React, { useState, useEffect, Component, useCallback, useMemo } from 'react';
import { View, StyleSheet, Modal, ScrollView, Image } from 'react-native';
import { Card, RadioButton, HelperText, ActivityIndicator, useTheme, IconButton, Text, TouchableRipple, Button } from 'react-native-paper';
import { IProcessedProductOptions, IOptionSelections, IOptionValidationState, IFilteredOptionGroups } from '@/types/productOptions';
import { buildImageUrl } from '@/utils/imageUtils';
import { useStore } from '@/store/StoreContext';
import { validateOptionSelections } from '@/utils/productOptionsUtils';
import { Colors } from '@/constants/Colors';
import { translate } from '@/constants/translations';

const baseColors = Colors.light; 

interface ProductOptionsProps {
    options: IProcessedProductOptions; 
    filteredOptions?: IFilteredOptionGroups;

    // The parent/hook passes in the current selections
    selections: IOptionSelections; 

    // The parent/hook function that updates selections 
    onOptionSelect: (groupKey: string, value: string) => void; 

    // Handle onChange style updates 
    onOptionChange?: (groupKey: string, value: string) => void;

    onSelectionsChange?: (selections: IOptionSelections, isValid: boolean) => void;
}

// Error boundary for handling option processing failures 
class ProductOptionsErrorBoundary extends Component<{children: React.ReactNode}, {hasError: boolean}> {
    state = { hasError: false };

    static getDerivedStateFromError() {
        return { haseError: true};
    }

    render() {
        if (this.state.hasError) {
            return <HelperText type="error">{translate('failedToLoadOptions')}</HelperText>;
        }
        return this.props.children;
    }
}

export const ProductOptions: React.FC<ProductOptionsProps> = ({
    options, 
    filteredOptions,
    selections, 
    onOptionSelect, 
    onOptionChange, 
    onSelectionsChange,
}) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedGroupKey, setSelectedGroupKey] = useState<string | null>(null);
    const [validationState, setValidationState] = useState<IOptionValidationState>({
        isValid: true, 
        missingRequired: []
    });
    const { colors } = useTheme();
    const { urlForImages } = useStore();
    const styles = useMemo(() => createStyles(colors), [colors]);

    const handleOpenModal = (groupKey: string) => {
        setSelectedGroupKey(groupKey);
    };

    const handleCloseModal = () => {
        setSelectedGroupKey(null);
    };

    const handleOptionSelectLocal = useCallback((groupKey: string, value: string) => {
            onOptionSelect(groupKey, value);
            handleCloseModal();
        },
         [onOptionSelect]);

    // Validate selections when component mounts or selections change
    useEffect(() => {
        try {
            // Validate the current selections against requirements 
            const validationResult = validateOptionSelections(selections, options.requirements)
            setValidationState(validationResult);

            // Notify parent component 
            if (onSelectionsChange) {
                onSelectionsChange(selections, validationResult.isValid);
            }
        } catch (error) {
            console.error('Error validating options: ', error);
            setError('Failed to validate options');
        }
    }, [selections, options.requirements, onSelectionsChange])

    const getSelectedLabel = useCallback((groupKey: string) => {
        const selectedId = selections[groupKey];
        const group = options.groups.find(g => g.key === groupKey);
        return group?.options.find(o => o.ID === selectedId)?.Name || 'Select option';
    }, [options, selections]);

    const renderModal = () => {
        const group = options.groups.find(g => g.key === selectedGroupKey);
        if (!group) return null; 

        const displayOptions = 
          filteredOptions && filteredOptions[group.key]
            ? filteredOptions[group.key]
            : group.options;

        return (
            <Modal 
                visible={!!selectedGroupKey}
                onRequestClose={handleCloseModal}
                transparent 
                animationType="slide"
            >
                <TouchableRipple 
                    style={styles.modalBackdrop}
                    onPress={handleCloseModal}
                >
                <View style={styles.modalContainer}>
                    <Card style={styles.modalCard}>
                        <Card.Title 
                            title={group.key}
                            titleStyle={styles.modalTitle}
                            right={() => (
                                <IconButton 
                                    icon="close"
                                    onPress={handleCloseModal}
                                    style={styles.closeIcon}
                                    size={24}
                                />
                            )}
                        />
                        <ScrollView
                            contentContainerStyle={styles.scrollContent}
                            showsVerticalScrollIndicator={false}
                        >
                                {displayOptions.map((option, index) => {
                                const imageUrl = buildImageUrl(imageUrl, option.ImgSrc || option.ImgUrl);
 
                                return (
                                    <TouchableRipple 
                                        key={option.ID}
                                        onPress={() => handleOptionSelectLocal(group.key, option.ID)}
                                        style={[
                                            styles.modalOption,
                                            selections[group.key] === option.ID && styles.modalOptionSelected,
                                            index === displayOptions.length - 1 && styles.lastOption
                                        ]}
                                        rippleColor="rgba(0, 0, 0, .32)"
                                    >
                                        <View style={styles.optionContent}>
                                            <RadioButton 
                                                value={option.ID} 
                                                color={colors.primary}
                                                uncheckedColor={colors.accent}
                                                status={
                                                    selections[group.key] === option.ID 
                                                      ? 'checked'
                                                      : 'unchecked'
                                                }
                                                onPress={() => handleOptionSelectLocal(group.key, option.ID)}
                                            />
                                            {imageUrl && (
                                                <Image 
                                                    source={{ uri: imageUrl }}
                                                    style={styles.optionImage}
                                                    resizeMode="cover"
                                                />
                                            )}
                                            <Text style={[
                                                styles.modalOptionText,
                                                !imageUrl && styles.modalOptionTextNoImage
                                            ]}>
                                                {option.Name}
                                            </Text>
                                        </View>
                                    </TouchableRipple>
                                );
                            })}
                        </ScrollView>
                    </Card>
                </View>
                </TouchableRipple>
            </Modal>
        )
    }

    const renderValidationErrors = () => {
        if (validationState.missingRequired.length === 0) return null;

        return (
            <HelperText type="error" style={styles.errorText}>
                {translate('selectRequiredOptions')}: {validationState.missingRequired.join(', ')}
            </HelperText>
        );
    };

    if (loading) {
        return (
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="large"/>
        </View>
    )
    }

    if (!options.groups.length) {
        return <HelperText type="info"style={styles.noOptionsText}>{translate('noCustomizableOptions')}</HelperText>;
    }

    return (
        <ProductOptionsErrorBoundary>
        <View style={styles.container}>
            {options.groups.map((group) => (
                <Card 
                    key={group.key}
                    style={[
                        styles.groupCard, 
                        validationState.missingRequired.includes(group.key) && {
                            borderColor: colors.error, 
                            borderWidth: 1
                        }
                    ]}
                >
                        <TouchableRipple 
                        onPress={() => handleOpenModal(group.key)}
                        style={styles.groupHeader}
                        >
                        <View style={styles.groupContent}>
                            <View style={styles.groupText}>
                                <Text style={styles.groupTitle}>
                                    {group.key} {group.isRequired && '*'}
                                </Text>
                                <Text 
                                    style={[
                                        styles.selectedOption, 
                                        !selections[group.key] && styles.placeholderText
                                    ]}
                                >
                                    {getSelectedLabel(group.key)}
                                </Text>
                            </View>
                            <IconButton 
                                icon="chevron-right"
                                size={20}
                            />
                        </View>
                    </TouchableRipple>
                </Card>
            ))}
            {renderValidationErrors()}
            {renderModal()}
        </View>
        </ProductOptionsErrorBoundary>
    );
};

const createStyles = (colors: typeof baseColors) => StyleSheet.create({
    container: {
        padding: 8, 
    },
    loadingContainer: {
        flex: 1, 
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32, 
    },
    groupCard: {
        marginBottom: 16,
        borderRadius: 12,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        elevation: 2,
    },
    groupHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 20,
        paddingHorizontal: 16, 
        backgroundColor: colors.surface,
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
    },
    radioItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12, 
        paddingHorizontal: 24, 
        borderTopWidth: 1, 
        borderTopColor: colors.accent,
    },
    radioLabel: {
        marginLeft: 16, 
        fontSize: 16,
        color: colors.accent,
    },
    errorText: {
        marginTop: 8, 
        marginHorizontal: 16,
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
        color: colors.primary,
        fontWeight: '500',
    },
    placeholderText: {
        color: colors.muted,
        fontStyle: 'italic',
    },
    modalBackdrop: {
        flex: 1, 
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
    },
    modalContainer: {
        flex: 1, 
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: 16,
    },
    modalCard: {
        maxHeight: '100%',
        borderRadius: 12, 
        elevation: 6, 
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15, 
        shadowRadius: 8,
    },
    modalTitle: {
        fontSize: 20, 
        fontWeight: '600',
        color: colors.text,
    },
    closeIcon: {
        marginRight: 8, 
    },
    scrollContent: {
        paddingVertical: 8,
    },
    modalOption: {
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderBottomWidth: 1,
        borderBottomColor: colors.background,
        minHeight: 56
    },
    modalOptionSelected: {
        backgroundColor: colors.background,
    },
    lastOption: {
        borderBottomWidth: 0, 
    },
    optionContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    modalOptionText: {
        fontSize: 16, 
        marginLeft: 16,
        color: colors.text,
        flexShrink: 1,
    },
    noOptionsText: {
        padding: 16, 
        textAlign: 'center',
        fontSize: 14
    },
    optionImage: {
        width: 40,
        height: 40,
        borderRadius: 8,
        marginLeft: 16,
        marginRight: 12,
    },
    modalOptionTextNoImage: {
        marginLeft: 16,
    },
});