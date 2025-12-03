import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Alert,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../api/supabase';

// Theme
import theme from '../../theme/theme';
const {
  COLORS,
  GRADIENTS,
  SPACING,
  FONT_SIZE,
  FONT_WEIGHT,
  BORDER_RADIUS,
  SHADOWS,
} = theme;

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
  } = route.params || {};

  const [loading, setLoading] = useState(false);
  const [examFee, setExamFee] = useState(200000);
  const [testFee, setTestFee] = useState(0);

  useEffect(() => {
    calculateFees();
  }, []);

  const calculateFees = async () => {
    try {
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

      const { data: tests } = await supabase
        .from('test_results')
        .select('price')
        .eq('appointment_id', appointmentId);

      const totalTestFee = tests?.reduce((sum, t) => sum + (Number(t.price) || 0), 0) || 0;
      setTestFee(totalTestFee);
    } catch (err) {
      console.error('Lỗi tính phí:', err);
    }
  };

  const totalAmount = examFee + testFee;

  const finalizeAll = async () => {
    if (loading) return;
    setLoading(true);

    try {
      // Tạo/cập nhật bệnh án
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

      // Tạo hóa đơn
      await supabase.from('invoices').insert({
        appointment_id: appointmentId,
        exam_fee: examFee,
        test_fee: testFee,
        medicine_fee: 0,
        total_amount: totalAmount,
      });

      // Hoàn tất
      await Promise.all([
        supabase.from('medical_records').update({ is_visible_to_patient: false }).eq('appointment_id', appointmentId),
        supabase.from('appointments').update({ status: 'completed' }).eq('id', appointmentId),
      ]);

      Alert.alert(
        'Thành công!',
        `Hóa đơn đã được tạo thành công!\nTổng tiền: ${totalAmount.toLocaleString()} ₫`,
        [{ text: 'OK', onPress: () => navigation.replace('DoctorAppointments') }]
      );
    } catch (err) {
      console.error('Lỗi hoàn tất:', err);
      Alert.alert('Lỗi', err.message || 'Đã có lỗi xảy ra.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>

      {/* HEADER */}
      <LinearGradient colors={GRADIENTS.header} style={{ paddingTop: 55, paddingBottom: 32 }}>
        <Text style={{
          fontSize: 26,
          fontWeight: FONT_WEIGHT.heavy,
          color: COLORS.textOnPrimary,
          textAlign: 'center',
          letterSpacing: 0.3,
        }}>
          Tổng kết thanh toán
        </Text>
        <Text style={{
          fontSize: 18,
          color: COLORS.textOnPrimary,
          textAlign: 'center',
          marginTop: 6,
          opacity: 0.95,
          fontWeight: FONT_WEIGHT.medium,
        }}>
          {patientName || 'Bệnh nhân'}
        </Text>
      </LinearGradient>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >

        {/* CARD TỔNG TIỀN – ĐÃ ĐƯỢC DỊCH XUỐNG ĐẸP, CÓ KHOẢNG THỞ */}
        <View style={{ paddingHorizontal: SPACING.xl, marginTop: SPACING.xxl }}>
          <View style={{
            backgroundColor: COLORS.surface,
            borderRadius: BORDER_RADIUS.xxl,
            paddingVertical: 36,
            paddingHorizontal: 32,
            alignItems: 'center',
            ...SHADOWS.floating,
            borderWidth: 1,
            borderColor: COLORS.border,
          }}>
            <Text style={{
              fontSize: FONT_SIZE.sm,
              color: COLORS.textLight,
              letterSpacing: 2,
              textTransform: 'uppercase',
              fontWeight: FONT_WEIGHT.semibold,
            }}>
              Tổng tiền phải thu
            </Text>
            <Text style={{
              fontSize: 48,
              fontWeight: '900',
              color: COLORS.primaryDark,
              marginTop: 12,
              letterSpacing: 0.5,
            }}>
              {totalAmount.toLocaleString()} ₫
            </Text>
          </View>
        </View>

        {/* CHI TIẾT HÓA ĐƠN */}
        <View style={{ paddingHorizontal: SPACING.xl, marginTop: SPACING.xl }}>
          <View style={{
            backgroundColor: COLORS.surface,
            borderRadius: BORDER_RADIUS.xl,
            padding: SPACING.xl,
            ...SHADOWS.card,
          }}>
            <Text style={{
              fontSize: FONT_SIZE.lg,
              fontWeight: FONT_WEIGHT.semibold,
              color: COLORS.textPrimary,
              marginBottom: SPACING.lg,
            }}>
              Chi tiết các khoản
            </Text>

            <View style={{ gap: SPACING.lg }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: FONT_SIZE.lg, color: COLORS.textSecondary }}>
                  Tiền khám bệnh
                </Text>
                <Text style={{ fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold, color: COLORS.textPrimary }}>
                  {examFee.toLocaleString()} ₫
                </Text>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: FONT_SIZE.lg, color: COLORS.textSecondary }}>
                  Tiền xét nghiệm
                </Text>
                <Text style={{
                  fontSize: FONT_SIZE.lg,
                  fontWeight: FONT_WEIGHT.bold,
                  color: testFee > 0 ? COLORS.textPrimary : COLORS.textLight,
                }}>
                  {testFee.toLocaleString()} ₫
                </Text>
              </View>
            </View>
          </View>
        </View>

      </ScrollView>

      {/* NÚT HOÀN TẤT CỐ ĐỊNH DƯỚI ĐÁY */}
      <View style={{
        position: 'absolute',
        bottom: 34,
        left: SPACING.xl,
        right: SPACING.xl,
      }}>
        <TouchableOpacity onPress={finalizeAll} disabled={loading}>
          <LinearGradient
            colors={loading ? ['#94A3B8', '#64748B'] : GRADIENTS.primaryButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              paddingVertical: 18,
              borderRadius: BORDER_RADIUS.xl,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              ...SHADOWS.floating,
            }}
          >
            {loading ? (
              <ActivityIndicator size="large" color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={30} color="#FFF" style={{ marginRight: 12 }} />
                <Text style={{
                  color: '#FFF',
                  fontSize: 20,
                  fontWeight: FONT_WEIGHT.bold,
                  letterSpacing: 0.5,
                }}>
                  HOÀN TẤT & TẠO HÓA ĐƠN
                </Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

    </View>
  );
}