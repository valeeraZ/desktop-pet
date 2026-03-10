# Desktop Pet

Desktop Pet is an experiment for turning a user's real pet photo or video into an interactive animated companion.

The project is being developed in two stages:

1. Chrome extension MVP: run the pet inside webpages as a floating interactive widget.
2. macOS app: evolve the same pet profile and behavior system into a true desktop pet.

## Repository layout

- `desktop-pet-extension/`: current Chrome extension MVP implementation.
- `docs/superpowers/specs/`: product and technical design specs.
- `docs/superpowers/plans/`: phased implementation plans.

## Current MVP

The Chrome extension MVP currently supports:

- Uploading one pet image from the popup UI.
- Saving the normalized pet profile in local extension storage.
- Rendering a floating pet panel on regular webpages.
- Basic pet behavior states: `idle`, `walk`, `jump`.
- Simple interactions: click to jump, toy mode to chase the cursor, drag to reposition.

## Run locally

1. Open `chrome://extensions`.
2. Enable Developer Mode.
3. Click Load unpacked.
4. Select `/Users/sylvain/Work/desktop-pet/desktop-pet-extension`.
5. Open any regular `http` or `https` page.
6. Use the extension popup to upload an image and show the pet.

## Notes

- The current MVP is template-driven animation, not AI-generated motion.
- Video processing, AI-assisted rigging, and the macOS app are planned next phases.
