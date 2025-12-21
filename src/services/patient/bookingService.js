import { supabase } from "../../api/supabase";

const VIETNAMESE_DAYS = [
  "Chủ nhật",
  "Thứ 2",
  "Thứ 3",
  "Thứ 4",
  "Thứ 5",
  "Thứ 6",
  "Thứ 7",
];

const DEFAULT_PRICE = 180000;

const getServicePrice = async (serviceName) => {
  try {
    const keyword = `%${serviceName.trim()}%`;

    const { data, error } = await supabase
      .from("services")
      .select("price, service_type")
      .eq("is_active", true)
      .in("service_type", ["consultation", "imaging", "lab_test"])
      .or(`name.ilike.${keyword},department.ilike.${keyword}`)
      .order("price", { ascending: true }) // lấy giá thấp nhất
      .limit(1)
      .single();

    if (error || !data?.price) {
      console.warn("Không tìm thấy giá cho:", serviceName);
      return DEFAULT_PRICE;
    }

    return Number(data.price);
  } catch (err) {
    console.error("getServicePrice error:", err);
    return DEFAULT_PRICE;
  }
};

export const getAvailableDates = async () => {
  try {
    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await supabase.rpc("get_available_dates", {
      from_date: today,
      days_ahead: 90,
    });

    if (error) throw error;

    return {
      success: true,
      data: data?.map((d) => d.work_date) || [],
    };
  } catch (error) {
    console.error("[BookingService] getAvailableDates error:", error);
    return { success: false, data: [] };
  }
};

export const getSpecializationsByDate = async (date) => {
  try {
    const dayOfWeek = VIETNAMESE_DAYS[new Date(date).getDay()];

    const { data, error } = await supabase
      .from("doctor_schedule_template")
      .select(
        `
        doctors!inner (
          id,
          name,
          specialization
        )
      `
      )
      .eq("day_of_week", dayOfWeek);

    if (error) throw error;

    const serviceMap = new Map();

    data.forEach((item) => {
      const services = (item.doctors?.specialization || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      services.forEach((s) => {
        serviceMap.set(s, (serviceMap.get(s) || 0) + 1);
      });
    });

    const result = await Promise.all(
      Array.from(serviceMap.entries()).map(async ([name, doctorCount]) => {
        const price = await getServicePrice(name);
        return { name, doctorCount, price };
      })
    );

    return {
      success: true,
      data: result.sort((a, b) => a.name.localeCompare(b.name)),
    };
  } catch (error) {
    console.error("[BookingService] getSpecializations error:", error);
    return { success: false, data: [] };
  }
};

export const getAvailableSlots = async (date, serviceName) => {
  try {
    const dayOfWeek = VIETNAMESE_DAYS[new Date(date).getDay()];

    const { data: templates, error } = await supabase
      .from("doctor_schedule_template")
      .select(
        `
        id,
        start_time,
        end_time,
        max_patients_per_slot,
        doctors!inner (
          id,
          name,
          room_number,
          experience_years,
          specialization,
          user_profiles (avatar_url)
        )
      `
      )
      .eq("day_of_week", dayOfWeek);

    if (error) throw error;

    const filtered = templates.filter((t) =>
      (t.doctors?.specialization || "")
        .split(",")
        .map((s) => s.trim())
        .includes(serviceName)
    );

    if (filtered.length === 0) {
      return { success: true, data: [] };
    }

    const slotIds = filtered.map((t) => t.id);

    const { data: booked } = await supabase
      .from("appointments")
      .select("slot_id")
      .eq("date", date)
      .in("slot_id", slotIds)
      .not(
        "status",
        "in",
        '("cancelled","patient_cancelled","doctor_cancelled")'
      );

    const bookedCount = {};
    booked?.forEach((b) => {
      bookedCount[b.slot_id] = (bookedCount[b.slot_id] || 0) + 1;
    });

    const grouped = {};

    for (const t of filtered) {
      const doctor = t.doctors;
      const bookedNum = bookedCount[t.id] || 0;
      const available = (t.max_patients_per_slot || 5) - bookedNum;

      if (available <= 0) continue;

      const startTime = t.start_time?.slice(0, 5) || "08:00";
      const endTime = t.end_time?.slice(0, 5) || "09:00";

      if (!grouped[doctor.id]) {
        const specs = (doctor.specialization || "")
          .split(",")
          .map((s) => s.trim());

        grouped[doctor.id] = {
          doctor: {
            id: doctor.id,
            name: doctor.name,
            room_number: doctor.room_number || "Chưa có phòng",
            avatar_url: doctor.user_profiles?.avatar_url,
            specializationText: specs.join(" • "),
            experience_years: doctor.experience_years || 0,
          },
          slots: [],
        };
      }

      grouped[doctor.id].slots.push({
        id: t.id,
        display: `${startTime} - ${endTime}`,
        start_time: startTime,
        end_time: endTime,
        available,
      });
    }

    return { success: true, data: Object.values(grouped) };
  } catch (error) {
    console.error("[BookingService] getAvailableSlots error:", error);
    return { success: false, data: [] };
  }
};

export const createAppointment = async ({
  doctorId,
  date,
  slotId,
  patientName,
  patientPhone,
  price = DEFAULT_PRICE,
  startTime = "08:00",
}) => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("Chưa đăng nhập");

    // 🔥 BẮT BUỘC: truyền date cho DB
    const appointmentDate = date; // YYYY-MM-DD

    const vietnamDate = new Date(`${date}T${startTime}:00+07:00`);
    const utcDateTime = vietnamDate.toISOString().slice(0, 19);

    const { data, error } = await supabase
      .from("appointments")
      .insert({
        user_id: user.id,
        doctor_id: doctorId,
        date: appointmentDate, // ✅ DÒNG QUAN TRỌNG NHẤT
        slot_id: slotId,
        appointment_date: utcDateTime,
        patient_name: patientName.trim(),
        patient_phone: patientPhone.replace(/\D/g, ""),
        price,
        status: "pending",
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error("Lỗi đặt lịch:", error);
    return { success: false, error: error.message };
  }
};

