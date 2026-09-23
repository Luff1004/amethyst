/*
  GAME CONFIG
  unlockCodex : true  -> the codex shows EVERY cutscene (names visible, replay enabled) so you can review them.
                false -> normal game: undiscovered cutscenes show as ???
                Auto-true on localhost/127.0.0.1/file:// (so review mode never needs a manual toggle
                when testing locally) and always false anywhere else (the deployed/shared link).
*/
const LOCAL_HOST = ['localhost', '127.0.0.1', ''].includes(location.hostname);
G.config = {
  unlockCodex: LOCAL_HOST,
};
