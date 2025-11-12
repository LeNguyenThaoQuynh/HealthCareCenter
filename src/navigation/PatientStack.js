import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import HomeScreen from "../screens/patient/HomeScreen";
import BookingScreen from "../screens/patient/BookingScreen";
import BookingOptionsScreen from "../screens/patient/BookingOptionsScreen";
import BookByDoctor from "../screens/patient/Book_appointment/BookByDoctor/BookByDoctor";
import BookByDate from "../screens/patient/Book_appointment/BookByDate/BookByDate";
import SearchDoctorScreen from "../screens/patient/SearchDoctorScreen";
import AppointmentScreen from "../screens/patient/AppointmentScreen";
import HistoryScreen from "../screens/patient/HistoryScreen";
import ProfileScreen from "../screens/patient/ProfileScreen";
import EditProfileScreen from "../screens/patient/EditProfileScreen";
import SelectDepartment from "../screens/patient/Book_appointment/BookByDate/SelectDepartment";
import SelectTimeSlot from "../screens/patient/Book_appointment/BookByDate/SelectTimeSlot";
import ConfirmBooking from "../screens/patient/Book_appointment/BookByDate/ConfirmBooking";
import BookingSuccess from "../screens/patient/Book_appointment/BookByDate/BookingSuccess";

const Stack = createStackNavigator();

export default function PatientStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeScreen" component={HomeScreen} />
      <Stack.Screen name="BookingScreen" component={BookingScreen} />
      <Stack.Screen
        name="BookingOptionsScreen"
        component={BookingOptionsScreen}
        options={{ headerShown: true, title: "Đặt Khám" }}
      />
      <Stack.Screen name="BookByDoctor" component={BookByDoctor} />
      <Stack.Screen name="BookByDate" component={BookByDate} />
      <Stack.Screen name="SearchDoctorScreen" component={SearchDoctorScreen} />
      <Stack.Screen name="AppointmentScreen" component={AppointmentScreen} />
      <Stack.Screen name="HistoryScreen" component={HistoryScreen} />
      <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />

      <Stack.Screen name="SelectDepartment" component={SelectDepartment} />
      <Stack.Screen name="SelectTimeSlot" component={SelectTimeSlot} />
      <Stack.Screen name="ConfirmBooking" component={ConfirmBooking} />
      <Stack.Screen name="BookingSuccess" component={BookingSuccess} />
    </Stack.Navigator>
  );
}
