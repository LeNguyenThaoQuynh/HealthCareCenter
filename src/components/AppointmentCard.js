// src/components/AppointmentCard.js
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp } from 'react-native-reanimated';

const Colors = {
  primary: '#1D4ED8',
  success: '#059669',
  danger: '#DC2626',
  muted: '#9CA3AF',
  textPrimary: '#1E293B',
  textSecondary: '#6B7280',
};

const AppointmentCard = React.memo(({ item, index, onCancel }) => {
  const slot = item.doctor_schedule_template || {};
  const doctor = item.doctor || {};

  // Chuyên khoa
  const specializationText =
    item.specializationText ||
    (item.specializations && item.specializations.length > 0
      ? item.specializations.join(' • ')
      : 'Chưa có chuyên khoa');

  // Giờ khám
  const timeStr =
    item.timeDisplay ||
    (slot.start_time && slot.end_time
      ? `${slot.start_time.slice(0, 5)} - ${slot.end_time.slice(0, 5)}`
      : 'Chưa xác định');

  // Xác định trạng thái
  const date = item.appointment_date ? new Date(item.appointment_date) : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isPast = date ? date < today : false;
  const isCancelled = ['cancelled', 'patient_cancelled'].includes(item.status);
  const isDoctorCancelled = item.status === 'doctor_cancelled';

  // Config màu + text theo trạng thái
  let statusConfig;
  if (isDoctorCancelled) {
    statusConfig = { colors: ['#F59E0B', '#FBBF24'], text: 'Bác sĩ hủy', icon: 'alert-circle' };
  } else if (isCancelled) {
    statusConfig = { colors: ['#DC2626', '#F87171'], text: 'Đã hủy', icon: 'close-circle' };
  } else if (isPast) {
    statusConfig = { colors: ['#6B7280', '#9CA3AF'], text: 'Hoàn thành', icon: 'checkmark-done' };
  } else {
    statusConfig = { colors: ['#10B981', '#34D399'], text: 'Đã xác nhận', icon: 'checkmark-circle' };
  }

  const dateStr = date
    ? date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : '---';

  return (
    <Animated.View entering={FadeInUp.delay(index * 80).duration(600)} style={styles.cardWrapper}>
      <TouchableOpacity activeOpacity={0.92} disabled={isCancelled || isDoctorCancelled}>
        <View style={[styles.card, (isCancelled || isDoctorCancelled) && styles.cancelledCard]}>
          <LinearGradient colors={['#FFFFFF', '#F8FAFC']} style={styles.gradient}>
            {/* HEADER: Tên bác sĩ + Trạng thái */}
            <View style={styles.headerRow}>
              <View style={styles.doctorInfo}>
                <Text style={styles.doctorName} numberOfLines={1}>
                  {doctor.name || 'Bác sĩ chưa xác định'}
                </Text>
                <Text style={styles.specialization} numberOfLines={2}>
                  {specializationText}
                </Text>
              </View>
              <LinearGradient colors={statusConfig.colors} style={styles.statusBadge}>
                <Ionicons name={statusConfig.icon} size={15} color="#FFF" />
                <Text style={styles.statusText}>{statusConfig.text}</Text>
              </LinearGradient>
            </View>

            <View style={styles.divider} />

            {/* NGÀY - GIỜ - PHÒNG */}
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Ionicons name="calendar-outline" size={18} color={Colors.primary} />
                <Text style={styles.detailValue}>{dateStr}</Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="time-outline" size={18} color={Colors.primary} />
                <Text style={styles.detailValue}>{timeStr}</Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="location-outline" size={18} color={Colors.primary} />
                <Text style={styles.detailValue}>
                  {doctor.room_number ? `P. ${doctor.room_number}` : 'Chưa có phòng'}
                </Text>
              </View>
            </View>

            {/* GIÁ KHÁM */}
            <View style={styles.priceRow}>
              <Ionicons name="cash-outline" size={20} color={Colors.success} />
              <Text style={styles.priceText}>
                {item.price ? item.price.toLocaleString('vi-VN') + ' đ' : '—'}
              </Text>
            </View>

            {/* QR CODE + MÃ PHIẾU */}
            <View style={styles.qrContainer}>
              <View style={styles.qrBox}>
                <QRCode value={item.id?.toString() || ' '} size={64} quietZone={8} />
              </View>
              <View style={styles.qrInfo}>
                <Text style={styles.label}>Mã Phiếu Hẹn (ID)</Text>
                <Text style={styles.qrCode} numberOfLines={1}>
                  {item.id}
                </Text>
              </View>
            </View>

            {/* NÚT HỦY – CHỈ HIỆN KHI onCancel ĐƯỢC TRUYỀN TỪ HistoryScreen */}
            {onCancel && (
              <TouchableOpacity style={styles.cancelButton} onPress={() => onCancel(item.id)}>
                <LinearGradient colors={['#EF4444', '#DC2626']} style={styles.cancelGradient}>
                  <Ionicons name="close-circle-outline" size={20} color="#FFF" />
                  <Text style={styles.cancelText}>Hủy Lịch Khám</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </LinearGradient>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  cardWrapper: { marginBottom: 18 },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#f1f1f1',
  },
  cancelledCard: { opacity: 0.7 },
  gradient: { padding: 20 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  doctorInfo: { flex: 1, marginRight: 12 },
  doctorName: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  specialization: { fontSize: 13.5, color: '#2563EB', fontWeight: '600', marginTop: 4, lineHeight: 18 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 5,
  },
  statusText: { color: '#FFF', fontSize: 11.5, fontWeight: '700' },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 14 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailValue: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: -4,
    gap: 8,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.success,
  },
  qrContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
    borderStyle: 'dashed',
    marginBottom: 16,
  },
  qrBox: {
    backgroundColor: '#FFF',
    padding: 8,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  qrInfo: { flex: 1, marginLeft: 14 },
  label: { fontSize: 11, color: '#64748B', fontWeight: '500' },
  qrCode: { fontSize: 14.5, fontWeight: '700', color: Colors.textPrimary, marginTop: 2 },
  cancelButton: { borderRadius: 16, overflow: 'hidden' },
  cancelGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  cancelText: { color: '#FFF', fontWeight: '800', fontSize: 15 },
});

export default AppointmentCard;