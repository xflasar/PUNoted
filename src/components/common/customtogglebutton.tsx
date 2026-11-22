import { alpha, ToggleButton, type ToggleButtonProps } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import { Square, SquareCheckBig } from "lucide-react";

const customToggleButtonSx: SxProps<Theme> = (theme) => ({
	height: 40,
	px: 2,
	textTransform: "none",
	gap: 0.5,
	whiteSpace: "nowrap",
	backgroundColor: "transparent",
	color: theme.palette.common.white,
	"&.Mui-selected": {
		backgroundColor: alpha(theme.palette.primary.main, 0.5),
	},
	"&:hover": {
		backgroundColor: alpha(theme.palette.common.white, 0.25),
	},
});

const CustomToggleButton = ({
	children,
	selected = false,
	sx,
	...props
}: ToggleButtonProps) => (
	<ToggleButton {...props} selected={selected} sx={[customToggleButtonSx, sx]}>
		{selected ? (
			<SquareCheckBig className="inline-icon" />
		) : (
			<Square className="inline-icon" />
		)}
		{children}
	</ToggleButton>
);

export default CustomToggleButton;
