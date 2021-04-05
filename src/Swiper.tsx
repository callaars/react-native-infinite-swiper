import React, { useMemo } from 'react';
import { View } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import Animated, {
  abs,
  add,
  block,
  cond,
  eq,
  greaterThan,
  multiply,
  set,
  sub,
  useCode,
  useValue,
  Value,
} from 'react-native-reanimated';
import { usePanGestureHandler } from 'react-native-redash';
import Card from './Card';

type SwiperProps = {
  width: number;
  height: number;
  renderItem: (index: Value<number>, isFocused: Value<0 | 1>) => JSX.Element;
};

const subtractOffset = (offset: Value<number>) =>
  block([cond(eq(offset, 0), 2, sub(offset, 1))]);

const addOffset = (offset: Value<number>) =>
  block([cond(eq(offset, 2), 0, add(offset, 1))]);

export const Swiper = React.memo((props: SwiperProps) => {
  const { height, width, renderItem } = props;

  //#region Boilerplate
  const translateX = useValue<number>(0);
  const startX = useValue<number>(0);
  const paneWidth = useValue<number>(width);
  const snapWidth = useValue<number>(width / 2);

  const { state, gestureHandler, translation } = usePanGestureHandler();

  const offsets = useMemo(
    () => [
      new Value<0 | 1 | 2>(0),
      new Value<0 | 1 | 2>(1),
      new Value<0 | 1 | 2>(2),
    ],
    []
  );

  const index = useValue<number>(0);
  //#endregion

  useCode(
    () => [
      cond(eq(state, State.BEGAN), [set(startX, translateX)]),
      cond(eq(state, State.ACTIVE), [
        set(translateX, add(startX, translation.x)),
      ]),
      cond(eq(state, State.END), [
        cond(
          greaterThan(abs(translation.x), snapWidth),
          [
            // We need to snap
            cond(
              greaterThan(translation.x, 0),
              [
                // Move right
                set(translateX, paneWidth),
                set(index, sub(index, 1)),
              ],
              [
                // Move left
                set(translateX, multiply(paneWidth, -1)),
                set(index, add(index, 1)),
              ]
            ),
          ],
          // Don't snap just reset the translation
          set(translateX, startX)
        ),

        cond(
          eq(translateX, paneWidth),
          [
            // We have moved right
            set(offsets[0], subtractOffset(offsets[0])),
            set(offsets[1], subtractOffset(offsets[1])),
            set(offsets[2], subtractOffset(offsets[2])),
            set(translateX, 0),
          ],
          cond(eq(translateX, multiply(paneWidth, -1)), [
            // We have moved left
            set(offsets[0], addOffset(offsets[0])),
            set(offsets[1], addOffset(offsets[1])),
            set(offsets[2], addOffset(offsets[2])),
            set(translateX, 0),
          ])
        ),
      ]),
    ],
    []
  );

  return (
    <View collapsable={false} style={{ width, height }}>
      <PanGestureHandler {...gestureHandler}>
        <Animated.View
          style={{ width, height, transform: [{ translateX }] }}
          collapsable={false}
        >
          <Card
            key="card-0"
            {...{ renderItem, offset: offsets[0], width, height, index }}
          />
          <Card
            key="card-1"
            {...{ renderItem, offset: offsets[1], width, height, index }}
          />
          <Card
            key="card-2"
            {...{ renderItem, offset: offsets[2], width, height, index }}
          />
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
});

export default Swiper;
