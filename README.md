# Gear Command Center // Developer Documentation

**Version:** 5.0 (Smart Compatibility Update)  
**Author:** Rui  
**Status:** Stable / Production Ready

## 1\. Project Overview

**Gear Command Center** (internally `RUI.DB`) is a client-side Single Page Application (SPA) designed for photographers to manage gear inventory, visualize focal length coverage, calculate loadout weights, and analyze compatibility between camera bodies and lenses.

It operates entirely in the browser using HTML5, Tailwind CSS (via CDN), and Vanilla JavaScript, requiring no build steps or backend server.

### Key Features

  * **Inventory Management:** CRUD operations backed by `localStorage`.
  * **Focal Field Simulator:** A canvas-based, fixed 3:2 aspect ratio visualization of focal ranges.
  * **Smart Compatibility Engine:** Real-time checking of Mount and Sensor Format (Full Frame vs APS-C) compatibility.
  * **EXIF Detective:** Drag-and-drop analysis to identify lenses from photo metadata.
  * **AI Assistant:** Integrated Google Gemini API for context-aware gear advice.
  * **Weight Loadout Calculator:** Dynamic summing of selected gear weight.

-----

## 2\. Technical Stack

The project utilizes a "No-Build" architecture. All dependencies are loaded via CDN.

| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **Core** | HTML5 / ES6 JavaScript | Structure and Logic |
| **Styling** | Tailwind CSS (CDN) | Utility-first styling |
| **Icons** | FontAwesome 6 | UI Icons |
| **Fonts** | Google Fonts (Inter, JetBrains Mono) | Typography |
| **Markdown** | Marked.js | Rendering AI responses |
| **Metadata** | Exif-js | Reading photo metadata for "Detective" mode |
| **Data Persistence** | `localStorage` + JSON | Browser-based database |

-----

## 3\. Installation & Setup

Because the app uses `fetch()` to load the initial JSON database, browser CORS (Cross-Origin Resource Sharing) policies prevent it from running via the `file://` protocol (double-clicking the HTML file).

### Prerequisites

  * A modern web browser (Chrome, Firefox, Edge).
  * A code editor (VS Code recommended).

### Running Locally

1.  **Clone/Download** the repository containing `index.html` and `lenses.json`.
2.  **Start a Local Server**:
      * **VS Code:** Install the "Live Server" extension, right-click `index.html`, and select "Open with Live Server".
      * **Python:** Open terminal in the folder and run `python -m http.server`.
      * **Node:** Run `npx serve`.
3.  **Access:** Open `http://localhost:5500` (or the port specified).

-----

## 4\. Data Architecture (`lenses.json`)

The application relies on a strict JSON schema. The `gearList` global array holds these objects.

### Schema Definition

```json
{
  "id": "number | unique identifier (timestamp for new items)",
  "name": "string | Display name",
  "type": "string | 'Body', 'Prime', 'Zoom', 'Tele-Zoom', 'Wide-Zoom'",
  "mount": "string | Critical for compatibility (e.g., 'Sony E', 'Canon RF')",
  "sensorFormat": "string | 'Full Frame', 'APS-C', 'MFT'",
  "aperture": "string | e.g., 'f/2.8'",
  "focalLength": "string | e.g., '24-70mm' or '50mm'",
  "minFocus": "string | e.g., '0.38m'",
  "magnification": "string | e.g., '0.19x'",
  "filterSize": "string | e.g., '82mm'",
  "weight": "string | Must end in 'g' for calculation (e.g., '650g')",
  "price": "number | Asset tracking",
  "image": "string | URL to product image",
  "link": "string | URL to official specs"
}
```

### Persistence Logic

1.  **On Load:** App attempts to fetch `lenses.json`.
2.  **Cache Sync:** If fetch succeeds, data is saved to `localStorage` key `my_lens_db_v5`.
3.  **Fallback:** If fetch fails (offline), data is loaded from `localStorage`.
4.  **On Edit/Add:** Changes are written immediately to `localStorage`.
5.  **Export:** User can download the current state as a `.json` file to overwrite the original source.

-----

## 5\. Core Logic Documentation

### A. The Compatibility Engine

Located inside `renderGrid()`, this logic runs every time the grid re-renders.

1.  **Identify Active Body:** Scans `loadoutSet` (selected items) for an item with `type === 'Body'`.
2.  **Comparison:** Iterates through all lenses.
      * **Mount Check:** If `lens.mount !== body.mount`, the card is flagged `incompatible` (Disabled, Opacity 30%, Red Warning).
      * **Crop Mode Check:** If `body.format === 'Full Frame'` and `lens.format === 'APS-C'`, the card is flagged `crop` (Yellow Border, Yellow Warning).
3.  **Visual Feedback:** CSS classes `.state-incompatible` and `.state-crop` handle the UI changes.

### B. Focal Field Simulator (Canvas)

Located in `drawFOV()`.

  * **Aspect Ratio:** The container is locked to `aspect-[3/2]` via Tailwind.
  * **Resolution Handling:** The canvas uses `window.devicePixelRatio` to ensure sharp rendering on Retina displays.
  * **Math:**
      * Base Viewport = 16mm (widest full-frame reference).
      * Scale Factor = `16 / currentLensFocalLength`.
      * Rectangle Calculation: `width = canvasWidth * ScaleFactor`.
      * Centering: `(canvasWidth - rectWidth) / 2`.

### C. EXIF Detective

Uses the `ondrop` and `ondragover` HTML API.

1.  **File Parsing:** Passes the dropped file to `EXIF.getData()`.
2.  **Extraction:** Reads `FocalLength` and `Model`.
3.  **Matching:**
      * Converts parsed focal length to Integer.
      * Iterates DB:
          * **Primes:** Checks matches within ±2mm tolerance.
          * **Zooms:** Checks if the focal length falls between Min and Max range.
4.  **UI Feedback:** Adds `.active-pulse` class to matching cards and scrolls them into view.

-----

## 6\. API Integration (Gemini AI)

The app connects directly to Google's Generative Language API.

  * **Endpoint:** `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`
  * **Authentication:** API Key is required. It is stored in `localStorage` (`gemini_api_key`) for convenience but is never transmitted to any server other than Google.
  * **Context Injection:** The user's prompt is automatically prefixed with:
    > "My Gear: [JSON Data]. Question: [User Prompt]. Answer concisely in markdown."

-----

## 7\. Customization Guide

### Changing Color Scheme

The app uses a custom Tailwind configuration in the `<head>`:

```javascript
colors: {
    'sony-orange': '#D44500', // Primary Brand Color
    'incompatible': '#333333',
}
```

Change `#D44500` to your preferred brand color (e.g., `#DC2626` for Canon Red, `#FFE100` for Nikon Yellow).

### Adding New Mounts

No code change is required. Simply add a lens via the "Add Gear" modal and type a new Mount name (e.g., "Fuji X"). The filtering logic is dynamic and will automatically create a new tag in the filter matrix.

-----

## 8\. Troubleshooting

  * **"Images are broken":** Ensure the URLs in `lenses.json` are direct links to images (ending in .jpg/.png) and allow hotlinking.
  * **"JSON won't load":** Check the console (F12). If you see a CORS error, you are likely opening the file directly. Use a local server (See Section 3).
  * **"Changes disappear after reload":** If you are relying on `localStorage`, ensure you haven't cleared your browser cache. Always use the "Download JSON" button to backup your data permanently.