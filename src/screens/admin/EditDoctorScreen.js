import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  Modal,
  FlatList,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  Animated,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../api/supabase";
import { useNavigation, useRoute } from "@react-navigation/native";
import theme from "../../theme/theme";

const { COLORS, GRADIENTS, SPACING, SHADOWS } = theme;

const EditDoctorScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { doctorId } = route.params || {};

  // Form state
  const [fullName, setFullName] = useState("");
  const [department, setDepartment] = useState(""); // Khoa
  const [specialization, setSpecialization] = useState(""); // Tên chuyên môn
  const [serviceId, setServiceId] = useState(null); // ID dịch vụ (nếu cần sau này)
  const [roomNumber, setRoomNumber] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [maxPatients, setMaxPatients] = useState("5");
  const [bio, setBio] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Data
  const [departments, setDepartments] = useState([]);
  const [specializations, setSpecializations] = useState([]); // [{id, name}]
  const [availableRooms, setAvailableRooms] = useState([]);

  // Modal
  const [deptModal, setDeptModal] = useState(false);
  const [specModal, setSpecModal] = useState(false);
  const [roomModal, setRoomModal] = useState(false);
  const [searchDept, setSearchDept] = useState("");
  const [searchSpec, setSearchSpec] = useState("");
  const [searchRoom, setSearchRoom] = useState("");
  const modalAnim = useRef(new Animated.Value(0)).current;

  // Load dữ liệu bác sĩ
  useEffect(() => {
    if (doctorId) fetchDoctor();
  }, [doctorId]);

  const fetchDoctor = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("doctors")
        .select(
          `
          name,
          specialization,
          experience_years,
          room_number,
          department_name,
          max_patients_per_slot,
          bio,
          user_profiles!inner(full_name)
        `
        )
        .eq("id", doctorId)
        .single();

      if (error) throw error;

      setFullName(data.user_profiles?.full_name || data.name || "");
      setDepartment(data.department_name || "");
      setSpecialization(data.specialization || "");
      setRoomNumber(data.room_number || "");
      setExperienceYears(String(data.experience_years || ""));
      setMaxPatients(String(data.max_patients_per_slot || 5));
      setBio(data.bio || "");
    } catch (err) {
      Alert.alert("Lỗi", "Không thể tải thông tin bác sĩ");
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  // 1. Load tất cả khoa
  useEffect(() => {
    const fetchDepartments = async () => {
      const { data, error } = await supabase
        .from("services")
        .select("department")
        .not("department", "is", null)
        .eq("is_active", true)
        .order("department");

      if (error) return;

      const unique = [...new Set(data.map((d) => d.department.trim()))].sort();
      setDepartments(unique);
    };
    fetchDepartments();
  }, []);

  // 2. Khi khoa thay đổi → load chuyên môn + kiểm tra hợp lệ
  useEffect(() => {
    const fetchSpecializations = async () => {
      if (!department) {
        setSpecializations([]);
        return;
      }

      const { data, error } = await supabase
        .from("services")
        .select("id, name")
        .eq("is_active", true)
        .eq("department", department.trim())
        .order("name");

      if (error || !data) {
        setSpecializations([]);
        return;
      }

      setSpecializations(data);

      // Nếu chuyên môn cũ không thuộc khoa mới → reset
      if (specialization && !data.some((s) => s.name === specialization)) {
        setSpecialization("");
        setServiceId(null);
        Alert.alert(
          "Thông báo",
          "Chuyên môn hiện tại không thuộc khoa mới. Vui lòng chọn lại."
        );
      }
    };

    fetchSpecializations();
  }, [department]);

  // 3. Load phòng trống theo khoa
  useEffect(() => {
    const fetchRooms = async () => {
      if (!department) {
        setAvailableRooms([]);
        return;
      }

      const { data } = await supabase
        .from("clinic_rooms")
        .select("room_number")
        .or(`department.eq.${department},department.is.null`)
        .is("doctor_id", null)
        .eq("is_active", true)
        .order("room_number");

      const rooms = data?.map((r) => r.room_number) || [];
      setAvailableRooms(rooms);

      if (roomNumber && !rooms.includes(roomNumber)) {
        setRoomNumber("");
        Alert.alert(
          "Thông báo",
          "Phòng hiện tại không còn trống. Vui lòng chọn lại."
        );
      }
    };

    fetchRooms();
  }, [department]);

  // Filter
  const filteredDepts = departments.filter((d) =>
    d.toLowerCase().includes(searchDept.toLowerCase())
  );
  const filteredSpecs = specializations.filter((s) =>
    s.name.toLowerCase().includes(searchSpec.toLowerCase())
  );
  const filteredRooms = availableRooms.filter((r) =>
    r.toLowerCase().includes(searchRoom.toLowerCase())
  );

  const getFloor = (room) => {
    const num = parseInt(room.replace(/\D/g, ""), 10);
    return isNaN(num) ? "" : `Tầng ${Math.floor(num / 100)}`;
  };

  const validate = () => {
    if (!fullName.trim()) return Alert.alert("Lỗi", "Vui lòng nhập họ tên");
    if (!department) return Alert.alert("Lỗi", "Vui lòng chọn khoa");
    if (!specialization) return Alert.alert("Lỗi", "Vui lòng chọn chuyên môn");
    if (!roomNumber) return Alert.alert("Lỗi", "Vui lòng chọn phòng khám");
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      const updates = {
        name: fullName.trim(),
        specialization: specialization,
        department_name: department,
        room_number: roomNumber,
        experience_years: experienceYears ? parseInt(experienceYears) : null,
        max_patients_per_slot: parseInt(maxPatients) || 5,
        bio: bio.trim() || null,
      };

      const { error: docError } = await supabase
        .from("doctors")
        .update(updates)
        .eq("id", doctorId);

      if (docError) throw docError;

      // Cập nhật full_name trong user_profiles nếu có
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("id", doctorId)
        .maybeSingle();

      if (profile) {
        await supabase
          .from("user_profiles")
          .update({ full_name: fullName.trim() })
          .eq("id", doctorId);
      }

      Alert.alert("Thành công", "Cập nhật thông tin bác sĩ thành công!", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert("Lỗi", "Cập nhật thất bại. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  const openModal = (type) => {
    if (type === "dept") setDeptModal(true);
    if (type === "spec") setSpecModal(true);
    if (type === "room") setRoomModal(true);

    Animated.timing(modalAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeModal = () => {
    Animated.timing(modalAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setDeptModal(false);
      setSpecModal(false);
      setRoomModal(false);
      setSearchDept("");
      setSearchSpec("");
      setSearchRoom("");
    });
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text
          style={{ marginTop: 16, fontSize: 16, color: COLORS.textSecondary }}
        >
          Đang tải thông tin...
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar barStyle="light-content" />

      <LinearGradient colors={GRADIENTS.header} style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chỉnh sửa bác sĩ</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Ionicons name="checkmark" size={30} color="#FFF" />
          )}
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.container}>
        <InputField
          label="Họ và tên *"
          icon="person"
          value={fullName}
          onChangeText={setFullName}
          placeholder="BS. Nguyễn Văn A"
        />

        {/* KHOA */}
        <View style={styles.section}>
          <Text style={styles.label}>Khoa làm việc *</Text>
          <TouchableOpacity
            style={[styles.selectBox, department && styles.active]}
            onPress={() => openModal("dept")}
          >
            <Ionicons
              name="business"
              size={22}
              color={department ? COLORS.primary : "#999"}
            />
            <Text style={[styles.selectText, department && styles.activeText]}>
              {department || "Chọn khoa"}
            </Text>
            <Ionicons name="chevron-down" size={22} color="#666" />
          </TouchableOpacity>
        </View>

        {/* CHUYÊN MÔN */}
        <View style={styles.section}>
          <Text style={styles.label}>Chuyên môn chính *</Text>
          <TouchableOpacity
            style={[styles.selectBox, specialization && styles.active]}
            onPress={() => openModal("spec")}
            disabled={!department}
          >
            <Ionicons
              name="medkit"
              size={22}
              color={specialization ? COLORS.success : "#999"}
            />
            <Text
              style={[styles.selectText, specialization && styles.activeText]}
              numberOfLines={2}
            >
              {specialization || "Chọn chuyên môn"}
            </Text>
            <Ionicons name="chevron-down" size={22} color="#666" />
          </TouchableOpacity>
        </View>

        {/* PHÒNG KHÁM */}
        <View style={styles.section}>
          <Text style={styles.label}>
            Phòng khám * {roomNumber && `(${getFloor(roomNumber)})`}
          </Text>
          <TouchableOpacity
            style={[styles.selectBox, roomNumber && styles.active]}
            onPress={() => openModal("room")}
            disabled={!department}
          >
            <Ionicons
              name="home"
              size={22}
              color={roomNumber ? COLORS.primary : "#999"}
            />
            <Text style={[styles.selectText, roomNumber && styles.activeText]}>
              {roomNumber ||
                (department ? "Chọn phòng trống" : "Chọn khoa trước")}
            </Text>
            <Ionicons name="chevron-down" size={22} color="#666" />
          </TouchableOpacity>
        </View>

        <InputField
          label="Số năm kinh nghiệm"
          icon="briefcase"
          value={experienceYears}
          onChangeText={(t) => setExperienceYears(t.replace(/[^0-9]/g, ""))}
          placeholder="15"
          keyboardType="numeric"
        />

        <InputField
          label="Số bệnh nhân tối đa/ca"
          icon="people"
          value={maxPatients}
          onChangeText={(t) => setMaxPatients(t.replace(/[^0-9]/g, "") || "5")}
          placeholder="5"
          keyboardType="numeric"
        />

        <View style={styles.section}>
          <Text style={styles.label}>Giới thiệu</Text>
          <View style={styles.textArea}>
            <Ionicons
              name="document-text"
              size={22}
              color={COLORS.primary}
              style={{ marginTop: 12 }}
            />
            <TextInput
              style={styles.textAreaInput}
              value={bio}
              onChangeText={setBio}
              placeholder="Bác sĩ có hơn 15 năm kinh nghiệm..."
              multiline
            />
          </View>
        </View>
      </ScrollView>

      {/* MODAL CHUNG */}
      <Modal
        visible={deptModal || specModal || roomModal}
        transparent
        animationType="none"
      >
        <TouchableWithoutFeedback onPress={closeModal}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [
                {
                  translateY: modalAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [300, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <LinearGradient colors={GRADIENTS.header} style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {deptModal
                ? "Chọn khoa"
                : specModal
                ? "Chọn chuyên môn"
                : "Chọn phòng khám"}
            </Text>
            <TouchableOpacity onPress={closeModal}>
              <Ionicons name="close-circle" size={28} color="#FFF" />
            </TouchableOpacity>
          </LinearGradient>

          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#666" />
            <TextInput
              placeholder={
                deptModal
                  ? "Tìm khoa..."
                  : specModal
                  ? "Tìm chuyên môn..."
                  : "Tìm phòng..."
              }
              value={
                deptModal ? searchDept : specModal ? searchSpec : searchRoom
              }
              onChangeText={
                deptModal
                  ? setSearchDept
                  : specModal
                  ? setSearchSpec
                  : setSearchRoom
              }
              style={styles.searchInput}
            />
          </View>

          <FlatList
            data={
              deptModal
                ? filteredDepts
                : specModal
                ? filteredSpecs
                : filteredRooms
            }
            keyExtractor={(_, i) => i.toString()}
            renderItem={({ item }) => {
              const displayText = deptModal
                ? item
                : specModal
                ? item.name
                : `${item} (${getFloor(item)})`;

              const isSelected = deptModal
                ? department === item
                : specModal
                ? specialization === item.name
                : roomNumber === item;

              return (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    if (deptModal) setDepartment(item);
                    else if (specModal) {
                      setSpecialization(item.name);
                      setServiceId(item.id);
                    } else setRoomNumber(item);
                    closeModal();
                  }}
                >
                  <Text style={styles.modalItemText}>{displayText}</Text>
                  {isSelected && (
                    <Ionicons
                      name="checkmark-circle"
                      size={26}
                      color={COLORS.success}
                    />
                  )}
                </TouchableOpacity>
              );
            }}
          />
        </Animated.View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

// InputField component
const InputField = ({ label, icon, ...props }) => (
  <View style={styles.section}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.inputWrapper}>
      <Ionicons name={icon} size={22} color={COLORS.primary} />
      <TextInput style={styles.input} placeholderTextColor="#999" {...props} />
    </View>
  </View>
);

// Styles
const styles = {
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: { fontSize: 23, fontWeight: "bold", color: "#FFF" },
  container: { padding: SPACING.xl, paddingBottom: 100 },
  section: { marginBottom: SPACING.xl },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 10,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    ...SHADOWS.medium,
  },
  input: { flex: 1, marginLeft: 12, fontSize: 16 },
  selectBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    ...SHADOWS.medium,
  },
  active: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: "#F0F9FF",
  },
  activeText: { color: COLORS.textPrimary, fontWeight: "600" },
  selectText: { flex: 1, marginLeft: 12, fontSize: 16, color: "#999" },
  textArea: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 12,
    minHeight: 110,
    ...SHADOWS.medium,
  },
  textAreaInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    textAlignVertical: "top",
  },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)" },
  modalContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFF",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    maxHeight: "85%",
    ...SHADOWS.large,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  modalTitle: { fontSize: 20, fontWeight: "bold", color: "#FFF" },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    margin: 16,
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 50,
  },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 16 },
  modalItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 18,
    marginHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  modalItemText: { fontSize: 17, color: COLORS.textPrimary },
};

export default EditDoctorScreen;
