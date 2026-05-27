import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { useTheme } from '../src/context/ThemeContext';
import { getSongsByMember, insertSong, deleteSong } from '../src/lib/db';
import { Ionicons } from '@expo/vector-icons';

export default function SongsScreen() {
  const [songs, setSongs] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [category, setCategory] = useState('praise'); 
  const [tag, setTag] = useState('ENG'); 
  const { user } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();

  useEffect(() => {
    if (user) loadSongs();
  }, [user]);

  const loadSongs = () => {
    setSongs(getSongsByMember(user.id));
  };

  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  };

  const handleAddSong = () => {
    if (!newTitle.trim()) return;

    insertSong({
      id: generateUUID(),
      member_id: user.id,
      title: newTitle.trim(),
      type: category,
      tags: tag,
      synced: 0
    });
    
    setNewTitle('');
    loadSongs();
  };

  const handleDelete = (id) => {
    deleteSong(id);
    loadSongs();
  };

  const filteredSongs = songs.filter(s => s.type === category);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: theme.colors.surface }]}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
           <Text style={[styles.headerTitle, { color: theme.colors.primary }]}>ECWA Bayeku Choir</Text>
           <Text style={[styles.headerTag, { color: theme.colors.textLight }]}>CURATE YOUR REPERTOIRE</Text>
        </View>
        <TouchableOpacity style={styles.settingsIcon} onPress={() => router.push('/settings')}>
          <Ionicons name="settings-outline" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.addSection}>
        <View style={[styles.inputGroup, { backgroundColor: theme.colors.surface }]}>
           <TextInput
             style={[styles.input, { color: theme.colors.text }]}
             placeholder="New Song Title..."
             placeholderTextColor={theme.colors.textLight}
             value={newTitle}
             onChangeText={setNewTitle}
           />
           <TouchableOpacity style={[styles.addBtn, { backgroundColor: theme.colors.primary }]} onPress={handleAddSong}>
             <Ionicons name="add" size={28} color="#FFF" />
           </TouchableOpacity>
        </View>

        <View style={styles.selectors}>
           {/* Category Toggle */}
           <View style={[styles.toggleContainer, { backgroundColor: theme.colors.surfaceSubtle }]}>
              <TouchableOpacity style={[styles.toggleBtn, category === 'praise' && { backgroundColor: theme.colors.primary }]} onPress={() => setCategory('praise')}>
                <Text style={[styles.toggleText, { color: category === 'praise' ? '#FFF' : theme.colors.textMuted }]}>PRAISE</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.toggleBtn, category === 'worship' && { backgroundColor: theme.colors.primary }]} onPress={() => setCategory('worship')}>
                <Text style={[styles.toggleText, { color: category === 'worship' ? '#FFF' : theme.colors.textMuted }]}>WORSHIP</Text>
              </TouchableOpacity>
           </View>

           {/* Tag Selector */}
           <View style={[styles.tagContainer, { backgroundColor: theme.colors.surfaceSubtle }]}>
              <TouchableOpacity style={[styles.tagBtn, tag === 'ENG' && { backgroundColor: theme.colors.primary }]} onPress={() => setTag('ENG')}>
                <Text style={[styles.tagText, { color: tag === 'ENG' ? '#FFF' : theme.colors.textMuted }]}>ENG</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.tagBtn, tag === 'YOR' && { backgroundColor: theme.colors.primary }]} onPress={() => setTag('YOR')}>
                <Text style={[styles.tagText, { color: tag === 'YOR' ? '#FFF' : theme.colors.textMuted }]}>YOR</Text>
              </TouchableOpacity>
           </View>
        </View>
        
        <TouchableOpacity 
          style={[styles.bankLink, { borderColor: theme.colors.primary }]}
          onPress={() => router.push('/global-songs')}
        >
          <Ionicons name="globe-outline" size={20} color={theme.colors.primary} />
          <Text style={[styles.bankLinkText, { color: theme.colors.primary }]}>Explore General Song Bank</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredSongs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={[styles.songCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.songInfo}>
              <Text style={[styles.songTitle, { color: theme.colors.text }]}>{item.title}</Text>
              <View style={styles.tagRow}>
                <View style={[styles.miniTag, { backgroundColor: theme.colors.accent + '20' }]}>
                  <Text style={[styles.miniTagText, { color: theme.colors.primaryDark }]}>{item.tags || 'ENG'}</Text>
                </View>
                <Text style={[styles.songCategory, { color: theme.colors.textMuted }]}>{item.type.toUpperCase()}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
              <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 16 },
  backBtn: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  headerInfo: { alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '900' },
  headerTag: { fontSize: 9, fontWeight: '800', letterSpacing: 2, marginTop: 2 },
  settingsIcon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  addSection: { paddingHorizontal: 24, marginBottom: 16 },
  inputGroup: { flexDirection: 'row', borderRadius: 20, padding: 8, alignItems: 'center', marginBottom: 12 },
  input: { flex: 1, paddingHorizontal: 16, fontSize: 16, fontWeight: '600' },
  addBtn: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  selectors: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  toggleContainer: { flex: 2, flexDirection: 'row', borderRadius: 14, padding: 4 },
  toggleBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  toggleText: { fontSize: 10, fontWeight: '900' },
  tagContainer: { flex: 1, flexDirection: 'row', borderRadius: 14, padding: 4 },
  tagBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  tagText: { fontSize: 10, fontWeight: '900' },
  bankLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 16, borderWidth: 1, borderStyle: 'dashed', gap: 8 },
  bankLinkText: { fontSize: 12, fontWeight: '800' },
  list: { padding: 24, paddingBottom: 120 },
  songCard: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 24, marginBottom: 12 },
  songInfo: { flex: 1 },
  songTitle: { fontSize: 16, fontWeight: '700' },
  tagRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 8 },
  miniTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  miniTagText: { fontSize: 8, fontWeight: '900' },
  songCategory: { fontSize: 10, fontWeight: '800' },
  deleteBtn: { padding: 8 }
});