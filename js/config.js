/*
  GAME CONFIG
  unlockCodex : true  -> the codex shows EVERY cutscene (names visible, replay enabled) so you can review them.
                false -> normal game: undiscovered cutscenes show as ???
                Auto-true on localhost/127.0.0.1/file:// (so review mode never needs a manual toggle
                when testing locally) and always false anywhere else (the deployed/shared link).
  viewer      : codex-only showcase - the full codex with every cutscene playable and nothing else.
                On with ?codex in the URL, or when a page sets window.AMETHYST_VIEWER before loading
                the game (the luff1004.github.io/amethyst-editor loader does). It never reads or writes
                the save: that page shares an origin (and so localStorage) with the real game.
*/
const LOCAL_HOST = ['localhost', '127.0.0.1', ''].includes(location.hostname);
const VIEWER = !!window.AMETHYST_VIEWER || new URLSearchParams(location.search).has('codex');
G.config = {
  unlockCodex: LOCAL_HOST || VIEWER,
  viewer: VIEWER,
};
if (VIEWER) document.documentElement.classList.add('viewer');
