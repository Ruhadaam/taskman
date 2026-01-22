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
}

const TaskItem: React.FC<TaskItemProps> = ({
    item,
    onToggle,
    onPress,
    isCompleting,
    borderLeftColor,
    date,
    rightContent,
}) => {
    const isCompletedOrCompleting =
        item.status === "completed" || isCompleting;

    return (
        <View style={styles.todoItem}>
            <View style={[styles.indicator, { backgroundColor: borderLeftColor }]} />
            <TouchableOpacity
                style={[
                    styles.checkbox,
                    isCompletedOrCompleting && styles.checkboxChecked,
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
                        isCompletedOrCompleting && styles.todoTitleCompleted,
                    ]}
                    numberOfLines={1}
                >
                    {item.title}
                </Text>
                {date && (
                    <Text style={styles.dateText}>
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
