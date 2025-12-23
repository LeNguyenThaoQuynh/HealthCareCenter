import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  StatusBar,
  Platform,
  Animated,
  TouchableWithoutFeedback,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Keyboard,
  Pressable,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { TabView, SceneMap, TabBar } from "react-native-tab-view";
import { MaterialIcons, Ionicons, Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { supabase } from "../../api/supabase";

const { width, height } = Dimensions.get("window");

const normalize = (v) =>
  String(v ?? "")
    .trim()
    .replace(/^0+/, "") || "0";

const INITIAL_ROOM = { floor: "", room_number: "" };
const INITIAL_ERRORS = { floor: "", room_number: "" };

export default function ManageRoom() {
  const navigation = useNavigation();

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [fabScale] = useState(new Animated.Value(1));

  const [newRoom, setNewRoom] = useState(INITIAL_ROOM);
  const [errors, setErrors] = useState(INITIAL_ERRORS);

  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: "assigned", title: "Đã phân công" },
    { key: "unassigned", title: "Chưa phân công" },
  ]);

  const fetchRooms = useCallback(async () => {
    try {
      setLoading(true);

      const { data: roomsData, error: roomsError } = await supabase
        .from("clinic_rooms")
        .select("id, floor, room_number, doctor_id")
        .eq("is_active", true)
        .order("floor")
        .order("room_number");

      if (roomsError || !roomsData) {
        console.error("Error fetching rooms:", roomsError);
        setRooms([]);
        return;
      }

      const doctorIds = roomsData
        .filter((room) => room.doctor_id !== null)
        .map((room) => room.doctor_id);

      let doctorsMap = {};

      if (doctorIds.length > 0) {
        const { data: doctorsData, error: doctorsError } = await supabase
          .from("doctors")
          .select("id, name, specialization, department_name")
          .in("id", doctorIds);

        if (doctorsError) {
          console.error("Error fetching doctors:", doctorsError);
        } else if (doctorsData) {
          doctorsData.forEach((doc) => {
            doctorsMap[doc.id] = doc;
          });
        }
      }

      const combinedRooms = roomsData.map((room) => ({
        ...room,
        doctor: room.doctor_id ? doctorsMap[room.doctor_id] : null,
      }));

      setRooms(combinedRooms);
    } catch (err) {
      console.error("Unexpected error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const animateFab = () => {
    Animated.sequence([
      Animated.timing(fabScale, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(fabScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const validateFloor = (v) => {
    if (!v) return "Vui lòng nhập tầng";
    if (!/^\d+$/.test(v)) return "Tầng chỉ được nhập số";
    const n = Number(v);
    if (n < 1 || n > 20) return "Tầng phải từ 1–20";
    return "";
  };

  const validateRoom = (v) => {
    if (!v) return "Vui lòng nhập số phòng";
    if (!/^\d+$/.test(v)) return "Số phòng chỉ được nhập số";
    const exists = rooms.some(
      (r) =>
        normalize(r.floor) === normalize(newRoom.floor) &&
        normalize(r.room_number) === normalize(v)
    );
    return exists ? "Phòng này đã tồn tại" : "";
  };

  const isFormValid =
    !errors.floor &&
    !errors.room_number &&
    newRoom.floor &&
    newRoom.room_number;

  const handleAddRoom = async () => {
    if (!isFormValid) return;

    const { error } = await supabase.from("clinic_rooms").insert({
      floor: Number(normalize(newRoom.floor)),
      room_number: normalize(newRoom.room_number),
    });

    if (error) {
      console.error("Error adding room:", error);
      Alert.alert("Lỗi", "Không thể thêm phòng mới");
    } else {
      setModalVisible(false);
      setNewRoom(INITIAL_ROOM);
      setErrors(INITIAL_ERRORS);
      fetchRooms();
    }
  };

  const RoomItem = ({ item }) => {
    const hasDoctor = !!item.doctor;
    const doctor = item.doctor;

    return (
      <Pressable
        style={({ pressed }) => [
          styles.roomCard,
          pressed && styles.roomCardPressed,
        ]}
      >
        <View style={styles.roomCardContent}>
          <View style={styles.roomCardLeft}>
            <View style={[
              styles.roomIconContainer,
              hasDoctor ? styles.roomIconAssigned : styles.roomIconUnassigned
            ]}>
              <Ionicons
                name={hasDoctor ? "medical" : "home-outline"}
                size={26}
                color={hasDoctor ? "#4F46E5" : "#94A3B8"}
              />
            </View>
            <View style={styles.roomInfo}>
              <View style={styles.roomHeader}>
                <Text style={styles.roomNumber}>Phòng {item.room_number}</Text>
                <View style={[
                  styles.floorTag,
                  hasDoctor && styles.floorTagAssigned
                ]}>
                  <Ionicons name="stairs" size={12} color="#4F46E5" />
                  <Text style={styles.floorText}>Tầng {item.floor}</Text>
                </View>
              </View>

              {hasDoctor ? (
                <View style={styles.doctorInfo}>
                  <View style={styles.doctorHeader}>
                    <Feather name="user" size={16} color="#4F46E5" />
                    <Text style={styles.doctorName} numberOfLines={1}>
                      {doctor.name}
                    </Text>
                  </View>
                  {doctor.specialization && (
                    <View style={styles.doctorDetailRow}>
                      <Feather name="briefcase" size={14} color="#64748B" />
                      <Text style={styles.doctorDetail} numberOfLines={1}>
                        {doctor.specialization}
                      </Text>
                    </View>
                  )}
                  {doctor.department_name && (
                    <View style={styles.doctorDetailRow}>
                      <Feather name="building" size={14} color="#64748B" />
                      <Text style={styles.doctorDepartment} numberOfLines={1}>
                        {doctor.department_name}
                      </Text>
                    </View>
                  )}
                </View>
              ) : (
                <View style={styles.emptyDoctorContainer}>
                  <Feather name="user-plus" size={16} color="#94A3B8" />
                  <Text style={styles.emptyDoctorText}>
                    Chưa phân công bác sĩ
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={[
            styles.statusBadge,
            hasDoctor ? styles.statusAssigned : styles.statusUnassigned
          ]}>
            <View
              style={[
                styles.statusDot,
                hasDoctor ? styles.dotActive : styles.dotInactive,
              ]}
            />
            <Text style={[
              styles.statusText,
              hasDoctor ? styles.statusTextActive : styles.statusTextInactive
            ]}>
              {hasDoctor ? "Đã phân công" : "Chưa phân công"}
            </Text>
          </View>
        </View>
        
        <View style={styles.cardDivider} />
      </Pressable>
    );
  };

  const assignedRooms = rooms.filter((r) => r.doctor);
  const unassignedRooms = rooms.filter((r) => !r.doctor);

  const renderScene = SceneMap({
    assigned: () => (
      <FlatList
        data={assignedRooms}
        keyExtractor={(i) => i.id.toString()}
        renderItem={({ item }) => <RoomItem item={item} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={fetchRooms}
            colors={["#4F46E5"]}
            tintColor="#4F46E5"
          />
        }
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIllustration}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="people" size={48} color="#7C3AED" />
              </View>
              <View style={styles.emptyDots}>
                <View style={[styles.emptyDot, styles.emptyDot1]} />
                <View style={[styles.emptyDot, styles.emptyDot2]} />
                <View style={[styles.emptyDot, styles.emptyDot3]} />
              </View>
            </View>
            <Text style={styles.emptyTitle}>Chưa có phòng được phân công</Text>
            <Text style={styles.emptySubtitle}>
              Phòng đã phân công sẽ xuất hiện ở đây
            </Text>
            <TouchableOpacity 
              style={styles.emptyActionButton}
              onPress={() => setIndex(1)}
            >
              <Text style={styles.emptyActionText}>Xem phòng chưa phân công</Text>
            </TouchableOpacity>
          </View>
        }
      />
    ),
    unassigned: () => (
      <FlatList
        data={unassignedRooms}
        keyExtractor={(i) => i.id.toString()}
        renderItem={({ item }) => <RoomItem item={item} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={fetchRooms}
            colors={["#4F46E5"]}
            tintColor="#4F46E5"
          />
        }
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIllustration}>
              <View style={[styles.emptyIconContainer, styles.emptySuccessIcon]}>
                <Ionicons name="checkmark-circle" size={48} color="#10B981" />
              </View>
              <View style={styles.emptyConfetti}>
                <View style={[styles.confetti, styles.confetti1]} />
                <View style={[styles.confetti, styles.confetti2]} />
                <View style={[styles.confetti, styles.confetti3]} />
              </View>
            </View>
            <Text style={styles.emptyTitle}>Tuyệt vời!</Text>
            <Text style={styles.emptySubtitle}>
              Tất cả phòng đã được phân công bác sĩ
            </Text>
            <TouchableOpacity 
              style={[styles.emptyActionButton, styles.emptyActionSuccess]}
              onPress={() => setIndex(0)}
            >
              <Text style={styles.emptyActionText}>Xem phòng đã phân công</Text>
            </TouchableOpacity>
          </View>
        }
      />
    ),
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Đang tải danh sách phòng...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#F8FAFC" }}>
      {/* StatusBar riêng biệt */}
      <StatusBar barStyle="light-content" backgroundColor="#4F46E5" />

      {/* HEADER - SÁT TOP HOÀN TOÀN */}
      <LinearGradient
        colors={["#4F46E5", "#7C3AED"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <MaterialIcons name="arrow-back-ios" size={22} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <View style={styles.titleRow}>
              <Ionicons name="business" size={26} color="#FFF" />
              <Text style={styles.headerTitle}>Quản Lý Phòng</Text>
            </View>
            <Text style={styles.headerSubtitle}>
              {rooms.length} phòng • {assignedRooms.length} đã phân công
            </Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.statsButton}>
              <Ionicons name="stats-chart" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* TABS + CONTENT - PADDING TOP 60 */}
      <View style={styles.tabContainer}>
        <TabView
          navigationState={{ index, routes }}
          renderScene={renderScene}
          onIndexChange={setIndex}
          initialLayout={{ width }}
          renderTabBar={(props) => (
            <TabBar
              {...props}
              indicatorStyle={styles.tabIndicator}
              style={styles.tabBar}
              labelStyle={styles.tabLabel}
              activeColor="#4F46E5"
              inactiveColor="#64748B"
              pressColor="transparent"
              renderLabel={({ route, focused }) => (
                <View style={styles.tabLabelContainer}>
                  <Text style={[
                    styles.tabLabel,
                    focused && styles.tabLabelActive
                  ]}>
                    {route.title}
                  </Text>
                  {focused && <View style={styles.tabLabelUnderline} />}
                </View>
              )}
            />
          )}
        />
      </View>

      {/* FAB */}
      <Animated.View
        style={[
          styles.fabContainer,
          {
            transform: [{ scale: fabScale }],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.fab}
          onPress={() => {
            animateFab();
            setModalVisible(true);
          }}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={["#4F46E5", "#7C3AED"]}
            style={styles.fabGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <MaterialIcons name="add" size={30} color="#FFF" />
          </LinearGradient>
          <View style={styles.fabPulse} />
        </TouchableOpacity>
      </Animated.View>

      {/* MODAL THÊM PHÒNG - CÓ NÚT DONE */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        statusBarTranslucent
      >
        <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1, justifyContent: "flex-end" }}
          >
            <ScrollView
              contentContainerStyle={styles.modalScroll}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                  {/* Modal Header */}
                  <LinearGradient
                    colors={["#4F46E5", "#7C3AED"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.modalHeader}
                  >
                    <View style={styles.modalHeaderContent}>
                      <View style={styles.modalIcon}>
                        <Ionicons name="add-circle" size={34} color="#FFF" />
                      </View>
                      <View style={styles.modalHeaderText}>
                        <Text style={styles.modalTitle}>Thêm phòng mới</Text>
                        <Text style={styles.modalSubtitle}>
                          Thêm phòng mới vào hệ thống
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.modalCloseButton}
                        onPress={() => setModalVisible(false)}
                      >
                        <Ionicons name="close" size={24} color="#FFF" />
                      </TouchableOpacity>
                    </View>
                  </LinearGradient>

                  {/* Form */}
                  <View style={styles.formContainer}>
                    <View style={styles.formGroup}>
                      <View style={styles.formLabelRow}>
                        <Ionicons name="stairs" size={18} color="#4F46E5" />
                        <Text style={styles.formLabel}>
                          Tầng <Text style={styles.required}>*</Text>
                        </Text>
                      </View>
                      <View style={[
                        styles.inputContainer,
                        errors.floor && styles.inputError,
                        !errors.floor && newRoom.floor && styles.inputSuccess
                      ]}>
                        <TextInput
                          style={styles.input}
                          value={newRoom.floor}
                          keyboardType="number-pad"
                          placeholder="Ví dụ: 3"
                          placeholderTextColor="#94A3B8"
                          onChangeText={(t) => {
                            const v = t.replace(/[^0-9]/g, "");
                            setNewRoom({ ...newRoom, floor: v });
                            setErrors({ ...errors, floor: validateFloor(v) });
                          }}
                          maxLength={2}
                          returnKeyType="done"
                          onSubmitEditing={() => Keyboard.dismiss()}
                        />
                        {newRoom.floor && !errors.floor && (
                          <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                        )}
                      </View>
                      {!!errors.floor && (
                        <View style={styles.errorContainer}>
                          <Ionicons
                            name="alert-circle"
                            size={16}
                            color="#EF4444"
                          />
                          <Text style={styles.errorText}>{errors.floor}</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.formGroup}>
                      <View style={styles.formLabelRow}>
                        <Ionicons name="home" size={18} color="#4F46E5" />
                        <Text
                          style={[
                            styles.formLabel,
                            (!newRoom.floor || errors.floor) &&
                              styles.formLabelDisabled,
                          ]}
                        >
                          Số phòng <Text style={styles.required}>*</Text>
                        </Text>
                      </View>
                      <View style={[
                        styles.inputContainer,
                        errors.room_number && styles.inputError,
                        (!newRoom.floor || errors.floor) && styles.inputDisabled,
                        !errors.room_number && newRoom.room_number && styles.inputSuccess
                      ]}>
                        <TextInput
                          editable={!!newRoom.floor && !errors.floor}
                          style={styles.input}
                          value={newRoom.room_number}
                          keyboardType="number-pad"
                          placeholder="Ví dụ: 101"
                          placeholderTextColor="#94A3B8"
                          onChangeText={(t) => {
                            const v = t.replace(/[^0-9]/g, "");
                            setNewRoom({ ...newRoom, room_number: v });
                            setErrors({ ...errors, room_number: validateRoom(v) });
                          }}
                          maxLength={4}
                          returnKeyType="done"
                          onSubmitEditing={() => Keyboard.dismiss()}
                        />
                        {newRoom.room_number && !errors.room_number && (
                          <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                        )}
                      </View>
                      {!!errors.room_number && (
                        <View style={styles.errorContainer}>
                          <Ionicons
                            name="alert-circle"
                            size={16}
                            color="#EF4444"
                          />
                          <Text style={styles.errorText}>
                            {errors.room_number}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Preview */}
                    {(newRoom.floor && newRoom.room_number && !errors.floor && !errors.room_number) && (
                      <View style={styles.previewContainer}>
                        <View style={styles.previewHeader}>
                          <Ionicons name="eye" size={18} color="#4F46E5" />
                          <Text style={styles.previewTitle}>Xem trước</Text>
                        </View>
                        <View style={styles.previewCard}>
                          <View style={styles.previewIcon}>
                            <Ionicons name="home" size={24} color="#4F46E5" />
                          </View>
                          <View style={styles.previewInfo}>
                            <Text style={styles.previewRoomNumber}>
                              Phòng {newRoom.room_number}
                            </Text>
                            <View style={styles.previewFloor}>
                              <Ionicons name="stairs" size={12} color="#4F46E5" />
                              <Text style={styles.previewFloorText}>
                                Tầng {newRoom.floor}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    )}

                    {/* Actions */}
                    <View style={styles.modalActions}>
                      <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => setModalVisible(false)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="close" size={20} color="#64748B" />
                        <Text style={styles.cancelText}>Hủy</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.submitButton,
                          !isFormValid && styles.submitButtonDisabled,
                        ]}
                        onPress={handleAddRoom}
                        disabled={!isFormValid}
                        activeOpacity={0.8}
                      >
                        <LinearGradient
                          colors={
                            isFormValid ? ["#10B981", "#059669"] : ["#CBD5E1", "#94A3B8"]
                          }
                          style={styles.submitGradient}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                        >
                          <Ionicons name="checkmark" size={22} color="#FFF" />
                          <Text style={styles.submitText}>Thêm phòng</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </BlurView>
      </Modal>
    </View>
  );
}

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContent: {
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: "#64748B",
    fontWeight: "500",
  },

  // HEADER SÁT TOP
  header: {
    paddingTop: 60, // Cực nhỏ để header sát top
    paddingBottom: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "ios" ? 4 : 2,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  headerCenter: {
    alignItems: "center",
    gap: 4,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerTitle: {
    color: "#FFF",
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 14,
    fontWeight: "500",
  },
  headerRight: {
    width: 44,
  },
  statsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },

  // Tab
  tabContainer: {
    flex: 1,
    backgroundColor: "#FFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
  },
  tabBar: {
    backgroundColor: "#FFF",
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  tabLabelContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  tabLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#64748B",
    paddingVertical: 12,
  },
  tabLabelActive: {
    color: "#4F46E5",
  },
  tabLabelUnderline: {
    width: 24,
    height: 3,
    backgroundColor: "#4F46E5",
    borderRadius: 2,
    marginTop: 2,
  },
  tabIndicator: {
    backgroundColor: "#4F46E5",
    height: 3,
    borderRadius: 2,
  },

  // List - PADDING TOP 60
  list: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 120,
  },

  // Room Card
  roomCard: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 6,
    overflow: "hidden",
  },
  roomCardPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  roomCardContent: {
    padding: 20,
  },
  roomCardLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
    marginBottom: 16,
  },
  roomIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  roomIconAssigned: {
    backgroundColor: "rgba(79, 70, 229, 0.1)",
  },
  roomIconUnassigned: {
    backgroundColor: "rgba(203, 213, 225, 0.1)",
  },
  roomInfo: {
    flex: 1,
  },
  roomHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  roomNumber: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1E293B",
    marginRight: 12,
  },
  floorTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(79, 70, 229, 0.08)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  floorTagAssigned: {
    backgroundColor: "rgba(79, 70, 229, 0.1)",
  },
  floorText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4F46E5",
  },
  doctorInfo: {
    gap: 6,
  },
  doctorHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#334155",
    flex: 1,
  },
  doctorDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  doctorDetail: {
    fontSize: 14,
    color: "#64748B",
    flex: 1,
  },
  doctorDepartment: {
    fontSize: 13,
    color: "#94A3B8",
    flex: 1,
  },
  emptyDoctorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
  },
  emptyDoctorText: {
    fontSize: 14,
    color: "#94A3B8",
    fontStyle: "italic",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  statusAssigned: {
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(34, 197, 94, 0.2)",
  },
  statusUnassigned: {
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.2)",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  dotActive: {
    backgroundColor: "#10B981",
  },
  dotInactive: {
    backgroundColor: "#F59E0B",
  },
  statusText: {
    fontSize: 13,
    fontWeight: "800",
  },
  statusTextActive: {
    color: "#059669",
  },
  statusTextInactive: {
    color: "#D97706",
  },
  cardDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginHorizontal: 20,
  },

  // Empty State
  emptyState: {
    alignItems: "center",
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyIllustration: {
    position: "relative",
    marginBottom: 32,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E2E8F0",
  },
  emptySuccessIcon: {
    backgroundColor: "#F0FDF4",
    borderColor: "#D1FAE5",
  },
  emptyDots: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  emptyDot: {
    position: "absolute",
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#4F46E5",
  },
  emptyDot1: {
    top: 20,
    left: -10,
  },
  emptyDot2: {
    top: -10,
    right: 30,
  },
  emptyDot3: {
    bottom: 10,
    right: -5,
  },
  emptyConfetti: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  confetti: {
    position: "absolute",
    width: 20,
    height: 8,
    backgroundColor: "#10B981",
    borderRadius: 4,
    transform: [{ rotate: "45deg" }],
  },
  confetti1: {
    top: 30,
    left: -15,
  },
  confetti2: {
    top: -5,
    right: 25,
    backgroundColor: "#3B82F6",
  },
  confetti3: {
    bottom: 20,
    right: -10,
    backgroundColor: "#F59E0B",
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#334155",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 15,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  emptyActionButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  emptyActionSuccess: {
    backgroundColor: "#F0FDF4",
    borderColor: "#A7F3D0",
  },
  emptyActionText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#4F46E5",
  },

  // FAB
  fabContainer: {
    position: "absolute",
    right: 24,
    bottom: 24,
    zIndex: 100,
  },
  fab: {
    position: "relative",
  },
  fabGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  fabPulse: {
    position: "absolute",
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    borderRadius: 40,
    backgroundColor: "rgba(79, 70, 229, 0.2)",
    zIndex: -1,
  },

  // Modal
  modalScroll: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  modalContainer: {
    alignItems: "center",
  },
  modalContent: {
    width: width * 0.9,
    backgroundColor: "#FFF",
    borderRadius: 32,
    overflow: "hidden",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 30 },
    shadowOpacity: 0.2,
    shadowRadius: 40,
    elevation: 20,
  },
  modalHeader: {
    paddingVertical: 28,
    paddingHorizontal: 24,
  },
  modalHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalHeaderText: {
    flex: 1,
    marginLeft: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFF",
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 15,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "500",
  },
  modalCloseButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  formContainer: {
    padding: 24,
  },
  formGroup: {
    marginBottom: 28,
  },
  formLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#334155",
  },
  formLabelDisabled: {
    color: "#CBD5E1",
  },
  required: {
    color: "#EF4444",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E2E8F0",
    borderRadius: 18,
    backgroundColor: "#FFF",
    paddingHorizontal: 16,
    overflow: "hidden",
  },
  input: {
    flex: 1,
    paddingVertical: 18,
    fontSize: 17,
    fontWeight: "600",
    color: "#1E293B",
  },
  inputError: {
    borderColor: "#EF4444",
    backgroundColor: "rgba(239, 68, 68, 0.02)",
  },
  inputSuccess: {
    borderColor: "#10B981",
  },
  inputDisabled: {
    backgroundColor: "#F8FAFC",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  errorText: {
    fontSize: 14,
    color: "#EF4444",
    fontWeight: "500",
  },
  previewContainer: {
    marginTop: 8,
    marginBottom: 24,
  },
  previewHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#4F46E5",
  },
  previewCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(79, 70, 229, 0.05)",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(79, 70, 229, 0.1)",
  },
  previewIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "rgba(79, 70, 229, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  previewInfo: {
    flex: 1,
  },
  previewRoomNumber: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1E293B",
    marginBottom: 4,
  },
  previewFloor: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  previewFloorText: {
    fontSize: 14,
    color: "#4F46E5",
    fontWeight: "600",
  },
  modalActions: {
    flexDirection: "row",
    gap: 16,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 18,
    borderRadius: 18,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cancelText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#64748B",
  },
  submitButton: {
    flex: 2,
    borderRadius: 18,
    overflow: "hidden",
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 18,
  },
  submitText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFF",
  },
});