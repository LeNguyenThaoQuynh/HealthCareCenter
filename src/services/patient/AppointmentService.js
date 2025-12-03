// src/services/patient/AppointmentService.js
import { supabase } from '../../api/supabase';

export class AppointmentService {
  static async fetchAppointmentsByUser(userId) {
    try {
      console.log('BẮT ĐẦU LẤY LỊCH HẸN CHO USER:', userId);

      // 1. Lấy danh sách lịch hẹn (THÊM price)
      const { data: appointments, error: apptError } = await supabase
        .from('appointments')
        .select(`
          id,
          status,
          appointment_date,
          date,
          slot_id,
          doctor_id,
          created_at,
          cancelled_by,
          price,                         
          doctor_schedule_template!inner (
            start_time,
            end_time
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (apptError) throw apptError;

      if (!appointments || appointments.length === 0) {
        return [];
      }

      const doctorIds = [...new Set(appointments.map(a => a.doctor_id).filter(Boolean))];
      const { data: doctors = [], error: docError } = await supabase
        .from('doctors')
        .select('id, name, room_number, specialization')
        .in('id', doctorIds);

      if (docError) throw docError;
      const result = appointments.map(appt => {
        const doctor = doctors.find(d => d.id === appt.doctor_id) || {};
        const template = appt.doctor_schedule_template || {};

        const specializationText = doctor.specialization
          ? doctor.specialization.trim()
          : 'Chưa có chuyên khoa';

        const timeDisplay =
          template.start_time && template.end_time
            ? `${template.start_time.slice(0, 5)} - ${template.end_time.slice(0, 5)}`
            : 'Chưa xác định giờ';

        return {
          ...appt,
          timeDisplay,

          // 🟢 TRẢ GIÁ VỀ CHO UI
          price: appt.price ?? 180000,

          doctor: {
            id: doctor.id,
            name: doctor.name?.trim() || 'Bác sĩ chưa xác định',
            room_number: doctor.room_number?.trim() || 'Chưa có',
            specialization: specializationText,
          },

          specializationText,
        };
      });

      console.log('KẾT QUẢ CUỐI CÙNG TRẢ VỀ:', result);
      return result;

    } catch (error) {
      console.error('LỖI AppointmentService:', error);
      throw error;
    }
  }

  // CANCEL
  static async cancelAppointment(appointmentId) {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .update({
          status: 'patient_cancelled',
          cancelled_by: { by: 'patient', reason: 'Hủy qua ứng dụng' },
          updated_at: new Date().toISOString(),
        })
        .eq('id', appointmentId)
        .select()
        .single();

      if (error) throw error;

      return { success: true, message: 'Hủy lịch thành công!' };
    } catch (error) {
      return { success: false, message: error.message || 'Hủy thất bại' };
    }
  }
}
