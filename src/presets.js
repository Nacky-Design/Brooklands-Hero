import manifest from './sequenceManifest.json';

export const PRESETS = [
  { id: 'silver', label: 'Silver', thumbnail: 'assets/turntable-v1/frame-00.webp' },
  { id: 'carmine', label: 'Carmine', thumbnail: 'assets/presets-preview/carmine-00.webp' },
  { id: 'oak-green', label: 'Oak Green', thumbnail: 'assets/presets-preview/oak-green-00.webp' },
];
export function presetFrameFile(index, preset = 'silver') {
  if (!PRESETS.some(option => option.id === preset)) throw new Error(`Unknown preset: ${preset}`);
  return preset === 'silver' ? manifest.frames[index].file : `assets/presets/${preset}/frame-${manifest.frames[index].id}.webp`;
}
