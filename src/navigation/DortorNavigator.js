// navigation/DoctorNavigator.js
import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';

// === CÁC MÀN HÌNH ===
import DoctorHome from '../screens/doctor/DoctorHomeScreen';                    // Trang chủ bác sĩ
import DoctorAppointmentsScreen from '../screens/doctor/DoctorAppointmentsScreen'; // Danh sách lịch hẹn
import PatientListScreen from '../screens/doctor/PatientListScreen';              // Danh sách bệnh nhân
import EditDoctorProfileScreen from '../screens/doctor/EditDoctorProfileScreen';  // Chỉnh sửa hồ sơ
import ProfileScreen from '../screens/doctor/ProfileScreen';                      // Hồ sơ bác sĩ
import PatientStatisticsScreen from '../screens/doctor/PatientStatisticsScreen';

// MÀN HÌNH MỚI – CHUẨN QUY TRÌNH Y KHOA
import OrderTestsScreen from '../screens/doctor/OrderTestsScreen';               // Chỉ định xét nghiệm
import FinalizeRecordScreen from '../screens/doctor/FinalizeRecordScreen'; 
import PaymentSummaryScreen from '../screens/doctor/PaymentSummaryScreen'
// Hoàn tất bệnh án (kê đơn)

const Drawer = createDrawerNavigator();

export default function DoctorNavigator() {
  return (
    <Drawer.Navigator
      initialRouteName="HomeDoctor"
      screenOptions={{
        headerShown: true,
        headerTintColor: '#fff',
        headerStyle: { backgroundColor: '#1E40AF' },
        headerTitleStyle: { fontWeight: 'bold', fontSize: 20 },
        drawerActiveTintColor: '#3B82F6',
        drawerInactiveTintColor: '#64748B',
        drawerLabelStyle: { fontSize: 16, fontWeight: '600', marginLeft: -10 },
        drawerStyle: { backgroundColor: '#fff', width: 280 },
      }}
    >
      {/* TRANG CHỦ */}
      <Drawer.Screen
        name="HomeDoctor"
        component={DoctorHome}
        options={{
          drawerLabel: 'Trang chủ',
          drawerIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />

      {/* LỊCH KHÁM */}
      <Drawer.Screen
        name="DoctorAppointments"
        component={DoctorAppointmentsScreen}
        options={{
          drawerLabel: 'Lịch khám',
          drawerIcon: ({ color, size }) => <Ionicons name="calendar" size={size} color={color} />,
        }}
      />

      {/* DANH SÁCH BỆNH NHÂN */}
      <Drawer.Screen
        name="PatientList"
        component={PatientListScreen}
        options={{
          drawerLabel: 'Bệnh nhân của tôi',
          drawerIcon: ({ color, size }) => <Ionicons name="people" size={size} color={color} />,
        }}
      />

      {/* CHỈ ĐỊNH XÉT NGHIỆM (MỚI) */}
      <Drawer.Screen
        name="OrderTests"
        component={OrderTestsScreen}
        options={{
          drawerLabel: 'Chỉ định xét nghiệm',
          drawerIcon: ({ color, size }) => <Ionicons name="flask" size={size} color={color} />,
          headerTitle: 'Chỉ định xét nghiệm',
        }}
      />

      {/* HOÀN TẤT BỆNH ÁN (MỚI) */}
      <Drawer.Screen
        name="FinalizeRecord"
        component={FinalizeRecordScreen}
        options={{
          drawerLabel: 'Hoàn tất bệnh án',
          drawerIcon: ({ color, size }) => <Ionicons name="document-text" size={size} color={color} />,
          headerTitle: 'Hoàn tất bệnh án',
        }}
      />

      <Drawer.Screen
        name="ProfileDoctor"
        component={ProfileScreen}
        options={{
          drawerLabel: 'Hồ sơ cá nhân',
          drawerIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
        }}
      />

      <Drawer.Screen
        name="EditProfileDoctor"
        component={EditDoctorProfileScreen}
        options={{
          drawerLabel: 'Chỉnh sửa hồ sơ',
          drawerIcon: ({ color, size }) => <Ionicons name="create" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="PatientStatistics"  // Tên route nên rõ nghĩa
        component={PatientStatisticsScreen}  // Dùng đúng tên import
        options={{
          drawerLabel: 'Thống kê bệnh nhân',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="bar-chart" size={size} color={color} />
          ),
          headerTitle: 'Thống kê bệnh nhân',
        }}
      />
       <Drawer.Screen
        name="PaymentSummaryScreen"
        component={PaymentSummaryScreen}
        options={{
          drawerLabel: 'Chỉnh sửa hồ sơ',
          drawerIcon: ({ color, size }) => <Ionicons name="create" size={size} color={color} />,
        }}
      />

    </Drawer.Navigator>
  );
}