import { check } from '@tauri-apps/plugin-updater';

export async function testUpdater() {
  try {
    const update = await check();

    console.log('Update result:', update);

    if (update) {
      console.log('Version:', update.version);
    } else {
      console.log('No update available');
    }
  } catch (error) {
    console.error('Updater error:', error);
  }
}