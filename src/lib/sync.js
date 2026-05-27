import * as Network from 'expo-network';
import { supabase } from './supabase';
import {
  insertMember, insertSong,
  getUnsyncedSongs, markSongSynced,
  getUnsyncedMembers, markMemberSynced,
  getRaffleHistory, saveRaffleResult,
  getAllAttendance, upsertAttendanceByMemberDate,
} from './db';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isValidUUID = (id) => UUID_REGEX.test(id);

export async function syncIfOnline() {
  const net = await Network.getNetworkStateAsync();
  if (!net.isConnected) return;

  await pushLocalData();
  await pullLatestData();
}

async function pullLatestData() {
  const { data: members, error: mError } = await supabase.from('members').select('*');
  if (mError) throw mError;
  if (members) {
    members.forEach(m => insertMember({ ...m, synced: 1 }));
  }

  const { data: songs, error: sError } = await supabase.from('songs').select('*');
  if (sError) throw sError;
  if (songs) {
    songs.forEach(s => insertSong({ ...s, synced: 1 }));
  }

  const { data: raffles, error: rError } = await supabase.from('raffle_results').select('*');
  if (rError) throw rError;
  if (raffles) {
    raffles.forEach(r => saveRaffleResult({ ...r }));
  }

  const { data: attendance, error: aError } = await supabase.from('attendance').select('*');
  if (aError) throw aError;
  if (attendance) {
    attendance.forEach(a => upsertAttendanceByMemberDate(a.member_id, a.sunday_date, a.is_present));
  }
}

async function pushLocalData() {
  // Sync Songs — skip any with invalid (old) IDs
  const unsyncedSongs = getUnsyncedSongs();
  for (const song of unsyncedSongs) {
    if (!isValidUUID(song.id)) {
      markSongSynced(song.id); // mark done so we don't retry forever
      continue;
    }
    const { error } = await supabase.from('songs').upsert({
      id: song.id,
      member_id: song.member_id,
      title: song.title,
      type: song.type,
    });
    if (error) throw error;
    markSongSynced(song.id);
  }

  // Sync Members PIN/profile changes
  const unsyncedMembers = getUnsyncedMembers();
  for (const member of unsyncedMembers) {
    if (!isValidUUID(member.id)) {
      markMemberSynced(member.id);
      continue;
    }
    const { error } = await supabase.from('members').upsert({
      id: member.id,
      name: member.name,
      pin: member.pin,
      is_admin: member.is_admin === 1,
    });
    if (error) throw error;
    markMemberSynced(member.id);
  }

  // Sync Raffle Results — skip records with bad IDs (old local data)
  const history = getRaffleHistory();
  for (const raffle of history) {
    if (!isValidUUID(raffle.id)) continue;
    if (!isValidUUID(raffle.member_id)) continue;
    const { error } = await supabase.from('raffle_results').upsert({
      id: raffle.id,
      member_id: raffle.member_id,
      praise_song_id: null,
      worship_song_id: null,
      draw_date: raffle.draw_date,
    });
    if (error) throw error;
  }

  // Sync Attendance — use member_id+sunday_date conflict key so local IDs don't matter
  const allAttendance = getAllAttendance();
  for (const att of allAttendance) {
    if (!isValidUUID(att.member_id)) continue;
    const { error } = await supabase.from('attendance').upsert(
      {
        member_id: att.member_id,
        sunday_date: att.sunday_date,
        is_present: att.is_present === 1,
      },
      { onConflict: 'member_id,sunday_date' }
    );
    if (error) throw error;
  }
}
