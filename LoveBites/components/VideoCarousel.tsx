import React, { useState } from 'react';
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

interface VideoCarouselProps {
    menuItems: MenuItem[];
    rowMode: string; 
    onHorizontalScroll: (index: number) => void; 
    currentIndex: number; 
    onIndexChange: (index: number) => void; 
}

export const VideoCarousel: React.FC<VideoCarouselProps> = ({
    menuItems, 
    rowMode, 
    onHorizontalScroll,
    currentIndex, 
    onIndexChange, 
}) => {
    const renderItem = ({ item: mi, index: itemIndex }: { item: MenuItem; index: number }) => {
        const isCurrent = rowMode === 'play' && itemIndex === currentIndex; 
        const isPreloaded = rowMode !== 'off' && Math.abs(itemIndex - currentIndex) === 1; 

        const mode = isCurrent ? 'play' : isPreloaded ? 'warm' : 'off';

        if (mode === 'off') {
            return <View style={styles.videoContainer} />;
        }

        return (
            <View style={styles.videoContainer}>
                {mi.video_url && (
                    <VideoPlayer 
                      uri={mi.video_url}
                      thumbUri={mi.thumb_url ?? mi.video_url.replace('.mp4', 'jpg')}
                      itemId={mi.id}
                      mode={mode}
                      width={W}
                      height={H}
                />
                )}
            </View>
        );
    };

    return (
        <FlatList 
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