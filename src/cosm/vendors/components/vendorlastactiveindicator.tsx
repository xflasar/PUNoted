import { Box, Typography } from "@mui/material";
import type { VendorStore } from "../types";

const MINS_PER_DAY = 1440;

const getVendorLastActive = (lastActive: string | undefined) => {
	const match = lastActive?.trim().match(/^(\d+)\s*([mhd])$/i);
	if (!match) return { label: "Inactive", color: "error" };

	const value = Number(match[1]);
	const unit = match[2].toLowerCase();
	const minutes = value * (unit === "m" ? 1 : unit === "h" ? 60 : MINS_PER_DAY);

	const unitName = unit === "m" ? "min" : unit === "h" ? "hr" : "day";
	return {
		label:
			value === 0
				? "<1 min ago"
				: `${value} ${unitName}${value === 1 ? "" : "s"} ago`,
		color:
			minutes < MINS_PER_DAY
				? "success"
				: minutes < 3 * MINS_PER_DAY
					? "warning"
					: "error",
	};
};

const VendorLastActiveIndicator = ({
	vendor,
}: {
	vendor: Pick<VendorStore["vendor"], "activity">;
}) => {
	const lastActive = getVendorLastActive(vendor.activity);

	return (
		<Box
			aria-label={`Vendor last active: ${lastActive.label}`}
			sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}
		>
			<Box
				aria-hidden="true"
				sx={{
					width: 6,
					height: 6,
					borderRadius: "50%",
					bgcolor: `${lastActive.color}.main`,
				}}
			/>
			<Typography component="span" variant="caption">
				{lastActive.label}
			</Typography>
		</Box>
	);
};

export default VendorLastActiveIndicator;
