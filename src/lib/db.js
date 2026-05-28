import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('choir.db');

export function initDB() {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS members (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      pin TEXT NOT NULL,
      is_admin INTEGER DEFAULT 0,
      vocal_section TEXT DEFAULT 'Soprano',
      synced INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS songs (
      id TEXT PRIMARY KEY,
      member_id TEXT NOT NULL,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      tags TEXT DEFAULT 'ENG',
      synced INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS raffle_results (
      id TEXT PRIMARY KEY,
      member_id TEXT,
      winner_name TEXT,
      praise_song_id TEXT,
      worship_song_id TEXT,
      session_number INTEGER DEFAULT 1,
      draw_date TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS attendance (
      id TEXT PRIMARY KEY,
      member_id TEXT NOT NULL,
      sunday_date TEXT NOT NULL,
      is_present INTEGER DEFAULT 1,
      UNIQUE(member_id, sunday_date)
    );
  `);
  
  // Migrations
  try {
    db.execSync('ALTER TABLE members ADD COLUMN vocal_section TEXT DEFAULT "Soprano"');
  } catch (_) {}

  try {
    db.execSync('ALTER TABLE songs ADD COLUMN tags TEXT DEFAULT "ENG"');
  } catch (_) {}

  try {
    db.execSync('ALTER TABLE raffle_results ADD COLUMN session_number INTEGER DEFAULT 1');
  } catch (_) {}

  try {
    db.execSync('ALTER TABLE raffle_results ADD COLUMN winner_name TEXT');
  } catch (_) {}
}

export function getMembers() {
  return db.getAllSync('SELECT * FROM members');
}

export function getMemberByNameAndPin(name, pin) {
  return db.getFirstSync(
    'SELECT * FROM members WHERE name = ? COLLATE NOCASE AND pin = ?',
    [name, pin]
  );
}

export function insertMember(member) {
  db.runSync(
    'INSERT OR REPLACE INTO members (id, name, pin, is_admin, vocal_section, synced) VALUES (?, ?, ?, ?, ?, ?)',
    [member.id, member.name, member.pin, member.is_admin ? 1 : 0, member.vocal_section || 'Soprano', member.synced ?? 0]
  );
}

export function updateMemberPin(id, newPin) {
  db.runSync('UPDATE members SET pin = ?, synced = 0 WHERE id = ?', [newPin, id]);
}

export function getUnsyncedMembers() {
  return db.getAllSync('SELECT * FROM members WHERE synced = 0');
}

export function markMemberSynced(id) {
  db.runSync('UPDATE members SET synced = 1 WHERE id = ?', [id]);
}

export function getSongsByMember(memberId) {
  return db.getAllSync('SELECT * FROM songs WHERE member_id = ?', [memberId]);
}

export function getAllSongs() {
  return db.getAllSync(`
    SELECT songs.*, members.name as owner_name 
    FROM songs 
    JOIN members ON songs.member_id = members.id 
    ORDER BY songs.title ASC
  `);
}

export function insertSong(song) {
  db.runSync(
    'INSERT OR REPLACE INTO songs (id, member_id, title, type, tags, synced) VALUES (?, ?, ?, ?, ?, ?)',
    [song.id, song.member_id, song.title, song.type, song.tags || 'ENG', song.synced ?? 0]
  );
}

export function deleteSong(id) {
  db.runSync('DELETE FROM songs WHERE id = ?', [id]);
}

export function setAttendance(id, memberId, date, isPresent) {
  db.runSync(
    'INSERT OR REPLACE INTO attendance (id, member_id, sunday_date, is_present) VALUES (?, ?, ?, ?)',
    [id, memberId, date, isPresent ? 1 : 0]
  );
}

export function getAttendance(date) {
  return db.getAllSync(
    'SELECT * FROM attendance WHERE sunday_date = ?',
    [date]
  );
}

export function saveRaffleResult(result) {
  db.runSync(
    'INSERT OR REPLACE INTO raffle_results (id, member_id, winner_name, praise_song_id, worship_song_id, session_number, draw_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [result.id, result.member_id, result.winner_name, result.praise_song_id, result.worship_song_id, result.session_number || 1, result.draw_date]
  );
}

export function getRaffleHistory() {
  return db.getAllSync(
    'SELECT * FROM raffle_results ORDER BY draw_date DESC'
  );
}

export function getUnsyncedSongs() {
  return db.getAllSync('SELECT * FROM songs WHERE synced = 0');
}

export function markSongSynced(id) {
  db.runSync('UPDATE songs SET synced = 1 WHERE id = ?', [id]);
}

export function getAllAttendance() {
  return db.getAllSync('SELECT * FROM attendance');
}

export function upsertAttendanceByMemberDate(memberId, date, isPresent) {
  db.runSync(
    `INSERT INTO attendance (id, member_id, sunday_date, is_present)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(member_id, sunday_date) DO UPDATE SET is_present = excluded.is_present`,
    [`${date}_${memberId}`, memberId, date, isPresent ? 1 : 0]
  );
}