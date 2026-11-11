# Mobile composition — scoped DIS design QA

Mode: LOCAL_PATCH. Approved source: 0ff24cb, src/main.jsx, src/style.css,
source image calibration and the rendered before-mobile.png.

LOCKED: desktop layout, approved copy, logo, Exo2/Manrope, material colors,
all 99 car images and the color correction, sequence behavior, contact data.
EDITABLE: composition below 900px; mobile image scale shared by every angle.
DEPENDENT: mobile navigation contains the booking action removed from its
crowded header; existing booking/CTA prototype behavior is retained.

Changes: one architectural scene; readable mobile hierarchy; 44px touch actions;
city and phone on their own header row; larger consistent car scale; material
stripes on compact preset buttons; rotation immediately below presets; safe-area
padding. Original image files and desktop geometry are preserved.

Evidence: qa.json and internal viewport screenshots cover 320, 360, 390 (two
heights), 440, 600, 768, 844 landscape, 899, 900, 1440, 1920. Actual Chromium
renders, font readiness, DOM geometry and touch input were checked. Desktop
1440 screenshot with and without the mobile stylesheet is byte-identical.

Manual visual review: 320/390 portrait and 768 tablet inspected against the
approved visual language. Text, car, material selection and rotation form one
reading sequence. The architectural background communicates the same premium
atelier setting, while the slanted display and palette stripes retain sportiness.

Compliance: PASS within the tested prototype scope. Artistic judgment remains
subject to user review. Impeccable / Playwriter: not_connected; QA used Playwright
and Chromium. Real device performance, production service routes and booking
backend are outside this change; no claim of those being completed.
