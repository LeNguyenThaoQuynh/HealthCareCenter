// src/navigation/AdminNavigator.js
import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import AdminHomeScreen from '../screens/admin/AdminHomeScreen';
import ManageDoctorsScreen from '../screens/admin/ManageDoctorsScreen';
import ManagePatientsScreen from '../screens/admin/ManagePatientsScreen';
import AdminDashboard from '../screens/admin/AdminDashboard';
import OutstandingDoctor from '../screens/admin/OutstandingDoctor';
import CreateDoctorAccountScreen from '../screens/admin/CreateDoctorAccountScreen';
import CreateDoctorScheduleScreen from '../screens/admin/CreateDoctorScheduleScreen';

const Drawer = createDrawerNavigator();

export default function AdminNavigator() {
  return (
    <Drawer.Navigator
      initialRouteName="Trang chủ"
      screenOptions={({ route }) => ({
        headerShown: true,
        headerTintColor: '#fff',
        headerStyle: { backgroundColor: '#1E40AF' },
        drawerActiveTintColor: '#3B82F6',
        drawerInactiveTintColor: '#64748B',
        drawerStyle: { backgroundColor: '#fff', width: 260 },
        drawerLabelStyle: { fontSize: 15, fontWeight: '600' },
        drawerIcon: ({ color, size }) => {
          const icons = {
            'Trang chủ': 'home',
            'Bác sĩ': 'medkit',
            'Bệnh nhân': 'heart',
            'Người dùng': 'people',
            'Quản trị': 'settings',
            'Tạo tài khoản': 'person-add',
            'Tạo bác sĩ': 'briefcase',
            'Báo cáo': 'bar-chart',
            'CreateDoctorSchedule': 'calendar',
          };
          return <Ionicons name={icons[route.name] || 'ellipse'} size={size} color={color} />;
        },
      })}
    >
      <Drawer.Screen name="Trang chủ" component={AdminHomeScreen} />
      <Drawer.Screen name="Bác sĩ" component={ManageDoctorsScreen} />
      <Drawer.Screen name="Bệnh nhân" component={ManagePatientsScreen} />
      <Drawer.Screen name="Quản trị" component={AdminDashboard} />
      <Drawer.Screen name="Tạo bác sĩ" component={CreateDoctorAccountScreen} />
      <Drawer.Screen name="Báo cáo" component={OutstandingDoctor} />
      <Drawer.Screen name="CreateDoctorSchedule" component={CreateDoctorScheduleScreen} />
    </Drawer.Navigator>
  );
}