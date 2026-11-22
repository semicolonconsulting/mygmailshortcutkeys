// Toolbar button and first install both open the settings page.
const ext = globalThis.browser || globalThis.chrome;

ext.action.onClicked.addListener(() => ext.runtime.openOptionsPage());

ext.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') ext.runtime.openOptionsPage();
});
