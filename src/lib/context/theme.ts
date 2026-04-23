import { createTheme, type PaletteMode } from "@mui/material";

// 1. Extend the Mui theme type definitions to include 'tableCategory'
// This is necessary for TypeScript to recognize the new property.
declare module "@mui/material/styles" {
	interface TypeBackground {
		tableCategory: string;
	}
	interface BreakpointOverrides {
		xs: true; // removes the `xs` breakpoint
		sm: true;
		md: true;
		lg: true;
		xl: true;
	}
}

export const getAppTheme = (mode: PaletteMode) =>
	createTheme({
		breakpoints: {
			values: {
				xs: 0,
				sm: 600, // Tablets / Large Phones
				md: 900, // Small Laptops / Landscape Tablets
				lg: 1200, // Desktops
				xl: 1536, // Large Screens
			},
		},
		palette: {
			primary: {
				main: "rgba(123, 104, 238, 1)",
			},
			text: {
				primary: "rgba(200,200,200,0.9)",
			},
			background: {
				paper:
					"linear-gradient(135deg, rgba(20, 20, 50, 1), rgba(10, 10, 30, 1))",
				tableCategory: "rgba(123, 104, 238, 0.3)",
				default: "#0F0F28",
			},
			mode,
		},
		components: {
			MuiCssBaseline: {
				styleOverrides: {
					// Apply scrollbar styles for Firefox
					body: {
						scrollbarColor: "rgba(123, 104, 238, 1) rgba(43, 43, 43, 0.2)",
						scrollbarWidth: "thin",
					},
					"&::-webkit-scrollbar": {
						width: "5px",
						height: "5px",
					},
					"&::-webkit-scrollbar-track": {
						background: "rgba(43, 43, 43, 0.2)",
						borderRadius: "10px",
					},
					"&::-webkit-scrollbar-thumb": {
						background: "rgba(123, 104, 238, 1)",
						borderRadius: "10px",
					},
					"&::-webkit-scrollbar-thumb:hover": {
						background: "rgba(123, 104, 238, 0.8)",
					},
				},
			},
		},
	});
