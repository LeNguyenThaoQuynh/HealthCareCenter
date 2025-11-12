// src/services/doctor/doctorService.js
import { supabase } from '../../api/supabase';

// === TỰ ĐỘNG SINH SLOT TỪ TEMPLATE ===
const generateSlotsFromTemplate = async (doctorId) => {
  const { data: templates, error: tempError } = await supabase
    .from('doctor_schedule_template')
    .select('*')
    .eq('doctor_id', doctorId);

  if (tempError) throw tempError;
  if (!templates || templates.length === 0) return;

  const slotsToInsert = [];

  const getNextDate = (dayName) => {
    const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    const target = days.indexOf(dayName);
    const today = new Date();
    const current = today.getDay();
    let diff = target - current;
    if (diff <= 0) diff += 7;
    const next = new Date(today);
    next.setDate(today.getDate() + diff);
    return next.toISOString().split('T')[0];
  };

  const generateTimeSlots = (start, end) => {
    const slots = [];
    let [sh, sm] = start.split(':').map(Number);
    let [eh, em] = end.split(':').map(Number);
    let current = sh * 60 + sm;
    const endMin = eh * 60 + em;

    while (current + 60 <= endMin) {
      const s = `${String(Math.floor(current / 60)).padStart(2, '0')}:${String(current % 60).padStart(2, '0')}`;
      const e = `${String(Math.floor((current + 60) / 60)).padStart(2, '0')}:${String((current + 60) % 60).padStart(2, '0')}`;
      slots.push([s, e]);
      current += 60;
    }
    return slots;
  };

  for (const template of templates) {
    const workDate = getNextDate(template.day_of_week);
    const timeSlots = generateTimeSlots(template.start_time, template.end_time);

    for (const [s, e] of timeSlots) {
      slotsToInsert.push({
        doctor_id: doctorId,
        is_template: false,
        work_date: workDate,
        start_time: s,
        end_time: e,
        max_patients: 5,
        booked_count: 0,
      });
    }
  }

  if (slotsToInsert.length > 0) {
    const { error } = await supabase
      .from('appointment_slots')
      .upsert(slotsToInsert, { onConflict: 'doctor_id,work_date,start_time' });

    if (error) throw error;
  }
};

// === TẠO BÁC SĨ + LỊCH MẪU + SLOT ===
// === TẠO BÁC SĨ + LỊCH MẪU + SLOT ===
export const createDoctorWithRoleService = async (
  email,
  password,
  fullName,
  departmentId,
  scheduleList = [],
  role = 2
) => {
  try {
    // 1. TẠO USER AUTH
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        return { success: false, message: `Email ${email} đã tồn tại` };
      }
      throw authError;
    }

    const userId = authData.user.id;

    // 2. TẠO PROFILE
    const { error: profileError } = await supabase
      .from('user_profiles')
      .upsert({ id: userId, full_name: fullName, email, role_id: role }, { onConflict: 'id' });

    if (profileError) throw profileError;

    // 3. TẠO BÁC SĨ
    const { error: doctorError } = await supabase
      .from('doctors')
      .upsert({ id: userId, department_id: departmentId }, { onConflict: 'id' });

    if (doctorError) throw doctorError;

    // 4. LƯU TEMPLATE VÀO BẢNG `doctor_schedule_template`
    if (scheduleList.length > 0) {
      const templateByDay = {};
      scheduleList.forEach(s => {
        if (!templateByDay[s.day_of_week]) {
          templateByDay[s.day_of_week] = { start: s.start_time, end: s.end_time };
        } else {
          const currentStart = templateByDay[s.day_of_week].start;
          const currentEnd = templateByDay[s.day_of_week].end;
          if (s.start_time < currentStart) templateByDay[s.day_of_week].start = s.start_time;
          if (s.end_time > currentEnd) templateByDay[s.day_of_week].end = s.end_time;
        }
      });

      const templateData = Object.entries(templateByDay).map(([day, { start, end }]) => ({
        doctor_id: userId,
        day_of_week: day,
        start_time: start,
        end_time: end,
      }));

      // SỬA: DÙNG .upsert() THAY .insert().onConflict()
      const { error: tempErr } = await supabase
        .from('doctor_schedule_template')
        .upsert(templateData, { 
          onConflict: 'doctor_id,day_of_week,start_time' 
        });

      if (tempErr) throw tempErr;

      // TỰ ĐỘNG SINH SLOT
      await generateSlotsFromTemplate(userId);
    }

    return { success: true, message: `Đã tạo bác sĩ ${fullName}`, userId };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// === LẤY TẤT CẢ BÁC SĨ ===
export const getAllDoctorsService = async () => {
  const { data, error } = await supabase
    .from('doctors')
    .select(`
      id,
      department_id,
      specialization,
      experience_years,
      room_number,
      max_patients_per_slot,
      bio,
      created_at,
      user_profiles (
        full_name,
        email,
        role_id,
        roles ( name )
      ),
      departments ( name )
    `)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
};

// === CẬP NHẬT BÁC SĨ ===
export const updateDoctorService = async (userId, updateData = {}) => {
  const updates = {};

  if (updateData.fullName) {
    const { error: profileError } = await supabase
      .from('user_profiles')
      .update({ full_name: updateData.fullName })
      .eq('id', userId);
    if (profileError) throw new Error(profileError.message);
  }

  if (updateData.departmentId) updates.department_id = updateData.departmentId;
  if (updateData.specialization) updates.specialization = updateData.specialization;
  if (updateData.experience_years) updates.experience_years = updateData.experience_years;
  if (updateData.room_number) updates.room_number = updateData.room_number;
  if (updateData.max_patients_per_slot) updates.max_patients_per_slot = updateData.max_patients_per_slot;
  if (updateData.bio) updates.bio = updateData.bio;

  if (Object.keys(updates).length > 0) {
    const { error: doctorError } = await supabase
      .from('doctors')
      .update(updates)
      .eq('id', userId);
    if (doctorError) throw new Error(doctorError.message);
  }

  return { success: true, message: 'Đã cập nhật thông tin bác sĩ' };
};

// === XÓA BÁC SĨ ===
export const deleteDoctorService = async (userId) => {
  try {
    // 1. XÓA TEMPLATE
    const { error: tempError } = await supabase
      .from('doctor_schedule_template')
      .delete()
      .eq('doctor_id', userId);

    if (tempError) throw tempError;

    // 2. XÓA TẤT CẢ SLOT
    const { error: slotError } = await supabase
      .from('appointment_slots')
      .delete()
      .eq('doctor_id', userId);

    if (slotError) throw slotError;

    // 3. XÓA doctors
    const { error: doctorError } = await supabase
      .from('doctors')
      .delete()
      .eq('id', userId);

    if (doctorError) throw doctorError;

    // 4. XÓA profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .delete()
      .eq('id', userId);

    if (profileError) throw profileError;

    // 5. XÓA auth
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);
    if (authError) throw authError;

    return { success: true, message: 'Đã xóa bác sĩ thành công' };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// === TẠO SLOT CỤ THỂ ===
export const createDoctorSlotService = async (doctorId, workDate, startTime, endTime, maxPatients = 5) => {
  const { data, error } = await supabase
    .from('appointment_slots')
    .insert([
      {
        doctor_id: doctorId,
        is_template: false,
        work_date: workDate,
        start_time: startTime,
        end_time: endTime,
        max_patients: maxPatients,
        booked_count: 0,
      },
    ])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
};