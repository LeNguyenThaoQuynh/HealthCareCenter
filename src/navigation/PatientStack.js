// src/navigation/PatientStack.js
import React from "react";
import { createStackNavigator } from "@react-navigation/stack";

// === CÁC MÀN HÌNH CŨ (đã có) ===
import HomeScreen from "../screens/patient/HomeScreen";
import BookingScreen from "../screens/patient/BookingScreen";
import BookingOptionsScreen from "../screens/patient/BookingOptionsScreen";
import BookByDoctor from "../screens/patient/Book_appointment/BookByDoctor/BookByDoctor";
import BookByDate from "../screens/patient/Book_appointment/BookByDate/BookByDate";
import AppointmentScreen from "../screens/patient/AppointmentScreen";
import HistoryScreen from "../screens/patient/HistoryScreen";
import ProfileScreen from "../screens/patient/ProfileScreen";
import EditProfileScreen from "../screens/patient/EditProfileScreen";

// === CÁC MÀN HÌNH BOOKING CHI TIẾT ===
import SelectDepartment from "../screens/patient/Book_appointment/BookByDate/SelectDepartment";
import SelectTimeSlot from "../screens/patient/Book_appointment/BookByDate/SelectTimeSlot";
import ConfirmBooking from "../screens/patient/Book_appointment/BookByDate/ConfirmBooking";
import BookingSuccess from "../screens/patient/Book_appointment/BookByDate/BookingSuccess";

import SelectDate from "../screens/patient/Book_appointment/BookByDoctor/SelectDate";
import SelectTimeSlotDoctor from "../screens/patient/Book_appointment/BookByDoctor/SelectTimeSlotDoctor";
import ConfirmBookingDoctor from "../screens/patient/Book_appointment/BookByDoctor/ConfirmBookingDoctor";
import BookSuccessDoctor from "../screens/patient/Book_appointment/BookByDoctor/BookSuccessDoctor";

// === MÀN HÌNH MỚI: BỆNH ÁN ĐIỆN TỬ (SIÊU ĐẸP) ===
import MedicalRecordScreen from "../screens/patient/MedicalRecordScreen";

const Stack = createStackNavigator();

export default function PatientStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animationEnabled: true,
        gestureEnabled: true,
      }}
    >
      {/* 1. MÀN HÌNH CHÍNH */}
      <Stack.Screen name="HomeScreen" component={HomeScreen} />

      {/* 2. ĐẶT LỊCH */}
      <Stack.Screen name="BookingScreen" component={BookingScreen} />
      <Stack.Screen
        name="BookingOptionsScreen"
        component={BookingOptionsScreen}
       
      />

      {/* Đặt theo bác sĩ */}
      <Stack.Screen name="BookByDoctor" component={BookByDoctor} />
      <Stack.Screen name="SelectDate" component={SelectDate} />
      <Stack.Screen name="SelectTimeSlotDoctor" component={SelectTimeSlotDoctor} />
      <Stack.Screen name="ConfirmBookingDoctor" component={ConfirmBookingDoctor} />
      <Stack.Screen name="BookSuccessDoctor" component={BookSuccessDoctor} />

      {/* Đặt theo ngày */}
      <Stack.Screen name="BookByDate" component={BookByDate} />
      <Stack.Screen name="SelectDepartment" component={SelectDepartment} />
      <Stack.Screen name="SelectTimeSlot" component={SelectTimeSlot} />
      <Stack.Screen name="ConfirmBooking" component={ConfirmBooking} />
      <Stack.Screen name="BookingSuccess" component={BookingSuccess} />

      {/* 3. LỊCH HẸN & LỊCH SỬ */}
      <Stack.Screen name="MyAppointments" component={AppointmentScreen} />
      <Stack.Screen name="HistoryScreen" component={HistoryScreen} />

      {/* 4. HỒ SƠ & BỆNH ÁN – MỚI THÊM */}
      <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />

      {/* MÀN HÌNH BỆNH ÁN ĐIỆN TỬ – ĐẸP NHƯ VINMEC */}
      <Stack.Screen
        name="MedicalRecordScreen"
        component={MedicalRecordScreen}
      
      />
    </Stack.Navigator>
  );
}