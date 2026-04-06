import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Home, QrCode, ClipboardList, RefreshCw, User } from 'lucide-react-native';

import { OfflineQueueProvider } from './src/context/OfflineQueueContext';

import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import ScannerScreen from './src/screens/ScannerScreen';
import WeaponConfirmScreen from './src/screens/WeaponConfirmScreen';
import ActiveTrackingScreen from './src/screens/ActiveTrackingScreen';
import RequestScreen from './src/screens/RequestScreen';
import ApprovalScreen from './src/screens/ApprovalScreen';
import SyncStatusScreen from './src/screens/SyncStatusScreen';
import ProfileScreen from './src/screens/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function ScannerStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ScannerMain" component={ScannerScreen} />
      <Stack.Screen name="WeaponConfirm" component={WeaponConfirmScreen} />
    </Stack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f3f4f6' },
        tabBarIcon: ({ color, size }) => {
          if (route.name === 'Home') return <Home color={color} size={size} />;
          if (route.name === 'Scan') return <QrCode color={color} size={size} />;
          if (route.name === 'ActiveTracking') return <ClipboardList color={color} size={size} />;
          if (route.name === 'Sync') return <RefreshCw color={color} size={size} />;
          if (route.name === 'Profile') return <User color={color} size={size} />;
        },
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#9ca3af',
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Scan" component={ScannerStack} options={{ tabBarLabel: 'Scan' }} />
      <Tab.Screen name="ActiveTracking" component={ActiveTrackingScreen} options={{ tabBarLabel: 'My Equip' }} />
      <Tab.Screen name="Sync" component={SyncStatusScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <OfflineQueueProvider>
        <NavigationContainer>
          <Stack.Navigator 
            initialRouteName="Login"
            screenOptions={{
              headerShown: false,
              animation: 'slide_from_right'
            }}
          >
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen name="Request" component={RequestScreen} />
            <Stack.Screen name="Approval" component={ApprovalScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </OfflineQueueProvider>
    </SafeAreaProvider>
  );
}
