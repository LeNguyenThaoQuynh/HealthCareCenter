import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  StatusBar,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { supabase } from "../../../../api/supabase";
import Animated, { 
  FadeInDown, 
  FadeInUp, 
  ZoomIn,
  SlideInRight 
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get('window');

const Colors = {
  primary: "#6366F1",
  secondary: "#8B5CF6",
  success: "#10B981",
  gradientStart: "#667EEA",
  gradientEnd: "#764BA2",
  text: "#1E293B",
  textLight: "#64748B",
  bg: "#F8FAFC",
  white: "#FFFFFF",
  card: "#FFFFFF",
  lightBlue: "#E0E7FF",
  border: "#E2E8F0",
  morning: "#F59E0B",
  afternoon: "#EC4899",
  evening: "#8B5CF6",
};

export default function ConfirmBookingDoctor() {
  const navigation = useNavigation();
  const route = useRoute();
  const { doctor, selectedDate, timeSlot } = route.params || {};

  const [loading, setLoading] = useState(false);
  const [fetchingPrice, setFetchingPrice] = useState(true);
  const [servicePrice, setServicePrice] = useState(150000);

  useEffect(() => {
    const fetchServicePrice = async () => {
      if (!doctor?.department_name) {
        setFetchingPrice(false);
        return;
      }

      try {
        setFetchingPrice(true);
        let query = supabase
          .from("services")
          .select("id, name, price, service_type")
          .eq("department", doctor.department_name)
          .eq("is_active", true);

        if (doctor.specializations && doctor.specializations.length > 0) {
          const mainSpec = doctor.specializations[0];
          query = query.ilike("name", `%${mainSpec}%`);
        }

        const { data, error } = await query
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (data?.price) {
          const newPrice = Math.round(Number(data.price));
          setServicePrice(newPrice);
        }
      } catch (err) {
        console.error("💥 Lỗi fetch giá:", err);
      } finally {
        setFetchingPrice(false);
      }
    };

    fetchServicePrice();
  }, [doctor?.department_name, doctor?.specializations]);

  useEffect(() => {
    if (!doctor?.id || !selectedDate || !timeSlot?.slot_id) {
      Alert.alert("Lỗi dữ liệu", "Thiếu thông tin đặt lịch");
      navigation.goBack();
    }
  }, [doctor, selectedDate, timeSlot, navigation]);

  const handleConfirm = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("Vui lòng đăng nhập lại");

      const { data: profile, error: profileError } = await supabase
        .from("user_profiles")
        .select("full_name, phone")
        .eq("id", user.id)
        .single();

      if (profileError || !profile) {
        throw new Error(
          "Không tìm thấy thông tin cá nhân. Vui lòng cập nhật hồ sơ."
        );
      }

      const vietnamDate = new Date(
        `${selectedDate}T${timeSlot.start}:00+07:00`
      );
      const appointmentDateTime = vietnamDate.toISOString().slice(0, 19);

      const appointmentData = {
        user_id: user.id,
        doctor_id: doctor.id,
        appointment_date: appointmentDateTime,
        date: selectedDate,
        slot_id: timeSlot.slot_id,
        department_id: doctor.department_id || null,
        status: "pending",
        patient_name: profile.full_name?.trim() || "Bệnh nhân",
        patient_phone: profile.phone?.replace(/\D/g, "") || "",
        price: servicePrice,
      };

      const { data: appointment, error } = await supabase
        .from("appointments")
        .insert(appointmentData)
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          Alert.alert(
            "Khung giờ đã được đặt",
            "Bác sĩ đã có lịch trong khung giờ này.\nVui lòng chọn khung giờ khác.",
            [
              {
                text: "Chọn giờ khác",
                onPress: () => navigation.goBack(),
              },
              {
                text: "Về trang chủ",
                style: "cancel",
                onPress: () => navigation.replace("HomeScreen"),
              },
            ]
          );
          return;
        }
        throw error;
      }

      const dateDisplay = new Date(selectedDate).toLocaleDateString("vi-VN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      Alert.alert(
        "Đặt lịch thành công 🎉",
        `Bạn đã đặt lịch với BS. ${doctor.name}

🕒 ${timeSlot.display}
📅 ${dateDisplay}
💰 Phí dịch vụ: ${formatPrice(servicePrice)}

Bạn có muốn xem lịch hẹn của mình không?`,
        [
          {
            text: "Màn hình chính",
            style: "cancel",
            onPress: () => navigation.replace("HomeScreen"),
          },
          {
            text: "Xem lịch hẹn",
            onPress: () => navigation.replace("HistoryScreen"),
          },
        ]
      );
    } catch (err) {
      console.error("Lỗi đặt lịch:", err);

      if (err.code === "23505") {
        Alert.alert(
          "Khung giờ đã được đặt",
          "Bác sĩ đã có lịch trong khung giờ này.\nVui lòng chọn khung giờ khác.",
          [
            {
              text: "Chọn giờ khác",
              onPress: () => navigation.goBack(),
            },
            {
              text: "Về trang chủ",
              style: "cancel",
              onPress: () => navigation.replace("HomeScreen"),
            },
          ]
        );
        return;
      }

      Alert.alert(
        "Đặt lịch thất bại",
        err.message || "Đã có lỗi xảy ra, vui lòng thử lại"
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const getTimeOfDay = (time) => {
    const hour = parseInt(time.split(':')[0]);
    if (hour < 12) return { label: "Buổi sáng", color: Colors.morning, icon: "sunny-outline" };
    if (hour < 17) return { label: "Buổi chiều", color: Colors.afternoon, icon: "partly-sunny-outline" };
    return { label: "Buổi tối", color: Colors.evening, icon: "moon-outline" };
  };

  const timeInfo = getTimeOfDay(timeSlot?.start || "08:00");

  const formatPrice = (price) => {
    return `${(price / 1000).toLocaleString("vi-VN")}.000đ`;
  };

  const renderSpecializations = () => {
    if (!doctor.specializations)
      return doctor.department_name || "Bác sĩ đa khoa";
    if (Array.isArray(doctor.specializations)) {
      return doctor.specializations.join(" • ");
    }
    return doctor.specializations || doctor.department_name || "Bác sĩ đa khoa";
  };

  if (!doctor || !selectedDate || !timeSlot) return null;

  return (
    <View style={styles.container}>
  <StatusBar barStyle="light-content" backgroundColor={Colors.gradientStart} />
  
  {/* Header Gradient - ĐÃ FIX */}
  <LinearGradient
    colors={[Colors.gradientStart, Colors.gradientEnd]}
    style={styles.header}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 0 }}
  >
    <View style={styles.headerContent}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
        activeOpacity={0.8}
      >
        <Ionicons name="chevron-back" size={24} color="#FFF" />
      </TouchableOpacity>
      
      <View style={styles.headerCenter}>
        <Text style={styles.headerTitle}>Xác Nhận Đặt Lịch</Text>
        <Text style={styles.headerSubtitle}>Hoàn tất thông tin đặt khám</Text>
      </View>
      
      <TouchableOpacity 
        style={styles.homeButton}
        onPress={() => navigation.navigate("HomeScreen")}
        activeOpacity={0.8}
      >
        <Ionicons name="home-outline" size={24} color="#FFF" />
      </TouchableOpacity>
    </View>
  </LinearGradient>


      <ScrollView 
        showsVerticalScrollIndicator={false} 
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Doctor Info Card */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.doctorCard}>
          <View style={styles.doctorHeader}>
            <LinearGradient
              colors={[Colors.primary, Colors.secondary]}
              style={styles.avatarGradient}
            >
              <Text style={styles.avatarLetter}>
                {doctor.name?.[0]?.toUpperCase() || "B"}
              </Text>
            </LinearGradient>
            
            <View style={styles.doctorInfo}>
              <Text style={styles.doctorName}>{doctor.name}</Text>
              <View style={styles.specialtyBadge}>
                <Ionicons name="medical-outline" size={14} color={Colors.white} />
                <Text style={styles.specialtyBadgeText}>
                  {renderSpecializations()}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Appointment Details */}
          <View style={styles.detailsContainer}>
            <View style={styles.detailItem}>
              <View style={styles.detailIcon}>
                <Ionicons name="medkit-outline" size={20} color={Colors.primary} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Chuyên khoa</Text>
                <Text style={styles.detailValue}>{renderSpecializations()}</Text>
              </View>
            </View>

            <View style={styles.detailItem}>
              <View style={styles.detailIcon}>
                <Ionicons name="location-outline" size={20} color={Colors.primary} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Phòng khám</Text>
                <Text style={styles.detailValue}>Phòng {doctor.room_number || "Chưa xác định"}</Text>
              </View>
            </View>

            <View style={styles.detailItem}>
              <View style={styles.detailIcon}>
                <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Ngày khám</Text>
                <Text style={styles.detailValue}>{formatDate(selectedDate)}</Text>
              </View>
            </View>

            <View style={styles.detailItem}>
              <View style={[styles.detailIcon, { backgroundColor: `${timeInfo.color}20` }]}>
                <Ionicons name={timeInfo.icon} size={20} color={timeInfo.color} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Thời gian</Text>
                <View style={styles.timeRow}>
                  <Text style={styles.timeValue}>{timeSlot.display}</Text>
                  <LinearGradient
                    colors={[timeInfo.color, `${timeInfo.color}DD`]}
                    style={styles.timeBadge}
                  >
                    <Text style={styles.timeBadgeText}>{timeInfo.label}</Text>
                  </LinearGradient>
                </View>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Price Card */}
        <Animated.View entering={FadeInUp.delay(300)} style={styles.priceCard}>
          <View style={styles.priceHeader}>
            <View style={styles.priceIcon}>
              <Ionicons name="cash-outline" size={24} color={Colors.primary} />
            </View>
            <Text style={styles.priceLabel}>Phí dịch vụ dự kiến</Text>
          </View>
          
          <View style={styles.priceValueContainer}>
            {fetchingPrice ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <LinearGradient
                colors={[Colors.gradientStart, Colors.gradientEnd]}
                style={styles.priceGradient}
              >
                <Text style={styles.priceValue}>{formatPrice(servicePrice)}</Text>
              </LinearGradient>
            )}
          </View>
          
          <Text style={styles.priceNote}>* Giá đã bao gồm tất cả phí dịch vụ</Text>
        </Animated.View>

        {/* Important Notes */}
        <Animated.View entering={FadeInUp.delay(400)} style={styles.notesCard}>
          <View style={styles.notesHeader}>
            <Ionicons name="information-circle" size={24} color={Colors.primary} />
            <Text style={styles.notesTitle}>Lưu ý quan trọng</Text>
          </View>
          
          <View style={styles.notesList}>
            <View style={styles.noteItem}>
              <View style={styles.noteBullet}>
                <Ionicons name="time-outline" size={16} color={Colors.primary} />
              </View>
              <Text style={styles.noteText}>
                Vui lòng đến trước <Text style={styles.noteHighlight}>15 phút</Text> để làm thủ tục
              </Text>
            </View>
            
            <View style={styles.noteItem}>
              <View style={styles.noteBullet}>
                <Ionicons name="close-circle-outline" size={16} color={Colors.primary} />
              </View>
              <Text style={styles.noteText}>
                Hủy lịch trước <Text style={styles.noteHighlight}>2 giờ</Text> nếu không thể đến
              </Text>
            </View>
            
            <View style={styles.noteItem}>
              <View style={styles.noteBullet}>
                <Ionicons name="document-text-outline" size={16} color={Colors.primary} />
              </View>
              <Text style={styles.noteText}>
                Mang theo giấy tờ tùy thân và bảo hiểm y tế (nếu có)
              </Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Footer Buttons */}
      <Animated.View entering={SlideInRight.delay(500)} style={styles.footer}>
        <TouchableOpacity
          style={[styles.cancelButton, loading && styles.disabled]}
          onPress={() => navigation.goBack()}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Ionicons name="close-circle-outline" size={22} color={Colors.textLight} />
          <Text style={styles.cancelButtonText}>Hủy bỏ</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.confirmButton, loading && styles.disabled]}
          onPress={handleConfirm}
          disabled={loading}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={[Colors.success, "#0D946E"]}
            style={styles.confirmGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={24} color="#FFF" />
                <Text style={styles.confirmButtonText}>XÁC NHẬN ĐẶT LỊCH</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
    container: { 
    flex: 1, 
    backgroundColor: Colors.bg 
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40, // Thêm Platform check
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Platform.OS === 'ios' ? 10 : 0, // Điều chỉnh cho iOS
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  headerTitle: {
    fontSize: 20, // Giảm size cho vừa
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
    textAlign: 'center',
  },
  homeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: { 
    flex: 1 
  },
  scrollContent: {
    paddingBottom: 30,
  },
  doctorCard: {
    backgroundColor: Colors.white,
    margin: 20,
    marginTop: 10,
    borderRadius: 28,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  doctorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarGradient: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    color: '#FFF' 
  },
  doctorInfo: {
    marginLeft: 20,
    flex: 1,
  },
  doctorName: { 
    fontSize: 22, 
    fontWeight: '700', 
    color: Colors.text,
    marginBottom: 8,
  },
  specialtyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  specialtyBadgeText: {
    fontSize: 13,
    color: Colors.white,
    fontWeight: '600',
  },
  divider: {
    height: 1.5,
    backgroundColor: '#F1F5F9',
    marginVertical: 20,
  },
  detailsContainer: {
    gap: 18,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.lightBlue,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  timeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
  },
  priceCard: {
    backgroundColor: Colors.white,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1.5,
    borderColor: Colors.lightBlue,
  },
  priceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  priceIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.lightBlue,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  priceLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  priceValueContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  priceGradient: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 20,
  },
  priceValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFF',
    textAlign: 'center',
  },
  priceNote: {
    fontSize: 13,
    color: Colors.textLight,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  notesCard: {
    backgroundColor: Colors.white,
    marginHorizontal: 20,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  notesTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginLeft: 12,
  },
  notesList: {
    gap: 16,
  },
  noteItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  noteBullet: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.lightBlue,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  noteText: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
  },
  noteHighlight: {
    color: Colors.primary,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 15,
    gap: 16,
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    gap: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textLight,
  },
  confirmButton: {
    flex: 2,
    borderRadius: 18,
    overflow: 'hidden',
  },
  confirmGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 12,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  disabled: {
    opacity: 0.6,
  },
});