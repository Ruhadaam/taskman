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
  Keyboard,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const keyboardHeightAnim = useRef(new Animated.Value(0)).current;
  const { colors, isDark } = useTheme();
  const { bottom: safeBottom } = useSafeAreaInsets();

  const RECURRING_PURPLE = "#9C27B0";
  const activeColor = colors.primary;

  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const toggleAnim = useRef(new Animated.Value(1)).current;
  // Combined: entry/exit slide + keyboard offset (negative = move up)
  const cardTranslateY = useRef(
    Animated.add(slideAnim, Animated.multiply(keyboardHeightAnim, -1))
  ).current;
  const [isModalVisible, setIsModalVisible] = useState(visible);

  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => {
        setKeyboardVisible(true);
        Animated.timing(keyboardHeightAnim, {
          toValue: e.endCoordinates.height,
          duration: Platform.OS === "ios" ? e.duration ?? 250 : 0,
          useNativeDriver: true,
        }).start();
      }
    );
    const hide = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      (e) => {
        setKeyboardVisible(false);
        Animated.timing(keyboardHeightAnim, {
          toValue: 0,
          duration: Platform.OS === "ios" ? e.duration ?? 250 : 0,
          useNativeDriver: true,
        }).start();
      }
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

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
      {/* Dark backdrop */}
      <Pressable
        style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.4)' }]}
        onPress={onClose}
      />

      {/* Card: bottom fixed, keyboard offset via combined translateY */}
      <Animated.View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          transform: [{ translateY: cardTranslateY }],
        }}
      >
        <View
          style={{
            width: '100%',
            maxHeight: SCREEN_HEIGHT * 0.85,
            backgroundColor: colors.card,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 24,
            paddingBottom: keyboardVisible ? 16 : safeBottom + 16,
            shadowColor: isDark ? '#000' : '#888',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.12,
            shadowRadius: 12,
            elevation: 20,
          }}
        >
          <View style={styles.sheetHandleContainer}>
            <View style={[styles.sheetHandle, { backgroundColor: isDark ? '#444' : colors.border }]} />
          </View>
          
          <View style={[styles.modalHeader, { borderBottomColor: isDark ? '#333' : colors.border, justifyContent: 'flex-end' }]}>
            <View style={styles.headerIcons}>
              <TouchableOpacity
                onPress={onDeleteTask}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={{ marginRight: 0 }}
              >
                <Icon name="delete-outline" size={24} color={colors.danger} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
            contentContainerStyle={{ paddingBottom: 8 }}
          >
            <View style={styles.minimalInputContainer}>
              <TextInput
                style={[
                  styles.minimalInput,
                  { color: colors.text }
                ]}
                placeholder="Görev başlığı"
                placeholderTextColor={colors.textSecondary}
                value={editTitle}
                maxLength={isRecurring ? 15 : 30}
                onChangeText={setEditTitle}
              />
            </View>

            <ScrollView 
              horizontal 
              keyboardShouldPersistTaps="handled"
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.pillsContainer}
            >
              <TouchableOpacity
                style={[
                  styles.actionPill,
                  { 
                    borderColor: isRecurring ? activeColor : colors.border,
                    backgroundColor: isRecurring ? activeColor + "15" : colors.inputBackground,
                  }
                ]}
                onPress={() => setIsRecurring(!isRecurring)}
              >
                <Icon name={isRecurring ? "repeat-on" : "repeat"} size={16} color={isRecurring ? activeColor : colors.textSecondary} />
                <Text style={[styles.actionPillText, { color: isRecurring ? activeColor : colors.text }]}>
                  Tekrarla
                </Text>
              </TouchableOpacity>
            </ScrollView>

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
              <Text style={styles.submitButtonText}>
                {isRecurring ? "Değişiklikleri Kaydet" : "Normal Göreve Dönüştür"}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
  minimalInputContainer: {
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  minimalInput: {
    fontSize: 24,
    fontWeight: "600",
    paddingVertical: 8,
  },
  pillsContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  actionPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
    marginRight: 8,
  },
  actionPillText: {
    fontSize: 14,
    fontWeight: "600",
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
