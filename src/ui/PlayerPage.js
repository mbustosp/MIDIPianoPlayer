import { EVENT_TYPES } from "../midi";

export default class PlayerPage {
  constructor({
    onMusicalPieceSelection,
    onPlayPieceClick,
    onStopPieceClick,
    onPausePieceClick
  }) {
    this.musicalPiecesOptions = [];
    this.loading = false;
    this.playButton = document.querySelector("#play-piece");
    this.stopButton = document.querySelector("#stop-piece");
    this.pauseButton = document.querySelector("#pause-piece");
    this.musicalPiecesSelect = document.querySelector("#musical-pieces");

    this.playButton.onclick = (evt) => onPlayPieceClick(evt.target.value);
    this.stopButton.onclick = (evt) => onStopPieceClick(evt.target.value);
    this.pauseButton.onclick = (evt) => onPausePieceClick(evt.target.value);
    this.musicalPiecesSelect.onchange = (evt) => {
      onMusicalPieceSelection(evt.target.value);
    };
  }

  set musicalPieceOptions(pieces) {
    this.musicalPiecesOptions = pieces;
    if (!pieces.length) {
      this.playButton.setAttribute("disabled", true);
      this.stopButton.setAttribute("disabled", true);
      this.pauseButton.setAttribute("disabled", true);
    } else {
      pieces
        .map((piece) => {
          const option = document.createElement("option");
          option.id = piece.id;
          option.value = piece.id;
          option.innerHTML = piece.name;
          option.selected = piece.id === 0;
          return option;
        })
        .forEach((pieceOption) => {
          this.musicalPiecesSelect.append(pieceOption);
        });
    }
  }

  set busy(isBusy) {
    this.loading = isBusy;
    if (isBusy) {
      this.playButton.setAttribute("disabled", true);
      this.stopButton.setAttribute("disabled", true);
      this.pauseButton.setAttribute("disabled", true);
      this.musicalPiecesSelect.setAttribute("disabled", true);
    } else {
      if (this.musicalPiecesOptions.length) {
        this.playButton.removeAttribute("disabled");
        this.musicalPiecesSelect.removeAttribute("disabled");
      }
    }
  }

  handle(event = {}) {
    const { type } = event;
    if (type === EVENT_TYPES.MIDI_STARTED) {
      this.playButton.setAttribute("disabled", true);
      this.pauseButton.removeAttribute("disabled");
      this.stopButton.removeAttribute("disabled");
    } else if (type === EVENT_TYPES.MIDI_STOPPED) {
      if (!this.busy) this.playButton.removeAttribute("disabled");
      this.stopButton.setAttribute("disabled", true);
      this.pauseButton.setAttribute("disabled", true);
    } else if (type === EVENT_TYPES.MIDI_LOADING) {
      this.busy = true;
    } else if (type === EVENT_TYPES.MIDI_LOADED) {
      this.busy = false;
    } else if (type === EVENT_TYPES.INSTRUMENT_LOADED) {
      this.busy = false;
    }
  }
}
