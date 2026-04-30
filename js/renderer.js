// renderer.js
// Mahnı data-sını götürüb #lyrics elementinə render edir

const CH_WIDTH = 9.02; // monospace font üçün simvol eni (px)

export function renderLyrics(song, targetId) {
  const container = document.getElementById(targetId);
  if (!container) return;
  container.innerHTML = "";

  song.sections.forEach((section) => {
    // null = bənd arası boşluq
    if (section === null) {
      const blank = document.createElement("div");
      blank.className = "blank";
      container.appendChild(blank);
      return;
    }

    const block = document.createElement("div");
    block.className = "section-block";

    // Bənd adı (label) varsa göstər
    if (section.label) {
      const labelEl = document.createElement("div");
      labelEl.className = "section-label";
      labelEl.textContent = section.label;
      block.appendChild(labelEl);
    }

    // Akor sətri
    if (section.chords && section.chords.length > 0) {
      const chordRow = document.createElement("div");
      chordRow.className = "chord-row";

      section.chords.forEach((chord) => {
        const tag = document.createElement("span");
        tag.className = "chord-tag";
        tag.textContent = chord.name;
        tag.style.left = chord.offset * CH_WIDTH + "px";
        chordRow.appendChild(tag);
      });

      block.appendChild(chordRow);
    }

    // Söz sətri
    if (section.line) {
      const lyricRow = document.createElement("div");
      lyricRow.className = "lyric-row";
      lyricRow.textContent = section.line;
      block.appendChild(lyricRow);
    }

    container.appendChild(block);
  });
}
