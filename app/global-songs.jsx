import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { getAllSongs } from '../src/lib/db';
import { useTheme } from '../src/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export default function GlobalSongsScreen() {
  const [songs, setSongs] = useState([]);
  const [filteredSongs, setFilteredSongs] = useState([]);
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState('ALL'); // 'ALL', 'ENG', 'YOR'
  const { theme } = useTheme();
  const router = useRouter();

  useEffect(() => {
    const all = getAllSongs();
    setSongs(all);
    setFilteredSongs(all);
  }, []);

  useEffect(() => {
    let result = songs;
    
    if (activeTag !== 'ALL') {
      result = result.filter(s => (s.tags || 'ENG') === activeTag);
    }
    
    if (search.trim()) {
      result = result.filter(s => s.title.toLowerCase().includes(search.toLowerCase()));
    }
    
    setFilteredSongs(result);
  }, [search, activeTag, songs]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: theme.colors.surface }]}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: theme.colors.primary }]}>Song Bank</Text>
          <Text style={[styles.headerSub, { color: theme.colors.textLight }]}>ECWA BAYEKU REPERTOIRE</Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      {/* Search & Filter */}
      <View style={styles.filterSection}>
        <View style={[styles.searchBar, { backgroundColor: theme.colors.surface }]}>
          <Ionicons name="search" size={20} color={theme.colors.textLight} />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.text }]}
            placeholder="Search all songs..."
            placeholderTextColor={theme.colors.textLight}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <View style={styles.tagToggle}>
          {['ALL', 'ENG', 'YOR'].map(tag => (
            <TouchableOpacity 
              key={tag}
              onPress={() => setActiveTag(tag)}
              style={[
                styles.tagBtn, 
                activeTag === tag && { backgroundColor: theme.colors.primary }
              ]}
            >
              <Text style={[
                styles.tagBtnText, 
                { color: activeTag === tag ? '#FFF' : theme.colors.textMuted }
              ]}>{tag}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={filteredSongs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={[styles.songItem, { backgroundColor: theme.colors.surface }]}>
            <View style={[styles.alphaBadge, { backgroundColor: theme.colors.primary + '15' }]}>
               <Text style={[styles.alphaText, { color: theme.colors.primary }]}>{item.title.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.songContent}>
              <Text style={[styles.songTitle, { color: theme.colors.text }]}>{item.title}</Text>
              <View style={styles.metadataRow}>
                <View style={[styles.langBadge, { backgroundColor: theme.colors.accent + '30' }]}>
                   <Text style={[styles.langText, { color: theme.colors.primaryDark }]}>{item.tags || 'ENG'}</Text>
                </View>
                <Text style={[styles.ownerText, { color: theme.colors.textMuted }]}>• Contributed by {item.owner_name}</Text>
              </View>
            </View>
            <View style={[styles.typeBadge, { borderColor: theme.colors.primary + '40' }]}>
               <Text style={[styles.typeText, { color: theme.colors.primary }]}>{item.type === 'praise' ? 'PR' : 'WP'}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 24 },
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '900' },
  headerSub: { fontSize: 8, fontWeight: '800', letterSpacing: 2, marginTop: 2 },
  backBtn: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  filterSection: { paddingHorizontal: 24, marginBottom: 16 },
  searchBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20, marginBottom: 16 },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 16, fontWeight: '600' },
  tagToggle: { flexDirection: 'row', gap: 12 },
  tagBtn: { flex: 1, paddingVertical: 10, borderRadius: 14, alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.03)' },
  tagBtnText: { fontSize: 11, fontWeight: '900' },
  list: { padding: 24, paddingBottom: 120 },
  songItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 24, marginBottom: 12 },
  alphaBadge: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  alphaText: { fontSize: 20, fontWeight: '900' },
  songContent: { flex: 1 },
  songTitle: { fontSize: 16, fontWeight: '700' },
  metadataRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 },
  langBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  langText: { fontSize: 9, fontWeight: '900' },
  ownerText: { fontSize: 11 },
  typeBadge: { borderWidth: 1, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  typeText: { fontSize: 8, fontWeight: '900' }
});
