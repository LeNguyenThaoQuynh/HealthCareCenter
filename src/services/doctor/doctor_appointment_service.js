// src/services/doctor/doctor_appointment_service.js
import { supabase } from '../../api/supabase';

export const DoctorAppointmentService = {
  async getDoctorId() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Chưa đăng nhập');
    console.log('DOCTOR ID:', user.id);
    return user.id;
  },

  async getAppointmentsByDoctor(doctorId) {
    try {
      // 1. LẤY LỊCH HẸN
      const { data: appointments = [] } = await supabase
        .from('appointments')
        .select(`
          id,
          user_id,
          patient_name,
          patient_phone,
          appointment_date,
          symptoms,
          status,
          created_at,
          doctor_schedule_template!inner(start_time, end_time)
        `)
        .eq('doctor_id', doctorId)
        .order('appointment_date', { ascending: true });

      // 2. LẤY PROFILE BỆNH NHÂN (có bảng profiles)
      const patientIds = [...new Set(appointments.map(a => a.user_id).filter(Boolean))];
      let patients = [];
      if (patientIds.length > 0) {
        const { data } = await supabase
          .from('profiles')
          .select('id, full_name, phone, avatar_url')
          .in('id', patientIds);
        patients = data || [];
      }

      // 3. LẤY ROOM_NUMBER (bảng doctors)
      let roomNumber = 'Chưa có phòng';
      try {
        const { data: doc } = await supabase
          .from('doctors')
          .select('room_number')
          .eq('id', doctorId)
          .maybeSingle();
        if (doc?.room_number) roomNumber = doc.room_number.trim();
      } catch (e) {}

      // 4. LẤY CHUYÊN KHOA (bảng doctor_specializations)
      let specializationText = 'Chưa xác định chuyên khoa';
      try {
        const { data: specs = [] } = await supabase
          .from('doctor_specializations')
          .select('specialization')
          .eq('doctor_id', doctorId);
        if (specs.length > 0) {
          specializationText = specs.map(s => s.specialization.trim()).join(' • ');
        }
      } catch (e) {}

      // 5. GỘP DỮ LIỆU
      const result = appointments.map(appt => {
        const slot = appt.doctor_schedule_template || {};
        const patientProfile = patients.find(p => p.id === appt.user_id);

        return {
          ...appt,
          timeDisplay: slot.start_time && slot.end_time
            ? `${slot.start_time.slice(0,5)} - ${slot.end_time.slice(0,5)}`
            : 'Chưa xác định',
          patient: {
            full_name: patientProfile?.full_name || appt.patient_name || 'Bệnh nhân',
            phone: patientProfile?.phone || appt.patient_phone || '',
            avatar_url: patientProfile?.avatar_url || null,
          },
          doctor_room_number: roomNumber,
          doctor_specialization_text: specializationText,
        };
      });

      console.log(`HOÀN TẤT → ${result.length} lịch | Phòng: ${roomNumber} | Chuyên khoa: ${specializationText}`);
      return result;

    } catch (err) {
      console.error('Lỗi service:', err);
      return [];
    }
  },
};