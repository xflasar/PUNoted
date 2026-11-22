import {
	alpha,
	ToggleButton,
	Tooltip,
	type ToggleButtonProps,
} from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import { Square, SquareCheckBig } from "lucide-react";
import type { ReactNode } from "react";

type CustomToggleButtonProps = ToggleButtonProps & {
	activeColor?: string;
	showIcon?: boolean;
	tooltip?: ReactNode;
};

const customToggleButtonSx =
	(activeColor?: string): SxProps<Theme> =>
	(theme) => ({
		height: 40,
		px: 2,
		textTransform: "none",
		gap: 0.5,
		whiteSpace: "nowrap",
		backgroundColor: "transparent",
		"& [data-toggle-icon='checked']": {
			display: "none",
		},
		"&.Mui-selected [data-toggle-icon='checked']": {
			display: "inline-flex",
		},
		"&.Mui-selected [data-toggle-icon='unchecked']": {
			display: "none",
		},
		"&&.Mui-selected": {
			backgroundColor: alpha(activeColor ?? theme.palette.primary.main, 0.5),
		},
	});

const CustomToggleButton = ({
	children,
	activeColor,
	showIcon = true,
	sx,
	tooltip,
	...props
}: CustomToggleButtonProps) => {
	const button = (
		<ToggleButton {...props} sx={[customToggleButtonSx(activeColor), sx]}>
			{showIcon && (
				<>
					<span aria-hidden="true" data-toggle-icon="unchecked">
						<Square className="inline-icon" />
					</span>
					<span aria-hidden="true" data-toggle-icon="checked">
						<SquareCheckBig className="inline-icon" />
					</span>
				</>
			)}
			{children}
		</ToggleButton>
	);

	return tooltip ? <Tooltip title={tooltip}>{button}</Tooltip> : button;
};

export default CustomToggleButton;
