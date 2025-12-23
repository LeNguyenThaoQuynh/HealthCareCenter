import { supabase } from "../../api/supabase";

/* =========================
   SIGN IN
========================= */
export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw {
      code: "LOGIN_FAILED",
      message: error.message,
    };
  }

  return data;
};

/* =========================
   SIGN UP
========================= */
export const signUp = async (
  email,
  password,
  fullName,
  phone,
  dateOfBirth,
  gender
) => {
  /* ===== Chuẩn hóa giới tính ===== */
  const normalizedGender = (() => {
    if (!gender) return "other";
    const g = gender.toLowerCase();
    if (g.includes("nam") || g.includes("male")) return "male";
    if (g.includes("nu") || g.includes("nữ") || g.includes("female"))
      return "female";
    return "other";
  })();

  /* ===== Chuẩn hóa ngày sinh ===== */
  let formattedDate = null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) {
    formattedDate = dateOfBirth;
  }

  /* ===== Đăng ký Supabase Auth ===== */
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        phone,
        date_of_birth: formattedDate,
        gender: normalizedGender,
      },
    },
  });

  /* ===== BẮT LỖI AUTH ===== */
  if (error) {
    if (error.message?.includes("already registered")) {
      throw {
        code: "EMAIL_EXISTS",
        message: "Email này đã được đăng ký",
      };
    }

    throw {
      code: "SUPABASE_AUTH_ERROR",
      message: error.message,
    };
  }

  const user = data?.user;

  /* ===== Tạo / cập nhật profile ===== */
  if (user) {
    const { error: profileError } = await supabase
      .from("user_profiles")
      .upsert(
        {
          id: user.id,
          full_name: fullName,
          phone,
          date_of_birth: formattedDate,
          gender: normalizedGender,
          role_id: 3, // patient
        },
        { onConflict: "id" }
      );

    if (profileError) {
      throw {
        code: "PROFILE_CREATE_FAILED",
        message: "Không thể tạo hồ sơ người dùng",
      };
    }
  }

  return user;
};

/* =========================
   GET USER PROFILE
========================= */
export const getUserProfile = async (userId) => {
  const { data, error } = await supabase
    .from("user_profiles")
    .select("*, roles(*)")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw {
      code: "GET_PROFILE_FAILED",
      message: error.message,
    };
  }

  return {
    id: data?.id,
    name: data?.full_name,
    role: data?.roles?.name || "patient",
  };
};
