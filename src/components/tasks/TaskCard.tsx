import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { Task, User } from "../../types";

interface TaskCardProps {
  item: Task;
  users: User[];
  onPress: () => void;
  onComplete?: (taskId: string) => void;
  getInitials: (name: string) => string;
  getRandomColor: (name: string) => string;
}

const TaskCard: React.FC<TaskCardProps> = ({
  item,
  users,
  onPress,
  onComplete,
  getInitials,
  getRandomColor,
}) => {
  const [isCompleting, setIsCompleting] = React.useState(false);

  const handleCheckboxPress = () => {
    if (isCompleting) return;
    setIsCompleting(true);
    // Slight delay before keeping the promise to the user
    setTimeout(() => {
      if (onComplete && item.id) {
        onComplete(item.id);
      } else {
        setIsCompleting(false);
      }
    }, 800);
  };

  const statusColor =
    item.status === "completed"
      ? "#34C759"
      : item.status === "past_due"
        ? "#FF3B30"
        : "#007AFF";

  const creator = users.find((u) => u.id.toString() === item.createdBy);
  return (
    <TouchableOpacity style={styles.taskCard} onPress={onPress}>
      <View
        style={[styles.statusIndicator, { backgroundColor: statusColor }]}
      />
      <View style={styles.taskContent}>
        <View style={styles.taskInfo}>
          <View style={styles.titleContainer}>
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={handleCheckboxPress}
              activeOpacity={0.6}
            >
              <View style={[
                styles.checkbox,
                (isCompleting || item.status === "completed") && styles.checkboxChecked
              ]}>
                {(isCompleting || item.status === "completed") && (
                  <Icon name="check" size={16} color="#fff" />
                )}
              </View>
            </TouchableOpacity>
            <Text
              style={[
                styles.taskTitle,
                (isCompleting || item.status === "completed") && { textDecorationLine: "line-through", color: "#999" }
              ]}
              numberOfLines={1}
            >
              {item.title}
            </Text>
          </View>
          <View style={styles.creatorInfo}>
            <View
              style={[
                styles.creatorInitialsBadge,
                { backgroundColor: getRandomColor(creator?.name || "") },
              ]}
            >
              <Text style={styles.creatorInitials}>
                {getInitials(creator?.name || "")}
              </Text>
            </View>
          </View>
        </View>

      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  taskCard: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    position: "relative",
    marginLeft: 6,
  },
  taskContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  taskInfo: {
    flex: 1,
    marginRight: 8,
  },
  taskTitle: {
    fontSize: 16,
    color: "#333",
    flex: 1,
    marginRight: 8,
  },
  taskUsers: {
    flexDirection: "row",
    alignItems: "center",
  },
  userBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 4,
  },
  initialsText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
    textAlignVertical: "center",
  },
  statusIndicator: {
    width: 6,
    height: "150%",
    position: "absolute",
    left: 0,
    top: 0,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  creatorInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  creatorInitialsBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  creatorInitials: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
    textAlign: "center",
    textAlignVertical: "center",
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  checkboxContainer: {
    marginRight: 4,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#C7C7CC",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  checkboxChecked: {
    backgroundColor: "#34C759", // iOS Green
    borderColor: "#34C759",
  },
  warningIcon: {
    marginLeft: 4,
  },
});

export default TaskCard;
