// src/services/doctor/doctor_appointment_service.js
import { supabase } from '../../api/supabase';

export const DoctorAppointmentService = {
  async getDoctorId() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) throw new Error('Không thể lấy thông tin người dùng. Vui lòng đăng nhập lại.');

      const { data: doctor, error: doctorError } = await supabase
        .from('doctors')
        .select('id')
        .eq('id', user.id)
        .single();

      if (doctorError || !doctor) throw new Error('Tài khoản này không phải bác sĩ.');

      return doctor.id;
    } catch (err) {
      console.error('Lỗi lấy ID bác sĩ:', err);
      throw err;
    }
  },

  async getAppointmentsByDoctor(doctorId) {
    try {
      if (!doctorId) throw new Error('ID bác sĩ không hợp lệ.');

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          user_id,
          appointment_date,
          symptoms,
          status,
          qr_code,
          created_at,
          updated_at,
          patient_name,
          patient_phone,
          date,
          cancelled_by,
          
          doctor:user_profiles!appointments_doctor_id_fkey(full_name, phone),
          
          patient:user_profiles!appointments_user_id_fkey(id, full_name, phone),
          
          department:departments!fk_appointments_department(name, description),
          
          slot:doctor_schedule_template!fk_slot_id(start_time, end_time)
        `)
        .eq('doctor_id', doctorId)
        .order('appointment_date', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw new Error('Không thể tải lịch khám: ' + error.message);
      }

      // Chuẩn hóa dữ liệu – đảm bảo 100% có patient.id
      return (data || []).map(appointment => ({
        ...appointment,
        user_id: appointment.user_id || null,
        patient: appointment.patient ? {
          id: appointment.patient.id,
          full_name: appointment.patient.full_name || appointment.patient_name || 'Bệnh nhân',
          phone: appointment.patient.phone || appointment.patient_phone || ''
        } : {
          id: appointment.user_id,
          full_name: appointment.patient_name || 'Bệnh nhân',
          phone: appointment.patient_phone || ''
        },
        doctor: appointment.doctor || { full_name: 'Bác sĩ', phone: '' },
        department: appointment.department || { name: 'Phòng khám chung', description: '' },
        slot: appointment.slot || { start_time: '08:00:00', end_time: '09:00:00' },
      }));
    } catch (err) {
      console.error('Lỗi tải lịch khám:', err);
      throw err;
    }
  },

  async confirmAppointment(appointmentId) {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .update({ status: 'confirmed', updated_at: new Date().toISOString() })
        .eq('id', appointmentId)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Không tìm thấy lịch hẹn');

      return data;
    } catch (err) {
      console.error('Lỗi xác nhận:', err);
      throw err;
    }
  },

  async cancelAppointment(appointmentId, cancelledBy = 'doctor', reason = null) {
    try {
      const status = cancelledBy === 'doctor' ? 'doctor_cancelled' : 'patient_cancelled';
      const cancelledByData = reason ? { cancelled_by: cancelledBy, reason } : { cancelled_by: cancelledBy };

      const { data, error } = await supabase
        .from('appointments')
        .update({
          status,
          cancelled_by: cancelledByData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', appointmentId)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Không tìm thấy lịch hẹn');

      return data;
    } catch (err) {
      console.error('Lỗi hủy lịch:', err);
      throw err;
    }
  },
};