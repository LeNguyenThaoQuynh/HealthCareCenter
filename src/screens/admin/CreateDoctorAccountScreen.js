// src/screens/admin/CreateDoctorAccountScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  Modal,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { supabase } from '../../api/supabase';
import { styles } from '../../styles/admin/CreateDoctorAccountStyles';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

export default function CreateDoctorAccountScreen() {
  const navigation = useNavigation();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [maxPatients, setMaxPatients] = useState('5');
  const [bio, setBio] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [departments, setDepartments] = useState([]);
  const [deptModalVisible, setDeptModalVisible] = useState(false);
  const [searchDept, setSearchDept] = useState('');
  const [filteredDepts, setFilteredDepts] = useState([]);

  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const specRef = useRef(null);
  const expRef = useRef(null);
  const roomRef = useRef(null);
  const maxRef = useRef(null);
  const bioRef = useRef(null);

  // === LẤY DANH SÁCH KHOA ===
  useEffect(() => {
    const fetchDepartments = async () => {
      const { data, error } = await supabase
        .from('departments')
        .select('id, name')
        .order('name');

      if (error) {
        Alert.alert('Lỗi', 'Không thể tải danh sách khoa.');
      } else {
        setDepartments(data || []);
        setFilteredDepts(data || []);
      }
    };
    fetchDepartments();
  }, []);

  // === TÌM KIẾM KHOA ===
  useEffect(() => {
    const filtered = departments.filter((dep) =>
      dep.name.toLowerCase().includes(searchDept.toLowerCase())
    );
    setFilteredDepts(filtered);
  }, [searchDept, departments]);

  // === XÁC THỰC ===
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidPassword = (pwd) => pwd.length >= 6;

  const selectedDepartmentName = () => {
    const dep = departments.find((d) => String(d.id) === String(departmentId));
    return dep ? dep.name : 'Chọn khoa';
  };

  // === TIẾP TỤC → CHỈ TRUYỀN DỮ LIỆU, KHÔNG LƯU DB ===
  const handleNext = () => {
    if (!fullName.trim() || !email.trim() || !password || !departmentId) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập đầy đủ các trường bắt buộc.');
      return;
    }
    if (!isValidEmail(email)) {
      Alert.alert('Email sai', 'Vui lòng nhập đúng định dạng email.');
      return;
    }
    if (!isValidPassword(password)) {
      Alert.alert('Mật khẩu yếu', 'Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }

    // CHỈ TRUYỀN DỮ LIỆU QUA MÀN HÌNH LỊCH
    navigation.navigate('Lịch làm việc', {
      doctorInfo: {
        fullName,
        email,
        password,
        specialization,
        experienceYears: experienceYears ? parseInt(experienceYears) : 0,
        roomNumber,
        maxPatients: maxPatients ? parseInt(maxPatients) : 5,
        bio,
        departmentId,
      },
    });
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Tạo tài khoản bác sĩ (1/2)</Text>

        {/* Full Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Họ và tên *</Text>
          <View style={styles.inputWrapper}>
            <Icon name="person-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Nguyễn Văn A"
              value={fullName}
              onChangeText={setFullName}
              returnKeyType="next"
              onSubmitEditing={() => emailRef.current?.focus()}
            />
          </View>
        </View>

        {/* Email */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email *</Text>
          <View style={styles.inputWrapper}>
            <Icon name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              ref={emailRef}
              style={styles.input}
              placeholder="doctor@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
            />
          </View>
        </View>

        {/* Password */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Mật khẩu *</Text>
          <View style={styles.inputWrapper}>
            <Icon name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              ref={passwordRef}
              style={styles.input}
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              returnKeyType="next"
            />
          </View>
        </View>

        {/* Khoa */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Khoa *</Text>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setDeptModalVisible(true)}
          >
            <Icon name="business-outline" size={20} color="#007AFF" style={styles.inputIcon} />
            <Text style={styles.dropdownText}>{selectedDepartmentName()}</Text>
            <Icon name="chevron-down" size={20} color="#007AFF" />
          </TouchableOpacity>
        </View>

        {/* Chuyên môn */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Chuyên môn</Text>
          <View style={styles.inputWrapper}>
            <Icon name="medkit-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              ref={specRef}
              style={styles.input}
              placeholder="Tim mạch, Nội khoa..."
              value={specialization}
              onChangeText={setSpecialization}
            />
          </View>
        </View>

        {/* Kinh nghiệm */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Số năm kinh nghiệm</Text>
          <View style={styles.inputWrapper}>
            <Icon name="time-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              ref={expRef}
              style={styles.input}
              placeholder="5"
              value={experienceYears}
              onChangeText={setExperienceYears}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Phòng */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Số phòng</Text>
          <View style={styles.inputWrapper}>
            <Icon name="home-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              ref={roomRef}
              style={styles.input}
              placeholder="202"
              value={roomNumber}
              onChangeText={setRoomNumber}
            />
          </View>
        </View>

        {/* Số bệnh nhân/ca */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Số bệnh nhân/ca</Text>
          <View style={styles.inputWrapper}>
            <Icon name="people-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              ref={maxRef}
              style={styles.input}
              placeholder="5"
              value={maxPatients}
              onChangeText={setMaxPatients}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Tiểu sử */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Tiểu sử</Text>
          <View style={[styles.inputWrapper, { height: 100, alignItems: 'flex-start' }]}>
            <Icon name="document-text-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              ref={bioRef}
              style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
              placeholder="Giới thiệu ngắn gọn..."
              value={bio}
              onChangeText={setBio}
              multiline
            />
          </View>
        </View>

        {/* NÚT TIẾP TỤC */}
        <TouchableOpacity style={styles.primaryButton} onPress={handleNext}>
          <Text style={styles.primaryButtonText}>Tiếp tục → Chọn lịch làm việc</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* MODAL CHỌN KHOA */}
      <Modal visible={deptModalVisible} animationType="slide" transparent>
        <TouchableWithoutFeedback onPress={() => setDeptModalVisible(false)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Chọn khoa</Text>
            <TouchableOpacity onPress={() => setDeptModalVisible(false)}>
              <Icon name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm khoa..."
            value={searchDept}
            onChangeText={setSearchDept}
          />
          <ScrollView style={{ maxHeight: 400 }}>
            {filteredDepts.map((dept) => (
              <TouchableOpacity
                key={dept.id}
                style={styles.modalItem}
                onPress={() => {
                  setDepartmentId(String(dept.id));
                  setDeptModalVisible(false);
                  setSearchDept('');
                }}
              >
                <Text style={styles.modalItemText}>{dept.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}