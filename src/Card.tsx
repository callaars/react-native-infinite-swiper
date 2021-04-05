import React from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  add,
  cond,
  eq,
  multiply,
  set,
  sub,
  useCode,
  useValue,
  Value,
} from 'react-native-reanimated';

type CardProps = {
  renderItem: (index: Value<number>, isFocused: Value<0 | 1>) => JSX.Element;
  offset: Value<0 | 1 | 2>;
  width: number;
  height: number;
  index: Value<number>;
};

const Card = (props: CardProps) => {
  const { offset, renderItem, width, height, index } = props;

  //#region Boilerplate
  const translateX = useValue<number>(0);
  const realIndex = useValue<number>(0);
  const isFocused = useValue<0 | 1>(0);
  //#endregion

  useCode(
    () => [
      set(translateX, sub(width, multiply(width, offset))),
      cond(
        eq(offset, 2),
        set(realIndex, sub(index, 1)),
        cond(
          eq(offset, 0),
          set(realIndex, add(index, 1)),
          set(realIndex, index)
        )
      ),
      cond(eq(offset, 1), set(isFocused, 1), set(isFocused, 0)),
    ],
    [width]
  );

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFillObject,
        { width, height },
        { transform: [{ translateX }] },
      ]}
    >
      {renderItem(realIndex, isFocused)}
    </Animated.View>
  );
};

export default Card;
