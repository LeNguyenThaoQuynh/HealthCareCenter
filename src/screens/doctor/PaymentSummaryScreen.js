// screens/doctor/PaymentSummaryScreen.js
// MÀN TÍNH TỔNG TIỀN + BẬT/TẮT MUA THUỐC + HOÀN TẤT – ĐÃ FIX LỖI TOUCHABLEOPACITY

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Switch,
  Alert,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,   // ĐÃ THÊM DÒNG NÀY → FIX LỖI 100%
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../api/supabase';

export default function PaymentSummaryScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const {
    appointmentId,
    patientId,
    patientName,
    diagnosis,
    treatment,
    notes,
    medicines = [] // phòng trường hợp null
  } = route.params || {};

  const [includeMedicine, setIncludeMedicine] = useState(true);
  const [loading, setLoading] = useState(false);
  const [examFee, setExamFee] = useState(200000);
  const [testFee, setTestFee] = useState(0);
  const [medicineFee, setMedicineFee] = useState(0);

  // Tính lại mỗi khi bật/tắt mua thuốc
  useEffect(() => {
    calculateAll();
  }, [includeMedicine]);

  const calculateAll = async () => {
    try {
      // 1. Tiền khám
      const { data: appt } = await supabase
        .from('appointments')
        .select('service_id')
        .eq('id', appointmentId)
        .single();

      if (appt?.service_id) {
        const { data: svc } = await supabase
          .from('services')
          .select('price')
          .eq('id', appt.service_id)
          .single();
        setExamFee(svc?.price || 200000);
      }

      // 2. Tiền xét nghiệm
      const { data: tests } = await supabase
        .from('test_results')
        .select('price')
        .eq('appointment_id', appointmentId);
      setTestFee(tests?.reduce((sum, t) => sum + (Number(t.price) || 0), 0) || 0);

      // 3. Tiền thuốc
      if (medicines.length > 0 && includeMedicine) {
        const names = medicines.map(m => m.name);
        const { data } = await supabase
          .from('medicines')
          .select('name, price')
          .in('name', names);

        const priceMap = {};
        data?.forEach(item => priceMap[item.name] = Number(item.price || 0));

        const total = medicines.reduce((sum, m) => sum + (priceMap[m.name] || 0), 0);
        setMedicineFee(total);
      } else {
        setMedicineFee(0);
      }
    } catch (err) {
      console.error('Lỗi tính tiền:', err);
    }
  };

  const totalAmount = examFee + testFee + (includeMedicine ? medicineFee : 0);

  const finalizeAll = async () => {
    if (loading) return;
    setLoading(true);

    try {
      // 1. Tạo/cập nhật bệnh án
      let { data: record } = await supabase
        .from('medical_records')
        .select('id')
        .eq('appointment_id', appointmentId)
        .maybeSingle();

      if (!record) {
        const { data: newRec } = await supabase
          .from('medical_records')
          .insert({
            patient_id: patientId,
            appointment_id: appointmentId,
            diagnosis,
            treatment: treatment || null,
            notes: notes || null,
          })
          .select('id')
          .single();
        record = newRec;
      } else {
        await supabase
          .from('medical_records')
          .update({ diagnosis, treatment: treatment || null, notes: notes || null })
          .eq('id', record.id);
      }

      // 2. Lưu đơn thuốc
      if (medicines.length > 0) {
        const payload = medicines.map(m => ({
          record_id: record.id,
          medicine_name: m.name,
          dosage: m.dosage || null,
          duration: m.duration || null,
        }));
        await supabase.from('prescriptions').insert(payload);
      }

      // 3. Tạo hóa đơn
      await supabase.from('invoices').insert({
        appointment_id: appointmentId,
        exam_fee: examFee,
        test_fee: testFee,
        medicine_fee: includeMedicine ? medicineFee : 0,
        total_amount: totalAmount,
      });

      // 4. Ẩn bệnh án + hoàn tất lịch hẹn
      await Promise.all([
        supabase.from('medical_records').update({ is_visible_to_patient: false }).eq('appointment_id', appointmentId),
        supabase.from('appointments').update({ status: 'completed' }).eq('id', appointmentId),
      ]);

      Alert.alert(
        'HOÀN TẤT!',
        `Hóa đơn đã được tạo thành công!\nTổng tiền: ${totalAmount.toLocaleString()} ₫`,
        [{ text: 'OK', onPress: () => navigation.replace('DoctorMain') }]
      );
    } catch (err) {
      console.error('Lỗi hoàn tất:', err);
      Alert.alert('Lỗi', err.message || 'Không thể hoàn tất. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#FFFBFE' }}>
      {/* HEADER */}
      <LinearGradient colors={['#7C2D12', '#4C1D0A']} style={{ paddingTop: 50, paddingBottom: 30, paddingHorizontal: 20 }}>
        <Text style={{ fontSize: 26, fontWeight: 'bold', color: '#fff', textAlign: 'center' }}>
          TỔNG KẾT THANH TOÁN
        </Text>
        <Text style={{ color: '#FECACA', fontSize: 18, textAlign: 'center', marginTop: 10 }}>
          {patientName || 'Bệnh nhân'}
        </Text>
      </LinearGradient>

      <View style={{ padding: 20 }}>

        {/* CARD TỔNG TIỀN SIÊU ĐẸP */}
        <View style={{
          backgroundColor: '#DCFCE7',
          borderRadius: 24,
          padding: 28,
          marginBottom: 30,
          borderWidth: 4,
          borderColor: '#22C55E',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.3,
          shadowRadius: 20,
          elevation: 15,
        }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#166534', textAlign: 'center', marginBottom: 24 }}>
            TỔNG TIỀN PHẢI THU
          </Text>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
            <Text style={{ fontSize: 20 }}>Tiền khám</Text>
            <Text style={{ fontSize: 20, fontWeight: 'bold' }}>{examFee.toLocaleString()} ₫</Text>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
            <Text style={{ fontSize: 20 }}>Tiền xét nghiệm</Text>
            <Text style={{ fontSize: 20, fontWeight: 'bold' }}>{testFee.toLocaleString()} ₫</Text>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 28 }}>
            <Text style={{ fontSize: 20 }}>Tiền thuốc</Text>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: includeMedicine ? '#166534' : '#DC2626' }}>
              {(includeMedicine ? medicineFee : 0).toLocaleString()} ₫
            </Text>
          </View>

          <View style={{ height: 4, backgroundColor: '#22C55E', marginVertical: 20 }} />

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 30, fontWeight: 'bold', color: '#166534' }}>TỔNG CỘNG</Text>
            <Text style={{ fontSize: 40, fontWeight: 'bold', color: '#DC2626' }}>
              {totalAmount.toLocaleString()} ₫
            </Text>
          </View>

          {/* NÚT BẬT/TẮT MUA THUỐC */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 32 }}>
            <Text style={{ fontSize: 22, fontWeight: '600' }}>Mua thuốc tại phòng khám?</Text>
            <Switch
              value={includeMedicine}
              onValueChange={setIncludeMedicine}
              trackColor={{ false: "#DC2626", true: "#22C55E" }}
              thumbColor={includeMedicine ? "#166534" : "#991B1B"}
              ios_backgroundColor="#DC2626"
            />
          </View>
        </View>

        {/* NÚT HOÀN TẤT */}
        <TouchableOpacity onPress={finalizeAll} disabled={loading} activeOpacity={0.8}>
          <LinearGradient
            colors={loading ? ['#94A3B8', '#64748B'] : ['#7C2D12', '#4C1D0A']}
            style={{
              paddingVertical: 28,
              borderRadius: 30,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.4,
              shadowRadius: 20,
              elevation: 20,
            }}
          >
            {loading ? (
              <ActivityIndicator size="large" color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={40} color="#fff" />
                <Text style={{ color: '#fff', fontSize: 26, fontWeight: 'bold', marginTop: 8 }}>
                  HOÀN TẤT & TẠO HÓA ĐƠN
                </Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 50 }} />
      </View>
    </ScrollView>
  );
}