// src/screens/doctor/DoctorAppointmentsScreen.js → ĐÃ DÙNG ĐÚNG 100% THEME CHÍNH, ĐẸP NHƯ PHƯỚC EM

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  StatusBar,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';

import { DoctorAppointmentController } from '../../controllers/doctor/doctor_appointment_controller';
import { supabase } from '../../api/supabase';

// DÙNG ĐÚNG THEME CHÍNH
import {
  COLORS,
  GRADIENTS,
  SPACING,
  BORDER_RADIUS,
  FONT_SIZE,
  FONT_WEIGHT,
  SHADOWS,
} from '../../theme/theme';

import { DoctorAppointmentsStyles as styles } from '../../styles/doctor/DoctorAppointmentsStyles';

const TABS = [
  { key: 'today', title: 'Hôm nay' },
  { key: 'pending', title: 'Chờ xác nhận' },
  { key: 'confirmed', title: 'Đã xác nhận' },
  { key: 'waiting_results', title: 'Chờ kết quả' },
  { key: 'completed', title: 'Đã khám xong' },
  { key: 'cancelled', title: 'Đã hủy' },
];

const TabButton = ({ tab, activeTab, setActiveTab }) => {
  const isActive = activeTab === tab.key;
  return (
    <TouchableOpacity
      key={tab.key}
      onPress={() => setActiveTab(tab.key)}
      style={styles.tabButton(isActive)}
    >
      <Text style={styles.tabText(isActive)}>{tab.title}</Text>
    </TouchableOpacity>
  );
};

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
      showAlert: !isRefresh,
    });

    setRefreshing(false);
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (['today', 'pending', 'confirmed', 'waiting_results'].includes(activeTab)) {
        loadAppointments();
      }
    }, [activeTab])
  );

  useEffect(() => {
    let result = [...appointments];

    switch (activeTab) {
      case 'today':
        result = appointments.filter(app => {
          const dateStr = app.appointment_date || app.date;
          if (!dateStr) return false;
          const appDate = new Date(dateStr);
          const d = new Date(appDate.getFullYear(), appDate.getMonth(), appDate.getDate());
          return d.getTime() === today.getTime();
        });
        break;
      case 'pending': result = appointments.filter(a => a.status === 'pending'); break;
      case 'confirmed': result = appointments.filter(a => a.status === 'confirmed'); break;
      case 'waiting_results': result = appointments.filter(a => a.status === 'waiting_results'); break;
      case 'completed': result = appointments.filter(a => a.status === 'completed'); break;
      case 'cancelled':
        result = appointments.filter(a =>
          ['cancelled', 'patient_cancelled', 'doctor_cancelled'].includes(a.status)
        );
        break;
      default: result = appointments;
    }

    result.sort((a, b) => {
      const dateA = new Date(a.appointment_date || a.date || 0);
      const dateB = new Date(b.appointment_date || b.date || 0);
      return dateA - dateB;
    });

    setFiltered(result);
  }, [appointments, activeTab]);

  const checkTestResults = async (appointmentId) => {
    try {
      const { data, error } = await supabase
        .from('test_results')
        .select('status')
        .eq('appointment_id', appointmentId);

      if (error || !data || data.length === 0) return false;
      return data.every(t => t.status !== 'pending' && t.status !== 'in_progress');
    } catch (err) {
      return false;
    }
  };

  const onRefresh = useCallback(() => loadAppointments(true), []);

  const startExamination = (item) => {
    const patientId = item.user_id || item.patient?.id;
    if (!patientId) return Alert.alert('Lỗi', 'Không thể xác định bệnh nhân');

    const patientName = item.patient?.full_name || item.patient_name || 'Bệnh nhân';

    const appointmentDate = new Date(item.appointment_date || item.date);
    const todayCheck = new Date();
    todayCheck.setHours(0, 0, 0, 0);
    const appointmentDay = new Date(
      appointmentDate.getFullYear(),
      appointmentDate.getMonth(),
      appointmentDate.getDate()
    );
    const isToday = appointmentDay.getTime() === todayCheck.getTime();

    // PENDING → Xác nhận
    if (item.status === 'pending') {
      Alert.alert('Xác nhận lịch hẹn', 'Bạn có chắc chắn xác nhận lịch này?', [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận',
          onPress: async () => {
            const { error } = await supabase
              .from('appointments')
              .update({ status: 'confirmed' })
              .eq('id', item.id);
            if (!error) {
              Alert.alert('Thành công', 'Lịch đã được xác nhận');
              loadAppointments();
            } else {
              Alert.alert('Lỗi', 'Không thể xác nhận');
            }
          },
        },
      ]);
      return;
    }

    // CONFIRMED → Chỉ định xét nghiệm
    if (item.status === 'confirmed' && isToday) {
      navigation.navigate('OrderTests', { appointmentId: item.id, patientId, patientName });
      return;
    }

    // WAITING_RESULTS → Hoàn tất bệnh án (nếu có kết quả)
    if (item.status === 'waiting_results' && isToday) {
      checkTestResults(item.id).then(hasResults => {
        if (!hasResults) {
          return Alert.alert('Chưa có kết quả', 'Vui lòng đợi đầy đủ kết quả xét nghiệm.');
        }
        navigation.navigate('FinalizeRecord', { appointmentId: item.id, patientId, patientName });
      });
      return;
    }

    // COMPLETED → Xem lại bệnh án
    if (item.status === 'completed') {
      Alert.alert('Đã khám xong', 'Bạn muốn xem lại bệnh án?', [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Xem bệnh án', onPress: () => navigation.navigate('ViewMedicalRecord', { appointmentId: item.id }) },
      ]);
      return;
    }
  };

  // DÙNG GRADIENT TỪ THEME CHÍNH
  const getStatusGradient = (status) => {
    switch (status) {
      case 'pending': return GRADIENTS.warning || ["#FF9F0A", "#FFB84D"];
      case 'confirmed': return GRADIENTS.appointmentCard;
      case 'waiting_results': return ["#FDB813", "#F59E0B"];
      case 'completed': return GRADIENTS.successButton;
      case 'cancelled':
      case 'patient_cancelled':
      case 'doctor_cancelled': return [COLORS.danger, "#FF453A"];
      default: return ["#94A3B8", "#64748B"];
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'CHỜ XÁC NHẬN',
      confirmed: 'SẴN SÀNG KHÁM',
      waiting_results: 'CHỜ KẾT QUẢ',
      completed: 'ĐÃ HOÀN TẤT',
      patient_cancelled: 'BN HỦY',
      doctor_cancelled: 'BS HỦY',
      cancelled: 'ĐÃ HỦY',
    };
    return labels[status] || 'KHÁC';
  };

  const cancelAppointment = (item) => async () => {
    Alert.alert('Hủy lịch', 'Bạn chắc chắn muốn hủy?', [
      { text: 'Không', style: 'cancel' },
      {
        text: 'Hủy lịch',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase
            .from('appointments')
            .update({ status: 'doctor_cancelled' })
            .eq('id', item.id);
          if (!error) {
            Alert.alert('Đã hủy', 'Lịch đã được hủy');
            loadAppointments();
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }) => {
    const patientName = item.patient?.full_name || item.patient_name || 'Bệnh nhân';
    const roomNumber = item.doctor_room_number || 'Chưa có phòng';
    const specialization = item.doctor_specialization_text || 'Chưa xác định chuyên khoa';

    const date = new Date(item.appointment_date || item.date);
    const timeStr = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const dateStr = date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

    const [g1, g2] = getStatusGradient(item.status);
    const statusLabel = getStatusLabel(item.status);

    const showActionButtons = ['pending', 'confirmed', 'waiting_results', 'completed'].includes(item.status);

    let mainActionText = "CHỈ ĐỊNH XÉT NGHIỆM";
    let mainActionIcon = "flask-outline";
    let gradientColors = GRADIENTS.primaryButton;

    if (item.status === 'waiting_results') {
      mainActionText = "HOÀN TẤT BỆNH ÁN";
      mainActionIcon = "document-text-outline";
    }
    if (item.status === 'completed') {
      mainActionText = "XEM LẠI BỆNH ÁN";
      mainActionIcon = "eye-outline";
      gradientColors = ["#E5E7EB", "#F2F4F8"];
    }

    return (
      <View style={styles.itemWrapper}>
        <View style={styles.itemCard}>
          <View style={styles.cardContent}>

            {/* Header: Tên + Trạng thái */}
            <View style={styles.itemHeader}>
              <Text style={styles.patientName}>{patientName}</Text>
              <LinearGradient colors={[g1, g2]} style={styles.statusBadge}>
                <Text style={styles.statusText}>{statusLabel}</Text>
              </LinearGradient>
            </View>

            {/* Thông tin */}
            <View style={styles.infoRow}>
              <View style={styles.iconCircle}>
                <Icon name="time-outline" size={18} color={COLORS.primary} />
              </View>
              <Text style={styles.infoText}>
                Thời gian: <Text style={styles.timeText}>{timeStr}</Text> ngày {dateStr}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.iconCircle}>
                <Icon name="business-outline" size={18} color={COLORS.primary} />
              </View>
              <Text style={styles.infoText}>Phòng: <Text style={styles.timeText}>{roomNumber}</Text></Text>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.iconCircle}>
                <Icon name="medkit-outline" size={18} color={COLORS.primary} />
              </View>
              <Text style={styles.infoText}>{specialization}</Text>
            </View>

            {/* Triệu chứng */}
            {item.symptoms ? (
              <View style={styles.symptomsBox}>
                <Text style={styles.symptomsText}>{item.symptoms}</Text>
              </View>
            ) : null}

            {/* Nút hành động */}
            {showActionButtons && (
              <View style={styles.actionContainer}>

                {/* Nút chính */}
                <TouchableOpacity onPress={() => startExamination(item)} style={styles.mainActionButton}>
                  <LinearGradient colors={gradientColors} style={styles.mainActionGradient}>
                    <Icon name={mainActionIcon} size={20} color="#fff" />
                    <Text style={styles.mainActionText}>{mainActionText}</Text>
                  </LinearGradient>
                </TouchableOpacity>

                {/* Nút hủy (nếu cần) */}
                {(item.status === 'pending' || item.status === 'confirmed' || item.status === 'waiting_results') && (
                  <TouchableOpacity onPress={cancelAppointment(item)} style={styles.secondaryButton}>
                    <Text style={styles.secondaryText}>Hủy lịch hẹn</Text>
                  </TouchableOpacity>
                )}

              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* HEADER ĐẸP NHƯ PHƯỚC EM */}
      <LinearGradient colors={GRADIENTS.header} style={styles.headerGradient}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={26} color={COLORS.textOnPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Lịch Khám Của Tôi</Text>
        </View>
      </LinearGradient>

      {/* TAB BAR */}
      <View style={styles.tabBarContainer}>
        <FlatList
          data={TABS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={item => item.key}
          renderItem={({ item }) => <TabButton tab={item} activeTab={activeTab} setActiveTab={setActiveTab} />}
        />
      </View>

      {/* Nội dung */}
      {loading && !refreshing ? (
        <View style={styles.centeredView}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Đang tải lịch khám...</Text>
        </View>
      ) : error ? (
        <View style={styles.centeredView}>
          <Icon name="cloud-offline-outline" size={80} color={COLORS.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.centeredView}>
          <Icon name="calendar-clear-outline" size={100} color={COLORS.textLight} />
          <Text style={styles.emptyText}>
            {activeTab === 'today' ? 'Hôm nay bạn chưa có lịch khám nào' : 'Không có lịch hẹn nào'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
        />
      )}
    </View>
  );
}