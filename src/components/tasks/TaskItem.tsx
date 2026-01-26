import React, { memo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { Task } from "../../types";

interface TaskItemProps {
    item: Task;
    onToggle: (task: Task) => void;
    onPress: (task: Task) => void;
    isCompleting: boolean;
    borderLeftColor: string;
    date?: string;
    rightContent?: React.ReactNode;
    themeColors?: any;
}

const TaskItem: React.FC<TaskItemProps> = ({
    item,
    onToggle,
    onPress,
    isCompleting,
    borderLeftColor,
    date,
    rightContent,
    themeColors,
}) => {
    const isCompletedOrCompleting =
        item.status === "completed" || isCompleting;

    const bg = themeColors ? themeColors.card : "#fff";
    const text = themeColors ? themeColors.text : "#333";
    const border = themeColors ? themeColors.border : "#eee";
    const subText = themeColors ? themeColors.textSecondary : "#666";

    return (
        <View style={[styles.todoItem, { backgroundColor: bg, borderColor: border }]}>
            <View style={[styles.indicator, { backgroundColor: borderLeftColor }]} />
            <TouchableOpacity
                style={[
                    styles.checkbox,
                    isCompletedOrCompleting && styles.checkboxChecked,
                    { borderColor: isCompletedOrCompleting ? "#34C759" : subText, backgroundColor: isCompletedOrCompleting ? "#34C759" : bg }
                ]}
                onPress={() => onToggle(item)}
            >
                {isCompletedOrCompleting && (
                    <Icon name="check" size={16} color="#fff" />
                )}
            </TouchableOpacity>
            <TouchableOpacity
                style={styles.todoContent}
                onPress={() => onPress(item)}
            >
                <Text
                    style={[
                        styles.todoTitle,
                        { color: text },
                        isCompletedOrCompleting && [styles.todoTitleCompleted, { color: subText }],
                    ]}
                    numberOfLines={1}
                >
                    {item.title}
                </Text>
                {date && (
                    <Text style={[styles.dateText, { color: subText }]}>
                        {date}
                    </Text>
                )}
            </TouchableOpacity>
            {rightContent && (
                <View style={styles.rightContentContainer}>
                    {rightContent}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    todoItem: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        borderRadius: 10,
        padding: 12,
        paddingLeft: 17, // Added padding to account for indicator width + spacing
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#eee",
        overflow: "hidden",
        position: "relative",
    },
    indicator: {
        position: "absolute",
        left: 0,
        top: 0,
        bottom: 0,
        width: 5,
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: "#ccc",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
        backgroundColor: "#fff",
    },
    checkboxChecked: {
        backgroundColor: "#34C759",
        borderColor: "#34C759",
    },
    todoContent: {
        flex: 1,
    },
    todoTitle: {
        fontSize: 16,
        color: "#333",
        fontWeight: "600",
        marginBottom: 4,
    },
    todoTitleCompleted: {
        color: "#8E8E93",
        textDecorationLine: "line-through",
    },
    dateText: {
        fontSize: 12,
        color: "#666",
        marginTop: 4,
    },
    rightContentContainer: {
        marginLeft: 8,
    },
});

export default memo(TaskItem);
