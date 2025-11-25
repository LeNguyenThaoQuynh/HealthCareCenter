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
  static async cancelAppointment(appointmentId, setAppointments, setError) {
    const safeSetError = setError || (() => {});

    if (!appointmentId) {
      const msg = 'Không tìm thấy lịch hẹn để hủy.';
      safeSetError(msg);
      return { success: false, message: msg };
    }

    try {
      const result = await AppointmentService.cancelAppointment(appointmentId, 'patient');

      if (!result.success) {
        throw new Error(result.message || 'Hủy thất bại');
      }

      // Cập nhật danh sách ngay lập tức (tối ưu trải nghiệm)
      if (setAppointments) {
        setAppointments(prev =>
          prev.map(appt =>
            appt.id === appointmentId
              ? {
                  ...appt,
                  status: 'patient_cancelled',
                  cancelled_by: { by: 'patient', reason: 'Bệnh nhân hủy' },
                }
              : appt
          )
        );
      }

      return {
        success: true,
        message: 'Bạn đã hủy lịch thành công!',
      };

    } catch (error) {
      console.error('cancelAppointment error:', error);
      const msg = error.message || 'Hủy lịch thất bại. Vui lòng thử lại.';
      safeSetError(msg);
      return { success: false, message: msg };
    }
  }
}