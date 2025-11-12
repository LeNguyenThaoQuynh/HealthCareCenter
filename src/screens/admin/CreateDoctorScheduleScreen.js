// src/screens/admin/CreateDoctorScheduleScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { supabase } from '../../api/supabase';
import { styles } from '../../styles/admin/CreateDoctorScheduleStyles';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function CreateDoctorScheduleScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { doctorInfo } = route.params;

  const [schedules, setSchedules] = useState({});
  const [loading, setLoading] = useState(false);
  const weekDays = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];

  // === ĐỊNH DẠNG GIỜ NHẬP ===
  const formatTimeInput = (text = '') => {
    const cleaned = String(text || '').replace(/[^0-9]/g, '');
    if (cleaned.length === 0) return '';
    if (cleaned.length <= 2) return cleaned;
    return `${cleaned.slice(0, 2)}:${cleaned.slice(2, 4)}`.slice(0, 5);
  };

  const isValidTime = (time) => /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);

  // === THÊM CA ===
  const addSlot = (day) => {
    const existing = schedules[day] || [];
    let newSlot;

    if (existing.length > 0) {
      const lastSlot = existing[existing.length - 1];
      let lastEnd = lastSlot.end;
      let [h, m] = lastEnd.split(':').map(Number);
      let totalMinutes = h * 60 + m + 60;

      let newH = Math.floor(totalMinutes / 60) % 24;
      let newM = totalMinutes % 60;

      // BỎ QUA GIỜ NGHỈ TRƯA
      if (newH === 12 && newM === 0) {
        totalMinutes += 60;
        newH = 13;
        newM = 0;
      }

      const newStart = `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
      const endMin = totalMinutes + 60;
      const endH = Math.floor(endMin / 60) % 24;
      const endM = endMin % 60;
      let newEnd = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

      const startMin = newH * 60 + newM;
      const endMinReal = endH * 60 + endM;
      if (endMinReal <= startMin) {
        const nextDayH = (endH + 1) % 24;
        newEnd = `${String(nextDayH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
      }

      newSlot = { start: newStart, end: newEnd };
    } else {
      newSlot = { start: '08:00', end: '09:00' };
    }

    setSchedules((prev) => ({
      ...prev,
      [day]: [...(prev[day] || []), newSlot],
    }));
  };

  // === XÓA CA ===
  const removeSlot = (day, index) => {
    setSchedules((prev) => {
      const updated = prev[day].filter((_, i) => i !== index);
      if (updated.length === 0) {
        const { [day]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [day]: updated };
    });
  };

  // === CẬP NHẬT GIỜ ===
  const updateSlotTime = (day, index, field, value) => {
    const formatted = formatTimeInput(value);
    setSchedules((prev) => {
      const updated = [...(prev[day] || [])];
      updated[index] = { ...updated[index], [field]: formatted };
      return { ...prev, [day]: updated };
    });
  };

  // === HOÀN TẤT → LƯU TẤT CẢ VÀO DATABASE ===
  const handleCreate = async () => {
    const allSlots = Object.values(schedules).flat();
    if (allSlots.length === 0) {
      Alert.alert('Lỗi', 'Vui lòng chọn ít nhất 1 khung giờ làm việc.');
      return;
    }

    // === KIỂM TRA GIỜ ===
    for (const [day, slots] of Object.entries(schedules)) {
      const sorted = [...slots].sort((a, b) => a.start.localeCompare(b.start));
      for (let i = 0; i < sorted.length; i++) {
        const current = sorted[i];
        const [sh, sm] = current.start.split(':').map(Number);
        const [eh, em] = current.end.split(':').map(Number);
        const currentStartMin = sh * 60 + sm;
        const currentEndMin = eh * 60 + em;

        if (!isValidTime(current.start) || !isValidTime(current.end)) {
          Alert.alert('Sai định dạng', `${day} - Slot ${i + 1}: Dùng HH:MM`);
          return;
        }

        const isOvernight = currentEndMin < currentStartMin;
        if (!isOvernight && currentStartMin >= currentEndMin) {
          Alert.alert('Lỗi giờ', `${day} - Slot ${i + 1}: Giờ kết thúc phải sau giờ bắt đầu`);
          return;
        }

        if (i < sorted.length - 1) {
          const next = sorted[i + 1];
          const [nh, nm] = next.start.split(':').map(Number);
          const nextStartMin = nh * 60 + nm;
          if (currentEndMin > nextStartMin && !isOvernight) {
            Alert.alert(
              'Trùng giờ',
              `${day}: ${current.start}–${current.end} đè lên ${next.start}–${next.end}`
            );
            return;
          }
        }
      }
    }

    setLoading(true);
    try {
      // 1. TẠO USER TRONG AUTH
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: doctorInfo.email,
        password: doctorInfo.password,
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          Alert.alert('Email đã tồn tại', 'Vui lòng dùng email khác.');
        } else {
          throw authError;
        }
        return;
      }

      const userId = authData.user?.id;
      if (!userId) throw new Error('Không lấy được ID người dùng');

      // 2. INSERT user_profiles → DÙNG role_id
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: userId,
          role_id: 2, // ← ID của 'doctor' trong bảng roles
          full_name: doctorInfo.fullName.trim(),
          email: doctorInfo.email,
          created_at: new Date().toISOString(),
        });

      if (profileError) throw profileError;

      // 3. INSERT doctors
      const { error: doctorError } = await supabase
        .from('doctors')
        .insert({
          id: userId,
          name: doctorInfo.fullName.trim(),
          department_id: parseInt(doctorInfo.departmentId),
          specialization: doctorInfo.specialization || null,
          experience_years: doctorInfo.experienceYears || null,
          room_number: doctorInfo.roomNumber || null,
          max_patients_per_slot: doctorInfo.maxPatients || 5,
          bio: doctorInfo.bio || null,
        });

      if (doctorError) throw doctorError;

      // 4. GỘP VÀ LƯU LỊCH → CÓ max_patients_per_slot
      const scheduleList = Object.entries(schedules).map(([day, slots]) => {
        const sorted = [...slots].sort((a, b) => a.start.localeCompare(b.start));
        return {
          doctor_id: userId,
          day_of_week: day,
          start_time: sorted[0].start,
          end_time: sorted[sorted.length - 1].end,
          max_patients_per_slot: doctorInfo.maxPatients, // ← CỘT ĐÃ ĐƯỢC THÊM
        };
      });

      const { error: scheduleError } = await supabase
        .from('doctor_schedule_template')
        .insert(scheduleList);

      if (scheduleError) throw scheduleError;

      Alert.alert('Thành công!', `Đã tạo bác sĩ: ${doctorInfo.fullName}`, [
        { text: 'OK', onPress: () => navigation.navigate('Bác sĩ') },
      ]);
    } catch (error) {
      console.error('Lỗi tạo bác sĩ:', error);
      Alert.alert('Lỗi', error.message || 'Tạo thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lịch làm việc</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* DOCTOR CARD */}
        <View style={styles.doctorCard}>
          <Text style={styles.doctorLabel}>Bác sĩ</Text>
          <Text style={styles.doctorName}>{doctorInfo.fullName}</Text>
        </View>

        {/* SCHEDULE SECTION */}
        <View style={styles.scheduleSection}>
          <Text style={styles.sectionTitle}>Chọn khung giờ làm việc</Text>

          {weekDays.map((day) => (
            <View key={day} style={styles.dayContainer}>
              <View style={styles.dayHeader}>
                <Text style={styles.dayName}>{day}</Text>
                <TouchableOpacity onPress={() => addSlot(day)} style={styles.addButton}>
                  <Icon name="add" size={16} color="#fff" />
                  <Text style={styles.addButtonText}>Thêm ca</Text>
                </TouchableOpacity>
              </View>

              {schedules[day]?.map((slot, index) => {
                const showBreak = index > 0;
                const prevEnd = showBreak ? schedules[day][index - 1].end : null;
                const currentStart = slot.start;

                return (
                  <View key={index}>
                    {showBreak && prevEnd === '12:00' && currentStart === '13:00' && (
                      <Text style={styles.lunchBreakText}>
                        Nghỉ trưa: 12:00 - 13:00
                      </Text>
                    )}
                    <View style={styles.slotContainer}>
                      <View style={styles.timeBox}>
                        <TextInput
                          placeholder="08:00"
                          value={slot.start}
                          onChangeText={(t) => updateSlotTime(day, index, 'start', t)}
                          style={styles.timeInput}
                          maxLength={5}
                          keyboardType="numeric"
                        />
                      </View>
                      <Text style={styles.arrow}>→</Text>
                      <View style={styles.timeBox}>
                        <TextInput
                          placeholder="12:00"
                          value={slot.end}
                          onChangeText={(t) => updateSlotTime(day, index, 'end', t)}
                          style={styles.timeInput}
                          maxLength={5}
                          keyboardType="numeric"
                        />
                      </View>
                      <TouchableOpacity onPress={() => removeSlot(day, index)} style={styles.deleteIcon}>
                        <Icon name="trash" size={18} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}

              {!schedules[day] && (
                <Text style={styles.emptyText}>Chưa có khung giờ</Text>
              )}
            </View>
          ))}
        </View>

        {/* CREATE BUTTON */}
        <TouchableOpacity
          style={[styles.createButton, loading && styles.createButtonDisabled]}
          onPress={handleCreate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Icon name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.createButtonText}>Hoàn tất tạo bác sĩ</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}