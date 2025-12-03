// src/controllers/patient/AppointmentController.js
// → FILE .JS – CHẠY NGAY, KHÔNG LỖI!

import { supabase } from '../../api/supabase';
import { AppointmentService } from '../../services/patient/AppointmentService';

export class AppointmentController {
  /**
   * TẢI DANH SÁCH LỊCH HẸN
   */
  static async loadAppointments(setAppointments, setLoading, setError) {
    // Cho phép setLoading và setError là optional
    const safeSetLoading = setLoading || (() => {});
    const safeSetError = setError || (() => {});

    if (typeof setAppointments !== 'function') {
      console.error('setAppointments phải là function!');
      return;
    }

    try {
      safeSetLoading(true);
      safeSetError(null);

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
      }

      const appointments = await AppointmentService.fetchAppointmentsByUser(user.id);
      setAppointments(appointments || []);

    } catch (error) {
      console.error('loadAppointments error:', error);
      const msg = error.message || 'Không thể tải lịch hẹn. Vui lòng thử lại.';
      safeSetError(msg);
    } finally {
      safeSetLoading(false);
    }
  }

  /**
   * HỦY LỊCH HẸN – DÙNG TRONG HistoryScreen
   */
  // Trong AppointmentService.js
static async cancelAppointment(appointmentId, cancelledBy = 'patient') {
  try {
    // LẤY THÔNG TIN LỊCH TRƯỚC KHI HỦY
    const { data: appointment, error: fetchError } = await supabase
      .from('appointments')
      .select('status')
      .eq('id', appointmentId)
      .single();

    if (fetchError) throw fetchError;
    if (!appointment) throw new Error('Lịch hẹn không tồn tại');

    // CẤM HỦY NẾU ĐÃ HOÀN THÀNH HOẶC ĐÃ HỦY
    if (appointment.status === 'completed') {
      return { success: false, message: 'Không thể hủy lịch đã hoàn thành' };
    }
    if (['cancelled', 'patient_cancelled', 'doctor_cancelled'].includes(appointment.status)) {
      return { success: false, message: 'Lịch hẹn đã bị hủy trước đó' };
    }

    // TIẾN HÀNH HỦY
    const { data, error } = await supabase
      .from('appointments')
      .update({
        status: cancelledBy === 'doctor' ? 'doctor_cancelled' : 'patient_cancelled',
        cancelled_by: { 
          by: cancelledBy, 
          reason: cancelledBy === 'doctor' ? 'Bác sĩ hủy' : 'Bệnh nhân hủy qua app',
          at: new Date().toISOString()
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', appointmentId)
      .select()
      .single();

    if (error) throw error;

    return { success: true, message: 'Hủy lịch thành công!' };
  } catch (error) {
    console.error('cancelAppointment error:', error);
    return { success: false, message: error.message || 'Hủy lịch thất bại' };
  }
}}