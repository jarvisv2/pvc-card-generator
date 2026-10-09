PVC Card Maker Pro — Full Project Package

This ZIP contains the patched index.html plus every CSS stylesheet and the visual-motion.js file supplied for the project.

Changes in this version:
- Removed the 86 × 54 mm and 87 × 55 mm size presets; CR80, 86.6 × 54.4 mm, and Custom remain available.
- Restyled the Print button with a vivid blue-violet gradient, matching hover/focus states, and improved contrast.
- Moved the theme selector into the centered gap between the A4 card-count metadata and the Dragon Sheet controls.
- Removed the Default theme button; only Dark and Vivid remain selectable.
- Existing saved "default" theme preferences automatically fall back to Vivid.
- Improved dark-mode contrast for the A4/600 DPI metadata, Dragon Sheet print-mode toggle, and card-slot surfaces/labels/controls.
- Kept the supplied core layout, cropper styles, other theme styles, motion styles, and application logic.

Project structure:
index.html
css/core.css
css/legacy-colorful.css
css/manual-crop.css
css/ultra-theme.css
css/ultra-motion.css
css/final-polish.css
css/theme-switcher.css
css/themes.css
js/visual-motion.js

How to use:
1. Extract the entire ZIP while preserving the css/ and js/ folders.
2. Open index.html in a modern browser, or upload the whole folder to your hosting project.
3. Do not move index.html away from its css/ and js/ folders.

No other app controls or PDF/cropping logic were intentionally changed in this update.

Background motion update:
- Added css/nebula-motion.css with slow aurora drift and luminous ribbon animation for the background.
- Motion is decorative only and does not alter card canvas, cropping, PDF processing, print, or export logic.
- Respects the operating system reduced-motion preference.

Zoom/background refinement (2026-10-09):
- Removed the decorative rounded stage frame that visually crossed behind the zoomed A4 sheet.
- Kept the grid and animated color atmosphere in the stage background only; the sheet canvas remains above these effects and its PDF/print pixels are unchanged.
- Added a slow, theme-aware animated atmospheric gradient, with reduced-motion support.


Brand studio polish (2026-10-09):
- Refined the product title, PRO badge, and DESIGN STUDIO / READY indicators.
- Replaced sharp rectangular social-link plates with compact rounded glass capsules.
- Added theme-specific link styling for Dark and Vivid modes, while preserving the original links and app behavior.
- Added reduced-motion support for new decorative title effects.

Brand Studio visual enhancement: css/brand-studio.css refines the title/PRO badge, metadata pills, and creator links without changing application logic. Keep it beside the other CSS files and do not remove its stylesheet reference from index.html.

Brand Studio 2.0 update (2026-10-09):
- Creator links (Instagram, GitHub, Facebook) stay in one compact row at normal sidebar width.
- Added an animated prism gradient to PVC Card Maker, a glossy animated PRO badge, a flowing underline, subtle capsule shimmer, and lift/glow hover feedback.
- Preserved original profile URLs and all application logic; animations honor prefers-reduced-motion.


Image upload support (2026-10-09):
- Supports JPEG/JPG and PNG alongside PDF through the dedicated Choose PDF / Choose JPG / PNG controls, drag-and-drop, and per-slot Load / Replace File.
- PDF files keep the existing automatic document detection and crop workflow.
- Images intentionally skip auto-detection and open Crop Review with Manual Crop enabled for the front. Choose Edit Back, then Manual Crop, to define the back crop; apply with Use These Crops.
- Images are rendered locally in the browser; no image is uploaded to a server.

LATEST FIX — CALIBRATED e-EPIC + DARK SELECT MENUS
- The supplied e-EPIC_RTE1289156.pdf has been used to calibrate the exact front-left and back-right card rectangles in its upper A4 row; the QR/details and notice areas below are excluded from both crops.
- Added a narrowly-scoped visual layout check for this image-based ECI PDF template so auto-detection can identify it even when PDF text extraction returns no text.
- Existing landscape card-sized and wide two-panel e-EPIC handling remains in place; unrelated document templates are unchanged.
- Dark theme select menus use readable dark backgrounds and light text.
