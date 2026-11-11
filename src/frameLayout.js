import calibration from './sequenceManifest.json';
import previousMidpoint from './legacyMidpoint.json';
import previousRoof from './legacyRoofFrames.json';

const PLATE_RATIO = 1672 / 941;
export function getFrameStyle(index, legacy = false, legacyRoof = false) {
  const frame = calibration.frames[index];
  const { scale, dx, dy } = legacy && frame.id === '01b' ? previousMidpoint : legacyRoof && previousRoof[frame.id] ? previousRoof[frame.id] : frame;
  const pitch = { '05': { angle:-3.5, x:895/1672, y:817/941 }, '05b': { angle:-2.2, x:875/1672, y:810/941 } }[frame.id];
  const correction = pitch ? ` translate(${pitch.x*100}%, ${pitch.y*100}%) rotate(${pitch.angle}deg) translate(${-pitch.x*100}%, ${-pitch.y*100}%)` : '';
  return { transformOrigin: '0 0', transform: `translate(${dx * 100}%, ${dy * 100}%) scale(${scale})${correction}` };
}

export function getSequenceLayout(width, height) {
  if (width < 900) {
    // Fit the widest corrected silhouette once for the entire sequence.
    // Fitting each angle independently would reintroduce the shrinking side view.
    const carWidth = width * calibration.mobileCanvasWidthRatio * .9;
    const carHeight = carWidth / PLATE_RATIO;
    return { width: carWidth, height: carHeight, left: width / 2 - carWidth * calibration.anchorX, top: height * .84 - carHeight * calibration.anchorY };
  }
  // Prefer frame 00 scale and placement; share the background's cover transform.
  const coverWidth = Math.max(width, height * PLATE_RATIO);
  const coverHeight = coverWidth / PLATE_RATIO;
  const originalWidth = coverWidth * .62;
  const originalAnchorX = (width - coverWidth) / 2 + coverWidth * .51 + originalWidth * (calibration.anchorX - .5);
  const groundY = (height - coverHeight) / 2 + coverHeight * .295 + originalWidth / PLATE_RATIO * calibration.anchorY;
  // Reserve the preset column (matching the 900/1100px CSS breakpoints).
  // Fit and centre the whole sequence once, never the currently selected angle.
  const leftLimit = width * .03;
  const rightLimit = width <= 1200 ? width * .98 - 186 - 24 : width * .97 - 250 - 24;
  const carWidth = Math.min(originalWidth, (rightLimit - leftLimit) / (2 * calibration.maxVisibleRadius)) * .9;
  const radius = carWidth * calibration.maxVisibleRadius;
  const anchorX = Math.max(leftLimit + radius, Math.min(originalAnchorX, rightLimit - radius));
  const carHeight = carWidth / PLATE_RATIO;
  return { width: carWidth, height: carHeight, left: anchorX - carWidth * calibration.anchorX, top: groundY - carHeight * calibration.anchorY };
}
