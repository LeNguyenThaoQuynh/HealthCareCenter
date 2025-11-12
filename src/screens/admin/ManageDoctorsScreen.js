// src/screens/admin/ManageDoctorsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { supabase } from '../../api/supabase';
import { getAllDoctorsService, deleteDoctorService } from '../../services/doctor/doctorService';
import { styles } from '../../styles/admin/ManageDoctorsStyles';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

export default function ManageDoctorsScreen() {
  const navigation = useNavigation();
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDoctors = async () => {
    try {
      const data = await getAllDoctorsService();
      setDoctors(data);
      setFilteredDoctors(data);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể tải danh sách bác sĩ');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    const query = searchQuery.toLowerCase();
    const filtered = doctors.filter(doc =>
      doc.user_profiles?.full_name?.toLowerCase().includes(query) ||
      doc.departments?.name?.toLowerCase().includes(query) ||
      doc.specialization?.toLowerCase().includes(query)
    );
    setFilteredDoctors(filtered);
  }, [searchQuery, doctors]);

  const handleDelete = (doctorId, doctorName) => {
    Alert.alert(
      'Xác nhận xóa',
      `Bạn có chắc muốn xóa bác sĩ ${doctorName}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const result = await deleteDoctorService(doctorId);
              if (result.success) {
                Alert.alert('Thành công', result.message);
                fetchDoctors();
              } else {
                Alert.alert('Lỗi', result.message);
              }
            } catch (error) {
              Alert.alert('Lỗi', 'Xóa thất bại');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const renderDoctorItem = ({ item }) => (
    <View style={styles.doctorCard}>
      <View style={styles.doctorInfo}>
        <Text style={styles.doctorName}>{item.user_profiles?.full_name || 'Không tên'}</Text>
        <Text style={styles.doctorDetail}>
          {item.departments?.name || 'Chưa có khoa'}
        </Text>
        <Text style={styles.doctorDetail}>Chuyên môn: {item.specialization || 'Chưa cập nhật'}</Text>
        <Text style={styles.doctorDetail}>Phòng: {item.room_number || 'Chưa có'}</Text>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => navigation.navigate('Sửa bác sĩ', { doctorId: item.id })}
        >
          <Icon name="pencil" size={18} color="#3B82F6" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDelete(item.id, item.user_profiles?.full_name)}
        >
          <Icon name="trash" size={18} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Đang tải danh sách bác sĩ...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Danh sách bác sĩ</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('Thêm bác sĩ')}
        >
          <Icon name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* SEARCH BAR */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#6B7280" style={styles.searchIcon} />
        <TextInput
          placeholder="Tìm bác sĩ, khoa, chuyên môn..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
        />
        {searchQuery !== '' && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Icon name="close-circle" size={20} color="#6B7280" />
          </TouchableOpacity>
        )}
      </View>

      {/* DOCTOR LIST */}
      <FlatList
        data={filteredDoctors}
        keyExtractor={(item) => item.id}
        renderItem={renderDoctorItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => {
            setRefreshing(true);
            fetchDoctors();
          }} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="people-outline" size={60} color="#9CA3AF" />
            <Text style={styles.emptyText}>Chưa có bác sĩ nào</Text>
          </View>
        }
      />
    </View>
  );
}