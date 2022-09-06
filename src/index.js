/**
 * MIDI Piano PLAYER
 *
 * Author: Matías Bustos
 *
 * Do you have any cool ideas? Contact me!
 *
 * PS:
 *
 * - I had to make an SVG image of the piano keyboard. Those ones available on internet
 * lack of a proper strucure: ids, groups, etc.
 */

import { FancyMidiPlayer } from "./midi";
import { INSTRUMENT_URL } from "./utils/constants";
import { FancyPiano } from "./piano";
import PlayerPage from "./ui/PlayerPage";
import getMusicalPieces from "./midi/getMusicalPieces";

const ready = function (cb) {
  document.readyState === "loading"
    ? // The document is still loading
      document.addEventListener("DOMContentLoaded", function (e) {
        cb();
      })
    : // The document is loaded completely
      cb();
};

ready(function () {
  // Let's grab the MIDI files
  const pieces = getMusicalPieces();
  // Initiliaze the Piano Keyboard component
  const keyboardComponent = new FancyPiano();
  // Initiliaze the MIDI player (TODO: Remove piano UI dependency)
  const midiPlayer = new FancyMidiPlayer(keyboardComponent);
  // Initiliaze the main page UI
  const playerPage = new PlayerPage({
    onMusicalPieceSelection: (pieceId) => {
      midiPlayer.stopMidi();
      return midiPlayer.setMidi(pieces[pieceId].path);
    },
    onPlayPieceClick: midiPlayer.playMidi.bind(midiPlayer),
    onStopPieceClick: midiPlayer.stopMidi.bind(midiPlayer),
    onPausePieceClick: midiPlayer.pauseMidi.bind(midiPlayer)
  });

  playerPage.busy = true;
  playerPage.musicalPieceOptions = pieces;

  // MIDI Player will be sending events, let's trey the Keyboard component start listening them.
  midiPlayer.subscribe(keyboardComponent);
  midiPlayer.subscribe(playerPage);

  // Last, but not less important: let's load the instrument into the MIDI Player
  midiPlayer
    .loadInstrument(INSTRUMENT_URL)
    .then(() => midiPlayer.setMidi(pieces[0].path)) // Load the first musical piece option
    .catch(() =>
      console.error("There was a problem while loading the instrument")
    );
});
