# iTalkSign — ASL Sign Language Translator

ASL alphabet and number translator with **text-to-sign** and **sign-to-text** modules.  
**Author:** Aime Igirimpuhwe

## Features

- **Text → Sign**: Type text to see ASL hand signs for each letter (A–Z, 0–9)
- **Sign → Text**: Click sign images to build words letter by letter
- **Admin dashboard** (`/admin`): Analytics on usage, letter frequency, sample words
- Uses your local ASL dataset
- Accessible UI with keyboard navigation and ARIA labels
- Responsive layout for mobile and desktop

## Dataset

Place your ASL dataset in the `DATASET` folder with this structure:

```
DATASET/
├── A/
│   └── *.jpg
├── B/
│   └── *.jpg
…
├── Z/
├── 0/
…
└── 9/
```

Each folder should contain one or more images (jpg, jpeg, png, gif) for that letter or digit.

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Build

```bash
npm run build
```

The build outputs to `dist/`. For production, serve the `dist` folder and ensure `DATASET` is available at `/DATASET/` (e.g., by copying or symlinking into `public/` before build).

## Tech Stack

- Vite + React + TypeScript
- Dataset manifest generated at build/dev start
