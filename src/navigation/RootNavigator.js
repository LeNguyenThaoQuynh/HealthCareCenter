import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import AuthNavigator from './AuthNavigator';
import RoleRedirect from '../screens/auth/RoleRedirect';
import AdminTabs from './AdminTabs';
import PatientStack from './PatientStack';
import ReceptionTabs from './ReceptionTabs';
import AccountantTabs from './AccountantTabs';
import DoctorHome from '../screens/doctor/DoctorHomeScreen';

const Stack = createStackNavigator();

export default function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Auth" component={AuthNavigator} />
      <Stack.Screen name="RoleRedirect" component={RoleRedirect} />
      <Stack.Screen name="AdminTabs" component={AdminTabs} />
      <Stack.Screen name="DoctorHome" component={DoctorHome} />
      <Stack.Screen name="PatientStack" component={PatientStack} />
      <Stack.Screen name="ReceptionTabs" component={ReceptionTabs} />
      <Stack.Screen name="AccountantTabs" component={AccountantTabs} />
    </Stack.Navigator>
  );
}
