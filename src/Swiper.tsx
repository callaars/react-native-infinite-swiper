import React from 'react';
import { View } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import Animated, {
  add,
  and,
  block,
  Clock,
  clockRunning,
  cond,
  eq,
  greaterThan,
  lessThan,
  neq,
  not,
  set,
  spring,
  startClock,
  stopClock,
  sub,
  useCode,
  useValue,
  Value,
} from 'react-native-reanimated';
import { snapPoint, usePanGestureHandler } from 'react-native-redash';
import { useMemoOne } from 'use-memo-one';
import Card from './Card';

//#region withSpring
interface PrivateSpringConfig extends Animated.SpringConfig {
  toValue: Animated.Value<number>;
}

type WithSpringProps = {
  value: Value<number>;
  xPosition: Value<number>;
  index: Value<number>;
  offsets: Value<number>[];
  velocity: Value<number>;
  overrideSpring: Value<number>;
  state: Value<State>;
  snapPoints: Animated.Adaptable<number>[];
  forceToIndex: Value<number>;
};

const withSpring = ({
  value,
  xPosition,
  index,
  offsets,
  state,
  snapPoints,
  velocity,
  forceToIndex,
  overrideSpring,
}: WithSpringProps) => {
  //#region Boilerplate
  const clock = new Clock();
  const gestureAndAnimationIsOver = new Value(1);

  const config: PrivateSpringConfig = {
    toValue: new Value(0),
    damping: 40,
    mass: 1,
    stiffness: 300,
    overshootClamping: false,
    restSpeedThreshold: 1,
    restDisplacementThreshold: 1,
  };

  const configOverride: PrivateSpringConfig = {
    toValue: new Value(0),
    damping: 30,
    mass: 1,
    stiffness: 300,
    overshootClamping: true,
    restSpeedThreshold: 1,
    restDisplacementThreshold: 1,
  };

  const springState: Animated.SpringState = {
    position: new Value(0),
    time: new Value(0),
    finished: new Value(0),
    velocity: new Value(0),
  };
  //#endregion

  const isSpringInterrupted = and(eq(state, State.BEGAN), clockRunning(clock));

  const finishSpring = [
    stopClock(clock),
    set(overrideSpring, 0),
    cond(greaterThan(springState.position, 100), [
      set(index, sub(index, 1)),
      set(offsets[0], subtractOffset(offsets[0])),
      set(offsets[1], subtractOffset(offsets[1])),
      set(offsets[2], subtractOffset(offsets[2])),
    ]),
    cond(lessThan(springState.position, -100), [
      set(index, add(index, 1)),
      set(offsets[0], addOffset(offsets[0])),
      set(offsets[1], addOffset(offsets[1])),
      set(offsets[2], addOffset(offsets[2])),
    ]),
    set(springState.position, 0),
    set(xPosition, 0),
  ];

  return block([
    cond(isSpringInterrupted, finishSpring),
    cond(gestureAndAnimationIsOver, set(springState.position, 0)),
    cond(and(not(overrideSpring), neq(state, State.END)), [
      set(gestureAndAnimationIsOver, 0),
      set(springState.finished, 0),
      set(springState.position, value),
      set(xPosition, springState.position),
    ]),
    cond(overrideSpring, [
      cond(not(clockRunning(clock)), [
        cond(
          lessThan(forceToIndex, index),
          [
            // We are going left
            set(index, add(forceToIndex, 1)),
            set(springState.finished, 0),
            set(springState.velocity, 50),
            set(springState.time, 0),
            set(configOverride.toValue, snapPoints[2]),
            startClock(clock),
          ],
          [
            // We are going right
            set(index, sub(forceToIndex, 1)),
            set(springState.finished, 0),
            set(springState.velocity, -50),
            set(springState.time, 0),
            set(gestureAndAnimationIsOver, 0),
            set(configOverride.toValue, snapPoints[0]),
            startClock(clock),
          ]
        ),
      ]),
      spring(clock, springState, configOverride),
      cond(springState.finished, finishSpring),
    ]),
    cond(
      and(
        eq(state, State.END),
        not(gestureAndAnimationIsOver),
        not(overrideSpring)
      ),
      [
        cond(and(not(clockRunning(clock)), not(springState.finished)), [
          set(springState.velocity, velocity),
          set(springState.time, 0),
          set(
            config.toValue,
            snapPoint(springState.position, velocity, snapPoints)
          ),
          startClock(clock),
        ]),
        spring(clock, springState, config),
        cond(springState.finished, finishSpring),
      ]
    ),
    set(xPosition, springState.position),
  ]);
};
//#endregion

//#region subtract/addOffset
const subtractOffset = (offset: Value<number>) =>
  block([cond(eq(offset, 0), 2, sub(offset, 1))]);

const addOffset = (offset: Value<number>) =>
  block([cond(eq(offset, 2), 0, add(offset, 1))]);
//#endregion

export type RenderItem = (
  index: Value<number>,
  isFocused: Value<0 | 1>,
  scrollToIndex: (index: number) => void
) => JSX.Element;

type SwiperProps = {
  width: number;
  height: number;
  renderItem: RenderItem;
};

export const Swiper = React.memo((props: SwiperProps) => {
  //#region Boilerplate
  const { height, width, renderItem } = props;

  const definitiveTranslation = useValue<number>(0);
  const overrideSpring = useValue<number>(0);
  const forceToIndex = useValue<number>(0);

  const {
    state,
    gestureHandler,
    translation,
    velocity,
  } = usePanGestureHandler();

  const offsets = useMemoOne(
    () => [
      new Value<0 | 1 | 2>(0),
      new Value<0 | 1 | 2>(1),
      new Value<0 | 1 | 2>(2),
    ],
    []
  );

  const index = useValue<number>(0);

  const snapPoints = useMemoOne(
    () => [new Value(-width), new Value(0), new Value(width)],
    []
  );
  //#endregion

  useCode(
    () =>
      withSpring({
        value: translation.x,
        velocity: velocity.x,
        state,
        snapPoints,
        overrideSpring,
        offsets,
        index,
        xPosition: definitiveTranslation,
        forceToIndex,
      }),
    []
  );

  const scrollToIndex = (newIndex: number) => {
    forceToIndex.setValue(newIndex);
    overrideSpring.setValue(1);
  };

  return (
    <View collapsable={false} style={{ width, height }}>
      <PanGestureHandler {...gestureHandler}>
        <Animated.View
          style={{
            width,
            height,
            transform: [{ translateX: definitiveTranslation }],
          }}
          collapsable={false}
        >
          <Card
            key="card-0"
            {...{
              renderItem,
              offset: offsets[0],
              width,
              height,
              index,
              scrollToIndex,
            }}
          />
          <Card
            key="card-1"
            {...{
              renderItem,
              offset: offsets[1],
              width,
              height,
              index,
              scrollToIndex,
            }}
          />
          <Card
            key="card-2"
            {...{
              renderItem,
              offset: offsets[2],
              width,
              height,
              index,
              scrollToIndex,
            }}
          />
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
});

export default Swiper;
