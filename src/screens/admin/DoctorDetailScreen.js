import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StatusBar,
  Dimensions,
  Platform
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "../../api/supabase";
import { deleteDoctorService } from "../../services/doctor/doctorService";
import Icon from "react-native-vector-icons/Ionicons";
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from "@react-navigation/native";

const { width } = Dimensions.get("window");

export default function DoctorDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { doctorId } = route.params;

  const [doctor, setDoctor] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDoctorDetail = async () => {
    setLoading(true);
    try {
      const { data: doc, error: docError } = await supabase
        .from("doctors")
        .select(
          `
          id,
          name,
          specialization,
          experience_years,
          room_number,
          max_patients_per_slot,
          bio,
          department_name,
          avatar_url,
          user_profiles!inner(full_name)
        `
        )
        .eq("id", doctorId)
        .single();

      if (docError) throw docError;

      const { data: sched, error: schedError } = await supabase
        .from("doctor_schedule_template")
        .select("day_of_week, start_time, end_time")
        .eq("doctor_id", doctorId);

      if (schedError) throw schedError;

      setDoctor(doc);
      setSchedules(sched || []);
    } catch (error) {
      console.error("Lỗi tải bác sĩ:", error);
      Alert.alert("Lỗi", "Không thể tải thông tin bác sĩ. Vui lòng thử lại.");
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchDoctorDetail();
    }, [doctorId])
  );

  const handleDelete = () => {
    const doctorName =
      doctor?.user_profiles?.full_name || doctor?.name || "bác sĩ này";

    Alert.alert(
      "Xóa bác sĩ",
      `Bạn có chắc chắn muốn xóa vĩnh viễn\n**${doctorName}**?\n\nHành động này không thể hoàn tác.`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              const result = await deleteDoctorService(doctorId);
              if (result.success) {
                Alert.alert("Thành công", result.message, [
                  {
                    text: "OK",
                    onPress: () => navigation.replace("ManageDoctors"),
                  },
                ]);
              } else {
                Alert.alert(
                  "Thất bại",
                  result.message || "Không thể xóa bác sĩ"
                );
              }
            } catch (err) {
              Alert.alert("Lỗi", "Đã xảy ra lỗi khi xóa bác sĩ");
            } finally {
              setLoading(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.loadingText}>Đang tải thông tin bác sĩ...</Text>
      </View>
    );
  }

  if (!doctor) return null;

  const fullName = doctor.user_profiles?.full_name || doctor.name || "Bác sĩ";
  const avatarUrl = doctor.avatar_url;
  const avatarLetter = fullName.charAt(0).toUpperCase();

  const dayMap = {
    T2: "Thứ 2",
    "Thứ 2": "Thứ 2",
    T3: "Thứ 3",
    "Thứ 3": "Thứ 3",
    T4: "Thứ 4",
    "Thứ 4": "Thứ 4",
    T5: "Thứ 5",
    "Thứ 5": "Thứ 5",
    T6: "Thứ 6",
    "Thứ 6": "Thứ 6",
    T7: "Thứ 7",
    "Thứ 7": "Thứ 7",
    CN: "Chủ nhật",
    "Chủ nhật": "Chủ nhật",
  };

  const weekDays = [
    "Thứ 2",
    "Thứ 3",
    "Thứ 4",
    "Thứ 5",
    "Thứ 6",
    "Thứ 7",
    "Chủ nhật",
  ];

  const scheduleByDay = schedules.reduce((acc, s) => {
    const dayName = dayMap[s.day_of_week?.trim()];
    if (!dayName) return acc;
    if (!acc[dayName]) acc[dayName] = [];
    const slot = `${s.start_time?.slice(0, 5)}-${s.end_time?.slice(0, 5)}`;
    acc[dayName].push(slot);
    return acc;
  }, {});

  return (
    <View style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      {/* StatusBar riêng biệt */}
      <StatusBar barStyle="light-content" backgroundColor="#4f46e5" />

      {/* HEADER - ĐÃ FIX KHÔNG CÒN TRỐNG */}
      <LinearGradient 
        colors={["#4f46e5", "#7c3aed"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Icon name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <View style={styles.titleContainer}>
              <Icon name="person-circle" size={26} color="#FFF" />
              <Text style={styles.headerTitle}>Chi Tiết Bác Sĩ</Text>
            </View>
            <Text style={styles.headerSubtitle}>Thông tin chi tiết và lịch làm việc</Text>
          </View>
          
          <TouchableOpacity
            onPress={() => navigation.navigate("AdminHome")}
            style={styles.homeButton}
            activeOpacity={0.7}
          >
            <Icon name="home" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* AVATAR SECTION */}
        <View style={styles.avatarSection}>
          <LinearGradient
            colors={["#2d91afff", "#93c3dfff"]}
            style={styles.avatarBackground}
          >
            <View style={styles.avatarWrapper}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatar} />
              ) : (
                <LinearGradient
                  colors={["#59c8e4ff", "#3a82edff"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.avatarGradient}
                >
                  <Text style={styles.avatarText}>{avatarLetter}</Text>
                </LinearGradient>
              )}
              <View style={styles.avatarRing} />
            </View>
          </LinearGradient>
          
          <View style={styles.nameContainer}>
            <Text style={styles.doctorName}>{fullName}</Text>
            <Text style={styles.department}>
              {doctor.department_name || "Chưa cập nhật khoa/phòng ban"}
            </Text>
            <View style={styles.experienceBadge}>
              <Icon name="time" size={14} color="#FFF" />
              <Text style={styles.experienceText}>
                {doctor.experience_years || 0} năm kinh nghiệm
              </Text>
            </View>
          </View>
        </View>

        {/* INFO GRID */}
        <View style={styles.infoGrid}>
          <View style={styles.infoCard}>
            <LinearGradient
              colors={["#e0e7ff", "#c7d2fe"]}
              style={styles.infoCardGradient}
            >
              <View style={styles.infoIconContainer}>
                <Icon name="medkit" size={28} color="#4f46e5" />
              </View>
              <Text style={styles.infoLabel}>Chuyên môn</Text>
              <Text style={styles.infoValue} numberOfLines={2}>
                {doctor.specialization || "Chưa cập nhật"}
              </Text>
            </LinearGradient>
          </View>

          <View style={styles.infoCard}>
            <LinearGradient
              colors={["#fef3c7", "#fde68a"]}
              style={styles.infoCardGradient}
            >
              <View style={styles.infoIconContainer}>
                <Icon name="time" size={28} color="#f59e0b" />
              </View>
              <Text style={styles.infoLabel}>Kinh nghiệm</Text>
              <Text style={styles.infoValue}>
                {doctor.experience_years || 0} năm
              </Text>
            </LinearGradient>
          </View>

          <View style={styles.infoCard}>
            <LinearGradient
              colors={["#dcfce7", "#bbf7d0"]}
              style={styles.infoCardGradient}
            >
              <View style={styles.infoIconContainer}>
                <Icon name="home" size={28} color="#10b981" />
              </View>
              <Text style={styles.infoLabel}>Phòng khám</Text>
              <Text style={styles.infoValue}>
                {doctor.room_number ? `P${doctor.room_number}` : "Chưa có"}
              </Text>
            </LinearGradient>
          </View>

          <View style={styles.infoCard}>
            <LinearGradient
              colors={["#fce7f3", "#fbcfe8"]}
              style={styles.infoCardGradient}
            >
              <View style={styles.infoIconContainer}>
                <Icon name="people" size={28} color="#ec4899" />
              </View>
              <Text style={styles.infoLabel}>BN tối đa/ca</Text>
              <Text style={styles.infoValue}>
                {doctor.max_patients_per_slot || 5}
              </Text>
            </LinearGradient>
          </View>
        </View>

        {/* SCHEDULE CARD */}
        <View style={styles.scheduleCard}>
          <View style={styles.scheduleHeader}>
            <LinearGradient
              colors={["#8b5cf6", "#7c3aed"]}
              style={styles.scheduleIconContainer}
            >
              <Icon name="calendar" size={22} color="#fff" />
            </LinearGradient>
            <View>
              <Text style={styles.scheduleTitle}>Lịch Làm Việc Cố Định</Text>
              <Text style={styles.scheduleSubtitle}>Tuần làm việc hàng tuần</Text>
            </View>
          </View>

          <View style={styles.scheduleContent}>
            {schedules.length === 0 ? (
              <View style={styles.emptySchedule}>
                <Icon name="calendar-outline" size={48} color="#cbd5e1" />
                <Text style={styles.emptyText}>Chưa có lịch làm việc</Text>
                <Text style={styles.emptySubtext}>Nhấn vào nút "Sửa lịch làm" để thêm</Text>
              </View>
            ) : (
              weekDays.map((day, index) => {
                const slots = scheduleByDay[day] || [];
                const isWorking = slots.length > 0;
                return (
                  <View key={day} style={[
                    styles.scheduleRow,
                    index % 2 === 0 && { backgroundColor: "#f8fafc" }
                  ]}>
                    <View style={styles.dayColumn}>
                      <Icon 
                        name={isWorking ? "checkmark-circle" : "close-circle"} 
                        size={16} 
                        color={isWorking ? "#10b981" : "#ef4444"} 
                        style={{ marginRight: 8 }}
                      />
                      <Text
                        style={[styles.dayName, isWorking && styles.dayNameActive]}
                      >
                        {day}
                      </Text>
                    </View>
                    <View style={styles.slotsColumn}>
                      <Text
                        style={[
                          styles.daySlots,
                          isWorking ? styles.daySlotsActive : styles.daySlotsOff,
                        ]}
                      >
                        {isWorking ? slots.join("  •  ") : "Nghỉ"}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </View>

        {/* ACTION BUTTONS */}
        <View style={styles.actionContainer}>
          <View style={styles.actionButtonsGrid}>
            <TouchableOpacity
              style={styles.editButtonContainer}
              onPress={() => navigation.navigate("EditDoctor", { doctorId })}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={["#0ea5e9", "#3b82f6"]}
                style={styles.editButton}
              >
                <Icon name="pencil" size={20} color="#fff" />
                <Text style={styles.editButtonText}>Sửa thông tin</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.scheduleButtonContainer}
              onPress={() =>
                navigation.navigate("EditDoctorSchedule", {
                  doctorId,
                  doctorName: fullName,
                })
              }
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={["#8b5cf6", "#7c3aed"]}
                style={styles.scheduleButton}
              >
                <Icon name="calendar" size={20} color="#fff" />
                <Text style={styles.scheduleButtonText}>Sửa lịch làm</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.deleteButtonContainer} 
              onPress={handleDelete}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={["#ef4444", "#dc2626"]}
                style={styles.deleteButton}
              >
                <Icon name="trash" size={20} color="#fff" />
                <Text style={styles.deleteButtonText}>Xóa bác sĩ</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* FOOTER NOTE */}
        <View style={styles.footerNote}>
          <Icon name="information-circle" size={16} color="#64748b" />
          <Text style={styles.footerText}>
            Mọi thay đổi sẽ được cập nhật ngay lập tức
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

/* ================= STYLES ================= */
const styles = {
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#64748b",
    fontWeight: "500",
  },
  // ✅ HEADER ĐÃ FIX - SÁT TOP + CONTENT PADDING TOP 60
  header: {
    paddingTop: 60, // Cực nhỏ để header sát top
    paddingBottom: 20,
    paddingHorizontal: 0,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 4 : 2, // Padding nhỏ bên trong
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerCenter: {
    alignItems: "center",
    flex: 1,
    marginHorizontal: 12,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    color: "#FFF",
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 13,
    fontWeight: "500",
    marginTop: 4,
  },
  homeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    paddingTop: 60, // ✅ ĐÚNG YÊU CẦU: CONTENT CÓ PADDING TOP 60 ĐỂ AVATAR ĐẸP
    paddingBottom: 60,
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: 30,
  },
  avatarBackground: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  avatarWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: "#FFF",
  },
  avatarGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#FFF",
  },
  avatarText: {
    fontSize: 48,
    fontWeight: "800",
    color: "#FFF",
  },
  avatarRing: {
    position: "absolute",
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  nameContainer: {
    alignItems: "center",
    marginTop: 20,
  },
  doctorName: {
    fontSize: 26,
    fontWeight: "800",
    color: "#1e293b",
    textAlign: "center",
    marginBottom: 4,
  },
  department: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 12,
    fontWeight: "500",
  },
  experienceBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f59e0b",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  experienceText: {
    fontSize: 14,
    color: "#FFF",
    fontWeight: "600",
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  infoCard: {
    width: (width - 52) / 2,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  infoCardGradient: {
    padding: 20,
    alignItems: "center",
  },
  infoIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "600",
    marginBottom: 4,
    textAlign: "center",
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e293b",
    textAlign: "center",
  },
  scheduleCard: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    marginHorizontal: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  scheduleHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    gap: 12,
  },
  scheduleIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  scheduleTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
  },
  scheduleSubtitle: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 2,
  },
  scheduleContent: {
    padding: 16,
  },
  emptySchedule: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#64748b",
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#94a3b8",
    marginTop: 4,
    textAlign: "center",
  },
  scheduleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  dayColumn: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  dayName: {
    fontSize: 15,
    fontWeight: "500",
    color: "#64748b",
  },
  dayNameActive: {
    color: "#1e293b",
    fontWeight: "600",
  },
  slotsColumn: {
    flex: 1,
    alignItems: "flex-end",
  },
  daySlots: {
    fontSize: 14,
    fontWeight: "500",
  },
  daySlotsActive: {
    color: "#10b981",
    fontWeight: "600",
  },
  daySlotsOff: {
    color: "#ef4444",
    fontStyle: "italic",
  },
  actionContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  actionButtonsGrid: {
    gap: 12,
  },
  editButtonContainer: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#0ea5e9",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    gap: 10,
  },
  editButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
  scheduleButtonContainer: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#8b5cf6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  scheduleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    gap: 10,
  },
  scheduleButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
  deleteButtonContainer: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    gap: 10,
  },
  deleteButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
  footerNote: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(100, 116, 139, 0.05)",
    marginHorizontal: 20,
    marginBottom: 40,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(100, 116, 139, 0.1)",
    gap: 8,
  },
  footerText: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "500",
  },
};