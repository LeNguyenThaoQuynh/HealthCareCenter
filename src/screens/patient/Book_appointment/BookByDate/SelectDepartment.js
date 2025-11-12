// src/screens/patient/Book_appointment/BookByDate/SelectDepartment.js
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  FlatList,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient'; // <-- Cần import LinearGradient
import { supabase } from '../../../../api/supabase';

// LƯU Ý: Đảm bảo bạn đã cài đặt 'expo-linear-gradient' nếu dùng Expo: expo install expo-linear-gradient

export default function SelectDepartment() {
  const navigation = useNavigation();
  const route = useRoute();
  const { date } = route.params;

  const [departments, setDepartments] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // === FORMAT NGÀY ===
  const formatHeaderDate = (dateStr) => {
    const dateObj = new Date(dateStr);
    const dayNames = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const day = dayNames[dateObj.getDay()];
    const dateNum = dateObj.getDate();
    const month = dateObj.getMonth() + 1;
    return `${day}, ${dateNum}/${month}`;
  };
  const headerDate = useMemo(() => formatHeaderDate(date), [date]);

  // === CHUYỂN NGÀY → THỨ (TIẾNG VIỆT, ĐÃ TRIM) ===
  const getVietnameseDay = (dateStr) => {
    const date = new Date(dateStr);
    const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    return dayNames[date.getDay()].trim();
  };

  // === LẤY KHOA CÓ BÁC SĨ LÀM VIỆC NGÀY ĐÓ ===
  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    try {
      const targetDay = getVietnameseDay(date);

      // (Giữ nguyên logic truy vấn Supabase)
      const { data, error } = await supabase
        .from('departments')
        .select(`
          id,
          name,
          description,
          services!services_department_id_fkey (price),
          doctors!doctors_department_id_fkey!inner (
            id,
            name,
            room_number,
            specialization,
            experience_years,
            doctor_schedule_template!doctor_schedule_template_doctor_id_fkey!inner (
              day_of_week,
              start_time,
              end_time
            )
          )
        `)
        .order('name', { ascending: true });

      if (error) throw error;

      const validDepts = data
        .map(dept => {
          const validDoctors = (dept.doctors || []).filter(doctor =>
            (doctor.doctor_schedule_template || []).some(t =>
              t.day_of_week?.trim() === targetDay &&
              t.end_time > t.start_time
            )
          );

          const servicePrice = dept.services?.[0]?.price ?? 150000;

          return {
            ...dept,
            doctors: validDoctors,
            price: servicePrice,
          };
        })
        .filter(dept => dept.doctors.length > 0);

      setDepartments(validDepts);
    } catch (err) {
      console.error('Lỗi lấy khoa:', err);
      Alert.alert('Lỗi', 'Không thể tải danh sách chuyên khoa.');
    } finally {
      setLoading(false);
    }
  }, [date]);

  useFocusEffect(
    useCallback(() => {
      fetchDepartments();
    }, [fetchDepartments])
  );

  // === TÌM KIẾM ===
  const filteredDepartments = useMemo(() => {
    if (!search.trim()) return departments;
    const lower = search.toLowerCase();
    return departments.filter(d =>
      d.name.toLowerCase().includes(lower) ||
      (d.description && d.description.toLowerCase().includes(lower))
    );
  }, [search, departments]);

  useEffect(() => {
    setFiltered(filteredDepartments);
  }, [filteredDepartments]);

  // === RENDER ITEM ===
  const renderItem = useCallback(({ item }) => {
    const hasNote = item.description && item.description.includes('Chỉ nhận');
    const price = item.price || 150000;

    // Tính toán số lượng bác sĩ có sẵn (đã được lọc ở bước fetch)
    const availableDoctorsCount = item.doctors.length;

    return (
      <TouchableOpacity
        style={styles.item}
        onPress={() =>
          navigation.navigate('SelectTimeSlot', {
            date,
            department: item,
            // Chuẩn bị template dữ liệu cho màn hình tiếp theo
            templates: item.doctors.flatMap(d =>
              (d.doctor_schedule_template || []).map(t => ({
                ...t,
                doctor_id: d.id,
                doctors: {
                  id: d.id,
                  name: d.name || 'Bác sĩ', 
                  room_number: d.room_number,
                  specialization: d.specialization,
                  experience_years: d.experience_years,
                },
                max_patients_per_slot: 5
              }))
            )
          })
        }
      >
        <View style={styles.itemLeft}>
          {/* Icon (Thay vì số 1) */}
          <View style={styles.iconCircle}>
            <Ionicons name="medical" size={20} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.deptName}>{item.name}</Text>
            {/* Thêm thông tin số lượng bác sĩ */}
            <Text style={styles.doctorCount}>
              <Ionicons name="person" size={12} color="#4B5563" /> {availableDoctorsCount} bác sĩ có lịch
            </Text>
            {hasNote && <Text style={styles.note}>{item.description}</Text>}
          </View>
        </View>
        
        <View style={styles.itemRight}>
          <Text style={styles.price}>{price.toLocaleString('vi-VN')}đ</Text>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </View>
      </TouchableOpacity>
    );
  }, [date, navigation]);

  const keyExtractor = useCallback(item => item.id.toString(), []);

  return (
    <View style={styles.container}>
      {/* HEADER MỚI VỚI GRADIENT */}
      <LinearGradient
        colors={['#1E40AF', '#60A5FA']} 
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Chọn chuyên khoa</Text>
        <Text style={styles.subtitle}>Ngày khám: {headerDate}</Text>
      </LinearGradient>

      {/* SEARCH CONTAINER MỚI */}
      <View style={styles.searchContainerWrapper}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            placeholder="Tìm nhanh chuyên khoa, triệu chứng..."
            placeholderTextColor="#9CA3AF"
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
          />
        </View>
      </View>

      <Text style={styles.hint}>Nhấn vào để xem và chọn khung giờ trống</Text>

      {/* BODY CONTENT */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Đang tải danh sách chuyên khoa...</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color="#D1D5DB" />
          <Text style={styles.emptyText}>
            {search
              ? `Không tìm thấy chuyên khoa '${search}'`
              : `Rất tiếc, ngày ${headerDate} không có chuyên khoa nào làm việc.`}
          </Text>
          <TouchableOpacity style={styles.backButtonAction} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Chọn ngày khác</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={10}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    marginBottom: 10,
  },
  title: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.3 },
  subtitle: { fontSize: 14, fontWeight: '500', color: '#E5E7EB', marginTop: 4 },

  searchContainerWrapper: {
    // Để Search Input nằm hơi chồng lên Header
    marginTop: -20,
    marginHorizontal: 16,
    zIndex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 5,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16, color: '#1F2937' },
  
  hint: { 
    marginHorizontal: 24, 
    color: '#FB923C', 
    fontSize: 13, 
    marginTop: 16, 
    marginBottom: 8,
    fontWeight: '600',
  },

  listContent: { 
    paddingHorizontal: 16, 
    paddingBottom: 20,
    paddingTop: 8, // Thêm padding trên để list không dính vào hint
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  itemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#059669', // Màu xanh lá cây đậm
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  deptName: { fontWeight: '800', color: '#1F2937', fontSize: 16, marginBottom: 2 },
  doctorCount: { fontSize: 13, color: '#4B5563', fontWeight: '500' },
  note: { 
    fontSize: 12, 
    color: '#DC2626', 
    marginTop: 4, 
    fontWeight: '600',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  itemRight: { alignItems: 'flex-end', justifyContent: 'center' },
  price: { fontWeight: '800', color: '#1E40AF', fontSize: 16, marginBottom: 4 },
  
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 12, color: '#6B7280', fontSize: 15 },
  emptyText: { marginTop: 12, color: '#6B7280', textAlign: 'center', fontSize: 15, lineHeight: 22 },
  backButtonAction: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
  },
  backButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
});