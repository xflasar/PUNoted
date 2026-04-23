# PUNoted Frontend

A comprehensive web application frontend for managing and analyzing game data, shipments, market prices, and corporate bases. Built with React, TypeScript, and Vite.

> **Note on Testing and Code Style:** This project is currently in early development and does not have any automated testing (Unit or E2E) set up yet. The codebase is actively evolving, and you may encounter relaxed TypeScript typings (e.g., `any`) and varying code styles as features are being prototyped and built.

## 🚀 Fast Start

### Prerequisites

- Node.js (v18 or higher recommended)
- npm (v9 or higher recommended)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/xflasar/PUNoted.git
   cd punoted
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### Running the Project

To start the development server with Hot Module Replacement (HMR):

```bash
npm run dev
```

The application will be available at `http://localhost:5173` by default.

### Building for Production

To build the application for production:

```bash
npm run build
```

To preview the production build locally:

```bash
npm run preview
```

## 🛠️ Development & Tech Stack

- **Framework:** React 19
- **Language:** TypeScript
- **Build Tool:** Vite + SWC
- **UI/Styling:** Material UI (MUI), Emotion, Lucide React
- **Data Visualization:** Deck.gl, Recharts, React Flow
- **State/Data Management:** React Query, React Router DOM

## Contributions

Before any PRs do make sure to run the code wih **Prettier formater** -> Default settings + ESLint. Thank you.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.
