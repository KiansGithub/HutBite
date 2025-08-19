import React, { useState, useRef, useEffect } from 'react';
import { 
    StyleSheet, 
    FlatList, 
    View, 
    Dimensions, 
} from 'react-native';
import { VideoPlayer } from './VideoPlayer';
import { FeedContentItem } from '@/types/feedContent';

const { width: W, height: H } = Dimensions.get('screen');
const ITEM_WIDTH = W; 

interface VideoCarouselProps {
    feedItems: FeedContentItem[];
    rowMode: string; 
    onHorizontalScroll: (index: number) => void; 
    currentIndex: number; 
    onIndexChange: (index: number) => void; 
    resetTrigger: number;
}

const VideoCarouselComponent: React.FC<VideoCarouselProps> = ({
    feedItems, 
    rowMode, 
    onHorizontalScroll,
    currentIndex, 
    onIndexChange, 
    resetTrigger,
}) => {
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        if (resetTrigger > 0) {
            flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
            onIndexChange(0);
        }
    }, [resetTrigger, onIndexChange]);

    const renderItem = ({ item: feedItem, index: itemIndex }: { item: FeedContentItem; index: number }) => {
        if (!feedItem.video_url) {
            return <View style={styles.videoContainer}/>;
        }

        let mode: 'play' | 'warm' | 'off' = 'off';

        if (rowMode === 'play') {
            const isCurrent = itemIndex === currentIndex;
            const isPreloaded = Math.abs(itemIndex - currentIndex) === 1;
            if (isCurrent) {
                mode = 'play';
            } else if (isPreloaded) {
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
                    uri={feedItem.video_url}
                    thumbUri={feedItem.thumb_url ?? feedItem.video_url.replace('.mp4', '.jpg')}
                    itemId={feedItem.id}
                      mode={mode}
                      width={W}
                      height={H}
                />
                ) : null}
            </View>
        );
    };

    return (
        <FlatList 
          ref={flatListRef}
          data={feedItems}
          horizontal
          pagingEnabled 
          bounces={false}
          keyExtractor={(feedItem) => feedItem.id.toString()}
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