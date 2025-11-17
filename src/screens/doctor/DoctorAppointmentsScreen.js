import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  StatusBar,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { styles } from '../../styles/doctor/DoctorAppointmentsStyles';
import { DoctorAppointmentController } from '../../controllers/doctor/doctor_appointment_controller';

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

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  useEffect(() => {
    loadAppointments();
  }, []);

  useEffect(() => {
    filterByTab();
  }, [appointments, activeTab]);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      await DoctorAppointmentController.loadAppointments(
        () => {},
        setAppointments,
        setLoading,
        () => {}
      );
    } catch (err) {
      console.error(err);
    }
  };

  const filterByTab = () => {
    let result = [...appointments];

    if (activeTab === 'today') {
      result = appointments.filter(app => {
        const date = app.appointment_date || app.slot?.start_time || app.created_at;
        if (!date) return false;
        const appDate = new Date(date);
        const d = new Date(appDate.getFullYear(), appDate.getMonth(), appDate.getDate());
        return d.getTime() === today.getTime();
      });
    } else if (activeTab === 'pending') result = appointments.filter(a => a.status === 'pending');
    else if (activeTab === 'confirmed') result = appointments.filter(a => a.status === 'confirmed');
    else if (activeTab === 'completed') result = appointments.filter(a => a.status === 'completed');
    else if (activeTab === 'cancelled')
      result = appointments.filter(a =>
        ['cancelled', 'patient_cancelled', 'doctor_cancelled'].includes(a.status)
      );

    result.sort((a, b) => {
      const ta = new Date(a.appointment_date || a.slot?.start_time || a.created_at).getTime();
      const tb = new Date(b.appointment_date || b.slot?.start_time || b.created_at).getTime();
      return ta - tb;
    });

    setFiltered(result);
  };

  const getStatusText = s => {
    const map = {
      pending: 'Chờ xác nhận',
      confirmed: 'Đã xác nhận',
      completed: 'Đã khám xong',
      patient_cancelled: 'BN hủy',
      doctor_cancelled: 'BS hủy',
      cancelled: 'Đã hủy',
    };
    return map[s] || s;
  };

  const getStatusColor = s => {
    const map = {
      pending: '#f39c12',
      confirmed: '#27ae60',
      completed: '#2980b9',
      patient_cancelled: '#e67e22',
      doctor_cancelled: '#8e44ad',
    };
    return map[s] || '#c0392b';
  };

  const confirmAppointment = async id => {
    Alert.alert('Xác nhận', 'Xác nhận bệnh nhân đến khám?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xác nhận',
        onPress: async () => {
          try {
            const updated = await DoctorAppointmentController.confirmAppointment(id, setAppointments);
            setAppointments(prev => prev.map(a => (a.id === id ? updated : a)));
          } catch (e) {
            Alert.alert('Lỗi', 'Không thể xác nhận');
          }
        },
      },
    ]);
  };

  const cancelAppointment = async id => {
    Alert.alert('Hủy lịch', 'Hủy cuộc hẹn này?', [
      { text: 'Không', style: 'cancel' },
      {
        text: 'Hủy lịch',
        style: 'destructive',
        onPress: async () => {
          try {
            const updated = await DoctorAppointmentController.cancelAppointment(
              id,
              setAppointments,
              null,
              'doctor',
              'Bận đột xuất'
            );
            setAppointments(prev => prev.map(a => (a.id === id ? updated : a)));
          } catch (e) {
            Alert.alert('Lỗi', 'Không thể hủy');
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }) => {
    const name = item.patient?.full_name?.trim() || item.patient_name || 'Bệnh nhân';
    const dept = item.department?.name || 'Phòng khám';

    const date = item.appointment_date
      ? new Date(item.appointment_date)
      : item.slot?.start_time
      ? new Date(`2025-01-01T${item.slot.start_time}`)
      : new Date();

    const timeStr = date.toLocaleString('vi-VN', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.patientName}>{name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusBadgeText}>{getStatusText(item.status)}</Text>
          </View>
        </View>
        <Text style={styles.department}>Khoa: {dept}</Text>
        <Text style={styles.time}>Giờ khám: {timeStr}</Text>
        {item.symptoms && <Text style={styles.symptoms}>Triệu chứng: {item.symptoms}</Text>}
        {item.cancelled_by?.cancelled_by && (
          <Text style={styles.cancelInfo}>
            Hủy bởi: {item.cancelled_by.cancelled_by === 'doctor' ? 'Bác sĩ' : 'Bệnh nhân'}
            {item.cancelled_by.reason ? ` – ${item.cancelled_by.reason}` : ''}
          </Text>
        )}
        {activeTab === 'pending' && (
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.confirmBtn} onPress={() => confirmAppointment(item.id)}>
              <Text style={styles.confirmBtnText}>Xác nhận</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => cancelAppointment(item.id)}>
              <Text style={styles.cancelBtnText}>Hủy lịch</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2c8e7c" />

      {/* Header xanh + nút back – KHÔNG CÒN CHỮ "Lịch hẹn" THỪA */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name={Platform.OS === 'ios' ? 'chevron-back' : 'arrow-back'} size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lịch khám của tôi</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.activeTab]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]} numberOfLines={2}>
              {tab.title}
            </Text>
            {activeTab === tab.key && <View style={styles.activeTabIndicator} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* Nội dung */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#2c8e7c" />
        </View>
      ) : filtered.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 }}>
          <Text style={styles.emptyText}>
            {activeTab === 'today' ? 'Hôm nay chưa có lịch khám nào' : 'Không có lịch hẹn'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}