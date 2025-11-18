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
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';

import { DoctorAppointmentController } from '../../controllers/doctor/doctor_appointment_controller';
import { supabase } from '../../api/supabase';

// Theme & Styles
import { theme } from '../../theme/theme';
import { DoctorAppointmentsStyles as styles } from '../../styles/doctor/DoctorAppointmentsStyles';

const { COLORS, GRADIENTS } = theme;

const TABS = [
  { key: 'today', title: 'Hôm nay' },
  { key: 'pending', title: 'Chờ xác nhận' },
  { key: 'confirmed', title: 'Đã xác nhận' },
  { key: 'completed', title: 'Đã khám xong' },
  { key: 'cancelled', title: 'Đã hủy' },
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
      if (['today', 'pending', 'confirmed'].includes(activeTab)) {
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
      case 'pending':
        result = appointments.filter(a => a.status === 'pending');
        break;
      case 'confirmed':
        result = appointments.filter(a => a.status === 'confirmed');
        break;
      case 'completed':
        result = appointments.filter(a => a.status === 'completed');
        break;
      case 'cancelled':
        result = appointments.filter(a =>
          ['cancelled', 'patient_cancelled', 'doctor_cancelled'].includes(a.status)
        );
        break;
    }

    result.sort((a, b) => {
      const dateA = new Date(a.appointment_date || a.date || 0);
      const dateB = new Date(b.appointment_date || b.date || 0);
      return dateA - dateB;
    });

    setFiltered(result);
  }, [appointments, activeTab]);

  const onRefresh = useCallback(() => loadAppointments(true), []);

  const startExamination = (item) => {
    if (item.status === 'completed') {
      Alert.alert('Đã khám xong', 'Bạn muốn xem lại bệnh án?', [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Xem bệnh án', onPress: () => navigation.navigate('ViewMedicalRecord', { appointmentId: item.id }) },
      ]);
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

  const getStatusGradient = (status) => ({
    pending: [COLORS.warning, '#f39c12'],
    confirmed: [COLORS.success, '#2ecc71'],
    completed: [COLORS.primary, COLORS.primaryLight],
    patient_cancelled: [COLORS.danger, '#e74c3c'],
    doctor_cancelled: [COLORS.accentPurple, COLORS.accentIndigo],
    cancelled: [COLORS.danger, '#e74c3c'],
  })[status] || [COLORS.disabled, COLORS.textLight];

  const renderItem = ({ item }) => {
    const name = item.patient?.full_name || item.patient_name || 'Bệnh nhân';
    const dept = item.department?.name || 'Phòng khám chung';
    const date = new Date(item.appointment_date || item.date);
    const timeStr = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const dateStr = date.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' });

    const isPending = item.status === 'pending';
    const canStart = item.status === 'confirmed';
    const isCompleted = item.status === 'completed';
    const [g1, g2] = getStatusGradient(item.status);

    const confirmAppointment = async () => {
      Alert.alert('Xác nhận lịch', 'Xác nhận lịch khám này?', [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận',
          onPress: async () => {
            const { error } = await supabase.from('appointments').update({ status: 'confirmed' }).eq('id', item.id);
            if (error) Alert.alert('Lỗi', error.message);
            else {
              Alert.alert('Thành công', 'Đã xác nhận lịch khám!');
              loadAppointments();
            }
          },
        },
      ]);
    };

    const cancelAppointment = async () => {
      Alert.alert('Hủy lịch', 'Bạn chắc chắn muốn hủy?', [
        { text: 'Không', style: 'cancel' },
        {
          text: 'Hủy lịch',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.from('appointments').update({ status: 'doctor_cancelled' }).eq('id', item.id);
            if (error) Alert.alert('Lỗi', error.message);
            else {
              Alert.alert('Đã hủy', 'Lịch khám đã được hủy');
              loadAppointments();
            }
          },
        },
      ]);
    };

    return (
      <View style={styles.itemWrapper}>
        <View style={styles.itemCard}>
          <View style={styles.cardContent}>
            {/* Tên bệnh nhân + Trạng thái */}
            <View style={styles.itemHeader}>
              <Text style={styles.patientName}>{name}</Text>
              <LinearGradient colors={[g1, g2]} style={styles.statusBadge}>
                <Text style={styles.statusText}>
                  {isPending && 'CHỜ XÁC NHẬN'}
                  {item.status === 'confirmed' && 'ĐÃ XÁC NHẬN'}
                  {item.status === 'completed' && 'ĐÃ KHÁM XONG'}
                  {['cancelled', 'patient_cancelled', 'doctor_cancelled'].includes(item.status) && 'ĐÃ HỦY'}
                </Text>
              </LinearGradient>
            </View>

            {/* Khoa */}
            <View style={styles.infoRow}>
              <View style={styles.iconWrapper}>
                <Icon name="business" size={19} color={COLORS.primary} />
              </View>
              <Text style={styles.infoText}>{dept}</Text>
            </View>

            {/* Thời gian */}
            <View style={styles.infoRow}>
              <View style={styles.iconWrapper}>
                <Icon name="calendar" size={19} color={COLORS.primary} />
              </View>
              <Text style={[styles.infoText, styles.timeText]}>{dateStr} • {timeStr}</Text>
            </View>

            {/* Triệu chứng */}
            {item.symptoms && (
              <View style={styles.symptomsBox}>
                <Text style={styles.symptomsLabel}>Triệu chứng:</Text>
                <Text style={styles.symptomsText}>{item.symptoms}</Text>
              </View>
            )}

            {/* Nút hành động */}
            <View style={styles.actionContainer}>
              {isPending && (
                <>
                  <TouchableOpacity onPress={confirmAppointment} style={styles.confirmButton}>
                    <Icon name="checkmark-circle" size={26} color={COLORS.textOnPrimary} />
                    <Text style={styles.actionButtonText}>XÁC NHẬN LỊCH</Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={cancelAppointment} style={styles.cancelButton}>
                    <Icon name="close-circle" size={26} color={COLORS.textOnPrimary} />
                    <Text style={styles.actionButtonText}>HỦY LỊCH</Text>
                  </TouchableOpacity>
                </>
              )}

              {canStart && (
                <TouchableOpacity onPress={() => startExamination(item)} style={styles.mainActionButton}>
                  <LinearGradient colors={GRADIENTS.primaryButton} style={styles.mainActionButtonGradient}>
                    <Icon name="medical" size={30} color={COLORS.textOnPrimary} />
                    <Text style={styles.mainActionButtonText}>BẮT ĐẦU KHÁM NGAY</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}

{isCompleted && (
  <TouchableOpacity
    activeOpacity={0.9}
    onPress={() => startExamination(item)}
    style={styles.secondaryActionButton}
  >
    <LinearGradient
      colors={[COLORS.primary, COLORS.primaryLight]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={{
        height: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 26,
        paddingHorizontal: 20,
      }}
    >
      <Icon name="document-text-outline" size={24} color="#fff" style={{ marginRight: 12 }} />
      <Text style={{
        fontSize: 15,
        fontWeight: '700',
        color: '#fff',
        letterSpacing: 0.8,
      }}>
        XEM LẠI BỆNH ÁN
      </Text>
    </LinearGradient>
  </TouchableOpacity>
)}
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Header */}
      <LinearGradient colors={GRADIENTS.header} style={styles.headerGradient}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={30} color={COLORS.textOnPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Lịch Khám Của Tôi</Text>
        </View>
      </LinearGradient>

      {/* Tab Bar – CHỈ GIỮ TEXT */}
      {/* TAB BAR SIÊU ĐẸP – THAY ĐOẠN NÀY */}
<View style={styles.tabBarContainer}>
  {TABS.map(tab => (
    <TouchableOpacity
      key={tab.key}
      activeOpacity={0.8}
      onPress={() => setActiveTab(tab.key)}
      style={styles.tabButton(activeTab === tab.key)}
    >
      <Text style={styles.tabText(activeTab === tab.key)}>
        {tab.title}
      </Text>
    </TouchableOpacity>
  ))}
</View>

      {/* Nội dung */}
      {loading && !refreshing ? (
        <View style={styles.centeredView}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Đang tải lịch khám...</Text>
        </View>
      ) : error ? (
        <View style={styles.centeredView}>
          <Icon name="cloud-offline-outline" size={100} color={COLORS.danger} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => loadAppointments()} style={styles.retryButton}>
            <Text style={styles.actionButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.centeredView}>
          <Icon name="calendar-clear-outline" size={110} color={COLORS.textLight} />
          <Text style={styles.emptyText}>
            {activeTab === 'today' ? 'Hôm nay bạn chưa có lịch khám nào' : 'Không có lịch hẹn nào'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
        />
      )}
    </View>
  );
}