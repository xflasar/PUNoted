import { useTheme } from "@mui/material";
import { Globe, Warehouse } from "lucide-react";

const LocationIcon = ({ locationCode }: { locationCode?: string }) => {
	const theme = useTheme();

	return locationCode === "HRT" ? (
		<Warehouse className="inline-icon" color={theme.palette.success.light} />
	) : (
		<Globe className="inline-icon" color={theme.palette.error.light} />
	);
};

export default LocationIcon;
