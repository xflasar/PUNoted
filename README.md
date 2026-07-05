# PUNoted Frontend

Frontend for https://github.com/xflasar/PUNoted-API
Built with React, TypeScript, and Vite.

## Development

1. Copy environment file: `cp .env.sample .env`
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`

The frontend will be served at `http://localhost:5174`.

It expects the API to be available at `http://localhost:9900/` which can be changed, or pointed to the production API, in `.env`.

## Building for Production

```bash
npm run build
```

To preview the production build locally:

```bash
npm run preview
```

## Tech Stack

- **Framework:** React 19
- **Language:** TypeScript
- **Build Tool:** Vite + SWC
- **UI/Styling:** Material UI (MUI), Emotion, Lucide React
- **Data Visualization:** Deck.gl, Recharts, React Flow
- **State/Data Management:** React Query, React Router DOM

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.
