import { createTheme, type PaletteMode } from "@mui/material";

// 1. Extend the Mui theme type definitions to include 'tableCategory'
declare module "@mui/material/styles" {
	interface TypeBackground {
		tableCategory: string;
	}
	interface BreakpointOverrides {
		xs: true;
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
				sm: 600,
				md: 900,
				lg: 1200,
				xl: 1536,
			},
		},
		palette: {
			primary: {
				main: "#7B68EE",
				light: "#9988ff",
				dark: "#5a48cc",
				contrastText: "#ffffff",
			},
			secondary: {
				main: "#00e5ff",
				contrastText: "#000000",
			},
			tertiary: {
				main: "rgba(247, 168, 5, 0.8)",
			},
			success: {
				main: "#69f0ae",
			},
			warning: {
				main: "#ffd700",
			},
			error: {
				main: "#ff5252",
			},
			text: {
				primary: "rgba(255,255,255,0.92)",
				secondary: "rgba(255,255,255,0.6)",
			},
			background: {
				paper: "rgba(16, 16, 32, 0.5)",
				tableCategory: "rgba(123, 104, 238, 0.2)",
				default: "#0B0B1E",
			},
			mode,
		},
		components: {
			MuiPaper: {
				styleOverrides: {
					root: {
						backgroundColor: "rgba(16, 16, 32, 0.5)",
						backgroundImage: "none",
						backdropFilter: "blur(15px)",
						border: "1px solid rgba(123, 104, 238, 0.2)",
						boxShadow: "0 4px 20px rgba(0, 0, 0, 0.4)",
						borderRadius: "12px",
					},
				},
			},
			MuiCard: {
				styleOverrides: {
					root: {
						backgroundColor: "rgba(16, 16, 32, 0.5)",
						backgroundImage: "none",
						backdropFilter: "blur(15px)",
						border: "1px solid rgba(123, 104, 238, 0.2)",
						boxShadow: "0 4px 20px rgba(0, 0, 0, 0.4)",
						borderRadius: "12px",
					},
				},
			},
			MuiDialog: {
				styleOverrides: {
					paper: {
						backgroundColor: "rgba(16, 16, 32, 0.95)",
						border: "1px solid rgba(123, 104, 238, 0.3)",
						borderRadius: "12px",
						boxShadow: "0 8px 32px rgba(0, 0, 0, 0.6)",
					},
				},
			},
			MuiTooltip: {
				styleOverrides: {
					tooltip: {
						backgroundColor: "rgba(16, 16, 32, 0.95)",
						border: "1px solid rgba(123, 104, 238, 0.35)",
						backdropFilter: "blur(12px)",
						boxShadow: "0 4px 20px rgba(0, 0, 0, 0.6)",
						fontSize: "0.72rem",
						fontWeight: 600,
						color: "#ffffff",
						borderRadius: "8px",
						padding: "6px 10px",
					},
					arrow: {
						color: "rgba(16, 16, 32, 0.95)",
					},
				},
			},
			MuiOutlinedInput: {
				styleOverrides: {
					root: {
						backgroundColor: "rgba(0, 0, 0, 0.4)",
						color: "#ffffff",
						borderRadius: "8px",
						"& fieldset": {
							borderColor: "rgba(123, 104, 238, 0.2)",
						},
						"&:hover fieldset": {
							borderColor: "rgba(123, 104, 238, 0.4) !important",
						},
						"&.Mui-focused fieldset": {
							borderColor: "#7B68EE !important",
						},
					},
				},
			},
			MuiTableCell: {
				styleOverrides: {
					root: {
						borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
					},
					head: {
						backgroundColor: "rgba(16, 16, 32, 0.95)",
						color: "#7B68EE",
						fontWeight: 800,
					},
				},
			},
			MuiMenu: {
				styleOverrides: {
					paper: {
						backgroundColor: "rgba(16, 16, 32, 0.95) !important",
						border: "1px solid rgba(123, 104, 238, 0.3)",
						boxShadow: "0 8px 24px rgba(0, 0, 0, 0.6)",
					},
				},
			},
			MuiAutocomplete: {
				styleOverrides: {
					paper: {
						backgroundColor: "rgba(16, 16, 32, 0.95) !important",
						border: "1px solid rgba(123, 104, 238, 0.3)",
					},
				},
			},
			MuiCssBaseline: {
				styleOverrides: {
					select: {
						backgroundColor: "rgba(0, 0, 0, 0.4)",
					},
					body: {
						backgroundColor: "#0B0B1E",
						scrollbarColor: "rgba(123, 104, 238, 0.8) rgba(43, 43, 43, 0.2)",
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
						background: "rgba(123, 104, 238, 0.8)",
						borderRadius: "10px",
					},
					"&::-webkit-scrollbar-thumb:hover": {
						background: "rgba(123, 104, 238, 1)",
					},
					// Hide Chrome/Safari/Firefox number spinner arrows globally
					"& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button":
						{
							WebkitAppearance: "none",
							margin: 0,
						},
					"& input[type=number]": {
						MozAppearance: "textfield",
					},
				},
			},
		},
	});
