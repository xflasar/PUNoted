# StarMap Feature

## Overview

The StarMap feature provides an interactive visualization of a galaxy map. It allows users to explore star systems, view sectors of space, and zoom in to individual systems to see planets and their orbits. The map is built using `deck.gl` for high-performance, GPU-accelerated rendering of large datasets.

The two primary views are:

1.  **Galaxy View**: A top-down view of all systems and sectors.
2.  **System View**: A zoomed-in view of a single star system, showing planets, their orbits, and other details.

## File Structure

The StarMap code is organized into a modular structure to separate concerns, following Clean Code and Single Responsibility Principles.

```
/StarMap
├── components/       # React components for UI elements (overlays, controls)
│   ├── controls/
│   ├── overlays/
│   └── ...
├── constants/        # Constant values for map settings (zoom levels, colors)
├── hooks/            # Custom React hooks for state management and logic
├── layers/           # Functions to create specific deck.gl layers
├── types/            # TypeScript type definitions for map data
├── utils/            # Helper functions for calculations (geometry, colors)
├── workers/          # Web workers for expensive computations (not yet fully implemented)
└── StarMapDeckGL.tsx # The main component that orchestrates the feature
```

## Core Components & Logic

### `StarMapDeckGL.tsx`

This is the main entry point for the StarMap feature. It acts as an **orchestrator**, bringing together all the hooks and components. Its primary responsibilities are:

- Managing the top-level state (e.g., the currently selected system).
- Calling the various custom hooks to manage data, state, and logic.
- Rendering the `DeckGL` canvas and the UI overlay components.

### Custom Hooks (`/hooks`)

The core logic is encapsulated within custom React hooks to keep the main component clean and maintainable.

- **`useMapData`**: Handles all data fetching from the API (`/api/dashboard_map`) and processes the raw data into a usable format for the map (systems, planets, sectors).
- **`useSystemViewSetup`**: Contains the logic that runs when a user enters a system view. It calculates orbit paths, scales planets, and prepares system-specific stats.
- **`useAnimation`**: Manages the animation loop (`requestAnimationFrame`) for calculating the real-time positions of planets in their orbits.
- **`useViewNavigation`**: Encapsulates all user navigation logic, including panning, zooming, clicking to enter a system, and automatically zooming into the nearest system.
- **`useMapLayers`**: Creates and manages all the `deck.gl` layers. It takes the processed data and view state and returns the final array of layers to be rendered.

### UI Components (`/components`)

The UI is broken down into smaller, reusable components:

- **Overlays (`/overlays`)**: Components that are rendered on top of the map, such as the loading spinner (`StatusOverlay`) and the mouse-over tooltip (`TooltipOverlay`).
- **Controls (`/controls`)**: Interactive UI elements, including the main `MapControls` panel, the `SystemExitButton`, and the `PopulationLegend`.
- Other components like `PlanetInfoBox` and `SystemStatsBox` display detailed information when an item is selected.

## How It Works

1.  **Data Fetching**: `useMapData` fetches system, planet, and sector data from the backend.
2.  **Orchestration**: `StarMapDeckGL.tsx` initializes all the hooks and manages the central state.
3.  **Navigation**: `useViewNavigation` listens to user input (clicks, zoom) and updates the view state (e.g., switching from galaxy to system view).
4.  **System Setup**: When a system is selected, `useSystemViewSetup` prepares all the necessary data for that system's view (e.g., orbit lines).
5.  **Animation**: `useAnimation` runs a continuous loop to update the positions of planets, creating the orbital motion effect.
6.  **Layer Generation**: `useMapLayers` takes all the current data and state from the other hooks and generates the visual layers (e.g., `ScatterplotLayer` for systems, `PathLayer` for orbits).
7.  **Rendering**: The main component passes the view state and layers to the `DeckGL` component, which renders the map. UI components are rendered on top to provide information and controls.
