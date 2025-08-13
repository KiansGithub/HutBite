import React, { useState, useRef, useEffect } from 'react';
import { 
    StyleSheet, 
    FlatList, 
    View, 
    Dimensions, 
} from 'react-native';
import { VideoPlayer } from './VideoPlayer';
import { Database } from '@/lib/supabase.d';

type MenuItem = Database['public']['Tables']['menu_items']['Row'] & { id: string };

const { width: W, height: H } = Dimensions.get('screen');
const ITEM_WIDTH = W; 

interface VideoCarouselProps {
    menuItems: MenuItem[];
    rowMode: string; 
    onHorizontalScroll: (index: number) => void; 
    currentIndex: number; 
    onIndexChange: (index: number) => void; 
    resetTrigger: number;
    isScreenFocused: boolean;
}

const VideoCarouselComponent: React.FC<VideoCarouselProps> = ({
    menuItems, 
    rowMode, 
    onHorizontalScroll,
    currentIndex, 
    onIndexChange, 
    resetTrigger,
    isScreenFocused,
}) => {
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        if (resetTrigger > 0) {
            flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
            onIndexChange(0);
        }
    }, [resetTrigger, onIndexChange]);

    const renderItem = ({ item: mi, index: itemIndex }: { item: MenuItem; index: number }) => {
        if (!mi.video_url) {
            return <View style={styles.videoContainer}/>;
        }

        let mode: 'play' | 'warm' | 'off' = 'off';

        if (rowMode === 'play') {
            const isCurrent = itemIndex === currentIndex;
            const isPreloaded = Math.abs(itemIndex - currentIndex) === 1;
            if (isCurrent && isScreenFocused) {
                mode = 'play';
            } else if (isPreloaded || isCurrent) {
                mode = 'warm';
            }
        } else if (rowMode === 'warm') {
            if (itemIndex === 0) {
                mode = 'warm';
            }
        }

        if (mode === 'off') {
            return <View style={styles.videoContainer} />;
        }

        return (
            <View style={styles.videoContainer}>
                {mode === 'play' || mode === 'warm' ? (
                    <VideoPlayer 
                      uri={mi.video_url}
                      thumbUri={mi.thumb_url ?? mi.video_url.replace('.mp4', '.jpg')}
                      itemId={mi.id}
                      mode={mode}
                      width={W}
                      height={H}
                      isScreenFocused={isScreenFocused}
                />
                ) : null}
            </View>
        );
    };

    return (
        <FlatList 
          ref={flatListRef}
          data={menuItems}
          horizontal
          pagingEnabled 
          bounces={false}
          keyExtractor={(mi) => mi.id.toString()}
          onMomentumScrollEnd={(e) => {
            const idx = Math.round(e.nativeEvent.contentOffset.x / W);
            onIndexChange(idx);
          }}
          renderItem={renderItem}
          getItemLayout={(_data, index) => ({
            length: ITEM_WIDTH, 
            offset: ITEM_WIDTH * index, 
            index, 
          })}
          style={styles.flatList}
          maxToRenderPerBatch={3}
          windowSize={3}
          initialNumToRender={1}
        />
    );
};

const styles = StyleSheet.create({
    videoContainer: { width: W, height: H },
    flatList: { width: W, height: H },
});

export const VideoCarousel = React.memo(VideoCarouselComponent);