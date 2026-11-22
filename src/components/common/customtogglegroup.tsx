import {
	alpha,
	ToggleButtonGroup,
	type ToggleButtonGroupProps,
} from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";

const customToggleGroupSx: SxProps<Theme> = (theme) => ({
	height: 40,
	borderRadius: "12px",
	"& .MuiToggleButtonGroup-grouped": {
		px: 2,
		textTransform: "none",
	},
});

const CustomToggleGroup = ({
	size = "small",
	sx,
	...props
}: ToggleButtonGroupProps) => (
	<ToggleButtonGroup {...props} size={size} sx={[customToggleGroupSx, sx]} />
);

export default CustomToggleGroup;
