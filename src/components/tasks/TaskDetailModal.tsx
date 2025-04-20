import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { Task, User } from "../../types";

interface TaskDetailModalProps {
  visible: boolean;
  onClose: () => void;
  selectedTask: Task | null;
  users: User[];
  showUserDropdown: boolean;
  showStatusDropdown: boolean;
  onStatusDropdownToggle: () => void;
  onUserDropdownToggle: () => void;
  onUserSelect: (userId: string) => void;
  onSaveUsers: () => void;
  onStatusChange: (
    status: "waiting" | "in-progress" | "completed" | "past_due"
  ) => void;
  getInitials: (name: string) => string;
  getRandomColor: (name: string) => string;
  renderStatusDropdown: () => React.ReactNode;
  onDeleteTask: () => void;
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  visible,
  onClose,
  selectedTask,
  users,
  showUserDropdown,
  showStatusDropdown,
  onStatusDropdownToggle,
  onUserDropdownToggle,
  onUserSelect,
  onSaveUsers,
  getInitials,
  getRandomColor,
  renderStatusDropdown,
  onDeleteTask,
}) => {
  if (!selectedTask) return null;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View
          style={[
            styles.modalContent,
            {
              borderColor:
                selectedTask.status === "completed"
                  ? "#34C759"
                  : selectedTask.status === "past_due"
                  ? "#FF3B30"
                  : selectedTask.status === "waiting"
                  ? "#007AFF"
                  : selectedTask.status === "in-progress"
                  ? "#FF9500"
                  : "#ffff",
            },
          ]}
        >
          <View
            style={[
              styles.modalHeader,
              {
                borderBottomColor:
                  selectedTask.status === "completed"
                    ? "#34C759"
                    : selectedTask.status === "past_due"
                    ? "#FF3B30"
                    : selectedTask.status === "waiting"
                    ? "#007AFF"
                    : selectedTask.status === "in-progress"
                    ? "#FF9500"
                    : "#ffff",
              },
            ]}
          >
            <View style={styles.headerLeft}>
              <Text style={styles.modalTitle}>{selectedTask.title}</Text>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity onPress={onStatusDropdownToggle}>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        selectedTask.status === "completed"
                          ? "#34C759"
                          : selectedTask.status === "past_due"
                          ? "#FF3B30"
                          : selectedTask.status === "waiting"
                          ? "#007AFF"
                          : selectedTask.status === "in-progress"
                          ? "#FF9500"
                          : "#ffff",
                    },
                  ]}
                >
                  <Text style={styles.statusText}>{selectedTask.status}</Text>
                </View>
              </TouchableOpacity>
              {showStatusDropdown && renderStatusDropdown()}
              <View style={styles.headerIcons}>
                <TouchableOpacity
                  style={styles.deleteIcon}
                  onPress={onDeleteTask}
                >
                  <Icon name="delete" size={24} color="#8E8E93" />
                </TouchableOpacity>
                <TouchableOpacity onPress={onClose}>
                  <Icon name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <Text style={styles.detailDescription}>
            {selectedTask.description}
          </Text>
          <View style={styles.bottomContainer}>
            <View style={styles.leftContainer}>
              <View style={styles.dateContainer}>
                <Icon
                  name="event"
                  size={16}
                  color="#666"
                  style={styles.dateIcon}
                />
                <Text style={styles.detailValue}>
                  {selectedTask.dueDate
                    ? new Date(selectedTask.dueDate).toLocaleDateString(
                        "tr-TR",
                        {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        }
                      )
                    : "Tarih belirtilmemiş"}
                </Text>
              </View>
            </View>
            <View style={styles.rightContainer}>
              <View style={styles.taskUsers}>
                {selectedTask.assignedTo.slice(0, 3).map((userId) => {
                  const user = users.find((u) => u.id.toString() === userId);
                  return (
                    <View
                      key={userId}
                      style={[
                        styles.userBadge,
                        {
                          backgroundColor: getRandomColor(user?.name || ""),
                        },
                      ]}
                    >
                      <Text style={styles.initialsText}>
                        {getInitials(user?.name || "")}
                      </Text>
                    </View>
                  );
                })}
                {selectedTask.assignedTo.length > 3 && (
                  <View
                    style={[styles.userBadge, { backgroundColor: "#8E8E93" }]}
                  >
                    <Text style={styles.initialsText}>
                      +{selectedTask.assignedTo.length - 3}
                    </Text>
                  </View>
                )}
              </View>
              <TouchableOpacity
                style={[styles.actionButton, styles.editButton]}
                onPress={onUserDropdownToggle}
              >
                <Icon name="add" size={20} color="#007AFF" />
              </TouchableOpacity>
            </View>
          </View>

          {showUserDropdown && (
            <View style={styles.dropdownContainer}>
              <ScrollView style={styles.dropdownList}>
                {users.map((user) => (
                  <TouchableOpacity
                    key={user.id}
                    style={[
                      styles.dropdownItem,
                      selectedTask.assignedTo.includes(user.id) &&
                        styles.selectedItem,
                    ]}
                    onPress={() => onUserSelect(user.id)}
                  >
                    <Text style={styles.dropdownItemText}>{user.name}</Text>
                    {selectedTask.assignedTo.includes(user.id) && (
                      <Icon name="check" size={20} color="#007AFF" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity
                style={styles.submitButton}
                onPress={onSaveUsers}
              >
                <Text style={styles.submitButtonText}>Kaydet</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    width: "90%",
    maxHeight: "80%",
    borderWidth: 2,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 2,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  detailDescription: {
    fontSize: 16,
    color: "#666",
    marginBottom: 16,
    lineHeight: 24,
  },
  bottomContainer: {
    marginTop: "auto",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  leftContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  rightContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  dateIcon: {
    marginRight: 6,
  },
  detailValue: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  editButton: {
    backgroundColor: "#E5F1FF",
  },
  dropdownContainer: {
    maxHeight: 200,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: "#fff",
  },
  dropdownList: {
    maxHeight: 200,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selectedItem: {
    backgroundColor: "#f0f8ff",
  },
  dropdownItemText: {
    fontSize: 16,
    color: "#333",
  },
  submitButton: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
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
    fontSize: 14,
    fontWeight: "bold",
  },
  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  deleteIcon: {
    padding: 4,
  },
});

export default TaskDetailModal;
