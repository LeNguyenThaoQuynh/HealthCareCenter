import React, { useEffect, useState } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { supabase } from "../api/supabase";

// PUBLIC
import WelcomeScreen from "../screens/WelcomeScreen";
import AuthNavigator from "./AuthNavigator";
import RoleRedirect from "../screens/auth/RoleRedirect";

// ADMIN
import AdminHomeScreen from "../screens/admin/AdminHomeScreen";
import AdminDashboard from "../screens/admin/AdminDashboard";
import ManageDoctorsScreen from "../screens/admin/ManageDoctorsScreen";
import CreateDoctorAccountScreen from "../screens/admin/CreateDoctorAccountScreen";
import CreateDoctorScheduleScreen from "../screens/admin/CreateDoctorScheduleScreen";
import OutstandingDoctor from "../screens/admin/OutstandingDoctor";
import RevenueStatsScreen from "../screens/admin/RevenueStatsScreen";
import ManagePatientsScreen from "../screens/admin/ManagePatientsScreen";
import DoctorDetailScreen from "../screens/admin/DoctorDetailScreen";
import CreateServiceScreen from "../screens/admin/CreateServiceScreen";
import ManageServicesScreen from "../screens/admin/ManageServicesScreen";
import EditDoctorScreen from "../screens/admin/EditDoctorScreen";
import EditServiceScreen from "../screens/admin/EditServiceScreen";

// DOCTOR
import DoctorHomeScreen from "../screens/doctor/DoctorHomeScreen";
import DoctorAppointmentsScreen from "../screens/doctor/DoctorAppointmentsScreen";
import EditDoctorProfileScreen from "../screens/doctor/EditDoctorProfileScreen";
import ProfileScreen from "../screens/doctor/ProfileScreen";
import PatientStatisticsScreen from "../screens/doctor/PatientStatisticsScreen";
import PaymentSummaryScreen from "../screens/doctor/PaymentSummaryScreen";
import OrderTestsScreen from "../screens/doctor/OrderTestsScreen";
import FinalizeRecordScreen from "../screens/doctor/FinalizeRecordScreen";

// LAB TECHNICIAN
import LabPendingTestsScreen from "../screens/Lab_Technician/LabPendingTestsScreen";
import LabEnterResultsScreen from "../screens/Lab_Technician/LabEnterResultsScreen";
import LabHistoryScreen from "../screens/Lab_Technician/LabHistoryScreen";
import LabHistoryDetail from "../screens/Lab_Technician/LabHistoryDetail";
import LabDashboard from "../screens/Lab_Technician/LabDashboard";

// OTHERS
import PatientStack from "./PatientStack";
import ReceptionTabs from "./ReceptionTabs";
import AccountantTabs from "./AccountantTabs";

const Stack = createStackNavigator();

export default function AppNavigator() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Kiểm tra session khi khởi động + lắng nghe thay đổi auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setLoading(false);
      }
    );

    return () => listener?.subscription?.unsubscribe();
  }, []);

  // Đang load → hiện Welcome
  if (loading) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
      </Stack.Navigator>
    );
  }

  // Xác định route khởi đầu theo role
  const getInitialRoute = () => {
    if (!session) return "Welcome";

    const role = session.user?.user_metadata?.role;

    const map = {
      admin: "AdminHome",
      doctor: "DoctorHome",
      patient: "PatientStack",
      receptionist: "ReceptionTabs",
      accountant: "AccountantTabs",
      lab: "LabDashboard",
    };

    return map[role] || "PatientStack";
  };

  return (
    <Stack.Navigator
      initialRouteName={getInitialRoute()}
      screenOptions={{ headerShown: false }}
    >
      {/* PUBLIC */}
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Auth" component={AuthNavigator} />
      <Stack.Screen name="RoleRedirect" component={RoleRedirect} />

      {/* ADMIN */}
      <Stack.Screen name="AdminHome" component={AdminHomeScreen} />
      <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
      <Stack.Screen name="ManageDoctors" component={ManageDoctorsScreen} />
      <Stack.Screen
        name="CreateDoctorAccount"
        component={CreateDoctorAccountScreen}
      />
      <Stack.Screen
        name="CreateDoctorSchedule"
        component={CreateDoctorScheduleScreen}
      />
      <Stack.Screen name="OutstandingDoctor" component={OutstandingDoctor} />
      <Stack.Screen name="RevenueStats" component={RevenueStatsScreen} />
      <Stack.Screen name="ManagePatients" component={ManagePatientsScreen} />
      <Stack.Screen name="DoctorDetail" component={DoctorDetailScreen} />
      <Stack.Screen name="CreateService" component={CreateServiceScreen} />
      <Stack.Screen name="ManageServices" component={ManageServicesScreen} />
      <Stack.Screen name="EditDoctor" component={EditDoctorScreen} />
      <Stack.Screen name="EditService" component={EditServiceScreen} />

      {/* DOCTOR */}
      <Stack.Screen name="DoctorHome" component={DoctorHomeScreen} />
      <Stack.Screen
        name="DoctorAppointments"
        component={DoctorAppointmentsScreen}
      />
      <Stack.Screen
        name="EditDoctorProfile"
        component={EditDoctorProfileScreen}
      />
      <Stack.Screen name="DoctorProfile" component={ProfileScreen} />
      <Stack.Screen
        name="PatientStatistics"
        component={PatientStatisticsScreen}
      />
      <Stack.Screen
        name="PaymentSummaryScreen"
        component={PaymentSummaryScreen}
      />
      <Stack.Screen name="OrderTests" component={OrderTestsScreen} />
      <Stack.Screen name="FinalizeRecord" component={FinalizeRecordScreen} />

      {/* LAB */}
      <Stack.Screen name="LabDashboard" component={LabDashboard} />
      <Stack.Screen name="LabPendingTests" component={LabPendingTestsScreen} />
      <Stack.Screen name="LabEnterResults" component={LabEnterResultsScreen} />
      <Stack.Screen name="LabHistory" component={LabHistoryScreen} />
      <Stack.Screen name="LabHistoryDetail" component={LabHistoryDetail} />

      {/* PATIENT / RECEPTIONIST / ACCOUNTANT */}
      <Stack.Screen name="PatientStack" component={PatientStack} />
      <Stack.Screen name="ReceptionTabs" component={ReceptionTabs} />
      <Stack.Screen name="AccountantTabs" component={AccountantTabs} />
    </Stack.Navigator>
  );
}
