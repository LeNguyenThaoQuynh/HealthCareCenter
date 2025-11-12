import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '../../../../api/supabase';
import { LinearGradient } from 'expo-linear-gradient'; // Import LinearGradient

export default function ConfirmBooking() {
  const navigation = useNavigation();
  const route = useRoute();
  // Giả sử price được truyền từ màn hình trước để hiển thị nhanh
  const { date, department, slot, doctor, price: initialPrice } = route.params; 

  const [loading, setLoading] = useState(false);
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  // Sử dụng giá trị truyền vào nếu có, nếu không mặc định 150.000đ
  const [servicePrice, setServicePrice] = useState(
    initialPrice ? Number(initialPrice).toLocaleString('vi-VN') + 'đ' : '150.000đ'
  );

  useEffect(() => {
    fetchPatientAndServiceInfo();
  }, []);

  // Hàm định dạng giá
  const formatPrice = (value) => {
    if (value === null || value === undefined) return '0đ';
    return Number(value).toLocaleString('vi-VN') + 'đ';
  }

  const fetchPatientAndServiceInfo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Lấy thông tin bệnh nhân
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('full_name, phone')
        .eq('id', user.id)
        .single();

      if (profile) {
        setPatientName(profile.full_name || '');
        setPatientPhone(profile.phone || '');
      }

      // 2. Lấy giá dịch vụ (Nếu chưa có từ route.params)
      if (!initialPrice) {
        const { data: service } = await supabase
          .from('services')
          .select('price')
          .eq('department_id', department.id)
          .order('id')
          .limit(1)
          .single();
    
        if (service && service.price) {
          setServicePrice(formatPrice(service.price));
        }
      }

    } catch (err) {
      console.warn('Lỗi khởi tạo:', err);
    }
  };

  const handleBooking = async () => {
    if (!patientName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập họ tên bệnh nhân.');
      return;
    }
    if (!patientPhone.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập số điện thoại.');
      return;
    }
    const cleanPhone = patientPhone.replace(/\D/g, '');
    if (!/^\d{10,11}$/.test(cleanPhone)) {
      Alert.alert('Lỗi', 'Số điện thoại không hợp lệ (10-11 số).');
      return;
    }

    setLoading(true);
    try {
      const { data: { user }, error: userErr } = await supabase.auth.getUser();
      if (userErr || !user) throw new Error('Chưa đăng nhập');

      // 1. Kiểm tra Slot có hợp lệ và lấy Max Patients
      const weekdays = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
      const dayOfWeek = weekdays[new Date(date).getDay()];
      
      // Giả định doctor.id, slot.start_time, slot.end_time là đủ để tìm template
      const { data: slotExists, error: checkError } = await supabase
        .from('doctor_schedule_template')
        .select('*')
        .eq('doctor_id', doctor.id)
        .eq('day_of_week', dayOfWeek)
        .lte('start_time', slot.start_time) // Start time của template phải trước hoặc bằng slot start time
        .gte('end_time', slot.end_time) // End time của template phải sau hoặc bằng slot end time
        .maybeSingle();

      if (checkError) throw new Error('Không thể kiểm tra khung giờ: ' + checkError.message);
      if (!slotExists) {
        Alert.alert('Lỗi', 'Khung giờ đã bị xóa hoặc không tồn tại. Vui lòng chọn lại.');
        navigation.goBack();
        return;
      }

      // 2. Kiểm tra số lượng đã đặt
      const { data: existing, error: existErr } = await supabase
        .from('appointments')
        .select('id')
        .eq('slot_id', slotExists.id)
        .eq('appointment_date', date);

      if (existErr) console.error('Lỗi khi kiểm tra lịch:', existErr);
      if (existing && existing.length >= (slotExists.max_patients_per_slot || 5)) {
        Alert.alert('Thông báo', 'Khung giờ này đã hết chỗ. Vui lòng chọn khung giờ khác.');
        setLoading(false);
        return;
      }

      // 3. Gọi RPC đặt lịch
      const { data, error } = await supabase.rpc('book_appointment_rpc', {
        p_user_id: user.id,
        p_doctor_id: doctor.id,
        p_slot_id: slotExists.id,
        p_patient_name: patientName.trim(),
        p_patient_phone: cleanPhone, // Dùng phone đã làm sạch
        p_department_id: department.id,
        p_appointment_date: date,
      });

      if (error) throw new Error(`Lỗi từ RPC: ${error.message || 'Không xác định'}`);
      const appointmentId = data?.appointment_id;
      if (!appointmentId) throw new Error('Không nhận được mã lịch hẹn.');

      // 4. Thành công
      const timeDisplay = `${slot.start_time.slice(0, 5)} - ${slot.end_time.slice(0, 5)}`;
      const dateDisplay = new Date(date).toLocaleDateString('vi-VN', {
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });

      Alert.alert(
        'Đặt lịch thành công! 🥳',
        `Mã lịch: ${appointmentId}\nBác sĩ: ${doctor.name}\nThời gian: ${timeDisplay}\nNgày: ${dateDisplay}\nGiá: ${servicePrice}`,
        [
          {
            text: 'Xem vé',
            onPress: () =>
              navigation.replace('BookingSuccess', {
                appointment_id: appointmentId,
                doctor_name: doctor.name,
                time: timeDisplay,
                date: dateDisplay,
                department: department.name,
                room: doctor.room_number || '—',
                price: servicePrice,
              }),
          },
          { text: 'Đóng', style: 'cancel' },
        ]
      );
    } catch (err) {
      console.error('LỖI ĐẶT LỊCH:', err);
      Alert.alert('Lỗi', err.message || 'Không thể đặt lịch. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const timeDisplay = `${slot.start_time.slice(0, 5)} - ${slot.end_time.slice(0, 5)}`;
  const dateDisplay = new Date(date).toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.title}>Xác nhận đặt lịch</Text>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        
        {/* THÔNG TIN LỊCH KHÁM */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Chi tiết lịch khám</Text>
          <View style={styles.divider} />

          <InfoRow icon="calendar-outline" label="Ngày khám" value={dateDisplay} />
          <InfoRow icon="time-outline" label="Giờ khám" value={timeDisplay} />
          <InfoRow icon="business-outline" label="Chuyên khoa" value={department.name} />
          <InfoRow icon="person-outline" label="Bác sĩ" value={doctor.name} />
          {doctor.room_number && (
            <InfoRow icon="location-outline" label="Phòng khám" value={doctor.room_number} />
          )}
        </View>

        {/* THÔNG TIN BỆNH NHÂN */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Thông tin bệnh nhân</Text>
          <View style={styles.divider} />
          
          <InputGroup 
            icon="person-outline" 
            placeholder="Họ và tên" 
            value={patientName} 
            onChangeText={setPatientName} 
            autoCapitalize="words"
          />
          <InputGroup 
            icon="call-outline" 
            placeholder="Số điện thoại" 
            value={patientPhone} 
            onChangeText={setPatientPhone} 
            keyboardType="phone-pad" 
            maxLength={11}
          />
        </View>

        {/* THẺ GIÁ */}
        <View style={styles.priceCardContainer}>
            <LinearGradient
                colors={['#10B981', '#059669']} 
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.priceCard}
            >
                <Text style={styles.priceLabel}>Phí khám dự kiến</Text>
                <Text style={styles.priceValue}>{servicePrice}</Text>
            </LinearGradient>
        </View>
      </ScrollView>

      {/* FOOTER BUTTON */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={handleBooking}
          disabled={loading}
        >
          <LinearGradient
            colors={loading ? ['#9CA3AF', '#9CA3AF'] : ['#3B82F6', '#1E40AF']} 
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientButton}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.confirmText}>Đặt lịch ngay</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// === COMPONENT CON TÁCH BIỆT ===

const InfoRow = ({ icon, label, value }) => (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={18} color="#4B5563" />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
);

const InputGroup = ({ icon, placeholder, value, onChangeText, ...props }) => (
    <View style={styles.inputContainer}>
        <Ionicons name={icon} size={20} color="#6B7280" style={styles.inputIcon} />
        <TextInput
            style={styles.input}
            placeholder={placeholder}
            placeholderTextColor="#9CA3AF"
            value={value}
            onChangeText={onChangeText}
            {...props}
        />
    </View>
);


// === STYLES MỚI ===

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7FC' }, // Nền sáng hơn, mát mẻ hơn
  scrollContent: { paddingVertical: 10, paddingBottom: 100 },
  
  // === HEADER ===
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 55 : 35,
    paddingHorizontal: 18,
    paddingBottom: 18,
    backgroundColor: '#fff',
    borderBottomWidth: 0, 
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  backButton: { 
    padding: 4, 
    marginRight: 8,
  },
  title: { 
    fontSize: 22, 
    fontWeight: '800', 
    color: '#1F2937', 
    letterSpacing: -0.5 
  },
  
  // === CARD & INFO ROWS ===
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 18,
    marginTop: 18,
    padding: 20, // Tăng padding
    borderRadius: 18, // Góc bo lớn hơn
    elevation: 8, // Bóng đổ mạnh hơn, mượt hơn
    shadowColor: '#3B82F6', // Màu bóng xanh nhẹ
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardTitle: { 
    fontSize: 18, 
    fontWeight: '800', 
    color: '#1F2937', 
    marginBottom: 12 
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 10,
  },
  infoRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 14, 
  },
  infoLabel: { 
    flex: 1, 
    marginLeft: 15, 
    color: '#4B5563', 
    fontSize: 15, 
    fontWeight: '500' 
  },
  infoValue: { 
    fontWeight: '700', 
    color: '#1F2937', 
    fontSize: 15 
  },

  // === INPUTS ===
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB', // Màu viền nhẹ
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 16,
    backgroundColor: '#fff', // Nền trắng cho input
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  inputIcon: { marginRight: 10 },
  input: { 
    flex: 1, 
    fontSize: 16, 
    color: '#1F2937', 
    paddingVertical: Platform.OS === 'ios' ? 14 : 12 
  },

  // === PRICE CARD (Sử dụng LinearGradient) ===
  priceCardContainer: {
    marginHorizontal: 18,
    marginTop: 18,
    marginBottom: 20,
    borderRadius: 15,
    overflow: 'hidden', // Quan trọng để gradient không tràn ra ngoài
    elevation: 8,
    shadowColor: '#059669', // Bóng đổ màu xanh lá
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  priceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderRadius: 15,
  },
  priceLabel: { 
    fontSize: 16, 
    color: '#fff', 
    fontWeight: '600' 
  },
  priceValue: { 
    fontSize: 22, 
    fontWeight: '800', 
    color: '#fff', 
    letterSpacing: 0.5 
  },
  
  // === FOOTER & BUTTON ===
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 30 : 15, // Khoảng đệm dưới cho iOS
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  confirmButton: {
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  gradientButton: {
    padding: 18,
    alignItems: 'center',
  },
  confirmText: { 
    color: '#fff', 
    fontWeight: '800', 
    fontSize: 17 
  },
});