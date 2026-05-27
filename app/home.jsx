import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import {
    Alert,
    Animated,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { useAuth } from "../src/context/AuthContext";
import { useTheme } from "../src/context/ThemeContext";
import { getRaffleHistory } from "../src/lib/db";
import { registerForPushNotificationsAsync } from "../src/lib/notifications";
import { syncIfOnline } from "../src/lib/sync";

let Notifications = null;
try {
  Notifications = require("expo-notifications");
} catch (e) {
  // unavailable in Expo Go SDK 53+
}

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const menuAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    setupNotifications();
    checkForNewRaffle();
  }, []);

  const setupNotifications = async () => {
    await registerForPushNotificationsAsync();
  };

  const checkForNewRaffle = async () => {
    const history = getRaffleHistory();
    if (history.length > 0) {
      const latest = history[0];
      const lastSeenRaffleId = await SecureStore.getItemAsync(
        "last_seen_raffle_id",
      );

      if (lastSeenRaffleId !== latest.id) {
        // Only notify if it's not our own draw if we want, but for now just notify
        Notifications.scheduleNotificationAsync({
          content: {
            title: "Raffle Finalized! 🎉",
            body: `${latest.winner_name || "Someone"} won this week's Sunday Raffle!`,
            data: { type: "raffle" },
          },
          trigger: null,
        });
        await SecureStore.setItemAsync("last_seen_raffle_id", latest.id);
      }
    }
  };

  const toggleMenu = (val) => {
    if (val) {
      setShowMenu(true);
      Animated.spring(menuAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();
    } else {
      Animated.timing(menuAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => setShowMenu(false));
    }
  };

  const handleSync = async () => {
    toggleMenu(false);
    try {
      await syncIfOnline();
      Alert.alert(
        "Sync Successful",
        "Your repertoire and profile are now up to date.",
      );
      checkForNewRaffle();
    } catch (e) {
      console.error("Sync error:", e);
      Alert.alert(
        "Sync Failed",
        e?.message || "Please check your internet connection.",
      );
    }
  };

  const handleLogout = () => {
    toggleMenu(false);
    logout();
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={[
              styles.avatarMini,
              { backgroundColor: theme.colors.primary },
            ]}
            onPress={() => toggleMenu(true)}
          >
            <Text style={styles.avatarTextMini}>
              {user?.name?.charAt(0).toUpperCase()}
            </Text>
          </TouchableOpacity>
          <Text style={[styles.logoTitle, { color: theme.colors.primary }]}>
            ECWA Bayeku Choir
          </Text>
          <TouchableOpacity
            style={styles.settingsIcon}
            onPress={() => router.push("/settings")}
          >
            <Ionicons
              name="settings-sharp"
              size={24}
              color={theme.colors.primary}
            />
          </TouchableOpacity>
        </View>

        <Text style={[styles.welcomeText, { color: theme.colors.text }]}>
          Welcome back, {user?.name} ✨
        </Text>

        {/* Role Badge */}
        <View
          style={[styles.roleBadge, { backgroundColor: theme.colors.accent }]}
        >
          <Text style={[styles.roleText, { color: theme.colors.primaryDark }]}>
            {user?.is_admin ? "CHIEF EDITOR" : "CHORAL MEMBER"}
          </Text>
        </View>

        {/* Vocal Section Card */}
        <View
          style={[
            styles.sectionCard,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <Text style={[styles.sectionValue, { color: theme.colors.primary }]}>
            {user?.vocal_section || "Soprano"}
          </Text>
          <Text
            style={[styles.sectionLabel, { color: theme.colors.textMuted }]}
          >
            Vocal Section
          </Text>
          <View style={styles.indicatorContainer}>
            <View
              style={[
                styles.indicatorLine,
                { backgroundColor: theme.colors.primary },
              ]}
            />
            <View
              style={[
                styles.indicatorDot,
                { backgroundColor: theme.colors.accent },
              ]}
            />
          </View>
        </View>

        {/* Main Stats */}
        <View style={styles.statsGrid}>
          <TouchableOpacity
            style={[styles.statItem, { backgroundColor: theme.colors.surface }]}
            onPress={() => router.push("/songs")}
          >
            <View
              style={[
                styles.iconBadge,
                { backgroundColor: theme.colors.primary + "15" },
              ]}
            >
              <Ionicons
                name="musical-notes"
                size={24}
                color={theme.colors.primary}
              />
            </View>
            <Text style={[styles.statTitle, { color: theme.colors.text }]}>
              My Songs
            </Text>
            <Text style={[styles.statSub, { color: theme.colors.textMuted }]}>
              Repertoire
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statItem, { backgroundColor: theme.colors.surface }]}
            onPress={() => router.push("/attendance")}
          >
            <View
              style={[
                styles.iconBadge,
                { backgroundColor: theme.colors.primary + "15" },
              ]}
            >
              <Ionicons
                name="calendar"
                size={24}
                color={theme.colors.primary}
              />
            </View>
            <Text style={[styles.statTitle, { color: theme.colors.text }]}>
              Presence
            </Text>
            <Text style={[styles.statSub, { color: theme.colors.textMuted }]}>
              History
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quick Action */}
        <View
          style={[styles.actionCard, { backgroundColor: theme.colors.primary }]}
        >
          <View style={styles.actionInfo}>
            <Text style={styles.actionTitle}>Sunday Raffle Draw</Text>
            <Text style={styles.actionSub}>
              {user?.is_admin
                ? "Trigger the weekly vocal draw."
                : "View who won this week&apos;s draw."}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: theme.colors.accent }]}
            onPress={() => router.push("/raffle")}
          >
            <Ionicons
              name={user?.is_admin ? "play" : "eye"}
              size={20}
              color={theme.colors.primaryDark}
            />
          </TouchableOpacity>
        </View>

        {/* Sync Footer */}
        <TouchableOpacity style={styles.syncBtn} onPress={() => syncIfOnline()}>
          <Ionicons name="refresh" size={16} color={theme.colors.textLight} />
          <Text style={[styles.syncText, { color: theme.colors.textLight }]}>
            Developed by olaolubalogs • 2024
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Profile Menu Dropdown Overlay */}
      {showMenu && (
        <Pressable style={styles.menuOverlay} onPress={() => toggleMenu(false)}>
          <Animated.View
            style={[
              styles.menuContent,
              {
                backgroundColor: theme.colors.surface,
                opacity: menuAnim,
                transform: [
                  {
                    translateY: menuAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-20, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.menuHeader}>
              <Text style={[styles.menuUser, { color: theme.colors.text }]}>
                {user?.name}
              </Text>
              <Text
                style={[styles.menuRole, { color: theme.colors.textMuted }]}
              >
                {user?.is_admin ? "Admin" : "Member"}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                toggleMenu(false);
                router.push("/settings");
              }}
            >
              <Ionicons
                name="person-outline"
                size={18}
                color={theme.colors.primary}
              />
              <Text style={[styles.menuItemText, { color: theme.colors.text }]}>
                Edit Profile
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={handleSync}>
              <Ionicons
                name="sync-outline"
                size={18}
                color={theme.colors.primary}
              />
              <Text style={[styles.menuItemText, { color: theme.colors.text }]}>
                Sync Now
              </Text>
            </TouchableOpacity>

            <View
              style={[
                styles.menuDivider,
                { backgroundColor: theme.colors.border },
              ]}
            />

            <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
              <Ionicons
                name="log-out-outline"
                size={18}
                color={theme.colors.error}
              />
              <Text
                style={[styles.menuItemText, { color: theme.colors.error }]}
              >
                Sign Out
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingBottom: 120,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 32,
  },
  avatarMini: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarTextMini: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "900",
  },
  logoTitle: {
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: "900",
    marginBottom: 12,
  },
  roleBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 32,
  },
  roleText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  sectionCard: {
    borderRadius: 24,
    padding: 32,
    marginBottom: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
  },
  sectionValue: {
    fontSize: 48,
    fontWeight: "900",
    letterSpacing: -1,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 4,
  },
  indicatorContainer: {
    width: "100%",
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  indicatorLine: {
    width: 2,
    height: 40,
  },
  indicatorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    position: "absolute",
  },
  statsGrid: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 24,
  },
  statItem: {
    flex: 1,
    padding: 20,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  statTitle: {
    fontSize: 18,
    fontWeight: "900",
  },
  statSub: {
    fontSize: 12,
    marginTop: 2,
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 24,
    borderRadius: 24,
    justifyContent: "space-between",
    marginBottom: 32,
  },
  actionInfo: {
    flex: 1,
  },
  actionTitle: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 4,
  },
  actionSub: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    lineHeight: 18,
  },
  actionBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 16,
  },
  syncBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  syncText: {
    fontSize: 12,
  },
  menuOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
  },
  menuContent: {
    position: "absolute",
    top: 60,
    left: 24,
    width: 200,
    borderRadius: 20,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  menuHeader: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
    marginBottom: 4,
  },
  menuUser: {
    fontSize: 14,
    fontWeight: "800",
  },
  menuRole: {
    fontSize: 10,
    fontWeight: "600",
    marginTop: 2,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 12,
    borderRadius: 12,
  },
  menuItemText: {
    fontSize: 13,
    fontWeight: "700",
  },
  menuDivider: {
    height: 1,
    marginVertical: 4,
    opacity: 0.5,
  },
});
