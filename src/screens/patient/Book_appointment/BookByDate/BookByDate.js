// src/screens/patient/Book_appointment/BookByDate/BookByDate.js
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Calendar } from 'react-native-calendars';
import { supabase } from '../../../../api/supabase';

// Định nghĩa màu sắc custom
const AVAILABLE_COLOR_BG = '#ECFDF5'; // Nền xanh lá nhạt cho ngày có lịch
const AVAILABLE_COLOR_BORDER = '#10B981'; // Viền xanh lá đậm
const AVAILABLE_TEXT_COLOR = '#111827'; // <--- ĐÃ ĐỔI SANG MÀU ĐEN ĐẬM HƠN
const SELECTED_COLOR = '#059669'; // Màu nền khi ngày được chọn

export default function BookByDate() {
  const navigation = useNavigation();
  const [selectedDate, setSelectedDate] = useState('');
  const [markedDates, setMarkedDates] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchAvailableDates = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .rpc('get_available_dates', { 
          from_date: today, 
          days_ahead: 90 
        });

      if (error) throw error;

      const marked = {};
      if (data && data.length > 0) {
        data.forEach(item => {
          // *** SỬ DỤNG customStyles cho ngày có lịch ***
          marked[item.work_date] = {
            customStyles: {
              container: {
                backgroundColor: AVAILABLE_COLOR_BG,
                borderRadius: 16, // Bo tròn
                borderWidth: 1,
                borderColor: AVAILABLE_COLOR_BORDER,
              },
              text: {
                color: AVAILABLE_TEXT_COLOR, // Màu chữ đã được làm đậm
                fontWeight: '700',
              },
            },
            isAvailable: true, // Thêm flag để kiểm tra
          };
        });
      }

      // Đặt lại style cho ngày đã chọn (nếu có)
      if (selectedDate && marked[selectedDate]) {
        marked[selectedDate] = {
          ...marked[selectedDate],
          selected: true,
          customStyles: {
            container: {
              backgroundColor: SELECTED_COLOR, // Màu nền xanh đậm khi chọn
              borderRadius: 16,
            },
            text: {
              color: '#FFFFFF', // Màu chữ trắng khi chọn
              fontWeight: '700',
            },
          },
        };
      }

      setMarkedDates(marked);
    } catch (err) {
      console.error('Lỗi tải lịch:', err);
      Alert.alert('Lỗi', 'Không thể tải lịch. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchAvailableDates();
    }, [])
  );

  const handleDayPress = (day) => {
    // Kiểm tra bằng flag isAvailable
    if (!markedDates[day.dateString]?.isAvailable) { 
      Alert.alert('Không thể đặt', 'Ngày này không có khung giờ khám.');
      return;
    }

    // Cập nhật markedDates để thay đổi style ngày cũ và ngày mới
    setMarkedDates(prev => {
        const newMarkedDates = { ...prev };

        // 1. Đặt lại style cho ngày cũ (nếu có)
        if (selectedDate && newMarkedDates[selectedDate]) {
            newMarkedDates[selectedDate] = {
                ...newMarkedDates[selectedDate],
                selected: false, 
                customStyles: {
                    container: {
                        backgroundColor: AVAILABLE_COLOR_BG,
                        borderRadius: 16,
                        borderWidth: 1,
                        borderColor: AVAILABLE_COLOR_BORDER,
                    },
                    text: {
                        color: AVAILABLE_TEXT_COLOR,
                        fontWeight: '700',
                    },
                },
            };
        }

        // 2. Đặt style cho ngày mới được chọn
        newMarkedDates[day.dateString] = {
            ...newMarkedDates[day.dateString],
            selected: true, 
            customStyles: {
                container: {
                    backgroundColor: SELECTED_COLOR, // Màu nền xanh đậm
                    borderRadius: 16,
                },
                text: {
                    color: '#FFFFFF', // Màu chữ trắng
                    fontWeight: '700',
                },
            },
        };
        return newMarkedDates;
    });
    
    setSelectedDate(day.dateString);
    navigation.navigate('SelectDepartment', { date: day.dateString });
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.title}>Chọn ngày khám</Text>
      </View>

      {/* LOADING */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Đang tải lịch khám...</Text>
        </View>
      )}

      {/* CALENDAR */}
      <View style={styles.calendarContainer}>
        <Calendar
          onDayPress={handleDayPress}
          markingType={'custom'}
          markedDates={markedDates}
          minDate={new Date().toISOString().split('T')[0]}
          theme={{
            backgroundColor: '#ffffff',
            calendarBackground: '#ffffff',
            textSectionTitleColor: '#1F2937',
            todayTextColor: '#10B981',
            todayBackgroundColor: '#ECFDF5',
            dayTextColor: '#1F2937',
            textDisabledColor: '#D1D5DB',
            arrowColor: '#4B5563',
            monthTextColor: '#1F2937',
            textDayFontWeight: '600',
            textMonthFontWeight: '800',
            textDayHeaderFontWeight: '700',
          }}
        />
      </View>

      {/* LEGEND */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          {/* Legend mô phỏng kiểu bo tròn */}
          <View style={[styles.dot, { 
            backgroundColor: AVAILABLE_COLOR_BG, 
            borderWidth: 1, 
            borderColor: AVAILABLE_COLOR_BORDER,
            borderRadius: 8, 
          }]} />
          <Text style={styles.legendText}>Có lịch khám</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { 
            backgroundColor: '#E5E7EB',
            borderWidth: 1,
            borderColor: '#E5E7EB',
            borderRadius: 8,
          }]} />
          <Text style={styles.legendText}>Không có lịch</Text>
        </View>
      </View>

      <Text style={styles.note}>
        Bấm vào ngày có màu xanh để tiếp tục đặt khám.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: { padding: 4 },
  title: { fontSize: 20, fontWeight: '700', marginLeft: 12, color: '#1F2937' },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  loadingText: { marginTop: 12, color: '#6B7280', fontSize: 15 },
  calendarContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  legend: { 
    marginHorizontal: 20, 
    marginTop: 16, 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    gap: 20,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  dot: { 
    width: 14, 
    height: 14, 
    borderRadius: 7, 
    marginRight: 10,
  },
  legendText: { fontSize: 13, color: '#6B7280' },
  note: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 32,
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 20,
  },
});