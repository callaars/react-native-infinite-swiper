import React, { useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import { call, useCode, Value } from 'react-native-reanimated';

type TestProps = {
  scrollToIndex: (index: number) => void;
  index: Value<number>;
  isFocused: Value<0 | 1>;
};

const Test = (props: TestProps) => {
  const { index: animatedIndex, isFocused, scrollToIndex } = props;

  const [index, setIndex] = useState<number | null>(null);
  const [hasFocus, setHasFocus] = useState<boolean>(false);

  useCode(
    () =>
      call([animatedIndex, isFocused], ([animIndex, focus]) => {
        setIndex(animIndex);
        setHasFocus(focus === 1);
      }),
    []
  );

  const [backgroundColor] = useState(randomColor());
  const randomNumber = Math.round(Math.random() * 1000 - 500);

  const onPress = () => scrollToIndex(randomNumber);

  if (index === null) {
    return null;
  }

  return (
    <View style={[styles.view, { backgroundColor }]}>
      <Text style={styles.text}>{index}</Text>
      <Text style={styles.text}>Focused: {hasFocus ? 'Yes!' : 'No'}</Text>
      <Button {...{ title: `Go to ${randomNumber}`, onPress }} />
    </View>
  );
};

const getColor = () => Math.round(Math.random() * 255);
const randomColor = () => `rgb(${getColor()}, ${getColor()}, ${getColor()})`;

const styles = StyleSheet.create({
  view: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 30,
  },
});

export default Test;
