import { Slot, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions, ActivityIndicator } from 'react-native';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { ThemeProvider, useTheme } from '../src/context/ThemeContext';
import { initDB } from '../src/lib/db';
import { syncIfOnline } from '../src/lib/sync';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

function RouteGuard({ isSyncing }) {
  const { user, isLoadingSession } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const { theme } = useTheme();
  const rootNavigationState = useRootNavigationState();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (rootNavigationState?.key) {
      setIsReady(true);
    }
  }, [rootNavigationState?.key]);

  useEffect(() => {
    if (!isReady || isLoadingSession || isSyncing) return;

    const inAuthGroup = segments[0] === '(auth)' || segments[0] === 'index' || segments.length === 0;

    if (!user && !inAuthGroup) {
      router.replace('/');
    } else if (user && inAuthGroup) {
      router.replace('/home');
    }
  }, [user, segments, router, isReady, isLoadingSession, isSyncing]);

  const showNav = user && segments[0] !== 'index' && segments.length > 0;

  // Show splash while DB init / sync / session restore is in progress
  if (!isReady || isLoadingSession || isSyncing) {
    return (
      <View style={[styles.splashContainer, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.splashLogo, { backgroundColor: theme.colors.primary }]}>
          <Ionicons name="musical-notes" size={36} color="#FFF" />
        </View>
        <Text style={[styles.splashTitle, { color: theme.colors.primary }]}>ECWA Bayeku Choir</Text>
        <ActivityIndicator
          size="small"
          color={theme.colors.primary}
          style={{ marginTop: 32 }}
        />
        <Text style={[styles.splashSub, { color: theme.colors.textLight }]}>
          {isSyncing ? 'Syncing with cloud...' : 'Loading...'}
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top', 'left', 'right']}>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      <View style={{ flex: 1 }}>
        <Slot />
      </View>
      {showNav && <BottomTabNav />}
    </SafeAreaView>
  );
}

function BottomTabNav() {
  const router = useRouter();
  const segments = useSegments();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { width } = useWindowDimensions();

  const tabs = [
    { id: 'home', icon: 'home', route: '/home', label: 'Home' },
    { id: 'songs', icon: 'musical-notes', route: '/songs', label: 'Library' },
    { id: 'attendance', icon: 'people', route: '/attendance', label: 'Presence' },
    { id: 'raffle', icon: 'ticket', route: '/raffle', label: 'Raffle' },
  ];

  const activeTab = segments[0] || 'home';

  return (
    <View style={[
      styles.tabContainer,
      {
        backgroundColor: theme.colors.surface,
        borderTopColor: theme.colors.border,
        paddingBottom: Math.max(insets.bottom, 16),
        width,
      }
    ]}>
      <View style={styles.tabBar}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id || (activeTab === 'home' && tab.id === 'home');
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabItem, { width: width / 4 }]}
              onPress={() => router.push(tab.route)}
            >
              <View style={[styles.iconContainer, isActive && { backgroundColor: theme.colors.primary + '15' }]}>
                <Ionicons
                  name={isActive ? tab.icon : `${tab.icon}-outline`}
                  size={24}
                  color={isActive ? theme.colors.primary : theme.colors.textMuted}
                />
              </View>
              <Text style={[
                styles.tabLabel,
                { color: isActive ? theme.colors.primary : theme.colors.textMuted }
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function RootLayout() {
  const [isSyncing, setIsSyncing] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        initDB();
        await syncIfOnline();
      } catch (_) {
        // Sync errors are non-fatal — user can still log in with local data
      } finally {
        setIsSyncing(false);
      }
    };
    init();
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <RouteGuard isSyncing={isSyncing} />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  splashLogo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 8,
  },
  splashTitle: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  splashSub: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    letterSpacing: 1,
  },
  tabContainer: {
    position: 'absolute',
    bottom: 0,
    borderTopWidth: 1,
    paddingTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 20,
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    padding: 8,
    borderRadius: 16,
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  }
});
