import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Share,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import QRCode from 'react-native-qrcode-svg';
import { LinearGradient } from 'expo-linear-gradient';

export default function BookingSuccess() {
  const navigation = useNavigation();
  const route = useRoute();
  const {
    appointment_id = '000000',
    doctor_name = 'Bác sĩ',
    time = '08:00 - 09:00',
    date = 'Chưa xác định',
    specialization = 'Chưa xác định',
    room = 'Chưa xác định',
    price = '180.000đ',
  } = route.params || {};

  // Tạo link QR (có thể thay bằng domain thật sau)
  const qrData = `https://yourclinic.com/booking/${appointment_id}`;

  const handleShare = async () => {
    try {
      const message = `ĐẶT LỊCH KHÁM THÀNH CÔNG!\n\n` +
        `Mã phiếu: #${appointment_id}\n` +
        `Bác sĩ: ${doctor_name}\n` +
        `Chuyên khoa: ${specialization}\n` +
        `Thời gian: ${time}\n` +
        `Ngày khám: ${date}\n` +
        `Phòng khám: ${room}\n` +
        `Phí khám: ${price}\n\n` +
        `Xem chi tiết: ${qrData}`;

      await Share.share({
        message,
        url: qrData,
        title: 'Phiếu đặt lịch khám bệnh',
      });
    } catch (err) {
      Alert.alert('Lỗi', 'Không thể chia sẻ phiếu khám');
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#10B981', '#059669']} style={styles.successHeader}>
        <Ionicons name="checkmark-circle" size={56} color="#fff" />
        <Text style={styles.successTitle}>Đặt lịch thành công!</Text>
        <Text style={styles.successSubtitle}>Chúng tôi đã nhận lịch khám của bạn</Text>
      </LinearGradient>

      <View style={styles.ticket}>
        <View style={styles.qrContainer}>
          <View style={styles.qrWrapper}>
            <QRCode
              value={qrData}
              size={180}
              color="#1F2937"
              backgroundColor="#fff"
              logo={{ uri: 'https://yourclinic.com/logo.png' }} // Thêm logo nếu muốn
              logoSize={40}
              logoBackgroundColor="white"
            />
          </View>
          <Text style={styles.qrLabel}>Quét mã tại quầy để xác nhận</Text>
        </View>

        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>Mã phiếu khám</Text>
          <Text style={styles.codeValue}>#{String(appointment_id).padStart(6, '0')}</Text>
        </View>

        <View style={styles.infoSection}>
          <InfoRow icon="person" label="Bác sĩ" value={doctor_name} />
          <InfoRow icon="medical" label="Chuyên khoa" value={specialization} bold />
          <InfoRow icon="time" label="Giờ khám" value={time} />
          <InfoRow icon="calendar" label="Ngày khám" value={date} />
          <InfoRow icon="location" label="Phòng khám" value={room} />
          <InfoRow icon="card" label="Phí khám" value={price} color="#DC2626" bold />
        </View>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Ionicons name="share-social" size={24} color="#fff" />
          <Text style={styles.shareText}>Chia sẻ</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => navigation.replace('HomeScreen')}
        >
          <Ionicons name="home" size={24} color="#fff" />
          <Text style={styles.homeText}>Về trang chủ</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.footerText}>
        Cảm ơn bạn đã tin tưởng dịch vụ của chúng tôi! Chúc bạn mau khỏe
      </Text>
    </View>
  );
}

const InfoRow = ({ icon, label, value, color, bold }) => (
  <View style={styles.infoRow}>
    <Ionicons name={icon} size={22} color="#4B5563" />
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={[styles.infoValue, bold && styles.boldValue, color && { color }]}>
      {value}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0FDF4',
  },
  successHeader: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 80 : 60,
    paddingBottom: 36,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
  },
  successTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: '#fff',
    marginTop: 16,
  },
  successSubtitle: {
    fontSize: 17,
    color: '#D1FAE5',
    marginTop: 8,
    fontWeight: '600',
  },
  ticket: {
    marginHorizontal: 20,
    marginTop: -40,
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 28,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  qrWrapper: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 24,
    elevation: 8,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  qrLabel: {
    fontSize: 15,
    color: '#059669',
    fontWeight: '700',
  },
  codeCard: {
    backgroundColor: '#ECFDF5',
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 28,
    borderWidth: 2,
    borderColor: '#10B981',
  },
  codeLabel: {
    fontSize: 16,
    color: '#059669',
    fontWeight: '700',
  },
  codeValue: {
    fontSize: 32,
    fontWeight: '900',
    color: '#065F46',
    marginTop: 6,
    letterSpacing: 3,
  },
  infoSection: {
    marginTop: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoLabel: {
    flex: 1,
    marginLeft: 16,
    fontSize: 16,
    color: '#4B5563',
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '600',
  },
  boldValue: {
    fontWeight: '900',
    fontSize: 17,
    color: '#065F46',
  },
  actionButtons: {
    flexDirection: 'row',
    marginHorizontal: 20,
    gap: 16,
    marginTop: 20,
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#6366F1',
    paddingVertical: 18,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
  },
  shareText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 17,
    marginLeft: 10,
  },
  homeButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#10B981',
    paddingVertical: 18,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
  },
  homeText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 17,
    marginLeft: 10,
  },
  footerText: {
    textAlign: 'center',
    marginTop: 32,
    marginBottom: 30,
    color: '#059669',
    fontSize: 15,
    fontWeight: '600',
    fontStyle: 'italic',
  },
});