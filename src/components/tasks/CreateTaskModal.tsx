import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  StyleSheet,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { Task, User } from "../../types";

interface CreateTaskModalProps {
  visible: boolean;
  onClose: () => void;
  newTask: Task;
  users: User[];
  showUserDropdown: boolean;
  onUserDropdownToggle: () => void;
  onUserSelect: (userId: string) => void;
  onTaskChange: (field: keyof Task, value: any) => void;
  onCreateTask: () => void;
}

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  visible,
  onClose,
  newTask,
  users,
  showUserDropdown,
  onUserDropdownToggle,
  onUserSelect,
  onTaskChange,
  onCreateTask,
}) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Yeni Görev Ekle</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Görev Başlığı"
            value={newTask.title}
            onChangeText={(text) => onTaskChange("title", text)}
          />

          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Görev Açıklaması"
            value={newTask.description}
            onChangeText={(text) => onTaskChange("description", text)}
            multiline
            numberOfLines={4}
          />

          <TouchableOpacity style={styles.input} onPress={onUserDropdownToggle}>
            <Text style={styles.dropdownText}>
              {newTask.assignedTo.length > 0
                ? `${newTask.assignedTo.length} kullanıcı seçildi`
                : "Kullanıcı Seç"}
            </Text>
          </TouchableOpacity>

          {showUserDropdown && (
            <View style={styles.dropdownContainer}>
              <ScrollView style={styles.dropdownList}>
                {users.map((user) => (
                  <TouchableOpacity
                    key={user.id}
                    style={[
                      styles.dropdownItem,
                      newTask.assignedTo.includes(user.id) &&
                        styles.selectedItem,
                    ]}
                    onPress={() => onUserSelect(user.id)}
                  >
                    <Text style={styles.dropdownItemText}>{user.name}</Text>
                    {newTask.assignedTo.includes(user.id) && (
                      <Icon name="check" size={20} color="#007AFF" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity
                style={styles.submitButton}
                onPress={onUserDropdownToggle}
              >
                <Text style={styles.submitButtonText}>Tamam</Text>
              </TouchableOpacity>
            </View>
          )}

          <TextInput
            style={styles.input}
            placeholder="Son Tarih (YYYY-MM-DD)"
            value={newTask.dueDate.toISOString().split("T")[0]}
            onChangeText={(text) => {
              const date = new Date(text);
              if (!isNaN(date.getTime())) {
                onTaskChange("dueDate", date);
              }
            }}
          />

          <TouchableOpacity style={styles.submitButton} onPress={onCreateTask}>
            <Text style={styles.submitButtonText}>Görev Oluştur</Text>
          </TouchableOpacity>
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
    borderColor: "#007AFF",
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
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
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
  dropdownText: {
    fontSize: 16,
    color: "#333",
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
});

export default CreateTaskModal;
