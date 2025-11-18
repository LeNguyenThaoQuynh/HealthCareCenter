// src/navigation/AppNavigator.js
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import AuthNavigator from './AuthNavigator';
import RoleRedirect from '../screens/auth/RoleRedirect';

// ADMIN SCREENS
import AdminHomeScreen from '../screens/admin/AdminHomeScreen';
import ManageDoctorsScreen from '../screens/admin/ManageDoctorsScreen';
import CreateDoctorAccountScreen from '../screens/admin/CreateDoctorAccountScreen';
import CreateDoctorScheduleScreen from '../screens/admin/CreateDoctorScheduleScreen';
import ReportsScreen from '../screens/admin/ReportsScreen';
import ManageUsersScreen from '../screens/admin/ManageUsersScreen';
import ManagePatientsScreen from '../screens/admin/ManagePatientsScreen';
import AdminDashboard from '../screens/admin/AdminDashboard';
import DoctorDetailScreen from '../screens/admin/DoctorDetailScreen';
import CreateMedicalRecord from '../screens/doctor/CreateMedicalRecord'
// OTHER ROLES
import DoctorTabs from './DoctorTabs';
import PatientStack from './PatientStack';
import ReceptionTabs from './ReceptionTabs';
import AccountantTabs from './AccountantTabs';

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* AUTH */}
      <Stack.Screen name="Auth" component={AuthNavigator} />
      <Stack.Screen name="RoleRedirect" component={RoleRedirect} />

      {/* ADMIN SCREENS */}
      <Stack.Screen name="AdminHome" component={AdminHomeScreen} />

      {/* THÊM TẤT CẢ MÀN HÌNH VÀO ĐÂY */}
      <Stack.Screen name="Bác sĩ" component={ManageDoctorsScreen} />
      <Stack.Screen name="Tạo bác sĩ" component={CreateDoctorAccountScreen} />
      <Stack.Screen name="Lịch làm việc" component={CreateDoctorScheduleScreen} />
      <Stack.Screen name="Báo cáo" component={ReportsScreen} />
      <Stack.Screen name="Người dùng" component={ManageUsersScreen} />
      <Stack.Screen name="Bệnh nhân" component={ManagePatientsScreen} />
      <Stack.Screen name="Quản trị" component={AdminDashboard} />

      {/* CHI TIẾT */}
      <Stack.Screen
        name="Chi tiết bác sĩ"
        component={DoctorDetailScreen}
      />

      {/* OTHER ROLES */}
      <Stack.Screen name="DoctorTabs" component={DoctorTabs} />
      <Stack.Screen name="PatientStack" component={PatientStack} />
      <Stack.Screen name="ReceptionTabs" component={ReceptionTabs} />
      <Stack.Screen name="AccountantTabs" component={AccountantTabs} />
      <Stack.Screen name="CreateMedicalRecord" component={CreateMedicalRecord} />
    </Stack.Navigator>
  );
}