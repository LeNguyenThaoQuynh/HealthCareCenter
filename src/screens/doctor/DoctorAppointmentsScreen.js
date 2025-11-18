// src/screens/doctor/DoctorAppointmentsScreen.js
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  StatusBar,
  Platform,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { DoctorAppointmentController } from '../../controllers/doctor/doctor_appointment_controller';

const TABS = [
  { key: 'today', title: 'Hôm nay', icon: 'today-outline' },
  { key: 'pending', title: 'Chờ xác nhận', icon: 'time-outline' },
  { key: 'confirmed', title: 'Đã xác nhận', icon: 'checkmark-circle-outline' },
  { key: 'completed', title: 'Đã khám xong', icon: 'medkit-outline' },
  { key: 'cancelled', title: 'Đã hủy', icon: 'close-circle-outline' },
];

export default function DoctorAppointmentsScreen() {
  const navigation = useNavigation();
  const [appointments, setAppointments] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [activeTab, setActiveTab] = useState('today');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Hàm tải dữ liệu – dùng chung cho load lần đầu & refresh
  const loadAppointments = async (isRefresh = false) => {
    if (!isRefresh) {
      setLoading(true);
      setError(null);
    }
    setRefreshing(isRefresh);

    await DoctorAppointmentController.loadAppointments({
      setAppointments,
      setLoading,
      onError: (msg) => setError(msg),
      showAlert: !isRefresh, // Chỉ hiện Alert khi load lần đầu hoặc reload thủ công
    });

    setRefreshing(false);
  };

  // Load lần đầu
  useEffect(() => {
    loadAppointments();
  }, []);

  // Tự động reload khi quay lại màn hình (chỉ các tab quan trọng)
  useFocusEffect(
    useCallback(() => {
      if (['today', 'pending', 'confirmed'].includes(activeTab)) {
        loadAppointments(false);
      }
    }, [activeTab])
  );

  // Lọc dữ liệu theo tab
  useEffect(() => {
    let result = [...appointments];

    if (activeTab === 'today') {
      result = appointments.filter(app => {
        const dateStr = app.appointment_date || app.date;
        if (!dateStr) return false;
        const appDate = new Date(dateStr);
        const d = new Date(appDate.getFullYear(), appDate.getMonth(), appDate.getDate());
        return d.getTime() === today.getTime();
      });
    } else if (activeTab === 'pending') {
      result = appointments.filter(a => a.status === 'pending');
    } else if (activeTab === 'confirmed') {
      result = appointments.filter(a => a.status === 'confirmed');
    } else if (activeTab === 'completed') {
      result = appointments.filter(a => a.status === 'completed');
    } else if (activeTab === 'cancelled') {
      result = appointments.filter(a =>
        ['cancelled', 'patient_cancelled', 'doctor_cancelled'].includes(a.status)
      );
    }

    // Sắp xếp theo thời gian
    result.sort((a, b) => 
      new Date(a.appointment_date || a.date || 0) - new Date(b.appointment_date || b.date || 0)
    );

    setFiltered(result);
  }, [appointments, activeTab]);

  const onRefresh = useCallback(() => {
    loadAppointments(true);
  }, []);

  // Kiểm tra có thể bắt đầu khám chưa (±3h đến +15 phút)
  const isTimeToStart = (dateStr) => {
    if (!dateStr) return false;
    const now = new Date();
    const appointmentTime = new Date(dateStr);
    const diffMinutes = (appointmentTime - now) / 60000;
    return diffMinutes >= -180 && diffMinutes <= 15;
  };

  const startExamination = (item) => {
    if (item.status === 'completed') {
      Alert.alert(
        'Đã khám xong',
        'Bệnh nhân này đã được khám. Bạn muốn xem lại bệnh án?',
        [
          { text: 'Hủy', style: 'cancel' },
          { text: 'Xem bệnh án', onPress: () => navigation.navigate('ViewMedicalRecord', { appointmentId: item.id }) },
        ]
      );
      return;
    }

    const patientId = item.user_id || item.patient?.id;
    if (!patientId) {
      Alert.alert('Lỗi', 'Không thể xác định bệnh nhân. Vui lòng tải lại.');
      return;
    }

    navigation.navigate('CreateMedicalRecord', {
      appointmentId: item.id,
      patientId,
      patientName: item.patient?.full_name || item.patient_name || 'Bệnh nhân',
      department: item.department?.name || 'Phòng khám chung',
    });
  };

  const getStatusGradient = (status) => {
    const map = {
      pending: ['#f39c12', '#e67e22'],
      confirmed: ['#27ae60', '#2ecc71'],
      completed: ['#2980b9', '#3498db'],
      patient_cancelled: ['#e74c3c', '#c0392b'],
      doctor_cancelled: ['#9b59b6', '#8e44ad'],
      cancelled: ['#e74c3c', '#c0392b'],
    };
    return map[status] || ['#95a5a6', '#7f8c8d'];
  };

  const renderItem = ({ item }) => {
    const name = item.patient?.full_name || item.patient_name || 'Bệnh nhân';
    const dept = item.department?.name || 'Phòng khám chung';
    const date = new Date(item.appointment_date || item.date);
    const timeStr = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const dateStr = date.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' });

    const canStart = item.status === 'confirmed' && isTimeToStart(item.appointment_date || item.date);
    const isCompleted = item.status === 'completed';
    const [g1, g2] = getStatusGradient(item.status);

    return (
      <View style={{ marginHorizontal: 16, marginBottom: 16 }}>
        <LinearGradient colors={['#ffffff', '#f8fafc']} style={{ borderRadius: 20, elevation: 12, shadowColor: '#000' }}>
          <View style={{ padding: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 21, fontWeight: '900', color: '#2c3e50' }}>{name}</Text>
              <LinearGradient colors={[g1, g2]} style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 30 }}>
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13 }}>
                  {item.status === 'pending' && 'CHỜ XÁC NHẬN'}
                  {item.status === 'confirmed' && 'ĐÃ XÁC NHẬN'}
                  {item.status === 'completed' && 'ĐÃ KHÁM XONG'}
                  {['cancelled', 'patient_cancelled', 'doctor_cancelled'].includes(item.status) && 'ĐÃ HỦY'}
                </Text>
              </LinearGradient>
            </View>

            <View style={{ marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Icon name="business" size={20} color="#2c8e7c" />
              <Text style={{ fontSize: 17, color: '#34495e', fontWeight: '700' }}>{dept}</Text>
            </View>

            <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Icon name="calendar" size={20} color="#2c8e7c" />
              <Text style={{ fontSize: 17, color: '#2c8e7c', fontWeight: '800' }}>{dateStr} • {timeStr}</Text>
            </View>

            {item.symptoms && (
              <View style={{ marginTop: 14, backgroundColor: '#e8f4f8', padding: 14, borderRadius: 16, borderLeftWidth: 5, borderLeftColor: '#3498db' }}>
                <Text style={{ fontSize: 16, color: '#2c3e50', lineHeight: 22 }}>
                  <Text style={{ fontWeight: '800' }}>Triệu chứng:</Text> {item.symptoms}
                </Text>
              </View>
            )}

            <View style={{ marginTop: 20 }}>
              {canStart && (
                <TouchableOpacity
                  onPress={() => startExamination(item)}
                  style={{ backgroundColor: '#2c8e7c', paddingVertical: 18, borderRadius: 18, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12 }}
                >
                  <Icon name="medical" size={28} color="#fff" />
                  <Text style={{ color: '#fff', fontSize: 19, fontWeight: '900' }}>BẮT ĐẦU KHÁM NGAY</Text>
                </TouchableOpacity>
              )}

              {isCompleted && (
                <TouchableOpacity
                  onPress={() => startExamination(item)}
                  style={{ backgroundColor: '#3498db', paddingVertical: 18, borderRadius: 18, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12 }}
                >
                  <Icon name="document-text" size={28} color="#fff" />
                  <Text style={{ color: '#fff', fontSize: 19, fontWeight: '900' }}>XEM LẠI BỆNH ÁN</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </LinearGradient>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f0f4f8' }}>
      <StatusBar barStyle="light-content" backgroundColor="#2c8e7c" />

      {/* Header */}
      <LinearGradient colors={['#2c8e7c', '#1e6b5f']} style={{ paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20 }}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={30} color="#fff" />
          </TouchableOpacity>
          <Text style={{ flex: 1, textAlign: 'center', fontSize: 26, fontWeight: '900', color: '#fff', marginRight: 30 }}>
            Lịch Khám Của Tôi
          </Text>
        </View>
      </LinearGradient>

      {/* Tabs */}
      <View style={{ backgroundColor: '#fff', paddingVertical: 14, flexDirection: 'row', justifyContent: 'space-around', elevation: 6 }}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            style={{
              alignItems: 'center',
              padding: 12,
              borderRadius: 16,
              backgroundColor: activeTab === tab.key ? '#2c8e7c' : 'transparent',
              minWidth: 70,
            }}
          >
            <Icon name={tab.icon} size={26} color={activeTab === tab.key ? '#fff' : '#7f8c8d'} />
            <Text style={{ marginTop: 6, fontSize: 13, fontWeight: '800', color: activeTab === tab.key ? '#fff' : '#2c3e50' }}>
              {tab.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Nội dung */}
      {loading && !refreshing ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#2c8e7c" />
          <Text style={{ marginTop: 20, fontSize: 18, color: '#7f8c8d', fontWeight: '600' }}>Đang tải lịch khám...</Text>
        </View>
      ) : error ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 }}>
          <Icon name="cloud-offline-outline" size={100} color="#e74c3c" />
          <Text style={{ marginTop: 20, fontSize: 18, color: '#c0392b', fontWeight: '700', textAlign: 'center' }}>
            {error}
          </Text>
          <TouchableOpacity
            onPress={() => loadAppointments()}
            style={{ marginTop: 20, backgroundColor: '#2c8e7c', paddingHorizontal: 30, paddingVertical: 14, borderRadius: 30 }}
          >
            <Text style={{ color: '#fff', fontWeight: '800' }}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : filtered.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 }}>
          <Icon name="calendar-clear" size={120} color="#bdc3c7" />
          <Text style={{ marginTop: 24, fontSize: 20, color: '#95a5a6', fontWeight: '700', textAlign: 'center' }}>
            {activeTab === 'today' ? 'Hôm nay bạn chưa có lịch khám nào' : 'Không có lịch hẹn nào'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2c8e7c']} />
          }
        />
      )}
    </View>
  );
}