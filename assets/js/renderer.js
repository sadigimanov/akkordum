// renderer.js
const CH_WIDTH = 9.02;

export function renderLyrics(song, targetId) {
  const container = document.getElementById(targetId);
  if (!container) return;
  container.innerHTML = "";

  song.sections.forEach((section) => {
    if (section === null) {
      const blank = document.createElement("div");
      blank.className = "blank";
      container.appendChild(blank);
      return;
    }

    const block = document.createElement("div");
    block.className = "section-block";

    if (section.label) {
      const labelEl = document.createElement("div");
      labelEl.className = "section-label";
      labelEl.textContent = section.label;
      block.appendChild(labelEl);
    }

    if (section.chords && section.chords.length > 0) {
      const chordRow = document.createElement("div");
      chordRow.className = "chord-row";

      section.chords.forEach((chord) => {
        const tag = document.createElement("span");
        tag.className = "chord-tag";
        tag.textContent = chord.name;
        tag.style.left = chord.offset * CH_WIDTH + "px";
        tag.dataset.offset = chord.offset; // ← font ölçüsü üçün saxla
        chordRow.appendChild(tag);
      });

      block.appendChild(chordRow);
    }

    if (section.line) {
      const lyricRow = document.createElement("div");
      lyricRow.className = "lyric-row";
      lyricRow.textContent = section.line;
      block.appendChild(lyricRow);
    }

    container.appendChild(block);
  });
}