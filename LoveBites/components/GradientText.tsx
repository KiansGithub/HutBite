import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
 
interface GradientTextProps {
  text: string;
  style?: any;
  colors?: string[];
}
 
export const GradientText: React.FC<GradientTextProps> = ({
  text,
  style,
  colors = ['#FFFFFF', '#FFE680']
}) => (
  <MaskedView
    style={{ alignSelf: 'stretch' }}
    maskElement={
      <View style={{ alignItems: 'center', backgroundColor: 'transparent' }}>
        <Text style={style}>{text}</Text>
      </View>
    }
  >
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={{ alignSelf: 'stretch' }}
    >
      <Text style={[style, { opacity: 0 }]}>{text}</Text>
    </LinearGradient>
  </MaskedView>
);