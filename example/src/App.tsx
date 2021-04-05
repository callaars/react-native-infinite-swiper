import { Swiper } from '@callaars/react-native-infinite-swiper';
import * as React from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import type { Value } from 'react-native-reanimated';
import Test from './Test';

export default function App() {
  const { width, height } = useWindowDimensions();

  const listWidth = width;

  const renderItem = (index: Value<number>, isFocused: Value<0 | 1>) => (
    <Test {...{ index, isFocused }} />
  );

  return (
    <View style={styles.container}>
      <Swiper {...{ width: listWidth, height, renderItem }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
