import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import Animated, { FadeInDown, ZoomIn, FadeInUp, BounceIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const Colors = {
  primary: '#0066FF',
  gradient: ['#0066FF', '#00D4FF'],
  success: '#00D778',
  successDark: '#00B060',
  text: '#1E293B',
  textLight: '#64748B',
  bg: '#F8FAFF',
  white: '#FFFFFF',
  lightGreen: '#F0FDF4',
  card: '#FFFFFF',
  border: '#E2E8F0',
};

export default function BookSuccessDoctor() {
  const navigation = useNavigation();
  const route = useRoute();
  const { doctor, selectedDate, timeSlot, appointment } = route.params || {};

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const renderSpecializations = () => {
    if (!doctor.specializations) return 'Bác sĩ đa khoa';
    return Array.isArray(doctor.specializations)
      ? doctor.specializations.join(' • ')
      : doctor.specializations;
  };

  if (!doctor || !selectedDate || !timeSlot || !appointment) {
    navigation.replace('PatientHome');
    return null;
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={Colors.gradient} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.replace('PatientHome')}>
          <Ionicons name="home" size={30} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đặt lịch thành công</Text>
        <View style={{ width: 30 }} />
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Animated.View entering={BounceIn.delay(300).springify()} style={styles.successIcon}>
          <LinearGradient colors={[Colors.success, Colors.successDark]} style={styles.checkCircle}>
            <Ionicons name="checkmark" size={80} color="#FFF" />
          </LinearGradient>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(600)} style={styles.message}>
          <Text style={styles.successTitle}>Đặt lịch thành công!</Text>
          <Text style={styles.successSubtitle}>
            Chúc mừng bạn đã đặt lịch khám với
          </Text>
          <Text style={styles.doctorHighlight}>BS. {doctor.name}</Text>
          <Text style={styles.successSubtitle}>
            Chúng tôi sẽ nhắc bạn trước giờ khám
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(800)} style={styles.detailCard}>
          <Text style={styles.cardTitle}>Thông tin lịch hẹn</Text>

          <View style={styles.avatarSection}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{doctor.name?.[0]?.toUpperCase() || 'B'}</Text>
            </View>
            <View style={styles.doctorInfo}>
              <Text style={styles.doctorName}>{doctor.name}</Text>
              <Text style={styles.specialty}>{renderSpecializations()}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={24} color={Colors.primary} />
            <Text style={styles.label}>Phòng khám</Text>
            <Text style={styles.value}>Phòng {doctor.room_number || 'Chưa xác định'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="calendar" size={24} color={Colors.primary} />
            <Text style={styles.label}>Ngày khám</Text>
            <Text style={styles.value}>{formatDate(selectedDate)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="time" size={24} color={Colors.primary} />
            <Text style={styles.label}>Giờ khám</Text>
            <Text style={styles.timeValue}>{timeSlot.display}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="cash-outline" size={24} color={Colors.primary} />
            <Text style={styles.label}>Phí khám</Text>
            <Text style={styles.priceValue}>150.000đ</Text>
          </View>

          <View style={styles.codeRow}>
            <Ionicons name="barcode-outline" size={26} color={Colors.success} />
            <Text style={styles.codeLabel}>Mã lịch hẹn</Text>
            <Text style={styles.codeValue}>{appointment.id.slice(0, 10).toUpperCase()}</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(1000)} style={styles.noteCard}>
          <Ionicons name="heart" size={28} color={Colors.success} />
          <Text style={styles.noteText}>
            • Vui lòng đến trước <Text style={styles.bold}>15 phút</Text> để làm thủ tục{'\n'}
            • Hủy lịch trước <Text style={styles.bold}>2 giờ</Text> nếu không thể đến{'\n'}
            • Mang theo CMND/CCCD và bảo hiểm y tế (nếu có)
          </Text>
        </Animated.View>
      </ScrollView>

      <Animated.View entering={FadeInUp.delay(1200)} style={styles.footer}>
        <TouchableOpacity
          style={styles.homeBtn}
          onPress={() => navigation.replace('PatientHome')}
        >
          <Text style={styles.homeText}>Về trang chủ</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.appointmentBtn}
          onPress={() => navigation.replace('MyAppointments')}
        >
          <LinearGradient colors={['#0066FF', '#00D4FF']} style={styles.gradientBtn}>
            <Ionicons name="calendar" size={22} color="#FFF" />
            <Text style={styles.appointmentText}>Xem lịch hẹn của tôi</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  headerTitle: { fontSize: 28, fontWeight: '900', color: '#FFF', letterSpacing: 0.5 },
  successIcon: { alignItems: 'center', marginTop: 40 },
  checkCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 30,
    shadowColor: Colors.success,
    shadowOpacity: 0.6,
    shadowRadius: 30,
  },
  message: { alignItems: 'center', marginHorizontal: 32, marginTop: 32 },
  successTitle: { fontSize: 30, fontWeight: '900', color: Colors.success, textAlign: 'center' },
  successSubtitle: { fontSize: 17, color: Colors.textLight, textAlign: 'center', marginTop: 8, lineHeight: 26 },
  doctorHighlight: { fontSize: 24, fontWeight: '900', color: Colors.primary, marginVertical: 8 },
  detailCard: {
    margin: 20,
    marginTop: 32,
    backgroundColor: Colors.card,
    borderRadius: 36,
    padding: 28,
    elevation: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.2,
    shadowRadius: 30,
  },
  cardTitle: { fontSize: 22, fontWeight: '900', color: Colors.text, textAlign: 'center', marginBottom: 24 },
  avatarSection: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 40, fontWeight: 'bold', color: '#FFF' },
  doctorInfo: { marginLeft: 20, flex: 1 },
  doctorName: { fontSize: 24, fontWeight: '900', color: Colors.text },
  specialty: { fontSize: 16, color: '#0066FF', marginTop: 6, fontWeight: '700' },
  divider: { height: 2, backgroundColor: Colors.border, marginVertical: 24 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  label: { width: 110, fontSize: 16, color: Colors.textLight, fontWeight: '600' },
  value: { flex: 1, fontSize: 17, color: Colors.text, fontWeight: '700' },
  timeValue: { flex: 1, fontSize: 20, color: Colors.primary, fontWeight: '900' },
  priceValue: { flex: 1, fontSize: 20, color: Colors.success, fontWeight: '900' },
  codeRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#F0FDF4', 
    padding: 16,
    borderRadius: 20,
    marginTop: 12,
    borderWidth: 2,
    borderColor: Colors.success,
  },
  codeLabel: { width: 110, fontSize: 16, color: Colors.success, fontWeight: '700' },
  codeValue: { flex: 1, fontSize: 18, color: Colors.success, fontWeight: '900', letterSpacing: 2 },
  noteCard: {
    margin: 20,
    marginTop: 10,
    backgroundColor: '#F0FDF4',
    padding: 24,
    borderRadius: 32,
    flexDirection: 'row',
    borderWidth: 3,
    borderColor: Colors.success,
  },
  noteText: { flex: 1, marginLeft: 20, fontSize: 16.5, color: Colors.text, lineHeight: 28 },
  bold: { fontWeight: '900', color: Colors.success },
  footer: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: Colors.white,
    elevation: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -12 },
    shadowOpacity: 0.2,
    shadowRadius: 25,
    gap: 16,
  },
  homeBtn: {
    flex: 1,
    paddingVertical: 20,
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  homeText: { fontSize: 17, fontWeight: '700', color: Colors.textLight },
  appointmentBtn: { flex: 2, borderRadius: 24, overflow: 'hidden' },
  gradientBtn: {
    flexDirection: 'row',
    paddingVertical: 20,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  appointmentText: { fontSize: 18, fontWeight: '900', color: '#FFF' },
});