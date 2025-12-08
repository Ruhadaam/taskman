import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { User } from "../types";
import { supabase, TABLES } from "../config/lib";
import { MaterialIcons as Icon } from "@expo/vector-icons";

const UserList = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    isAdmin: false,
  });

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    const filtered = users.filter(
      (user) =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchQuery, users]);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase.from(TABLES.PROFILES).select("*");

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error("Kullanıcılar yüklenirken hata:", error);
    }
  };

  const handleAddUser = async () => {
    try {
      // Önce auth kullanıcısını oluştur
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
        options: {
          data: {
            email_confirm: true,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Kullanıcı oluşturulamadı");

      // Profil bilgilerini ekle
      const { error: profileError } = await supabase
        .from(TABLES.PROFILES)
        .insert([
          {
            uid: authData.user.id,
            name: newUser.name,
            email: newUser.email,
            isAdmin: false,
            createdAt: new Date().toISOString(),
            unseen: [],
            seen: [],
          },
        ]);

      if (profileError) throw profileError;

      Alert.alert("Başarılı", "Kullanıcı başarıyla eklendi");
      setModalVisible(false);
      setNewUser({
        name: "",
        email: "",
        password: "",
        isAdmin: false,
      });
      loadUsers();
    } catch (error) {
      Alert.alert("Hata", "Kullanıcı eklenirken bir hata oluştu");
      console.error("Kullanıcı ekleme hatası:", error);
    }
  };

  const handleDeleteUser = async (user: User) => {
    try {
      // Önce profil bilgilerini sil
      const { error: profileError } = await supabase
        .from(TABLES.PROFILES)
        .delete()
        .eq("uid", user.uid || "");

      if (profileError) throw profileError;

      // Auth kullanıcısını sil
      const { error: authError } = await supabase.auth.admin.deleteUser(
        user.uid || ""
      );
      if (authError) throw authError;

      Alert.alert("Başarılı", "Kullanıcı başarıyla silindi");
      loadUsers();
    } catch (error) {
      Alert.alert("Hata", "Kullanıcı silinirken bir hata oluştu");
      console.error("Kullanıcı silme hatası:", error);
    }
  };

  const renderItem = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={styles.userCard}
      onPress={() => {
        setSelectedUser(item);
        setDetailModalVisible(true);
      }}
    >
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteUser(item)}
      >
        <Icon name="delete" size={24} color="#ff4444" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Icon
            name="search"
            size={20}
            color="#666"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Kullanıcı ara..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Icon name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredUsers}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Yeni Kullanıcı Ekle</Text>

            <TextInput
              style={styles.input}
              placeholder="Ad Soyad"
              value={newUser.name}
              onChangeText={(text) => setNewUser({ ...newUser, name: text })}
            />

            <TextInput
              style={styles.input}
              placeholder="Email"
              value={newUser.email}
              onChangeText={(text) => setNewUser({ ...newUser, email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TextInput
              style={styles.input}
              placeholder="Şifre"
              value={newUser.password}
              onChangeText={(text) =>
                setNewUser({ ...newUser, password: text })
              }
              secureTextEntry
            />

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.buttonText}>İptal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleAddUser}
              >
                <Text style={styles.buttonText}>Ekle</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={detailModalVisible}
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Kullanıcı Detayları</Text>

            {selectedUser && (
              <View style={styles.detailContainer}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Ad Soyad:</Text>
                  <Text style={styles.detailValue}>{selectedUser.name}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Email:</Text>
                  <Text style={styles.detailValue}>{selectedUser.email}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Rol:</Text>
                  <Text style={styles.detailValue}>
                    {selectedUser.isAdmin ? "Admin" : "Kullanıcı"}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Oluşturulma Tarihi:</Text>
                  <Text style={styles.detailValue}>
                    {selectedUser.createdAt
                      ? new Date(selectedUser.createdAt).toLocaleDateString()
                      : "Bilinmiyor"}
                  </Text>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={[styles.modalButton, styles.closeButton]}
              onPress={() => setDetailModalVisible(false)}
            >
              <Text style={styles.buttonText}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  addButton: {
    backgroundColor: "#007AFF",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  listContainer: {
    padding: 10,
  },
  userCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 12,
    color: "#666",
  },
  deleteButton: {
    padding: 8,
  },
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
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalButton: {
    flex: 1,
    padding: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: "#ff4444",
  },
  confirmButton: {
    backgroundColor: "#007AFF",
  },
  closeButton: {
    backgroundColor: "#666",
    marginTop: 20,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },
  detailContainer: {
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  detailLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "bold",
  },
  detailValue: {
    fontSize: 14,
    color: "#333",
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    marginHorizontal: 10,
    paddingHorizontal: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 14,
  },
});

export default UserList;
