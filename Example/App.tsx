import { FC, useEffect, useRef, useState } from "react";
import {
  FlatList,
  FlatListProps,
  GestureResponderEvent,
  LayoutChangeEvent,
  ListRenderItemInfo,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { PanGestureHandler } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
} from "react-native-reanimated";

/**
 * From https://stackoverflow.com/a/1484514.
 */
function getRandomColor() {
  const letters = "0123456789ABCDEF";

  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }

  return color;
}

const AnimatedFlatList = Animated.createAnimatedComponent<FlatListProps<number>>(FlatList);

export const App: FC = () => {
  const [data, setData] = useState<number[]>([]);
  const [colors, setColors] = useState<string[]>([]);

  const listContainerRef = useRef<View>(null);
  const listRef = useRef<FlatList<number>>(null);
  const listContentOffsetY = useSharedValue(0);
  const itemHeights = useSharedValue<number[]>([]);

  const draggedItemIndex = useSharedValue<number | null>(null);
  const [draggedItem, setDraggedItem] = useState<number>();
  const setDraggedItemByIndex = (index: number | null) => {
    if (index == null) {
      setDraggedItem(undefined);
    } else {
      setDraggedItem(data[index]);
    }
  };
  useDerivedValue(() => {
    runOnJS(setDraggedItemByIndex)(draggedItemIndex.value);
  }, [draggedItemIndex, data]);

  const hoverItemOffsetX = useSharedValue(0);
  const hoverItemOffsetY = useSharedValue(0);
  const hoverItemTranslateX = useSharedValue(0);
  const hoverItemTranslateY = useSharedValue(0);
  const hoverItemAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: hoverItemTranslateX.value },
      { translateY: hoverItemTranslateY.value },
    ],
  }));

  const panGestureHandler = useAnimatedGestureHandler({
    // onStart: event => console.log(`start: ${event}`),
    onActive: event => {
      hoverItemTranslateX.value = hoverItemOffsetX.value + event.translationX;
      hoverItemTranslateY.value = hoverItemOffsetY.value + event.translationY;
    },
    // onCancel: event => console.log(`cancel: ${event}`),
    // onFail: event => console.log(`fail: ${event}`),
    onEnd: () => {
      draggedItemIndex.value = null;
    },
    // onFinish: event => console.log(`finish: ${event}`),
  });

  const handleScroll = useAnimatedScrollHandler({
    onScroll: event => {
      listContentOffsetY.value = event.contentOffset.y;
    },
  });

  useEffect(() => {
    const newData = [];
    const rowColors = [];
    for (let i = 0; i < 1000; i++) {
      newData.push(i);
      rowColors.push(getRandomColor());
    }

    setData(newData);
    setColors(rowColors);
  }, []);

  const handleLongPress = (event: GestureResponderEvent, index?: number) => {
    if (index == null) {
      return;
    }

    listRef.current?.setNativeProps({ scrollEnabled: false });
    draggedItemIndex.value = index;

    listContainerRef.current?.measure((_x, _y, _width, _height, listPageX, listPageY) => {
      const { pageX, pageY, locationX, locationY } = event.nativeEvent;

      hoverItemOffsetX.value = pageX - listPageX - locationX;
      hoverItemOffsetY.value = pageY - listPageY - locationY;
      hoverItemTranslateX.value = pageX - listPageX - locationX;
      hoverItemTranslateY.value = pageY - listPageY - locationY;
    });
  };

  const handleItemLayout = (event: LayoutChangeEvent, index?: number) => {
    if (index == null) {
      return;
    }

    itemHeights.value[index] = event.nativeEvent.layout.height;
  };

  const renderItem = ({ item, index }: Partial<ListRenderItemInfo<number>>) => {
    const dynamicStyle = {
      backgroundColor: colors[item as number],
    };

    return (
      <Pressable
        onLongPress={event => handleLongPress(event, index)}
        onLayout={event => handleItemLayout(event, index)}
      >
        <View style={[styles.item, dynamicStyle]}>
          <Text style={styles.itemTitle}>{item}</Text>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView>
      <PanGestureHandler
        onGestureEvent={panGestureHandler}
        simultaneousHandlers={listRef}
        onEnded={() => listRef.current?.setNativeProps({ scrollEnabled: true })}
      >
        <Animated.View>
          <View ref={listContainerRef}>
            <AnimatedFlatList
              data={data}
              renderItem={renderItem}
              keyExtractor={item => item.toString()}
              scrollEventThrottle={16}
              onScroll={handleScroll}
              ref={listRef}
            />
          </View>
          <Animated.View style={[styles.hoverItem, hoverItemAnimatedStyle]}>
            {draggedItem && renderItem({ item: draggedItem })}
          </Animated.View>
        </Animated.View>
      </PanGestureHandler>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  item: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  itemTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  muted: {
    opacity: 0.2,
  },
  hover: {
    borderWidth: 5,
    zIndex: 999,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.37,
    shadowRadius: 7.49,
    elevation: 12,
  },
  hoverItem: {
    position: "absolute",
    opacity: 0.8,
    width: "100%",
  },
});
