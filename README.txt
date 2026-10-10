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

Interaction polish update (2026-10-10):
- Mirror Sheet is softly tinted when OFF and uses a clearer cyan/blue/violet gradient when ON, in both Dark and Vivid themes.
- Add PDF, Clear All, Print, and Download A4 now use coordinated low-saturation surfaces with gentle hover motion rather than competing neon gradients.
- Choose PDF and Choose JPG / PNG have distinct, subtle gradients for quicker recognition without excessive color pop.
- The updates are visual-only; button IDs, click handlers, and PDF/image processing remain unchanged.
- Added css/interaction-polish.css; keep it alongside the other stylesheets.


BRAND SIGNATURE UPDATE (2026-10-10):
- The final header wordmark uses theme-specific transparent artwork for the approved “PVC Card Maker PRO” design, rather than relying on the browser's available script fonts.
- Added css/brand-signature.css and the assets/ wordmark PNGs; keep both alongside the rest of the project.
- A screen-reader-friendly text heading remains in the header. PDF, image, crop, print, export and card-layout logic are unchanged.


BRAND SIGNATURE REFINEMENT (2026-10-10):
- Refined the signature-style “Maker” with Alex Brush as the preferred calligraphy font, with Allura/Satisfy/local cursive fallbacks.
- Added a flowing gradient swash under “Maker” and subtle cyan glints to better match the approved concept banner.
- Kept theme-specific gradients and compact spacing for Dark and Vivid themes; app behavior remains unchanged.


WORDMARK CONCEPT MATCH (2026-10-10):
- The title now uses the more flourished Alex Brush script first for “Maker,” with Allura/Satisfy/local cursive fallbacks.
- Added the long flowing gradient signature swash, cyan sparkles, and the small star in the PRO badge to more closely echo the approved concept preview.
- Dark and Vivid themes have separate, high-contrast gradients; all changes remain visual-only.


APPROVED WORDMARK ART UPDATE (2026-10-10):
- Replaced the font-dependent text approximation with a theme-specific transparent wordmark artwork cropped from the approved concept preview, so the live header matches the chosen visual more closely across devices.
- Added assets/pvc-card-maker-wordmark-vivid.png and assets/pvc-card-maker-wordmark-dark.png. Keep the assets/ folder beside index.html, css/, and js/.
- Retained an accessible text heading and retained existing brand status/social links. No app logic or PDF/crop/print behavior changed.

WORDMARK COLOR REFINEMENT (2026-10-10):
- Refined the vivid-theme PVC Card lettering to reduce silvery/washed-out highlights and keep a richer electric-blue-to-violet face, while leaving the Maker script styling intact.
- Lifted the dark-theme wordmark brightness and saturation so both the bold PVC Card lettering and the signature Maker lettering read more clearly against navy.
- Only the two existing transparent wordmark PNG assets were color-tuned; HTML structure, theme switching, crop logic, PDF/image processing, print and export behavior remain unchanged.

LOGO REFINEMENT (2026-10-10)
The sidebar logo uses crisp live HTML text with a restrained 3D depth treatment for “PVC Card” and a signature-style “Maker” in both Vivid and Dark themes. The prior raster wordmark layers are hidden to prevent fuzzy or washed-out text at the sidebar's responsive size.

Branding refinement
-------------------
The header wordmark uses css/brand-refinement.css for a crisp dimensional blue/indigo “PVC Card” and a signature-style “Maker”, tuned independently for Vivid and Dark themes. The Alex Brush web font is used when online; local cursive fallbacks preserve the layout if it cannot load. No application logic was changed for this branding adjustment.


Branding note (latest): The header wordmark is rendered with live text in css/brand-clean-final.css. PVC Card uses crisp solid blue/cyan text with controlled depth; Maker uses a signature-style script color per theme. Older wordmark artwork files remain in assets for reference but are not rendered in the header.

BRANDING UPDATE (2026-10-10)
- Added css/brand-calligraphy-finish.css as the final wordmark styling layer.
- The PVC Card wordmark is tuned with crisp dimensional blue/cyan text; Maker keeps a calligraphic treatment with clearer separation and a restrained underline.
- Dark and Vivid themes use different high-contrast colors. Application processing logic and controls are unchanged.
BRAND WORDMARK NOTE
The two pvc-wordmark-reference-*.png files are theme-specific transparent RGBA logo assets. Their backgrounds are intentionally transparent so they blend into the Vivid and Dark theme panels without an image-shaped rectangle. Keep the files in assets/ and preserve their filenames.

LATEST BRAND WORDMARK UPDATE
----------------------------
The header now uses a single live-text wordmark stylesheet at
css/brand-wordmark-redesign.css. “PVC Card” uses a crisp, dimensional blue
finish; “Maker” uses calligraphy-style gradient text; and PRO is a separate
compact badge. Dark and Vivid themes have separate palettes. Legacy logo-art
stylesheets remain in the folder for reference but are no longer loaded by
index.html. No PDF processing, crop, print, export, or card-position logic was
intentionally changed by this branding update.

Brand consistency update: both theme wordmarks share the same display sizing/aspect ratio. Dark artwork receives a subtle brightness/saturation/contrast lift to improve legibility without adding blur.
