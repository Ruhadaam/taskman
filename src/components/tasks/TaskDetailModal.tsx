import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Modal, StyleSheet, TextInput } from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { Task } from "../../types";

interface TaskDetailModalProps {
  visible: boolean;
  onClose: () => void;
  selectedTask: Task | null;
  onStatusChange: (
    status: "waiting" | "completed"
  ) => void;
  onDeleteTask: () => void;
  onSave: (title: string) => void;
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  visible,
  onClose,
  selectedTask,
  onDeleteTask,
  onSave,
}) => {
  if (!selectedTask) return null;

  const [editTitle, setEditTitle] = useState(selectedTask.title);

  useEffect(() => {
    if (selectedTask) {
      setEditTitle(selectedTask.title);
    }
  }, [selectedTask]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "#34C759";
      case "past_due":
        return "#FF3B30";
      default:
        return "#007AFF";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Tamamlanmış";
      case "past_due":
        return "Dünden Kalan";
      default:
        return "Beklemede";
    }
  };

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
              borderColor: getStatusColor(selectedTask.status),
            },
          ]}
        >
          <View
            style={[
              styles.modalHeader,
              {
                borderBottomColor: getStatusColor(selectedTask.status),
              },
            ]}
          >
            <View style={styles.headerLeft}>
              <TextInput
                style={styles.titleInput}
                value={editTitle}
                onChangeText={setEditTitle}
                placeholder="Başlık"
              />
            </View>
            <View style={styles.headerRight}>

              <View style={styles.headerIcons}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteIcon]}


                  onPress={() => {

                    try {
                      onDeleteTask();
                    } catch (e) {
                      console.error("Error calling onDeleteTask:", e);
                    }
                  }}
                >
                  <Icon name="delete" size={20} color="#FF3B30" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.closeButton]}
                  onPress={onClose}
                >
                  <Icon name="close" size={20} color="#333" />
                </TouchableOpacity>
              </View>
            </View>
          </View>


          <View style={styles.bottomContainer}>
            <TouchableOpacity
              style={styles.submitButton}
              onPress={() => onSave(editTitle)}
            >
              <Text style={styles.submitButtonText}>Kaydet</Text>
            </TouchableOpacity>
          </View>

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
  titleInput: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#fff",
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
  closeButton: {
    backgroundColor: "#f5f5f5",
  },
});

export default TaskDetailModal;
