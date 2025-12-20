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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "../../api/supabase";
import { deleteDoctorService } from "../../services/doctor/doctorService";
import { styles } from "../../styles/admin/DoctorDetailStyles";
import Icon from "react-native-vector-icons/Ionicons";
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from "@react-navigation/native";

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

  // FIX CHÍNH: Mỗi lần màn hình được focus → tự động reload dữ liệu mới nhất
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
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Đang tải thông tin...</Text>
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
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E40AF" />

      <LinearGradient colors={["#1E40AF", "#3B82F6"]} style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết bác sĩ</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate("AdminHome")}
          style={styles.homeButton}
        >
          <Icon name="home" size={24} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <LinearGradient
                colors={["#3B82F6", "#1D4ED8"]}
                style={styles.avatarGradient}
              >
                <Text style={styles.avatarText}>{avatarLetter}</Text>
              </LinearGradient>
            )}
          </View>
          <Text style={styles.doctorName}>{fullName}</Text>
          <Text style={styles.department}>
            {doctor.department_name || "Chưa cập nhật khoa/phòng ban"}
          </Text>
        </View>

        <View style={styles.infoGrid}>
          <LinearGradient
            colors={["#EBF8FF", "#DBF0FF"]}
            style={styles.infoCard}
          >
            <Icon name="medkit" size={28} color="#0EA5E9" />
            <Text style={styles.infoLabel}>Chuyên môn</Text>
            <Text style={styles.infoValue}>
              {doctor.specialization || "Chưa cập nhật"}
            </Text>
          </LinearGradient>

          <LinearGradient
            colors={["#FFFBEB", "#FEF3C7"]}
            style={styles.infoCard}
          >
            <Icon name="time" size={28} color="#F59E0B" />
            <Text style={styles.infoLabel}>Kinh nghiệm</Text>
            <Text style={styles.infoValue}>
              {doctor.experience_years || 0} năm
            </Text>
          </LinearGradient>

          <LinearGradient
            colors={["#F0FDF4", "#DCFCE7"]}
            style={styles.infoCard}
          >
            <Icon name="home" size={28} color="#10B981" />
            <Text style={styles.infoLabel}>Phòng khám</Text>
            <Text style={styles.infoValue}>
              {doctor.room_number || "Chưa có"}
            </Text>
          </LinearGradient>

          <LinearGradient
            colors={["#FDF2F8", "#FCE7F3"]}
            style={styles.infoCard}
          >
            <Icon name="people" size={28} color="#EC4899" />
            <Text style={styles.infoLabel}>BN tối đa/ca</Text>
            <Text style={styles.infoValue}>
              {doctor.max_patients_per_slot || 5}
            </Text>
          </LinearGradient>
        </View>

        <View style={styles.scheduleCard}>
          <View style={styles.scheduleHeader}>
            <Icon name="calendar" size={22} color="#8B5CF6" />
            <Text style={styles.scheduleTitle}>Lịch làm việc cố định</Text>
          </View>

          {schedules.length === 0 ? (
            <View style={styles.emptySchedule}>
              <Text style={styles.emptyText}>Chưa có lịch làm việc</Text>
            </View>
          ) : (
            weekDays.map((day) => {
              const slots = scheduleByDay[day] || [];
              const isWorking = slots.length > 0;
              return (
                <View key={day} style={styles.scheduleRow}>
                  <Text
                    style={[styles.dayName, isWorking && styles.dayNameActive]}
                  >
                    {day}
                  </Text>
                  <Text
                    style={[
                      styles.daySlots,
                      isWorking ? styles.daySlotsActive : styles.daySlotsOff,
                    ]}
                  >
                    {isWorking ? slots.join("  •  ") : "Nghỉ"}
                  </Text>
                </View>
              );
            })
          )}
        </View>

        {/* 3 NÚT HÀNH ĐỘNG */}
        <View style={styles.actionContainer}>
          {/* Sửa thông tin */}
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigation.navigate("EditDoctor", { doctorId })}
          >
            <Icon name="pencil" size={18} color="#fff" />
            <Text style={styles.editButtonText}>Sửa thông tin</Text>
          </TouchableOpacity>

          <View style={styles.actionButtonWrapper}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() =>
                navigation.navigate("EditDoctorSchedule", {
                  doctorId,
                  doctorName: fullName,
                })
              }
            >
              <LinearGradient
                colors={["#6366F1", "#4F46E5"]}
                style={styles.scheduleButton}
              >
                <Icon name="calendar-outline" size={18} color="#fff" />
                <Text style={styles.scheduleButtonText}>Sửa lịch làm</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Xóa bác sĩ */}
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Icon name="trash" size={18} color="#fff" />
            <Text style={styles.deleteButtonText}>Xóa bác sĩ</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}
