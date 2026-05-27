import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Platform, Dimensions, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { getMembers, saveRaffleResult, getAttendance, getSongsByMember, getRaffleHistory } from '../src/lib/db';
import { useAuth } from '../src/context/AuthContext';
import { useTheme } from '../src/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import ConfettiCannon from 'react-native-confetti-cannon';
import * as Haptics from 'expo-haptics';
import { scheduleRaffleNotification } from '../src/lib/notifications';

const { width } = Dimensions.get('window');

function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

export default function RaffleScreen() {
  const [members, setMembers] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [winners, setWinners] = useState([]); // Array of { member, praiseSongs, worshipSongs, session }
  const [error, setError] = useState(null);
  const [lastDraw, setLastDraw] = useState(null);
  const router = useRouter();
  const { user } = useAuth();
  const { theme } = useTheme();

  useEffect(() => {
    setMembers(getMembers());
    const history = getRaffleHistory();
    if (history.length > 0) {
      setLastDraw(history[0]);
    }
  }, []);

  const handleDraw = () => {
    if (!user?.is_admin) {
      Alert.alert('Access Denied', 'Only administrators can initiate the Sunday Raffle.');
      return;
    }

    setIsDrawing(true);
    setWinners([]);
    setError(null);
    
    if (Platform.OS !== 'web') {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {
        console.log('Haptics failed', e);
      }
    }

    setTimeout(() => {
      const today = getTodayDate();
      const attendance = getAttendance(today);
      const presentMemberIds = attendance.filter(a => a.is_present === 1).map(a => a.member_id);

      const eligibleMembers = members.filter(m => {
        const isPresent = presentMemberIds.includes(m.id);
        const songs = getSongsByMember(m.id);
        const praises = songs.filter(s => s.type === 'praise');
        const worships = songs.filter(s => s.type === 'worship');
        return isPresent && praises.length >= 5 && worships.length >= 5;
      });

      if (eligibleMembers.length < 2) {
        setError('Try Again: Need at least 2 eligible members (Present with 5 Praise & 5 Worship songs)');
        setIsDrawing(false);
        return;
      }

      // Pick 2 unique winners
      const copy = [...eligibleMembers].sort(() => 0.5 - Math.random());
      const selected = copy.slice(0, 2);
      
      const newWinners = selected.map((m, index) => {
        const allSongs = getSongsByMember(m.id);
        const p = allSongs.filter(s => s.type === 'praise').sort(() => 0.5 - Math.random()).slice(0, 5);
        const w = allSongs.filter(s => s.type === 'worship').sort(() => 0.5 - Math.random()).slice(0, 5);
        
        const genUUID = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
          const r = Math.random() * 16 | 0;
          return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });

        saveRaffleResult({
          id: genUUID(),
          member_id: m.id,
          winner_name: m.name,
          praise_song_id: null,
          worship_song_id: null,
          session_number: index + 1,
          draw_date: getTodayDate()
        });

        return { member: m, praiseSongs: p, worshipSongs: w, session: index + 1 };
      });

      setWinners(newWinners);
      setIsDrawing(false);
      
      // Trigger notification for the first winner (as a representative)
      if (newWinners.length > 0) {
        scheduleRaffleNotification(newWinners[0].member.name);
      }
    }, 2000);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: theme.colors.surface }]}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.primary }]}>ECWA Bayeku Choir</Text>
        <TouchableOpacity style={styles.settingsIcon} onPress={() => router.push('/settings')}>
          <Ionicons name="settings-outline" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.titleSection}>
          <View style={[styles.diceCircle, { backgroundColor: theme.colors.accent }]}>
            <Ionicons name="dice" size={32} color={theme.colors.primaryDark} />
          </View>
          <Text style={[styles.title, { color: theme.colors.primary }]}>Sunday Raffle</Text>
        </View>

        <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
          The weekly celebration of attendance and musical excellence.
        </Text>

        {/* Requirements Card */}
        <View style={[styles.infoCard, { backgroundColor: theme.colors.surfaceSubtle }]}>
          <View style={styles.infoIconCircle}>
            <Ionicons name="shield-checkmark" size={24} color={theme.colors.primary} />
          </View>
          <View style={styles.infoTextContainer}>
            <Text style={[styles.infoTitle, { color: theme.colors.primary }]}>Eligibility Requirements</Text>
            <Text style={[styles.infoSub, { color: theme.colors.textMuted }]}>
              • Must be present in today&apos;s attendance log.{"\n"}
              • Must have at least <Text style={{fontWeight: '900'}}>5 Praise</Text> and <Text style={{fontWeight: '900'}}>5 Worship</Text> songs.
            </Text>
          </View>
        </View>

        {/* Draw Action restricted to Admins */}
        {user?.is_admin ? (
          <View style={styles.drawContainer}>
            <TouchableOpacity 
              style={[styles.drawOutterCircle, { backgroundColor: theme.colors.primary + '15' }]}
              onPress={handleDraw}
              disabled={isDrawing}
            >
              <View style={[styles.drawInnerCircle, { backgroundColor: theme.colors.primary }]}>
                <Ionicons name="sparkles" size={40} color="#FFF" />
                <Text style={styles.drawText}>{isDrawing ? 'Drawing...' : 'Pick 2 Winners'}</Text>
              </View>
            </TouchableOpacity>
            {error && <Text style={styles.errorText}>{error}</Text>}
          </View>
        ) : (
          <View style={[styles.memberStatusCard, { backgroundColor: theme.colors.primary + '10' }]}>
             <Ionicons name="lock-closed" size={32} color={theme.colors.primary} />
             <Text style={[styles.memberStatusTitle, { color: theme.colors.primary }]}>Awaiting Administrator</Text>
             <Text style={[styles.memberStatusSub, { color: theme.colors.textMuted }]}>Only Chief Editors can initiate the raffle draw.</Text>
          </View>
        )}

        {/* Winners List */}
        {!isDrawing && winners.length > 0 && winners.map((win) => (
          <View key={win.member.id} style={[styles.winnerCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.winnerHeader}>
              <View style={[styles.trophyCircle, { backgroundColor: theme.colors.primary }]}>
                <Text style={{color: theme.colors.accent, fontWeight: '900', fontSize: 24}}>{win.session}</Text>
              </View>
              <View style={styles.winnerInfo}>
                <Text style={[styles.winnerLabel, { color: theme.colors.primary }]}>
                  {win.session === 1 ? 'FIRST PRAISE & WORSHIP' : 'SECOND PRAISE & WORSHIP'}
                </Text>
                <Text style={[styles.winnerName, { color: theme.colors.text }]}>
                  {win.member.name}
                </Text>
              </View>
            </View>
            
            <View style={styles.repertoireContainer}>
              <View style={styles.repertoireColumn}>
                 <Text style={[styles.categoryTitle, { color: theme.colors.textMuted }]}>PRAISE SELECTION</Text>
                 {win.praiseSongs.map((song, idx) => (
                    <View key={song.id} style={styles.songRow}>
                       <Text style={[styles.songNumberText, { color: theme.colors.primary }]}>{idx + 1}.</Text>
                       <Text style={[styles.winnerSongTitle, { color: theme.colors.text }]} numberOfLines={1}>{song.title}</Text>
                    </View>
                 ))}
              </View>
              
              <View style={styles.repertoireColumn}>
                 <Text style={[styles.categoryTitle, { color: theme.colors.textMuted }]}>WORSHIP SELECTION</Text>
                 {win.worshipSongs.map((song, idx) => (
                    <View key={song.id} style={styles.songRow}>
                       <Text style={[styles.songNumberText, { color: theme.colors.primary }]}>{idx + 1}.</Text>
                       <Text style={[styles.winnerSongTitle, { color: theme.colors.text }]} numberOfLines={1}>{song.title}</Text>
                    </View>
                 ))}
              </View>
            </View>
          </View>
        ))}

        {/* Latest Winner from History (if no current draw) */}
        {!isDrawing && winners.length === 0 && lastDraw && (
          <View style={[styles.winnerCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.winnerHeader}>
              <View style={[styles.trophyCircle, { backgroundColor: theme.colors.primary }]}>
                <Ionicons name="trophy" size={32} color={theme.colors.accent} />
              </View>
              <View style={styles.winnerInfo}>
                <Text style={[styles.winnerLabel, { color: theme.colors.primary }]}>LATEST WINNER</Text>
                <Text style={[styles.winnerName, { color: theme.colors.text }]}>
                  {lastDraw.winner_name || members.find(m => m.id === lastDraw.member_id)?.name || 'Unknown'}
                </Text>
              </View>
            </View>
            <Text style={[styles.noItems, { color: theme.colors.textLight, textAlign: 'center', marginBottom: 20 }]}>
              Check raffle history in settings for full repertoire.
            </Text>
          </View>
        )}

        {winners.length > 0 && !isDrawing && (
          <TouchableOpacity 
            style={[styles.closeBtn, { backgroundColor: theme.colors.primary, marginTop: 24 }]}
            onPress={() => setWinners([])}
          >
            <Text style={styles.closeBtnText}>DONE</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {winners.length > 0 && (
        <ConfettiCannon count={200} origin={{ x: width / 2, y: 0 }} />
      )}
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
  content: {
    padding: 24,
    paddingBottom: 140,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  diceCircle: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 32,
  },
  infoCard: {
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    marginBottom: 24,
  },
  infoIconCircle: {
    marginRight: 16,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  infoSub: {
    fontSize: 14,
    lineHeight: 20,
  },
  drawContainer: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
  drawOutterCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawInnerCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  drawText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 8,
  },
  memberStatusCard: {
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    marginBottom: 40,
    gap: 12,
  },
  memberStatusTitle: {
    fontSize: 20,
    fontWeight: '900',
  },
  memberStatusSub: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorText: {
    marginTop: 16,
    color: '#EF4444',
    fontWeight: '700',
    textAlign: 'center',
  },
  winnerCard: {
    borderRadius: 32,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    marginTop: 20,
  },
  winnerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  trophyCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  winnerInfo: {
    flex: 1,
  },
  winnerLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  winnerName: {
    fontSize: 24,
    fontWeight: '900',
  },
  repertoireContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  repertoireColumn: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 9,
    fontWeight: '900',
    marginBottom: 12,
    letterSpacing: 1,
  },
  songRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  songNumberText: {
    fontSize: 10,
    fontWeight: '800',
    marginRight: 4,
    width: 16,
  },
  winnerSongTitle: {
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  noItems: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  closeBtn: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#FFF',
    fontWeight: '900',
    letterSpacing: 1,
  }
});