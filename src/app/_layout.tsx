import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { getDb } from '@/db/client';
import { refreshModelStatus } from '@/ai/local';
import { DownloadStatusIndicator } from '@/components/DownloadStatusIndicator';
import { MobileDeviceShell } from '@/components/MobileDeviceShell';
import { PopupProvider } from '@/components/Popup';
import { ControlCenterModal } from '@/components/ControlCenterModal';
import { StudentGlanceSummaryModal } from '@/components/StudentGlanceSummaryModal';
import {
  AccessibilityPreferences,
  useReduceMotion,
} from '@/components/AccessibilityPreferences';
import { OrasProvider, useOras } from '@/context/OrasContext';
import { SettingsProvider, useSettings } from '@/settings/SettingsContext';
import { useTheme } from '@/theme';

export default function RootLayout() {
  return (
    <SettingsProvider>
      <OrasProvider>
        <AccessibilityPreferences>
          <PopupProvider>
            <MobileDeviceShell>
              <RootLayoutContent />
            </MobileDeviceShell>
          </PopupProvider>
        </AccessibilityPreferences>
      </OrasProvider>
    </SettingsProvider>
  );
}

function RootLayoutContent() {
  const theme = useTheme();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    Promise.all([getDb(), refreshModelStatus(), Ionicons.loadFont()])
      .catch((e) => console.warn('Init failed:', e))
      .finally(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.tint} />
      </View>
    );
  }

  return <RootNavigator />;
}

function RootNavigator() {
  const theme = useTheme();
  const { settings, ready } = useSettings();
  const {
    controlCenterVisible,
    setControlCenterVisible,
    glanceSummaryVisible,
    setGlanceSummaryVisible,
  } = useOras();
  const reduceMotion = useReduceMotion();

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(theme.background);
  }, [theme.background]);

  if (!ready) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.tint} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={settings.theme === 'dark' ? 'light' : 'dark'} />
      <Stack
        initialRouteName={settings.onboarded ? '(tabs)' : 'onboarding'}
        screenOptions={{
          headerStyle: { backgroundColor: theme.card },
          headerTintColor: theme.navy,
          headerTitleStyle: { fontWeight: '800' },
          contentStyle: { backgroundColor: theme.background },
          animation: reduceMotion ? 'none' : 'slide_from_right',
        }}
      >
        <Stack.Protected guard={!settings.onboarded}>
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        </Stack.Protected>
        <Stack.Protected guard={settings.onboarded}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="calendar"
            options={{ headerShown: false, title: 'Smart Schedule' }}
          />
          <Stack.Screen
            name="requirements"
            options={{ headerShown: false, title: 'Tasks & Requirements' }}
          />
          <Stack.Screen
            name="quiz"
            options={{ headerShown: false, title: 'Mastery Quiz' }}
          />
          <Stack.Screen
            name="settings"
            options={{ headerShown: false, title: 'Settings' }}
          />
          <Stack.Screen
            name="chat-settings"
            options={{ title: 'OrasOras AI Settings' }}
          />
          <Stack.Screen
            name="calculator"
            options={{ headerShown: false, title: 'Calculator' }}
          />
          <Stack.Screen name="privacy" options={{ title: 'Privacy Policy' }} />
          <Stack.Screen
            name="terms"
            options={{ title: 'Terms & Conditions' }}
          />
        </Stack.Protected>
      </Stack>
      <DownloadStatusIndicator />
      <ControlCenterModal
        visible={controlCenterVisible}
        onClose={() => setControlCenterVisible(false)}
      />
      <StudentGlanceSummaryModal
        visible={glanceSummaryVisible}
        onClose={() => setGlanceSummaryVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
