import '../src/i18n';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { View, Platform, StyleSheet } from 'react-native';
import { AuthProvider } from '../src/context/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
    <GestureHandlerRootView style={s.root}>
      <StatusBar style="light" />
      {Platform.OS === 'web' ? (
        <View style={s.webOuter}>
          <View style={s.webPhone}>
            <Stack screenOptions={{ headerShown: false, animation: 'none' }} />
          </View>
        </View>
      ) : (
        <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />
      )}
    </GestureHandlerRootView>
    </AuthProvider>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#04040e' },
  webOuter: {
    flex: 1,
    backgroundColor: '#04040e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  webPhone: {
    width: 390,
    height: 844,
    maxHeight: '100vh' as any,
    overflow: 'hidden',
    borderRadius: 12,
    backgroundColor: '#04040e',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 40,
  },
});
