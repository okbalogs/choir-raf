import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, Alert } from 'react-native';
import { getMembers, setAttendance, getAttendance } from '../src/lib/db';
import { useAuth } from '../src/context/AuthContext';
import { useTheme } from '../src/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

export default function AttendanceScreen() {
  const [members, setMembers] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const { user } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const today = getTodayDate();

  useEffect(() => {
    // Admins are not meant to be in the attendance list (only tracking members)
    const allMembers = getMembers().filter(m => !m.is_admin);
    setMembers(allMembers);

    const todayLog = getAttendance(today);
    const map = {};
    todayLog.forEach(log => {
      map[log.member_id] = log.is_present === 1;
    });
    setAttendanceMap(map);
  }, [today]);

  const toggleAttendance = (memberId) => {
    if (!user?.is_admin) {
      Alert.alert('Access Denied', 'Only administrators can mark attendance.');
      return;
    }

    const newVal = !attendanceMap[memberId];
    setAttendanceMap(prev => ({ ...prev, [memberId]: newVal }));
    
    setAttendance(
      `${today}_${memberId}`,
      memberId,
      today,
      newVal
    );
  };

  const presentCount = members.filter(m => attendanceMap[m.id]).length;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: theme.colors.surface }]}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: theme.colors.primary }]}>Attendance</Text>
          <View style={[styles.roleBadgeHeader, { backgroundColor: user?.is_admin ? theme.colors.primary + '15' : theme.colors.accent + '30' }]}>
            <Text style={[styles.roleTextHeader, { color: user?.is_admin ? theme.colors.primary : theme.colors.primaryDark }]}>
              {user?.is_admin ? 'MANAGEMENT' : 'VIEW ONLY'}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.settingsIcon} onPress={() => router.push('/settings')}>
          <Ionicons name="settings-outline" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={members}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={(
          <View style={styles.listHeader}>
             <View style={[styles.iconCircle, { backgroundColor: theme.colors.primary }]}>
                <Ionicons name="people" size={32} color="#FFF" />
             </View>
             <View style={styles.headerTextContainer}>
                <Text style={[styles.title, { color: theme.colors.text }]}>Sunday Service</Text>
                <Text style={[styles.date, { color: theme.colors.textMuted }]}>{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
             </View>
             <View style={[styles.countPill, { backgroundColor: theme.colors.accent }]}>
                <Text style={[styles.countText, { color: theme.colors.primaryDark }]}>{presentCount} OF {members.length} PRESENT</Text>
             </View>
          </View>
        )}
        renderItem={({ item }) => {
          const isPresent = attendanceMap[item.id];
          const section = item.vocal_section || 'Soprano';
          
          return (
            <View style={[styles.memberCard, { backgroundColor: theme.colors.surface }]}>
              <View style={[styles.avatar, { backgroundColor: theme.colors.background }]}>
                <Text style={[styles.avatarText, { color: theme.colors.primary }]}>{item.name.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.memberInfo}>
                <Text style={[styles.memberName, { color: theme.colors.text }]}>{item.name}</Text>
                <View style={styles.sectionRow}>
                   <View style={[styles.dot, { backgroundColor: theme.colors.success }]} />
                   <Text style={[styles.sectionText, { color: theme.colors.textLight }]}>{section.toUpperCase()}</Text>
                </View>
              </View>
              <TouchableOpacity 
                activeOpacity={user?.is_admin ? 0.7 : 1}
                onPress={() => toggleAttendance(item.id)}
                style={[
                  styles.statusBtn, 
                  isPresent && { backgroundColor: theme.colors.primary },
                  !user?.is_admin && { opacity: 0.8 }
                ]}
              >
                <Ionicons 
                  name={isPresent ? "checkmark-circle" : (user?.is_admin ? "ellipse-outline" : "close-circle-outline")} 
                  size={24} 
                  color={isPresent ? "#FFF" : theme.colors.textLight} 
                />
              </TouchableOpacity>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
  },
  headerCenter: {
    alignItems: 'center',
  },
  roleBadgeHeader: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  roleTextHeader: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  settingsIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: 24,
    paddingBottom: 140,
  },
  listHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    transform: [{ rotate: '-10deg' }],
  },
  headerTextContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
  },
  date: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  countPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  countText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 24,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '900',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '700',
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  sectionText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  }
});