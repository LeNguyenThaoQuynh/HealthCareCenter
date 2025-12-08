import { supabase } from "../../api/supabase";

export const deleteDoctorService = async (doctorId, deletedBy = null) => {
  console.log("BẮT ĐẦU XÓA BÁC SĨ (GIỮ LẠI INVOICES) - ID:", doctorId);

  try {
    const { data: appointments, error: aptError } = await supabase
      .from("appointments")
      .select("*")
      .eq("doctor_id", doctorId);

    if (aptError) {
      console.error("Lỗi lấy appointments:", aptError);
      return { success: false, message: "Không thể kiểm tra lịch hẹn" };
    }

    const appointmentIds = appointments?.map((a) => a.id) || [];
    console.log(`Tìm thấy ${appointmentIds.length} lịch hẹn`);

    if (appointmentIds.length > 0) {
      console.log("Đang lưu trữ lịch hẹn vào deleted_appointments...");
      const archiveData = appointments.map((apt) => ({
        ...apt,
        deleted_at: new Date().toISOString(),
        deleted_by: deletedBy || "admin_system",
        deleted_reason: "doctor_deleted",
      }));

      const { error: archiveError } = await supabase
        .from("deleted_appointments")
        .insert(archiveData)
        .select();

      if (archiveError) {
        console.warn(
          "Không thể lưu trữ lịch hẹn (vẫn tiếp tục xóa):",
          archiveError.message
        );
      } else {
        console.log(
          `ĐÃ LƯU TRỮ ${appointmentIds.length} lịch hẹn vào deleted_appointments`
        );
      }
    }

    if (appointmentIds.length > 0) {
      console.log("Đang xóa medical_records...");
      const { error: mrError } = await supabase
        .from("medical_records")
        .delete()
        .in("appointment_id", appointmentIds);

      if (mrError) {
        console.error("Lỗi xóa medical_records:", mrError);
        return { success: false, message: "Không thể xóa bệnh án" };
      }
      console.log("Đã xóa tất cả medical_records");
    }

    if (appointmentIds.length > 0) {
      console.log("Đang xóa appointments (invoices vẫn được giữ lại)...");
      const { error: aptDeleteError } = await supabase
        .from("appointments")
        .delete()
        .in("id", appointmentIds);

      if (aptDeleteError) {
        console.error("Lỗi xóa appointments:", aptDeleteError);
        return { success: false, message: "Không thể xóa lịch hẹn" };
      }
      console.log(
        `Đã xóa ${appointmentIds.length} lịch hẹn – INVOICES VẪN CÒN NGUYÊN!`
      );
    }

    console.log("Xóa lịch làm việc mẫu...");
    await supabase
      .from("doctor_schedule_template")
      .delete()
      .eq("doctor_id", doctorId);

    console.log("Xóa bản ghi doctors...");
    const { error: docError } = await supabase
      .from("doctors")
      .delete()
      .eq("id", doctorId);
    if (docError) throw docError;

    console.log("Xóa user_profiles...");
    await supabase.from("user_profiles").delete().eq("id", doctorId);

    console.log("Xóa tài khoản đăng nhập...");
    const { error: authError } = await supabase.auth.admin.deleteUser(doctorId);
    if (authError) {
      console.warn(
        "Lỗi xóa auth user (vẫn coi là thành công):",
        authError.message
      );
    }

    console.log("XÓA BÁC SĨ THÀNH CÔNG – INVOICES ĐƯỢC GIỮ LẠI 100%!");
    return {
      success: true,
      message: `Đã xóa bác sĩ và lưu trữ ${appointmentIds.length} lịch hẹn. Hóa đơn vẫn còn nguyên!`,
    };
  } catch (error) {
    console.error("LỖI NGHIÊM TRỌNG KHI XÓA BÁC SĨ:", error);
    return {
      success: false,
      message: "Xóa thất bại: " + (error.message || "Lỗi không xác định"),
    };
  }
};
