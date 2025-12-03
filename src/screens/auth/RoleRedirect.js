// src/screens/auth/RoleRedirect.js
import React, { useEffect } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../api/supabase';

export default function RoleRedirect() {
  const navigation = useNavigation();

  useEffect(() => {
    const checkRole = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          navigation.replace('Auth');
          return;
        }

        // Lấy profile + role từ bảng user_profiles (join với roles)
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select(`
            role_id,
            roles (
              name,
              description
            )
          `)
          .eq('id', user.id)
          .single();

        if (profileError || !profile?.roles?.name) {
          console.warn('Không tìm thấy role, chuyển về bệnh nhân mặc định');
          navigation.replace('PatientStack', { screen: 'HomeScreen' });
          return;
        }

        const roleName = profile.roles.name.toLowerCase();

        // CHUYỂN HƯỚNG THEO ROLE – ĐÃ THÊM LAB
        switch (roleName) {
          case 'admin':
            navigation.replace('AdminHome');
            break;

          case 'doctor':
            navigation.replace('DoctorHome');
            break;

          case 'patient':
            navigation.replace('PatientStack', { screen: 'HomeScreen' });
            break;

          case 'receptionist':
            navigation.replace('ReceptionTabs');
            break;

          case 'accountant':
            navigation.replace('AccountantTabs');
            break;

          case 'lab_technician':   // THÊM DÒNG NÀY – QUAN TRỌNG!
            navigation.replace('LabDashboard'); // Mày sẽ tạo màn này sau
            break;

          default:
            navigation.replace('PatientStack', { screen: 'HomeScreen' });
            break;
        }
      } catch (err) {
        console.error('Lỗi RoleRedirect:', err);
        navigation.replace('Auth');
      }
    };

    checkRole();
  }, [navigation]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
      <ActivityIndicator size="large" color="#1E40AF" />
      <Text style={{ marginTop: 20, fontSize: 16, color: '#64748B' }}>
        Đang xác định vai trò...
      </Text>
    </View>
  );
}