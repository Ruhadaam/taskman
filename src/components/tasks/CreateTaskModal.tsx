import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  StyleSheet,
  Platform,
} from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useTheme } from "../../context/ThemeContext";
import { Task } from "../../types";

interface CreateTaskModalProps {
  visible: boolean;
  onClose: () => void;
  newTask: Task;
  onTaskChange: (field: keyof Task, value: any) => void;
  onCreateTask: () => void;
  onCreateRecurringTask?: (title: string) => void;
}

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  visible,
  onClose,
  newTask,
  onTaskChange,
  onCreateTask,
  onCreateRecurringTask,
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const { colors, isDark } = useTheme();

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "Europe/Istanbul",
    }).format(date);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      onTaskChange("createdAt", selectedDate);
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
        <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.primary }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Yeni Görev Ekle</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.inputBackground }]}
            placeholder="Görev Başlığı"
            placeholderTextColor={colors.textSecondary}
            value={newTask.title}
            onChangeText={(text) => onTaskChange("title", text)}
          />

          <TouchableOpacity
            style={[styles.datePickerButton, { borderColor: colors.border, backgroundColor: colors.inputBackground }]}
            onPress={() => setShowDatePicker(true)}
          >
            <View style={styles.datePickerContent}>
              <Icon name="calendar-today" size={20} color={colors.primary} />
              <Text style={[styles.datePickerText, { color: colors.text }]}>
                {newTask.createdAt
                  ? formatDate(newTask.createdAt)
                  : "Tarih Seçin"}
              </Text>
            </View>
          </TouchableOpacity>

          {showDatePicker && (
            <>
              {Platform.OS === "ios" && (
                <View style={styles.iosPickerContainer}>
                  <View style={[styles.iosPickerHeader, { borderBottomColor: colors.border }]}>
                    <TouchableOpacity
                      onPress={() => setShowDatePicker(false)}
                      style={styles.iosPickerDoneButton}
                    >
                      <Text style={[styles.iosPickerDoneText, { color: colors.primary }]}>Tamam</Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={newTask.createdAt || new Date()}
                    mode="date"
                    display="spinner"
                    onChange={handleDateChange}
                    themeVariant={isDark ? "dark" : "light"}
                  />
                </View>
              )}
              {Platform.OS === "android" && (
                <DateTimePicker
                  value={newTask.createdAt || new Date()}
                  mode="date"
                  display="default"
                  onChange={handleDateChange}
                />
              )}
            </>
          )}

          <TouchableOpacity
            style={[styles.checkboxContainer, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}
            onPress={() => setIsRecurring(!isRecurring)}
          >
            <View style={[styles.checkbox, { backgroundColor: isRecurring ? colors.primary : colors.card, borderColor: isRecurring ? colors.primary : colors.border }]}>
              {isRecurring && <Icon name="check" size={16} color="#fff" />}
            </View>
            <Text style={[styles.checkboxLabel, { color: colors.text }]}>Sabit Görev (Her gün tekrarlar)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: colors.primary }]}
            onPress={() => {
              if (isRecurring && onCreateRecurringTask) {
                onCreateRecurringTask(newTask.title);
                setIsRecurring(false);
              } else {
                onCreateTask();
              }
            }}
          >
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
  datePickerButton: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    backgroundColor: "#fff",
  },
  datePickerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  datePickerText: {
    fontSize: 16,
    color: "#333",
  },
  iosPickerContainer: {
    marginBottom: 15,
  },
  iosPickerHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  iosPickerDoneButton: {
    paddingHorizontal: 15,
    paddingVertical: 5,
  },
  iosPickerDoneText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "600",
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    backgroundColor: "#f9f9f9",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#eee",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#ccc",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    backgroundColor: "#fff",
  },
  checkboxChecked: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  checkboxLabel: {
    fontSize: 16,
    color: "#333",
  },
});

export default CreateTaskModal;
