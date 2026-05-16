import React, { useEffect, useState, useRef } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Modal, 
  StyleSheet, 
  TextInput, 
  Platform, 
  Pressable, 
  Animated, 
  Dimensions,
  KeyboardAvoidingView
} from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { RecurringTask } from "../../types";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface RecurringTaskDetailModalProps {
  visible: boolean;
  onClose: () => void;
  selectedTask: RecurringTask | null;
  onDeleteTask: () => void;
  onSave: (title: string, daysOfWeek?: number[]) => void;
  onConvertToNormal?: (title: string) => void;
}

const RecurringTaskDetailModal: React.FC<RecurringTaskDetailModalProps> = ({
  visible,
  onClose,
  selectedTask,
  onDeleteTask,
  onSave,
  onConvertToNormal
}) => {
  const [editTitle, setEditTitle] = useState<string>("");
  const [isRecurring, setIsRecurring] = useState(true);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const { colors, isDark } = useTheme();

  const RECURRING_PURPLE = "#9C27B0";
  const activeColor = colors.primary;

  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const toggleAnim = useRef(new Animated.Value(1)).current;
  const [isModalVisible, setIsModalVisible] = useState(visible);

  useEffect(() => {
    Animated.timing(toggleAnim, {
      toValue: isRecurring ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isRecurring]);

  const daysList = [
    { id: 1, label: "P" },
    { id: 2, label: "S" },
    { id: 3, label: "Ç" },
    { id: 4, label: "P" },
    { id: 5, label: "C" },
    { id: 6, label: "C" },
    { id: 0, label: "P" },
  ];

  useEffect(() => {
    if (visible && selectedTask) {
      setIsModalVisible(true);
      setEditTitle(selectedTask.title);
      setIsRecurring(true);
      // Veritabanından gelen daysOfWeek bilgisini state'e aktarıyoruz
      setSelectedDays(selectedTask.daysOfWeek || []);
      
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
        tension: 50,
      }).start();
    } else if (!visible) {
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        setIsModalVisible(false);
      });
    }
  }, [visible, selectedTask]);

  const toggleDay = (dayId: number) => {
    setSelectedDays((prev) =>
      prev.includes(dayId) ? prev.filter((d) => d !== dayId) : [...prev, dayId]
    );
  };

  if (!isModalVisible && !visible) return null;

  return (
    <Modal
      animationType="none"
      transparent={true}
      visible={isModalVisible}
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View style={styles.modalOverlay}>
        <Pressable 
          style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.4)' }]} 
          onPress={onClose}
        />
        <Animated.View 
          style={[
            styles.modalContent, 
            { 
              backgroundColor: 'transparent',
              shadowOpacity: 0,
              elevation: 0,
              transform: [{ translateY: slideAnim }],
              padding: 0,
            }
          ]}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
            style={{ 
              width: "100%", 
              backgroundColor: colors.card,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 24,
              paddingBottom: Platform.OS === 'ios' ? 40 : 24,
              shadowColor: isDark ? "#000" : "#888",
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.1,
              shadowRadius: 10,
              elevation: 20,
            }}
          >
            <View style={styles.sheetHandleContainer}>
              <View style={[styles.sheetHandle, { backgroundColor: isDark ? '#444' : colors.border }]} />
            </View>
            
            <View style={[styles.modalHeader, { borderBottomColor: isDark ? '#333' : colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Sabit Görevi Düzenle</Text>
              <View style={styles.headerIcons}>
                <TouchableOpacity
                  onPress={onDeleteTask}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={styles.deleteButton}
                >
                  <Icon name="delete-outline" size={24} color={colors.danger} />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={onClose}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Icon name="close" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.input, 
                  { 
                    color: colors.text, 
                    borderColor: isRecurring ? activeColor : colors.border, 
                    backgroundColor: colors.inputBackground 
                  }
                ]}
                placeholder="Görev Başlığı"
                placeholderTextColor={colors.textSecondary}
                value={editTitle}
                maxLength={isRecurring ? 15 : 40}
                onChangeText={setEditTitle}
              />
              <Text style={[styles.charCount, { color: colors.textSecondary }]}>
                {editTitle.length} / {isRecurring ? 15 : 40}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.checkboxContainer, 
                { 
                  backgroundColor: isRecurring ? activeColor + '10' : colors.inputBackground, 
                  borderColor: isRecurring ? activeColor : colors.border,
                  marginBottom: isRecurring ? 12 : 24
                }
              ]}
              onPress={() => setIsRecurring(!isRecurring)}
              activeOpacity={0.8}
            >
              <View style={[
                styles.checkbox, 
                { 
                  backgroundColor: isRecurring ? RECURRING_PURPLE : colors.card, 
                  borderColor: isRecurring ? RECURRING_PURPLE : colors.border 
                }
              ]}>
                {isRecurring && <Icon name="check" size={16} color="#fff" />}
              </View>
              <View style={styles.checkboxTextContainer}>
                <Text style={[styles.checkboxLabel, { color: colors.text }]}>Sabit Görev</Text>
                <Text style={[styles.checkboxSubLabel, { color: colors.textSecondary }]}>Bu görev her gün otomatik tekrarlanır</Text>
              </View>
            </TouchableOpacity>

            <Animated.View style={{
              opacity: toggleAnim,
              maxHeight: toggleAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 200] }),
              transform: [{
                translateY: toggleAnim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] })
              }],
              overflow: 'hidden'
            }}>
              <View style={styles.daysContainer}>
                <View style={styles.daysHeader}>
                  <Text style={[styles.daysTitle, { color: colors.textSecondary }]}>Tekrarlanacak Günler</Text>
                  <TouchableOpacity 
                    style={[
                      styles.everyDayChip, 
                      { 
                        backgroundColor: selectedDays.length === 0 ? activeColor + '20' : 'transparent',
                        borderColor: selectedDays.length === 0 ? activeColor : isDark ? '#444' : colors.border
                      }
                    ]}
                    onPress={() => setSelectedDays([])}
                  >
                    <Text style={[styles.everyDayText, { color: selectedDays.length === 0 ? activeColor : colors.textSecondary }]}>
                      Her Gün
                    </Text>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.daysRow}>
                  {daysList.map((day) => {
                    const isSelected = selectedDays.includes(day.id);
                    return (
                      <TouchableOpacity
                        key={day.id}
                        style={[
                          styles.dayButton,
                          { 
                            backgroundColor: isSelected ? activeColor : colors.inputBackground,
                            borderColor: isSelected ? activeColor : isDark ? '#444' : colors.border
                          }
                        ]}
                        onPress={() => toggleDay(day.id)}
                      >
                        <Text style={[styles.dayButtonText, { color: isSelected ? "#fff" : colors.text }]}>
                          {day.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <Text style={[styles.daysHint, { color: colors.textSecondary }]}>
                  {selectedDays.length === 0 
                    ? "Görev haftanın her günü otomatik olarak eklenir." 
                    : "Görev sadece seçilen günlerde otomatik olarak eklenir."}
                </Text>
              </View>
            </Animated.View>

            <TouchableOpacity
              style={[
                styles.submitButton, 
                { 
                  backgroundColor: activeColor,
                  opacity: editTitle.trim() ? 1 : 0.6,
                  shadowColor: activeColor,
                }
              ]}
              disabled={!editTitle.trim()}
              onPress={() => {
                if (!isRecurring && onConvertToNormal) {
                  onConvertToNormal(editTitle);
                } else {
                  onSave(editTitle, selectedDays);
                }
              }}
            >
              <Icon name={isRecurring ? "save" : "check"} size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.submitButtonText}>
                {isRecurring ? "Değişiklikleri Kaydet" : "Normal Göreve Dönüştür"}
              </Text>
            </TouchableOpacity>
            {/* Gap filler for WhatsApp style bottom sheet */}
            <View style={{ 
              height: 1000, 
              backgroundColor: colors.card, 
              position: 'absolute', 
              top: '100%', 
              left: 0, 
              right: 0 
            }} />
          </KeyboardAvoidingView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    width: "100%",
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    elevation: 20,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  sheetHandleContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  sheetHandle: {
    width: 40,
    height: 5,
    borderRadius: 2.5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteButton: {
    marginRight: 16,
  },
  inputContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 16,
    paddingRight: 65,
    fontSize: 16,
    fontWeight: '500',
  },
  charCount: {
    position: 'absolute',
    right: 12,
    bottom: 16,
    fontSize: 11,
    fontWeight: '600',
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  checkboxTextContainer: {
    flex: 1,
  },
  checkboxLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  checkboxSubLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  daysContainer: {
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  daysHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  daysTitle: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    marginLeft: 4,
  },
  everyDayChip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  everyDayText: {
    fontSize: 11,
    fontWeight: "700",
  },
  daysRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  daysHint: {
    fontSize: 12,
    fontStyle: 'italic',
    marginLeft: 4,
    opacity: 0.8,
  },
  dayButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  dayButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },
  submitButton: {
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: 'row',
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
});

export default RecurringTaskDetailModal;
