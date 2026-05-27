import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert, StatusBar, TextInput, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { useTheme } from '../src/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { insertMember, updateMemberPin } from '../src/lib/db';
import { syncIfOnline } from '../src/lib/sync';

export default function SettingsScreen() {
  const { user, logout, login } = useAuth();
  const { theme, themeMode, updateTheme } = useTheme();
  const router = useRouter();
  
  const [notifications, setNotifications] = useState(true);
  const [biometrics, setBiometrics] = useState(false);
  const [editingSection, setEditingSection] = useState(false);
  const [newSection, setNewSection] = useState(user?.vocal_section || 'Soprano');
  
  // PIN Change States
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPinModalVisible, setIsPinModalVisible] = useState(false);
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const n = await SecureStore.getItemAsync('notifications');
      const b = await SecureStore.getItemAsync('biometrics_enabled');
      if (n !== null) setNotifications(n === 'true');
      if (b !== null) setBiometrics(b === 'true');
    } catch (e) {
      console.log('Load settings error', e);
    }
  };

  const toggleNotifications = async (val) => {
    setNotifications(val);
    await SecureStore.setItemAsync('notifications', val.toString());
  };

  const toggleBiometrics = async (val) => {
    try {
      if (val) {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        if (!hasHardware || !isEnrolled) {
          Alert.alert('Error', 'Biometrics not supported or not set up on this device.');
          return;
        }
        const auth = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Enable Biometric Login',
        });
        if (auth.success) {
          await SecureStore.setItemAsync('user_name', user.name);
          await SecureStore.setItemAsync('user_pin', user.pin);
          await SecureStore.setItemAsync('biometrics_enabled', 'true');
          setBiometrics(true);
          Alert.alert('Success', 'Biometric login enabled!');
        }
      } else {
        await SecureStore.deleteItemAsync('user_name');
        await SecureStore.deleteItemAsync('user_pin');
        await SecureStore.setItemAsync('biometrics_enabled', 'false');
        setBiometrics(false);
      }
    } catch (_error) {
      Alert.alert('Error', 'Could not set up biometrics.');
    }
  };

  const handleUpdateSection = async () => {
    try {
      const updatedUser = { ...user, vocal_section: newSection, synced: 0 };
      insertMember(updatedUser);
      login(updatedUser);
      setEditingSection(false);
      
      // Sync to Supabase
      await syncIfOnline();
      Alert.alert('Success', 'Vocal section updated and synced!');
    } catch (e) {
      Alert.alert('Sync Warning', 'Section updated locally, but cloud sync failed. We will retry next time you are online.');
    }
  };

  const handlePinChange = async () => {
    if (currentPinInput !== user.pin) {
      Alert.alert('Error', 'Current PIN is incorrect.');
      return;
    }
    if (newPinInput.length !== 4) {
      Alert.alert('Error', 'New PIN must be 4 digits.');
      return;
    }
    if (newPinInput !== confirmPinInput) {
      Alert.alert('Error', 'New PIN and confirmation do not match.');
      return;
    }

    try {
      updateMemberPin(user.id, newPinInput);
      const updatedUser = { ...user, pin: newPinInput, synced: 0 };
      login(updatedUser);
      
      // Update Biometric Storage if enabled
      if (biometrics) {
        await SecureStore.setItemAsync('user_pin', newPinInput);
      }

      // Sync to Supabase
      await syncIfOnline();

      setIsPinModalVisible(false);
      setCurrentPinInput('');
      setNewPinInput('');
      setConfirmPinInput('');
      Alert.alert('Success', 'PIN updated and secure in cloud!');
    } catch (e) {
      Alert.alert('Error', 'Update failed: ' + (e.message || 'Check your internet connection.'));
    }
  };

  const ThemeOption = ({ mode, label, icon }) => (
    <TouchableOpacity 
      style={[
        styles.themeOption, 
        themeMode === mode && { backgroundColor: theme.colors.primary + '15', borderColor: theme.colors.primary }
      ]}
      onPress={() => updateTheme(mode)}
    >
      <Ionicons name={icon} size={20} color={themeMode === mode ? theme.colors.primary : theme.colors.textMuted} />
      <Text style={[styles.themeLabel, { color: themeMode === mode ? theme.colors.primary : theme.colors.textMuted }]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: theme.colors.surface }]}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.primary }]}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.profileCard, { backgroundColor: theme.colors.surface }]}>
          <View style={[styles.avatarMain, { backgroundColor: theme.colors.primary, borderColor: theme.colors.surfaceSubtle }]}>
             <Text style={styles.avatarTextMain}>{user?.name?.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={[styles.profileName, { color: theme.colors.text }]}>{user?.name}</Text>
          <View style={[styles.roleBadge, { backgroundColor: theme.colors.accent }]}>
             <Text style={[styles.roleText, { color: theme.colors.primaryDark }]}>{user?.is_admin ? 'CHIEF EDITOR' : 'CHORAL MEMBER'}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textLight }]}>APPEARANCE</Text>
          <View style={[styles.themeSelector, { backgroundColor: theme.colors.surface }]}>
             <ThemeOption mode="light" label="Light" icon="sunny" />
             <ThemeOption mode="dark" label="Dark" icon="moon" />
             <ThemeOption mode="system" label="System" icon="options" />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textLight }]}>SECURITY & ACCESS</Text>
          <View style={[styles.menuContainer, { backgroundColor: theme.colors.surface }]}>
             <TouchableOpacity style={[styles.menuItem, { borderBottomColor: theme.colors.background }]} onPress={() => setIsPinModalVisible(true)}>
                <View style={[styles.menuIconCircle, { backgroundColor: theme.colors.primary + '15' }]}><Ionicons name="key-outline" size={20} color={theme.colors.primary} /></View>
                <View style={styles.menuTextContainer}>
                   <Text style={[styles.menuTitle, { color: theme.colors.text }]}>Change Security PIN</Text>
                   <Text style={[styles.menuDetail, { color: theme.colors.textMuted }]}>Update your 4-digit individual code</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={theme.colors.textLight} />
             </TouchableOpacity>
             <View style={[styles.menuItem, { borderBottomWidth: 0 }]}>
                <View style={[styles.menuIconCircle, { backgroundColor: theme.colors.primary + '15' }]}><Ionicons name="finger-print-outline" size={20} color={theme.colors.primary} /></View>
                <Text style={[styles.menuTitle, { color: theme.colors.text, flex: 1 }]}>FaceID / Biometrics</Text>
                <Switch 
                  value={biometrics} 
                  onValueChange={toggleBiometrics}
                  trackColor={{ false: '#D1D5DB', true: theme.colors.primaryLight }}
                  thumbColor={biometrics ? theme.colors.primary : '#F3F4F6'}
                />
             </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textLight }]}>VOCAL REPERTOIRE</Text>
          <View style={[styles.menuContainer, { backgroundColor: theme.colors.surface }]}>
            <View style={[styles.menuItem, { borderBottomColor: theme.colors.background }]}>
               <View style={[styles.menuIconCircle, { backgroundColor: theme.colors.primary + '15' }]}><Ionicons name="mic-outline" size={20} color={theme.colors.primary} /></View>
               <View style={styles.menuTextContainer}>
                  <Text style={[styles.menuTitle, { color: theme.colors.text }]}>Vocal Section</Text>
                  {editingSection ? (
                    <TextInput 
                      style={[styles.sectionInput, { color: theme.colors.primary, borderBottomColor: theme.colors.primary }]}
                      value={newSection}
                      onChangeText={setNewSection}
                      autoFocus
                      onBlur={handleUpdateSection}
                      onSubmitEditing={handleUpdateSection}
                    />
                  ) : (
                    <Text style={[styles.menuDetail, { color: theme.colors.textMuted }]}>{user?.vocal_section || 'Soprano'}</Text>
                  )}
               </View>
               <TouchableOpacity onPress={() => setEditingSection(!editingSection)}>
                  <Ionicons name={editingSection ? "checkmark-circle" : "create-outline"} size={20} color={theme.colors.primary} />
               </TouchableOpacity>
            </View>
            <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]} onPress={() => router.push('/songs')}>
                <View style={[styles.menuIconCircle, { backgroundColor: theme.colors.primary + '15' }]}><Ionicons name="musical-notes-outline" size={20} color={theme.colors.primary} /></View>
                <Text style={[styles.menuTitle, { color: theme.colors.text, flex: 1 }]}>Manage My Songs</Text>
                <Ionicons name="chevron-forward" size={16} color={theme.colors.textLight} />
             </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textLight }]}>APPLICATION</Text>
          <View style={[styles.menuContainer, { backgroundColor: theme.colors.surface }]}>
             <View style={[styles.menuItem, { borderBottomColor: theme.colors.background }]}>
                <View style={[styles.menuIconCircle, { backgroundColor: theme.colors.primary + '15' }]}><Ionicons name="notifications-outline" size={20} color={theme.colors.primary} /></View>
                <Text style={[styles.menuTitle, { color: theme.colors.text, flex: 1 }]}>Push Notifications</Text>
                <Switch 
                  value={notifications} 
                  onValueChange={toggleNotifications}
                  trackColor={{ false: '#D1D5DB', true: theme.colors.primaryLight }}
                  thumbColor={notifications ? theme.colors.primary : '#F3F4F6'}
                />
             </View>
             <TouchableOpacity
               style={[styles.menuItem, { borderBottomWidth: 0 }]}
               onPress={async () => {
                 if (isSyncing) return;
                 setIsSyncing(true);
                 try {
                   await syncIfOnline();
                   Alert.alert('Sync Complete', 'Everything is up to date.');
                 } catch (e) {
                   Alert.alert('Sync Failed', 'Check your internet connection and try again.');
                 } finally {
                   setIsSyncing(false);
                 }
               }}
             >
                <View style={[styles.menuIconCircle, { backgroundColor: theme.colors.primary + '15' }]}>
                  <Ionicons name={isSyncing ? 'sync' : 'cloud-upload-outline'} size={20} color={theme.colors.primary} />
                </View>
                <Text style={[styles.menuTitle, { color: theme.colors.text, flex: 1 }]}>
                  {isSyncing ? 'Syncing...' : 'Sync with Cloud'}
                </Text>
                {!isSyncing && <Ionicons name="chevron-forward" size={16} color={theme.colors.textLight} />}
             </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textLight }]}>SUPPORT & CREDITS</Text>
          <View style={[styles.menuContainer, { backgroundColor: theme.colors.surface }]}>
             <TouchableOpacity style={[styles.menuItem, { borderBottomColor: theme.colors.background }]} onPress={() => Alert.alert('About', 'Branded for ECWA Bayeku Choir.\n\nDeveloped & Maintained by olaolubalogs.')}>
                <View style={[styles.menuIconCircle, { backgroundColor: theme.colors.primary + '15' }]}><Ionicons name="information-circle-outline" size={20} color={theme.colors.primary} /></View>
                <View style={styles.menuTextContainer}>
                  <Text style={[styles.menuTitle, { color: theme.colors.text }]}>About the App</Text>
                  <Text style={[styles.menuDetail, { color: theme.colors.textMuted }]}>Custom Build for ECWA Bayeku</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={theme.colors.textLight} />
             </TouchableOpacity>
             <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]} onPress={() => Alert.alert('Credits', 'Developer: olaolubalogs\nFramework: The Harmonic Editorial\nVersion: 2.4.1')}>
                <View style={[styles.menuIconCircle, { backgroundColor: theme.colors.primary + '15' }]}><Ionicons name="code-slash" size={20} color={theme.colors.primary} /></View>
                <Text style={[styles.menuTitle, { color: theme.colors.text, flex: 1 }]}>Developer Credits</Text>
                <Ionicons name="chevron-forward" size={16} color={theme.colors.textLight} />
             </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={[styles.logoutBtn, { backgroundColor: theme.dark ? '#450a0a' : '#FFF1F2' }]} onPress={logout}>
           <Ionicons name="log-out-outline" size={20} color={theme.colors.error} />
           <Text style={[styles.logoutText, { color: theme.colors.error }]}>SIGN OUT</Text>
        </TouchableOpacity>
        
        <Text style={[styles.footerInfo, { color: theme.colors.textLight }]}>ECWA Bayeku Choir • olaolubalogs © 2024</Text>
      </ScrollView>

      {/* PIN Change Modal */}
      <Modal 
        visible={isPinModalVisible} 
        animationType="slide" 
        transparent={true}
        onRequestClose={() => setIsPinModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Change Security PIN</Text>
              <TouchableOpacity onPress={() => setIsPinModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.colors.textLight} />
              </TouchableOpacity>
            </View>

            <View style={styles.pinForm}>
              <View style={styles.inputItem}>
                <Text style={[styles.inputLabel, { color: theme.colors.textMuted }]}>CURRENT PIN</Text>
                <TextInput 
                  style={[styles.pinInput, { color: theme.colors.text, backgroundColor: theme.colors.background }]}
                  secureTextEntry
                  keyboardType="number-pad"
                  maxLength={4}
                  value={currentPinInput}
                  onChangeText={setCurrentPinInput}
                />
              </View>

              <View style={styles.inputItem}>
                <Text style={[styles.inputLabel, { color: theme.colors.textMuted }]}>NEW PIN</Text>
                <TextInput 
                  style={[styles.pinInput, { color: theme.colors.text, backgroundColor: theme.colors.background }]}
                  secureTextEntry
                  keyboardType="number-pad"
                  maxLength={4}
                  value={newPinInput}
                  onChangeText={setNewPinInput}
                />
              </View>

              <View style={styles.inputItem}>
                <Text style={[styles.inputLabel, { color: theme.colors.textMuted }]}>CONFIRM NEW PIN</Text>
                <TextInput 
                  style={[styles.pinInput, { color: theme.colors.text, backgroundColor: theme.colors.background }]}
                  secureTextEntry
                  keyboardType="number-pad"
                  maxLength={4}
                  value={confirmPinInput}
                  onChangeText={setConfirmPinInput}
                />
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.savePinBtn, { backgroundColor: theme.colors.primary }]}
              onPress={handlePinChange}
            >
              <Text style={styles.savePinText}>UPDATE PIN</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '800' },
  scrollContent: { padding: 24, paddingBottom: 120 },
  profileCard: { borderRadius: 32, padding: 32, alignItems: 'center', marginBottom: 32 },
  avatarMain: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 4 },
  avatarTextMain: { fontSize: 40, fontWeight: '900', color: '#FFFFFF' },
  profileName: { fontSize: 24, fontWeight: '900', marginBottom: 8 },
  roleBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  roleText: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 1.5, marginBottom: 16, marginLeft: 8 },
  themeSelector: { flexDirection: 'row', gap: 12, borderRadius: 24, padding: 12 },
  themeOption: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 16, borderWidth: 1, borderColor: 'transparent', gap: 8 },
  themeLabel: { fontSize: 12, fontWeight: '800' },
  menuContainer: { borderRadius: 24, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1 },
  menuIconCircle: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  menuTextContainer: { flex: 1 },
  menuTitle: { fontSize: 15, fontWeight: '700' },
  menuDetail: { fontSize: 12, marginTop: 2 },
  sectionInput: { fontSize: 14, fontWeight: '700', borderBottomWidth: 1, padding: 0, marginTop: 2 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 20, borderRadius: 24, marginBottom: 40 },
  logoutText: { fontSize: 14, fontWeight: '800', marginLeft: 12, letterSpacing: 1 },
  footerInfo: { textAlign: 'center', fontSize: 12, marginBottom: 20 },
  
  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 32, paddingBottom: 60 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  pinForm: { gap: 20, marginBottom: 32 },
  inputItem: { gap: 8 },
  inputLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  pinInput: { height: 56, borderRadius: 16, paddingHorizontal: 20, fontSize: 24, fontWeight: '900', letterSpacing: 10, textAlign: 'center' },
  savePinBtn: { height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  savePinText: { color: '#FFF', fontWeight: '900', letterSpacing: 1 }
});
