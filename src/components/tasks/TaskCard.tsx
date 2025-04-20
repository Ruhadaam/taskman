import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { Task, User } from "../../types";

interface TaskCardProps {
  item: Task;
  users: User[];
  onPress: () => void;
  getInitials: (name: string) => string;
  getRandomColor: (name: string) => string;
}

const TaskCard: React.FC<TaskCardProps> = ({
  item,
  users,
  onPress,
  getInitials,
  getRandomColor,
}) => {
  const statusColor =
    item.status === "completed"
      ? "#34C759"
      : item.status === "in-progress"
      ? "#FF9500"
      : item.status === "past_due"
      ? "#FF3B30"
      : "#007AFF";

  const creator = users.find((u) => u.id.toString() === item.createdBy);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isOverdue =
    today > new Date(item.dueDate) && item.status !== "completed";

  return (
    <TouchableOpacity style={styles.taskCard} onPress={onPress}>
      <View
        style={[styles.statusIndicator, { backgroundColor: statusColor }]}
      />
      <View style={styles.taskContent}>
        <View style={styles.taskInfo}>
          <View style={styles.titleContainer}>
            <Text style={styles.taskTitle} numberOfLines={1}>
              {item.title}
            </Text>
            {isOverdue && (
              <Icon
                name="error"
                size={25}
                color="#FF3B30"
                style={styles.warningIcon}
              />
            )}
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
        <View style={styles.taskUsers}>
          {item.assignedTo.slice(0, 3).map((userId) => {
            const user = users.find((u) => u.id.toString() === userId);

            return (
              <View
                key={userId}
                style={[
                  styles.userBadge,
                  { backgroundColor: getRandomColor(user?.name || "") },
                ]}
              >
                <Text style={styles.initialsText}>
                  {getInitials(user?.name || "")}
                </Text>
              </View>
            );
          })}
          {item.assignedTo.length > 3 && (
            <View style={[styles.userBadge, { backgroundColor: "#8E8E93" }]}>
              <Text style={styles.initialsText}>
                +{item.assignedTo.length - 3}
              </Text>
            </View>
          )}
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
    height: "100%",
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
    gap: 8,
  },
  warningIcon: {
    marginLeft: 4,
  },
});

export default TaskCard;
