// src/controllers/doctor/doctor_appointment_controller.js

import { Alert } from 'react-native';
import { DoctorAppointmentService } from '../../services/doctor/doctor_appointment_service';

export const DoctorAppointmentController = {
  /**
   * TẢI DANH SÁCH LỊCH KHÁM CỦA BÁC SĨ
   * Linh hoạt: không bắt buộc truyền đủ 4 callback
   */
  async loadAppointments({
    setDoctorId = null,
    setAppointments,
    setLoading,
    onError,
    showAlert = true, // tự động hiện Alert khi lỗi (mặc định có)
  } = {}) {
    try {
      // Bắt đầu loading
      if (setLoading) setLoading(true);
      if (onError) onError(null);

      // 1. Lấy doctorId từ storage
      const doctorId = await DoctorAppointmentService.getDoctorId();
      if (!doctorId) {
        throw new Error('Không tìm thấy thông tin bác sĩ. Vui lòng đăng nhập lại.');
      }

      // Cập nhật doctorId nếu cần (một số màn hình dùng)
      if (setDoctorId) setDoctorId(doctorId);

      // 2. Lấy danh sách lịch khám
      const appointments = await DoctorAppointmentService.getAppointmentsByDoctor(doctorId);

      // 3. Kiểm tra dữ liệu hợp lệ
      if (!Array.isArray(appointments)) {
        throw new Error('Dữ liệu lịch khám không hợp lệ từ máy chủ.');
      }

      // Cập nhật state
      if (setAppointments) {
        setAppointments(appointments);
      }

      return { success: true, data: appointments };

    } catch (err) {
      console.error('DoctorAppointmentController.loadAppointments → Error:', err);

      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Không thể tải lịch khám. Vui lòng kiểm tra mạng và thử lại.';

      // Gọi callback lỗi (nếu có)
      if (onError) onError(message);

      // Tự động hiện Alert (trừ khi tắt)
      if (showAlert) {
        setTimeout(() => {
          Alert.alert('Lỗi tải dữ liệu', message, [{ text: 'Đóng', style: 'cancel' }]);
        }, 300);
      }

      return { success: false, error: message };

    } finally {
      // Luôn tắt loading dù thành công hay thất bại
      if (setLoading) setLoading(false);
    }
  },

  /**
   * XÁC NHẬN LỊCH HẸN
   */
  async confirmAppointment(appointmentId, { setAppointments, onError } = {}) {
    try {
      if (!appointmentId) throw new Error('ID lịch hẹn không hợp lệ.');

      const updated = await DoctorAppointmentService.confirmAppointment(appointmentId);

      if (setAppointments) {
        setAppointments(prev =>
          prev.map(appt => (appt.id === appointmentId ? updated : appt))
        );
      }

      Alert.alert('Thành công', 'Đã xác nhận lịch hẹn thành công');
      return { success: true, appointment: updated };
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Không thể xác nhận lịch hẹn.';
      console.error('confirmAppointment error:', err);

      if (onError) onError(msg);
      Alert.alert('Lỗi', msg);

      return { success: false, error: msg };
    }
  },

  /**
   * HỦY LỊCH HẸN
   */
  async cancelAppointment(
    appointmentId,
    { setAppointments, onError, cancelledBy = 'doctor', reason = null } = {}
  ) {
    try {
      if (!appointmentId) throw new Error('ID lịch hẹn không hợp lệ.');

      const updated = await DoctorAppointmentService.cancelAppointment(
        appointmentId,
        cancelledBy,
        reason
      );

      if (setAppointments) {
        setAppointments(prev =>
          prev.map(appt => (appt.id === appointmentId ? updated : appt))
        );
      }

      Alert.alert('Thành công', 'Đã hủy lịch hẹn thành công');
      return { success: true, appointment: updated };
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Không thể hủy lịch hẹn.';
      console.error('cancelAppointment error:', err);

      if (onError) onError(msg);
      Alert.alert('Lỗi', msg);

      return { success: false, error: msg };
    }
  },
};