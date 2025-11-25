// src/controllers/doctor/doctor_appointment_controller.js

import { Alert } from 'react-native';
import { DoctorAppointmentService } from '../../services/doctor/doctor_appointment_service';

export const DoctorAppointmentController = {
  /**
   * TẢI LỊCH KHÁM CỦA BÁC SĨ
   * ĐÃ FIX: luôn tắt loading dù lỗi hay thành công
   */
  async loadAppointments({
    setAppointments,
    setLoading,
    onError,
    showAlert = true,
  } = {}) {
    try {
      // Bắt đầu loading
      if (setLoading) setLoading(true);
      if (onError) onError(null);

      console.log('DoctorAppointmentController → Bắt đầu tải lịch...');

      // 1. Lấy doctorId
      const doctorId = await DoctorAppointmentService.getDoctorId();

      // 2. Lấy dữ liệu từ service (đã có timeout + log + không treo)
      const appointments = await DoctorAppointmentService.getAppointmentsByDoctor(doctorId);

      // 3. Cập nhật state
      if (setAppointments) {
        setAppointments(appointments);
        console.log('Controller → Đã cập nhật', appointments.length, 'lịch vào state');
      }

      return { success: true, data: appointments };

    } catch (err) {
      console.error('DoctorAppointmentController → LỖI TOÀN BỘ:', err);

      const message = err?.message || 'Không thể tải lịch khám. Vui lòng thử lại.';

      if (onError) onError(message);

      if (showAlert) {
        Alert.alert('Lỗi tải dữ liệu', message, [{ text: 'OK' }]);
      }

      // Quan trọng: vẫn trả về mảng rỗng để UI không bị treo
      if (setAppointments) {
        setAppointments([]);
      }

      return { success: false, error: message };

    } finally {
      // BẮT BUỘC PHẢI CÓ → DÙ LỖI HAY KHÔNG CŨNG TẮT LOADING
      if (setLoading) {
        console.log('Controller → Tắt loading (finally)');
        setLoading(false);
      }
    }
  },

  // XÁC NHẬN LỊCH
  async confirmAppointment(appointmentId, { setAppointments } = {}) {
    try {
      const data = await DoctorAppointmentService.confirmAppointment(appointmentId);

      if (setAppointments) {
        setAppointments(prev =>
          prev.map(a => (a.id === appointmentId ? { ...a, status: 'confirmed' } : a))
        );
      }

      Alert.alert('Thành công', 'Lịch hẹn đã được xác nhận');
      return { success: true, data };

    } catch (err) {
      Alert.alert('Lỗi', 'Không thể xác nhận lịch: ' + (err.message || ''));
      return { success: false };
    }
  },

  // HỦY LỊCH
  async cancelAppointment(appointmentId, { setAppointments, reason } = {}) {
    try {
      const data = await DoctorAppointmentService.cancelAppointment(appointmentId, 'doctor', reason);

      if (setAppointments) {
        setAppointments(prev =>
          prev.map(a => (a.id === appointmentId ? { ...a, status: 'doctor_cancelled' } : a))
        );
      }

      Alert.alert('Đã hủy', 'Lịch hẹn đã được hủy bởi bác sĩ');
      return { success: true, data };

    } catch (err) {
      Alert.alert('Lỗi', 'Không thể hủy lịch: ' + (err.message || ''));
      return { success: false };
    }
  },
};