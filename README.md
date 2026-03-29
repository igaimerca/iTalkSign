# iTalkSign — ASL Sign Language Translator

A web app that translates between text and American Sign Language (ASL). Type text to see hand signs, or click signs to build words.

**Author:** Aime Igirimpuhwe

## What You'll Need

- Node.js (version 16 or higher)
- npm (comes with Node.js)
- ASL hand sign images (jpg, png, or gif)

## Quick Setup

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd iTalkSign
npm install
```

### 2. Add Your ASL Images

The app needs hand sign images in a `DATASET` folder. The project already has the folder structure ready - you just need to add your images:

```
DATASET/
├── A/
│   └── your_A_sign.jpg
├── B/
│   └── your_B_sign.jpg
├── C/
│   └── your_C_sign.png
├── ...
├── Z/
│   └── your_Z_sign.gif
├── 0/
│   └── your_0_sign.jpg
├── ...
└── 9/
    └── your_9_sign.jpg
```

**Important:** Each folder (A-Z, 0-9) needs at least one image file. The app automatically picks the first image it finds in each folder.

### 3. Run the App

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

That's it! The app will automatically generate a dataset manifest and start running.

## What the App Does

- **Text → Sign**: Type any text and see ASL signs for each letter and number
- **Sign → Text**: Click on sign images to build words letter by letter  
- **Admin Dashboard**: Visit `/admin` to see usage analytics and popular letters
- **Voice Input**: Use your microphone to convert speech to signs (experimental)

## For Production

```bash
npm run build
```

This creates a `dist/` folder. Deploy this folder to any web server. Make sure the `DATASET` folder is accessible at `/DATASET/` on your server (copy it to your public folder or create a symlink).

## Tech Stack

Built with Vite, React, and TypeScript. The dataset manifest is automatically generated when you start the app or build for production.
