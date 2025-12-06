// navigation/AppNavigator.js
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// === AUTH & COMMON ===
import AuthNavigator from './AuthNavigator';
import RoleRedirect from '../screens/auth/RoleRedirect';

// === ADMIN ===
import AdminHomeScreen from '../screens/admin/AdminHomeScreen';
import AdminDashboard from '../screens/admin/AdminDashboard';
import ManageDoctorsScreen from '../screens/admin/ManageDoctorsScreen';
import CreateDoctorAccountScreen from '../screens/admin/CreateDoctorAccountScreen';
import CreateDoctorScheduleScreen from '../screens/admin/CreateDoctorScheduleScreen';
import OutstandingDoctor from '../screens/admin/OutstandingDoctor';
import RevenueStatsScreen from '../screens/admin/RevenueStatsScreen';
import ManagePatientsScreen from '../screens/admin/ManagePatientsScreen';
import DoctorDetailScreen from '../screens/admin/DoctorDetailScreen';
import CreateServiceScreen from'../screens/admin/CreateServiceScreen';
import ManageServicesScreen from'../screens/admin/ManageServicesScreen';
// === DOCTOR ===
import DoctorHomeScreen from '../screens/doctor/DoctorHomeScreen';
import DoctorAppointmentsScreen from '../screens/doctor/DoctorAppointmentsScreen';
import EditDoctorProfileScreen from '../screens/doctor/EditDoctorProfileScreen';
import ProfileScreen from '../screens/doctor/ProfileScreen';
import PatientStatisticsScreen from '../screens/doctor/PatientStatisticsScreen';
import PaymentSummaryScreen from '../screens/doctor/PaymentSummaryScreen' 
// === MÀN HÌNH QUY TRÌNH Y KHOA ===
import OrderTestsScreen from '../screens/doctor/OrderTestsScreen';
import FinalizeRecordScreen from '../screens/doctor/FinalizeRecordScreen';

// === PHÒNG XÉT NGHIỆM (LAB) – ĐÃ SỬA ĐÚNG ĐƯỜNG DẪN ===
// SỬA THÀNH ĐÚNG TÊN FILE (có chữ Screen)
import LabPendingTestsScreen from '../screens/Lab_Technician/LabPendingTestsScreen';
import LabEnterResultsScreen from '../screens/Lab_Technician/LabEnterResultsScreen';
import LabHistoryScreen from '../screens/Lab_Technician/LabHistoryScreen';
import LabDashboard from '../screens/Lab_Technician/LabDashboard';
import LabHistoryDetail from '../screens/Lab_Technician/LabHistoryDetail';

import PendingInvoicesScreen from '../screens/accountant/AccountantHomeScreen'
// === KHÁC ===
import PatientStack from './PatientStack';
import ReceptionTabs from './ReceptionTabs';
import AccountantTabs from './AccountantTabs';
import Login from '../screens/auth/LoginScreen'
const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* AUTH */}
      <Stack.Screen name="Auth" component={AuthNavigator} />
      <Stack.Screen name="RoleRedirect" component={RoleRedirect} />
      <Stack.Screen name="Login" component={Login}/>
      {/* ADMIN */}
      <Stack.Screen name="AdminHome" component={AdminHomeScreen} />
      <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
      <Stack.Screen name="ManageDoctors" component={ManageDoctorsScreen} />
      <Stack.Screen name="CreateDoctorAccount" component={CreateDoctorAccountScreen} />
      <Stack.Screen name="CreateDoctorSchedule" component={CreateDoctorScheduleScreen} />
      <Stack.Screen name="OutstandingDoctor" component={OutstandingDoctor} />
      <Stack.Screen name="ManagePatients" component={ManagePatientsScreen} />
      <Stack.Screen name="DoctorDetail" component={DoctorDetailScreen} />
      <Stack.Screen name="CreateService" component={CreateServiceScreen}/>
      <Stack.Screen name='ManageServices' component={ManageServicesScreen}/>
      <Stack.Screen name='RevenueStats' component={RevenueStatsScreen}/>

      {/* DOCTOR */}
      <Stack.Screen name="DoctorHome" component={DoctorHomeScreen} />
      <Stack.Screen name="DoctorAppointments" component={DoctorAppointmentsScreen} />
      <Stack.Screen name="EditDoctorProfile" component={EditDoctorProfileScreen} />
      <Stack.Screen name="DoctorProfile" component={ProfileScreen} />
      <Stack.Screen name="PaymentSummaryScreen"component={PaymentSummaryScreen}/>
<Stack.Screen 
  name="PatientStatistics" 
  component={PatientStatisticsScreen} 

/>
      {/* QUY TRÌNH Y KHOA */}
      <Stack.Screen name="OrderTests" component={OrderTestsScreen} />
      <Stack.Screen name="FinalizeRecord" component={FinalizeRecordScreen} />

      {/* PHÒNG XÉT NGHIỆM – ĐÃ KHAI BÁO ĐẦY ĐỦ */}
     <Stack.Screen name="LabPendingTests" component={LabPendingTestsScreen} />
<Stack.Screen name="LabEnterResults" component={LabEnterResultsScreen} />
<Stack.Screen name="LabHistory" component={LabHistoryScreen} />
<Stack.Screen name="LabDashboard" component={LabDashboard} />
<Stack.Screen name="LabHistoryDetail" component={LabHistoryDetail} />


      {/* KHÁC */}
      <Stack.Screen name="PatientStack" component={PatientStack} />
      <Stack.Screen name="ReceptionTabs" component={ReceptionTabs} />
      <Stack.Screen name="AccountantTabs" component={AccountantTabs} />
      <Stack.Screen name='PendingInvoicesScreen' component={PendingInvoicesScreen}/>
    </Stack.Navigator>
  );
}