// VideoCarousel.tsx
import React, { useRef, useEffect, useCallback } from 'react';
import { StyleSheet, FlatList, View, Dimensions, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { VideoPlayer } from './VideoPlayer';
import { FeedContentItem } from '@/types/feedContent';

const { width: W, height: H } = Dimensions.get('screen');
const ITEM_WIDTH = W;

interface VideoCarouselProps {
  feedItems: FeedContentItem[];                 // already filtered by parent
  rowMode: 'play' | 'warm' | 'off';
  currentIndex: number;                         // parent-owned index
  onIndexChange: (index: number) => void;
  resetTrigger: number;
  onDoubleTapLike: () => void;
  onVideoFailed?: (itemId: string) => void;     // bubble up failures
}

const VideoCarouselComponent: React.FC<VideoCarouselProps> = ({
  feedItems,
  rowMode,
  currentIndex,
  onIndexChange,
  resetTrigger,
  onDoubleTapLike,
  onVideoFailed,
}) => {
  const flatListRef = useRef<FlatList<FeedContentItem>>(null);

  // Reset to first item on restaurant change
  useEffect(() => {
    if (resetTrigger > 0) {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
      onIndexChange(0);
    }
  }, [resetTrigger, onIndexChange]);

  // If parent index is out of bounds (e.g., list shrank), snap to last valid
  useEffect(() => {
    if (feedItems.length === 0) return;
    if (currentIndex >= feedItems.length) {
      onIndexChange(feedItems.length - 1);
      flatListRef.current?.scrollToOffset({ offset: ITEM_WIDTH * (feedItems.length - 1), animated: false });
    }
  }, [feedItems.length, currentIndex, onIndexChange]);

  const clampIndex = useCallback((raw: number) => {
    if (feedItems.length === 0) return 0;
    const last = feedItems.length - 1;
    if (raw < 0) return 0;
    if (raw > last) return last;
    return raw;
  }, [feedItems.length]);

  const handleMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const raw = e.nativeEvent.contentOffset.x / ITEM_WIDTH;
    const idx = clampIndex(Math.round(raw));
    if (idx !== currentIndex) onIndexChange(idx);
  };

  const renderItem = ({ item, index }: { item: FeedContentItem; index: number }) => {
    if (!item.video_url) return <View style={styles.videoContainer} />;

    // Decide per-cell mode based on rowMode + index proximity
    let cellMode: 'play' | 'warm' | 'off' = 'off';
    if (rowMode === 'play') {
      if (index === currentIndex) cellMode = 'play';
      else if (Math.abs(index - currentIndex) === 1) cellMode = 'warm';
    } else if (rowMode === 'warm' && index === 0) {
      cellMode = 'warm';
    }

    if (cellMode === 'off') return <View style={styles.videoContainer} />;

    return (
      <View style={styles.videoContainer}>
        <VideoPlayer
          uri={item.video_url}
          thumbUri={item.thumb_url ?? item.video_url.replace('.mp4', '.jpg')}
          itemId={item.id}
          mode={cellMode}
          width={W}
          height={H}
          onDoubleTapLike={onDoubleTapLike}
          onVideoFailed={onVideoFailed}
        />
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
      keyExtractor={(it) => it.id.toString()}
      renderItem={renderItem}
      getItemLayout={(_d, index) => ({ length: ITEM_WIDTH, offset: ITEM_WIDTH * index, index })}
      onMomentumScrollEnd={handleMomentumEnd}
      style={styles.flatList}
      // Slightly relaxed virtualization; avoid removeClippedSubViews here
      maxToRenderPerBatch={2}
      windowSize={2}
      initialNumToRender={1}
      updateCellsBatchingPeriod={50}
      scrollEventThrottle={16}
      showsHorizontalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  videoContainer: { width: W, height: H },
  flatList: { width: W, height: H },
});

export const VideoCarousel = React.memo(VideoCarouselComponent);
