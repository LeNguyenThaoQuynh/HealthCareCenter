import { supabase } from "../../api/supabase";

/**
 * Service xử lý các tác vụ liên quan đến profile
 */
export const profileService = {
  /**
   * Lấy thông tin profile của user
   */
  async getUserProfile(userId) {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Cập nhật thông tin profile
   */
  async updateUserProfile(userId, profileData) {
    const { data, error } = await supabase
      .from("user_profiles")
      .update({
        full_name: profileData.fullName,
        phone: profileData.phone,
        date_of_birth: profileData.dateOfBirth,
        gender: profileData.gender,
      })
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Cập nhật metadata trong auth.users
   */
  async updateAuthMetadata(profileData) {
    const { data, error } = await supabase.auth.updateUser({
      data: {
        full_name: profileData.fullName,
        phone: profileData.phone,
        date_of_birth: profileData.dateOfBirth,
        gender: profileData.gender,
      },
    });

    if (error) throw error;
    return data;
  },
};
