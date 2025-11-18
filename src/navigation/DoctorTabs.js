import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';

import DoctorHomeScreen from '../screens/doctor/DoctorHomeScreen';
import DoctorAppointmentsScreen from '../screens/doctor/DoctorAppointmentsScreen';
import ProfileScreen from '../screens/doctor/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function DoctorTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#2c8e7c',
        tabBarInactiveTintColor: '#95a5a6',
        tabBarStyle: {
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerShown: false,               // Ẩn header mặc định của từng screen
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
      }}
    >
      {/* Trang chủ */}
      <Tab.Screen
        name="HomeTab"
        component={DoctorHomeScreen}
        options={{
          tabBarLabel: 'Trang chủ',                 // vẫn để chữ cho người dùng biết
          tabBarIcon: ({ color, size }) => (
            <Icon name="home-outline" color={color} size={size} />
          ),
        }}
      />

      {/* Lịch khám – ĐÃ XÓA CHỮ "Lịch hẹn" ở tab dưới */}
      <Tab.Screen
        name="AppointmentsTab"
        component={DoctorAppointmentsScreen}
        options={{
          tabBarLabel: '',                          // XÓA CHỮ HOÀN TOÀN
          tabBarIcon: ({ color, size }) => (
            <Icon name="calendar-outline" color={color} size={size + 4} />
          ),
        }}
      />

      {/* Hồ sơ */}
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Hồ sơ',
          tabBarIcon: ({ color, size }) => (
            <Icon name="person-outline" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
    
  );
  
}