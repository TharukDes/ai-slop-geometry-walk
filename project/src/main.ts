import { Color, DisplayMode, Engine } from 'excalibur';
import { COLORS, FIXED_UPDATE_FPS, VIEW } from './game/config';
import { GameScene } from './game/scenes/GameScene';
import './style.css';

const game = new Engine({
  width: VIEW.width,
  height: VIEW.height,
  canvasElementId: 'game',
  displayMode: DisplayMode.FitContainer,
  backgroundColor: Color.fromHex(COLORS.background),
  suppressPlayButton: true,
  fixedUpdateFps: FIXED_UPDATE_FPS,
  antialiasing: true,
});

game.addScene('game', new GameScene());

const prevent = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space']);
window.addEventListener(
  'keydown',
  (event) => {
    if (prevent.has(event.code)) {
      event.preventDefault();
    }
  },
  { passive: false },
);

game
  .start()
  .then(() => game.goToScene('game'))
  .catch((error: unknown) => {
    console.error('Failed to start Geometry Walk', error);
  });
