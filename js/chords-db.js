// js/chords-db.js
// Hər akkord üçün struktur:
// frets: [6 sim üçün pərdə nömrəsi, -1 = çalınmır, 0 = açıq]
// fingers: [hər nota üçün barmaq nömrəsi, 0 = açıq/çalınmır]
// barre: { fret, from, to } — barre akkord üçün (istəyə bağlı)
// baseFret: neçənci pərdədən başlayır (default 1)

const CHORDS_DB = {
  // ── C ailesi ──────────────────────────────────────────────
  "C":    { frets: [-1, 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0] },
  "Cm":   { frets: [-1, 3, 5, 5, 4, 3], fingers: [0, 1, 3, 4, 2, 1], barre: { fret: 3, from: 5, to: 1 } },
  "C7":   { frets: [-1, 3, 2, 3, 1, 0], fingers: [0, 3, 2, 4, 1, 0] },
  "Cm7":  { frets: [-1, 3, 5, 3, 4, 3], fingers: [0, 1, 3, 1, 2, 1], barre: { fret: 3, from: 5, to: 1 } },
  "Cmaj7":{ frets: [-1, 3, 2, 0, 0, 0], fingers: [0, 3, 2, 0, 0, 0] },
  "Csus2":{ frets: [-1, 3, 0, 0, 1, 3], fingers: [0, 2, 0, 0, 1, 4] },
  "Csus4":{ frets: [-1, 3, 3, 0, 1, 1], fingers: [0, 3, 4, 0, 1, 1] },

  // ── C# / Db ailesi ────────────────────────────────────────
  "C#":   { frets: [-1, 4, 3, 1, 2, 1], fingers: [0, 4, 3, 1, 2, 1], barre: { fret: 1, from: 4, to: 1 }, baseFret: 1 },
  "C#m":  { frets: [-1, 4, 6, 6, 5, 4], fingers: [0, 1, 3, 4, 2, 1], barre: { fret: 4, from: 5, to: 1 } },
  "C#7":  { frets: [-1, 4, 3, 4, 2, 1], fingers: [0, 4, 3, 4, 2, 1], barre: { fret: 1, from: 4, to: 1 } },
  "C#m7": { frets: [-1, 4, 4, 4, 4, 4], fingers: [0, 1, 1, 1, 1, 1], barre: { fret: 4, from: 5, to: 1 } },
  "Db":   { frets: [-1, 4, 3, 1, 2, 1], fingers: [0, 4, 3, 1, 2, 1], barre: { fret: 1, from: 4, to: 1 } },

  // ── D ailesi ──────────────────────────────────────────────
  "D":    { frets: [-1, -1, 0, 2, 3, 2], fingers: [0, 0, 0, 1, 3, 2] },
  "Dm":   { frets: [-1, -1, 0, 2, 3, 1], fingers: [0, 0, 0, 2, 3, 1] },
  "D7":   { frets: [-1, -1, 0, 2, 1, 2], fingers: [0, 0, 0, 2, 1, 3] },
  "Dm7":  { frets: [-1, -1, 0, 2, 1, 1], fingers: [0, 0, 0, 2, 1, 1] },
  "Dmaj7":{ frets: [-1, -1, 0, 2, 2, 2], fingers: [0, 0, 0, 1, 1, 1] },
  "Dsus2":{ frets: [-1, -1, 0, 2, 3, 0], fingers: [0, 0, 0, 1, 3, 0] },
  "Dsus4":{ frets: [-1, -1, 0, 2, 3, 3], fingers: [0, 0, 0, 1, 3, 4] },

  // ── D# / Eb ailesi ────────────────────────────────────────
  "D#":   { frets: [-1, -1, 1, 3, 4, 3], fingers: [0, 0, 1, 2, 4, 3] },
  "D#m":  { frets: [-1, -1, 1, 3, 4, 2], fingers: [0, 0, 1, 3, 4, 2] },
  "Eb":   { frets: [-1, -1, 1, 3, 4, 3], fingers: [0, 0, 1, 2, 4, 3] },
  "Ebm":  { frets: [-1, -1, 1, 3, 4, 2], fingers: [0, 0, 1, 3, 4, 2] },

  // ── E ailesi ──────────────────────────────────────────────
  "E":    { frets: [0, 2, 2, 1, 0, 0], fingers: [0, 2, 3, 1, 0, 0] },
  "Em":   { frets: [0, 2, 2, 0, 0, 0], fingers: [0, 2, 3, 0, 0, 0] },
  "E7":   { frets: [0, 2, 0, 1, 0, 0], fingers: [0, 2, 0, 1, 0, 0] },
  "Em7":  { frets: [0, 2, 0, 0, 0, 0], fingers: [0, 1, 0, 0, 0, 0] },
  "Emaj7":{ frets: [0, 2, 1, 1, 0, 0], fingers: [0, 3, 1, 2, 0, 0] },
  "Esus4":{ frets: [0, 2, 2, 2, 0, 0], fingers: [0, 1, 2, 3, 0, 0] },

  // ── F ailesi ──────────────────────────────────────────────
  "F":    { frets: [1, 3, 3, 2, 1, 1], fingers: [1, 3, 4, 2, 1, 1], barre: { fret: 1, from: 6, to: 1 } },
  "Fm":   { frets: [1, 1, 1, 3, 3, 1], fingers: [1, 1, 1, 3, 4, 1], barre: { fret: 1, from: 6, to: 1 } },
  "F7":   { frets: [1, 1, 2, 1, 3, 1], fingers: [1, 1, 2, 1, 3, 1], barre: { fret: 1, from: 6, to: 1 } },
  "Fm7":  { frets: [1, 1, 1, 1, 3, 1], fingers: [1, 1, 1, 1, 3, 1], barre: { fret: 1, from: 6, to: 1 } },
  "Fmaj7":{ frets: [1, 0, 2, 2, 1, 0], fingers: [1, 0, 3, 4, 2, 0] },
  "Fsus2":{ frets: [1, 1, 3, 3, 1, 1], fingers: [1, 1, 3, 4, 1, 1], barre: { fret: 1, from: 6, to: 1 } },

  // ── F# / Gb ailesi ────────────────────────────────────────
  "F#":   { frets: [2, 2, 3, 4, 4, 2], fingers: [1, 1, 2, 3, 4, 1], barre: { fret: 2, from: 6, to: 1 } },
  "F#m":  { frets: [2, 2, 2, 4, 4, 2], fingers: [1, 1, 1, 3, 4, 1], barre: { fret: 2, from: 6, to: 1 } },
  "F#7":  { frets: [2, 2, 3, 2, 4, 2], fingers: [1, 1, 2, 1, 3, 1], barre: { fret: 2, from: 6, to: 1 } },
  "F#m7": { frets: [2, 2, 2, 2, 4, 2], fingers: [1, 1, 1, 1, 3, 1], barre: { fret: 2, from: 6, to: 1 } },
  "Gb":   { frets: [2, 2, 3, 4, 4, 2], fingers: [1, 1, 2, 3, 4, 1], barre: { fret: 2, from: 6, to: 1 } },

  // ── G ailesi ──────────────────────────────────────────────
  "G":    { frets: [3, 2, 0, 0, 0, 3], fingers: [2, 1, 0, 0, 0, 3] },
  "Gm":   { frets: [3, 3, 3, 5, 5, 3], fingers: [1, 1, 1, 3, 4, 1], barre: { fret: 3, from: 6, to: 1 } },
  "G7":   { frets: [3, 2, 0, 0, 0, 1], fingers: [3, 2, 0, 0, 0, 1] },
  "Gm7":  { frets: [3, 1, 3, 3, 3, 1], fingers: [3, 1, 4, 4, 4, 1], barre: { fret: 1, from: 5, to: 1 } },
  "Gmaj7":{ frets: [3, 2, 0, 0, 0, 2], fingers: [3, 2, 0, 0, 0, 1] },
  "Gsus4":{ frets: [3, 3, 0, 0, 1, 3], fingers: [2, 3, 0, 0, 1, 4] },
  "Gsus2":{ frets: [3, 0, 0, 0, 3, 3], fingers: [2, 0, 0, 0, 3, 4] },

  // ── G# / Ab ailesi ────────────────────────────────────────
  "G#":   { frets: [4, 3, 1, 1, 1, 4], fingers: [4, 3, 1, 1, 1, 4], barre: { fret: 1, from: 5, to: 1 }, baseFret: 1 },
  "G#m":  { frets: [4, 4, 4, 6, 6, 4], fingers: [1, 1, 1, 3, 4, 1], barre: { fret: 4, from: 6, to: 1 } },
  "Ab":   { frets: [4, 3, 1, 1, 1, 4], fingers: [4, 3, 1, 1, 1, 4], barre: { fret: 1, from: 5, to: 1 } },
  "Abm":  { frets: [4, 4, 4, 6, 6, 4], fingers: [1, 1, 1, 3, 4, 1], barre: { fret: 4, from: 6, to: 1 } },

  // ── A ailesi ──────────────────────────────────────────────
  "A":    { frets: [-1, 0, 2, 2, 2, 0], fingers: [0, 0, 1, 2, 3, 0] },
  "Am":   { frets: [-1, 0, 2, 2, 1, 0], fingers: [0, 0, 2, 3, 1, 0] },
  "A7":   { frets: [-1, 0, 2, 0, 2, 0], fingers: [0, 0, 2, 0, 3, 0] },
  "Am7":  { frets: [-1, 0, 2, 0, 1, 0], fingers: [0, 0, 2, 0, 1, 0] },
  "Amaj7":{ frets: [-1, 0, 2, 1, 2, 0], fingers: [0, 0, 2, 1, 3, 0] },
  "Asus2":{ frets: [-1, 0, 2, 2, 0, 0], fingers: [0, 0, 1, 2, 0, 0] },
  "Asus4":{ frets: [-1, 0, 2, 2, 3, 0], fingers: [0, 0, 1, 2, 3, 0] },

  // ── A# / Bb ailesi ────────────────────────────────────────
  "A#":   { frets: [-1, 1, 3, 3, 3, 1], fingers: [0, 1, 2, 3, 4, 1], barre: { fret: 1, from: 5, to: 1 } },
  "A#m":  { frets: [-1, 1, 3, 3, 2, 1], fingers: [0, 1, 3, 4, 2, 1], barre: { fret: 1, from: 5, to: 1 } },
  "Bb":   { frets: [-1, 1, 3, 3, 3, 1], fingers: [0, 1, 2, 3, 4, 1], barre: { fret: 1, from: 5, to: 1 } },
  "Bbm":  { frets: [-1, 1, 3, 3, 2, 1], fingers: [0, 1, 3, 4, 2, 1], barre: { fret: 1, from: 5, to: 1 } },
  "Bb7":  { frets: [-1, 1, 3, 1, 3, 1], fingers: [0, 1, 3, 1, 4, 1], barre: { fret: 1, from: 5, to: 1 } },

  // ── B ailesi ──────────────────────────────────────────────
  "B":    { frets: [-1, 2, 4, 4, 4, 2], fingers: [0, 1, 2, 3, 4, 1], barre: { fret: 2, from: 5, to: 1 } },
  "Bm":   { frets: [-1, 2, 4, 4, 3, 2], fingers: [0, 1, 3, 4, 2, 1], barre: { fret: 2, from: 5, to: 1 } },
  "B7":   { frets: [-1, 2, 1, 2, 0, 2], fingers: [0, 2, 1, 3, 0, 4] },
  "Bm7":  { frets: [-1, 2, 0, 2, 0, 2], fingers: [0, 1, 0, 2, 0, 3] },
  "Bmaj7":{ frets: [-1, 2, 4, 3, 4, 2], fingers: [0, 1, 3, 2, 4, 1], barre: { fret: 2, from: 5, to: 1 } },
};

export default CHORDS_DB;