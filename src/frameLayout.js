import calibration from './frameCalibration.json';

const PLATE_RATIO = 1672 / 941;
export function getFrameStyle(index) {
  const { scale, dx, dy } = calibration.frames[index];
  return { transformOrigin: '0 0', transform: `translate(${dx * 100}%, ${dy * 100}%) scale(${scale})` };
}

export function getSequenceLayout(width, height) {
  if (width < 900) {
    // Fit the widest corrected silhouette once for the entire sequence.
    // Fitting each angle independently would reintroduce the shrinking side view.
    const carWidth = width * calibration.mobileCanvasWidthRatio;
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
  const rightLimit = width <= 1100 ? width * .98 - 156 - 20 : width * .97 - 184 - 20;
  const carWidth = Math.min(originalWidth, (rightLimit - leftLimit) / (2 * calibration.maxVisibleRadius));
  const radius = carWidth * calibration.maxVisibleRadius;
  const anchorX = Math.max(leftLimit + radius, Math.min(originalAnchorX, rightLimit - radius));
  const carHeight = carWidth / PLATE_RATIO;
  return { width: carWidth, height: carHeight, left: anchorX - carWidth * calibration.anchorX, top: groundY - carHeight * calibration.anchorY };
}
