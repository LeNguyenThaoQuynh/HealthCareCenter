// src/navigation/AdminNavigator.js
import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import AdminHomeScreen from '../screens/admin/AdminHomeScreen';
import ManageDoctorsScreen from '../screens/admin/ManageDoctorsScreen';
import ManagePatientsScreen from '../screens/admin/ManagePatientsScreen';
import AdminDashboard from '../screens/admin/AdminDashboard';
import CreateUserScreen from '../screens/admin/CreateUserScreen';
import OutstandingDoctor from '../screens/admin/OutstandingDoctor';
import CreateDoctorAccountScreen from '../screens/admin/CreateDoctorAccountScreen';
import CreateDoctorScheduleScreen from '../screens/admin/CreateDoctorScheduleScreen';
import RevenueStatsScreen from'../screens/admin/RevenueStatsScreen';
const Drawer = createDrawerNavigator();

export default function AdminNavigator() {
  return (
    <Drawer.Navigator
      initialRouteName="Trang chủ"
      screenOptions={{
        headerShown: true,
        headerTintColor: '#fff',
        headerStyle: { backgroundColor: '#1E40AF' },
        drawerActiveTintColor: '#3B82F6',
        drawerInactiveTintColor: '#64748B',
        drawerStyle: { backgroundColor: '#fff', width: 260 },
        drawerLabelStyle: { fontSize: 15, fontWeight: '600' },
      }}
    >
      <Drawer.Screen
        name="Trang chủ"
        component={AdminHomeScreen}
        options={{
          drawerIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="Bác sĩ"
        component={ManageDoctorsScreen}
        options={{
          drawerIcon: ({ color, size }) => <Ionicons name="medkit" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="Bệnh nhân"
        component={ManagePatientsScreen}
        options={{
          drawerIcon: ({ color, size }) => <Ionicons name="heart" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="Người dùng"
        component={RevenueStatsScreen}
        options={{
          drawerIcon: ({ color, size }) => <Ionicons name="people" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="Quản trị"
        component={AdminDashboard}
        options={{
          drawerIcon: ({ color, size }) => <Ionicons name="settings" size={size} color={color} />,
        }}
      />
      
      <Drawer.Screen
        name="Tạo bác sĩ"
        component={CreateDoctorAccountScreen}
        options={{
          drawerIcon: ({ color, size }) => <Ionicons name="briefcase" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="Báo cáo"
        component={OutstandingDoctor}
        options={{
          drawerIcon: ({ color, size }) => <Ionicons name="bar-chart" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="CreateDoctorSchedule"
        component={CreateDoctorScheduleScreen}
        options={{
          drawerIcon: ({ color, size }) => <Ionicons name="calendar" size={size} color={color} />,
        }}
      />
    </Drawer.Navigator>
  );
}