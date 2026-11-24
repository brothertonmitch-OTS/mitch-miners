// ============================================================================
// MULTI-MINE — Application Entry Point
// ============================================================================
window.addEventListener('DOMContentLoaded', () => {
  window.MM.SVGs.preloadAll();

  const canvas = document.getElementById('game-canvas');
  let ui = null;

  const engine = new window.MM.GameEngine(canvas, {
    onWaveStart(waveCfg) {
      if (ui) ui.onWaveStart(waveCfg);
    },
    onHudUpdate(snap) {
      if (ui) ui.updateHud(snap);
    },
    onPause(paused) {
      if (ui) ui.onPause(paused);
    },
    onWaveClear(run, dividend) {
      if (ui) ui.openBetweenWaves(run, dividend);
    },
    onVictory(run) {
      if (ui) ui.showEndScreen(run, true);
    },
    onGameOver(run) {
      if (ui) ui.showEndScreen(run, false);
    },
    onAchievement(ach) {
      if (ui) ui.showAchievementToast(ach);
    }
  });

  ui = new window.MM.UIController(engine);
  engine.startLoop();

  window.MM.engine = engine;
  window.MM.ui = ui;
});
