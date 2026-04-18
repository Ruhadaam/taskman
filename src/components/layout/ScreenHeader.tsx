import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  title: string;
  right?: React.ReactNode;
  left?: React.ReactNode;
  bottomBorder?: boolean;
};

export default function ScreenHeader({
  title,
  right,
  left,
  bottomBorder = true,
}: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderBottomColor: colors.border,
          borderBottomWidth: bottomBorder ? StyleSheet.hairlineWidth : 0,
          paddingVertical:20

        },
      ]}
    >
      <View style={styles.row}>
        <View style={styles.leftSlot}>{left}</View>
        <View style={styles.titleWrap}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        </View>
        <View style={styles.rightSlot}>{right}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 32,
  },
  leftSlot: {
    flex: 0,
    justifyContent: "center",
  },
  rightSlot: {
    flex: 0,
    justifyContent: "center",
    alignItems: "flex-end",
  },
  titleWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
});
