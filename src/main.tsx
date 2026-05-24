// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./app.tsx";
import "./index.css";
import { PaletteModeProvider } from "./lib/context/palettemodecontext.tsx";
import ThemeWrapper from "./components/common/themewrapper.tsx";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
	<React.StrictMode>
		<QueryClientProvider client={queryClient}>
			<BrowserRouter>
				<PaletteModeProvider>
					<ThemeWrapper>
						<App />
					</ThemeWrapper>
				</PaletteModeProvider>
			</BrowserRouter>
		</QueryClientProvider>
	</React.StrictMode>,
);
