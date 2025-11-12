import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import DateTimePickerModal from "react-native-modal-datetime-picker"; // THÊM IMPORT
import CustomButton from "../../components/CustomButton";
import { useUserStore } from "../../store/useUserStore";
import {
  getProfile,
  updateProfile,
} from "../../controllers/patient/profileController";
import { Colors } from "../../shared/colors";
import { editProfileStyles as styles } from "../../styles/patient/editProfileStyles";

const EditProfileScreen = ({ navigation }) => {
  const { user, setUser } = useUserStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // THÊM STATE CHO DATE PICKER
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
  });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const profile = await getProfile();
      setFormData(profile);

      // SET SELECTED DATE NẾU CÓ
      if (profile.dateOfBirth) {
        setSelectedDate(new Date(profile.dateOfBirth));
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      Alert.alert("Lỗi", error.message || "Không thể tải thông tin hồ sơ");
    } finally {
      setLoading(false);
    }
  };

  // THÊM FUNCTIONS CHO DATE PICKER
  const showDatePicker = () => {
    setDatePickerVisible(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisible(false);
  };

  const handleDateConfirm = (date) => {
    const formattedDate = date.toISOString().split("T")[0]; // YYYY-MM-DD format
    setFormData({ ...formData, dateOfBirth: formattedDate });
    setSelectedDate(date);
    hideDatePicker();
  };

  // FUNCTION FORMAT DATE HIỂN THỊ
  const formatDisplayDate = (dateString) => {
    if (!dateString) return "Chọn ngày sinh";
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, "0")}/${(
      date.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}/${date.getFullYear()}`;
  };

  const handleUpdate = async () => {
    setSaving(true);

    try {
      await updateProfile(formData);

      setUser({
        ...user,
        name: formData.fullName.trim(),
      });

      Alert.alert("Thành công", "Cập nhật thông tin thành công", [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Lỗi", error.message || "Không thể cập nhật thông tin");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <LinearGradient
        colors={["#1D4ED8CC", "#38BDF8B3"]}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#38BDF8" />
            <Text style={styles.loadingText}>Đang tải...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={["#1D4ED8CC", "#38BDF8B3"]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chỉnh sửa hồ sơ</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={["#E0F2FE", "#BFDBFE"]}
                style={styles.avatarGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {formData.fullName
                      ? formData.fullName.charAt(0).toUpperCase()
                      : "U"}
                  </Text>
                </View>
              </LinearGradient>
              <TouchableOpacity style={styles.editAvatarButton}>
                <Ionicons name="camera" size={20} color="#FFF" />
              </TouchableOpacity>
            </View>
            <Text style={styles.userName}>
              {formData.fullName || "Người dùng"}
            </Text>
            <Text style={styles.userRole}>Bệnh nhân</Text>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            {/* Họ và tên */}
            <View style={styles.inputGroup}>
              <View style={styles.inputIconContainer}>
                <Ionicons name="person" size={24} color="#1D4ED8" />
              </View>
              <View style={styles.inputContent}>
                <Text style={styles.inputLabel}>Họ và tên</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nhập họ và tên"
                  placeholderTextColor="#4B5563"
                  value={formData.fullName}
                  onChangeText={(text) =>
                    setFormData({ ...formData, fullName: text })
                  }
                  editable={!saving}
                />
              </View>
            </View>

            {/* Email (Read-only) */}
            <View style={styles.inputGroup}>
              <View style={styles.inputIconContainer}>
                <Ionicons name="mail" size={24} color="#1D4ED8" />
              </View>
              <View style={styles.inputContent}>
                <Text style={styles.inputLabel}>Email</Text>
                <Text style={styles.inputReadonly}>{user?.email || "N/A"}</Text>
              </View>
            </View>

            {/* Số điện thoại */}
            <View style={styles.inputGroup}>
              <View style={styles.inputIconContainer}>
                <Ionicons name="call" size={24} color="#1D4ED8" />
              </View>
              <View style={styles.inputContent}>
                <Text style={styles.inputLabel}>Số điện thoại</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nhập số điện thoại"
                  placeholderTextColor="#4B5563"
                  value={formData.phone}
                  onChangeText={(text) =>
                    setFormData({ ...formData, phone: text })
                  }
                  keyboardType="phone-pad"
                  editable={!saving}
                />
              </View>
            </View>

            {/* NGÀY SINH - THAY ĐỔI THÀNH DATE PICKER */}
            <View style={styles.inputGroup}>
              <View style={styles.inputIconContainer}>
                <Ionicons name="calendar" size={24} color="#1D4ED8" />
              </View>
              <View style={styles.inputContent}>
                <Text style={styles.inputLabel}>Ngày sinh</Text>
                <TouchableOpacity
                  style={styles.datePickerButton}
                  onPress={showDatePicker}
                  disabled={saving}
                >
                  <Text
                    style={[
                      styles.input,
                      !formData.dateOfBirth && styles.placeholderText,
                    ]}
                  >
                    {formatDisplayDate(formData.dateOfBirth)}
                  </Text>
                  <Ionicons
                    name="chevron-down"
                    size={20}
                    color="#1D4ED8"
                    style={styles.dropdownIcon}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Giới tính */}
            <View style={styles.inputGroup}>
              <View style={styles.inputIconContainer}>
                <Ionicons name="male-female" size={24} color="#1D4ED8" />
              </View>
              <View style={styles.inputContent}>
                <Text style={styles.inputLabel}>Giới tính</Text>
                <View style={styles.genderContainer}>
                  {[
                    { value: "male", label: "Nam", icon: "male" },
                    { value: "female", label: "Nữ", icon: "female" },
                    { value: "other", label: "Khác", icon: "help-circle" },
                  ].map((gender) => (
                    <TouchableOpacity
                      key={gender.value}
                      style={[
                        styles.genderButton,
                        formData.gender === gender.value &&
                          styles.genderButtonActive,
                      ]}
                      onPress={() =>
                        setFormData({ ...formData, gender: gender.value })
                      }
                      disabled={saving}
                    >
                      <Ionicons
                        name={gender.icon}
                        size={20}
                        color={
                          formData.gender === gender.value ? "#FFF" : "#1E293B"
                        }
                      />
                      <Text
                        style={[
                          styles.genderText,
                          formData.gender === gender.value &&
                            styles.genderTextActive,
                        ]}
                      >
                        {gender.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Vai trò (Read-only) */}
            <View style={styles.inputGroup}>
              <View style={styles.inputIconContainer}>
                <Ionicons name="shield-checkmark" size={24} color="#1D4ED8" />
              </View>
              <View style={styles.inputContent}>
                <Text style={styles.inputLabel}>Vai trò</Text>
                <Text style={styles.inputReadonly}>Bệnh nhân</Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                onPress={handleUpdate}
                disabled={saving}
              >
                <LinearGradient
                  colors={
                    saving ? ["#9CA3AF", "#9CA3AF"] : ["#1D4ED8", "#38BDF8"]
                  }
                  style={styles.saveButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {saving ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <>
                      <Ionicons
                        name="checkmark-circle"
                        size={24}
                        color="#FFF"
                      />
                      <Text style={styles.saveButtonText}>Lưu thay đổi</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => navigation.goBack()}
                disabled={saving}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* DATE PICKER MODAL */}
        <DateTimePickerModal
          isVisible={isDatePickerVisible}
          mode="date"
          onConfirm={handleDateConfirm}
          onCancel={hideDatePicker}
          maximumDate={new Date()}
          date={selectedDate}
          display={Platform.OS === "ios" ? "inline" : "default"}
          accentColor="#1D4ED8"
          textColor="#1E293B"
        />
      </SafeAreaView>
    </LinearGradient>
  );
};

export default EditProfileScreen;
