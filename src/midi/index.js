import SoundFont from "soundfont-player";
import MidiPlayer from "midi-player-js";
import {
  SUSTAINED_NOTE_DURATION,
  NON_SUSTAINED_NOTE_DURATION
} from "../utils/constants";
import ReverbJS from "reverb.js";

export const EVENT_TYPES = {
  SUSTAIN_PEDAL_PRESSED: "SUSTAIN_PEDAL_PRESSED",
  SUSTAIN_PEDAL_RELEASED: "SUSTAIN_PEDAL_RELEASED",
  KEY_PRESSED: "KEY_PRESSED",
  KEY_RELEASED: "KEY_RELEASED",
  MIDI_LOADING: "MIDI_LOADING",
  MIDI_LOADED: "MIDI_LOADED",
  MIDI_STARTED: "MIDI_STARTED",
  MIDI_STOPPED: "MIDI_STOPPED",
  MIDI_PAUSED: "MIDI_PAUSED",
  INSTRUMENT_LOADED: "INSTRUMENT_LOADED"
};

export class FancyMidiPlayer {
  constructor(piano) {
    // Audio context is required to play Soundfont files and reverb
    this.audioContext =
      window.AudioContext || window.webkitAudioContext || false;
    this.safeAudioContext = new this.audioContext();
    this.instrument = null;
    // MIDI file that will be played
    this.midi = null;
    this.player = null;
    this.subscribers = [];
    this.piano = piano;
    this.volume = 3;

    ReverbJS.extend(this.safeAudioContext);

    // Load the impulse response; upon load, connect it to the audio output.
    const reverbUrl = "./public/reverb/Basement.m4a";
    this.reverbNode = this.safeAudioContext.createReverbFromUrl(
      reverbUrl,
      function () {
        this.reverbNode.connect(this.safeAudioContext.destination);
      }.bind(this)
    );
  }

  notify(event) {
    console.log(event);
    if (this.subscribers.length)
      this.subscribers.forEach(({ subscriber }) => subscriber.handle(event));
  }

  subscribe(subscriber) {
    const subscriberId = this.subscribers.length;
    this.subscribers.push({ subscriber, id: subscriberId });
    return subscriberId;
  }

  /**
   * Loads js soundfont file
   * @param {string} instrumentUrl
   */
  async loadInstrument(instrumentUrl) {
    this.instrument = await SoundFont.instrument(
      this.safeAudioContext,
      instrumentUrl,
      {
        destination: this.reverbNode
      }
    );

    this.notify({ type: EVENT_TYPES.INSTRUMENT_LOADED });

    // Attach event handlers to midi player
    this.player = new MidiPlayer.Player((event) => {
      if (event.name === "Controller Change") {
        this.onControllerChange(event);
      } else if (event.name === "Note on") {
        this.onNoteOnEvent(event);
      } else if (event.name === "Note off") {
        this.onNoteOffEvent(event);
      }
    });
  }

  onControllerChange(event) {
    // Handle sustain pedal event
    if (event.number === 64) {
      this.piano.setSustainPedal(event.value);
      if (event.value) {
        this.notify({ type: EVENT_TYPES.SUSTAIN_PEDAL_PRESSED });
      } else {
        this.notify({ type: EVENT_TYPES.SUSTAIN_PEDAL_RELEASED });
      }
      /** 
      console.log(this.piano.isSustainPedalPressed ? "Pressed" : "Released");
      if (!this.piano.isSustainPedalPressed) {
        this.piano
          .getSustainedKeys()
          .forEach((sustainedKey) => sustainedKey.stop());
      }*/
    }
  }

  onNoteOnEvent(event) {
    if (event.velocity === 0) {
      this.onNoteOffEvent(event);
    } else {
      let keyEvent = this.instrument.play(
        event.noteName,
        this.safeAudioContext.currentTime,
        {
          gain: (event.velocity / 100) * this.volume,
          duration: this.piano.isSustainPedalPressed
            ? SUSTAINED_NOTE_DURATION
            : NON_SUSTAINED_NOTE_DURATION
        }
      );
      this.notify({
        type: EVENT_TYPES.KEY_PRESSED,
        context: { keyEvent, noteNumber: event.noteNumber }
      });
      //this.piano.setKey(event.noteNumber, keyEvent);
    }
  }

  onNoteOffEvent(event) {
    this.notify({
      type: EVENT_TYPES.KEY_RELEASED,
      context: { noteNumber: event.noteNumber }
    });
    //const keyToStop = this.piano.stopKey(event.noteNumber);
    // if (keyToStop) keyToStop.stop();
  }

  async setMidi(midiUrl) {
    this.notify({ type: EVENT_TYPES.MIDI_LOADING });
    this.midi = await fetch(midiUrl).then((response) => response.arrayBuffer());
    this.player.loadArrayBuffer(this.midi);
    this.notify({ type: EVENT_TYPES.MIDI_LOADED, context: { midiUrl } });
  }

  playMidi() {
    this.player.play();
    this.notify({ type: EVENT_TYPES.MIDI_STARTED });
  }

  stopMidi() {
    this.player.stop();
    this.notify({ type: EVENT_TYPES.MIDI_STOPPED });
    //this.piano.repaintKeys();
  }

  pauseMidi() {
    this.player.pause();
    this.notify({ type: EVENT_TYPES.MIDI_STOPPED });
  }
}
