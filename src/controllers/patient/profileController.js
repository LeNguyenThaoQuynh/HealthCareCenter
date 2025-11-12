import { profileService } from "../../services/patient/profileService";
import { supabase } from "../../api/supabase";

// Controller xử lý logic nghiệp vụ cho profile

//Chuẩn hóa giới tính
const normalizeGender = (gender) => {
  console.log("🔍 normalizeGender input:", gender);

  if (!gender) return "other";

  const lowerGender = gender.toString().toLowerCase().trim();

  // Nếu đã là male/female/other thì giữ nguyên
  if (["male", "female", "other"].includes(lowerGender)) {
    return lowerGender;
  }

  // Xử lý trường hợp nhập tiếng Việt (từ old data)
  if (lowerGender === "nam") return "male";
  if (lowerGender === "nữ" || lowerGender === "nu") return "female";

  console.log("❌ Unknown gender, defaulting to other");
  return "other";
};

/**
 * Validate dữ liệu profile
 */
const validateProfileData = (formData) => {
  const errors = {};

  // Validate tên
  if (!formData.fullName || !formData.fullName.trim()) {
    errors.fullName = "Vui lòng nhập họ và tên";
  }

  // Validate số điện thoại
  if (!formData.phone || !formData.phone.trim()) {
    errors.phone = "Vui lòng nhập số điện thoại";
  } else {
    const phoneRegex = /^[0-9]{10,11}$/;
    if (!phoneRegex.test(formData.phone)) {
      errors.phone = "Số điện thoại không hợp lệ (10-11 chữ số)";
    }
  }

  // Validate ngày sinh
  if (formData.dateOfBirth) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(formData.dateOfBirth)) {
      errors.dateOfBirth = "Ngày sinh phải có định dạng YYYY-MM-DD";
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Lấy thông tin profile
 */
export const getProfile = async () => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("Không tìm thấy thông tin người dùng");
    }

    const profile = await profileService.getUserProfile(user.id);

    return {
      fullName: profile.full_name || "",
      phone: profile.phone || "",
      dateOfBirth: profile.date_of_birth || "",
      gender: profile.gender || "", // Giữ nguyên male/female/other từ DB
    };
  } catch (error) {
    console.error("Error in getProfile:", error);
    throw error;
  }
};

/**
 * Cập nhật thông tin profile
 */
export const updateProfile = async (formData) => {
  try {
    // Validate dữ liệu
    const validation = validateProfileData(formData);
    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0];
      throw new Error(firstError);
    }

    // Lấy user hiện tại
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("Không tìm thấy thông tin người dùng");
    }

    // Chuẩn hóa dữ liệu
    const normalizedData = {
      fullName: formData.fullName.trim(),
      phone: formData.phone.trim(),
      dateOfBirth: formData.dateOfBirth || null,
      gender: normalizeGender(formData.gender),
    };

    // Cập nhật user_profiles
    const updatedProfile = await profileService.updateUserProfile(
      user.id,
      normalizedData
    );

    // Cập nhật auth metadata
    await profileService.updateAuthMetadata(normalizedData);

    return updatedProfile;
  } catch (error) {
    console.error("Error in updateProfile:", error);
    throw error;
  }
};
