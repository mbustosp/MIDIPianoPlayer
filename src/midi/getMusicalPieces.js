import MusicPiece from "../midi/MusicPiece";
import { repertoire } from "../../public/music_repertoire.json";
import { ASSETS_PATH } from "../utils/constants";

const getFilePath = (filename) => `${ASSETS_PATH}/${filename}`;
export default () =>
  repertoire.map(
    ({ title, filename }, idx) =>
      new MusicPiece(idx, title, getFilePath(filename))
  );
