import React from 'react';
import { View, Text, TouchableOpacity, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function LabDashboard({ navigation }) {
  return (
    <View style={{ flex: 1, backgroundColor: '#F0FDF4' }}>
      <StatusBar barStyle="light-content" backgroundColor="#10B981" />
      
      <LinearGradient colors={['#10B981', '#059669']} style={{ paddingTop: 50, padding: 20 }}>
        <Text style={{ fontSize: 26, fontWeight: 'bold', color: '#fff' }}>Phòng Xét Nghiệm</Text>
        <Text style={{ fontSize: 16, color: '#ECFDF5', marginTop: 8 }}>Chào mừng quay lại!</Text>
      </LinearGradient>

      <View style={{ padding: 20 }}>
        <TouchableOpacity
          onPress={() => {
            console.log('Điều hướng tới: Xét nghiệm cần làm (LabPendingTests)');
            navigation.navigate('LabPendingTests');
          }}
          style={{ backgroundColor: '#fff', padding: 24, borderRadius: 20, marginBottom: 16, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 8 }}
        >
          <Ionicons name="flask" size={40} color="#10B981" style={{ marginRight: 20 }} />
          <View>
            <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Xét nghiệm cần làm</Text>
            <Text style={{ color: '#64748B' }}>Nhấn để nhập kết quả</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            console.log('Điều hướng tới: Lịch sử kết quả (LabHistory)');
            navigation.navigate('LabHistory');
          }}
          style={{ backgroundColor: '#fff', padding: 24, borderRadius: 20, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 8 }}
        >
          <Ionicons name="document-text" size={40} color="#3B82F6" style={{ marginRight: 20 }} />
          <View>
            <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Lịch sử kết quả</Text>
            <Text style={{ color: '#64748B' }}>Xem lại kết quả đã nhập</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}