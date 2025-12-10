import React from "react";
import { createStackNavigator } from "@react-navigation/stack";

import HomeScreen from "../screens/patient/HomeScreen";
import BookingScreen from "../screens/patient/BookingScreen";
import BookingOptionsScreen from "../screens/patient/BookingOptionsScreen";
import BookByDoctor from "../screens/patient/Book_appointment/BookByDoctor/BookByDoctor";
import BookByDate from "../screens/patient/Book_appointment/BookByDate/BookByDate";
import AppointmentScreen from "../screens/patient/AppointmentScreen";
import HistoryScreen from "../screens/patient/HistoryScreen";
import ProfileScreen from "../screens/patient/ProfileScreen";
import EditProfileScreen from "../screens/patient/EditProfileScreen";
import BloodGlucoseScreen from "../screens/patient/Health_Monitoring/BloodGlucoseScreen";
import BloodPressureScreen from "../screens/patient/Health_Monitoring/BloodPressureScreen";
import WeightBMIScreen from "../screens/patient/Health_Monitoring/WeightBMIScreen";
import CustomerGuideScreen from "../screens/patient/news/CustomerGuideScreen";

import SelectDepartment from "../screens/patient/Book_appointment/BookByDate/SelectDepartment";
import SelectTimeSlot from "../screens/patient/Book_appointment/BookByDate/SelectTimeSlot";
import ConfirmBooking from "../screens/patient/Book_appointment/BookByDate/ConfirmBooking";
import BookingSuccess from "../screens/patient/Book_appointment/BookByDate/BookingSuccess";

import SelectDate from "../screens/patient/Book_appointment/BookByDoctor/SelectDate";
import SelectTimeSlotDoctor from "../screens/patient/Book_appointment/BookByDoctor/SelectTimeSlotDoctor";
import ConfirmBookingDoctor from "../screens/patient/Book_appointment/BookByDoctor/ConfirmBookingDoctor";
import BookSuccessDoctor from "../screens/patient/Book_appointment/BookByDoctor/BookSuccessDoctor";

import MedicalRecordScreen from "../screens/patient/MedicalRecordScreen";
import PriceListScreen from "../screens/patient/news/PriceListScreen";
import SupportScreen from "../screens/patient/SupportScreen";
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
      <Stack.Screen name="HomeScreen" component={HomeScreen} />

      <Stack.Screen name="BookingScreen" component={BookingScreen} />
      <Stack.Screen
        name="BookingOptionsScreen"
        component={BookingOptionsScreen}
      />

      <Stack.Screen name="BookByDoctor" component={BookByDoctor} />
      <Stack.Screen name="SelectDate" component={SelectDate} />
      <Stack.Screen
        name="SelectTimeSlotDoctor"
        component={SelectTimeSlotDoctor}
      />
      <Stack.Screen
        name="ConfirmBookingDoctor"
        component={ConfirmBookingDoctor}
      />
      <Stack.Screen name="BookSuccessDoctor" component={BookSuccessDoctor} />

      <Stack.Screen name="BookByDate" component={BookByDate} />
      <Stack.Screen name="SelectDepartment" component={SelectDepartment} />
      <Stack.Screen name="SelectTimeSlot" component={SelectTimeSlot} />
      <Stack.Screen name="ConfirmBooking" component={ConfirmBooking} />
      <Stack.Screen name="BookingSuccess" component={BookingSuccess} />

      <Stack.Screen name="MyAppointments" component={AppointmentScreen} />
      <Stack.Screen name="HistoryScreen" component={HistoryScreen} />

      <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />

      <Stack.Screen name="WeightBMI" component={WeightBMIScreen} />
      <Stack.Screen name="BloodPressure" component={BloodPressureScreen} />
      <Stack.Screen name="BloodGlucose" component={BloodGlucoseScreen} />

      <Stack.Screen name="CustomerGuide" component={CustomerGuideScreen} />
      <Stack.Screen name="PriceList" component={PriceListScreen} />
      <Stack.Screen name="SupportScreen" component={SupportScreen} />
      <Stack.Screen
        name="MedicalRecordScreen"
        component={MedicalRecordScreen}
      />
    </Stack.Navigator>
  );
}
