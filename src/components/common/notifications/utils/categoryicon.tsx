import {
	DirectionsBoat,
	Inventory2,
	ShowChart,
	PrecisionManufacturing,
	Description,
	AccountBalanceWallet,
	Notifications,
} from "@mui/icons-material";

export const getCategoryIcon = (category: string) => {
	switch (category) {
		case "fleet":
			return <DirectionsBoat sx={{ color: "#4FC3F7", fontSize: "1rem" }} />;
		case "storage":
			return <Inventory2 sx={{ color: "#FFB74D", fontSize: "1rem" }} />;
		case "cx":
			return <ShowChart sx={{ color: "#81C784", fontSize: "1rem" }} />;
		case "production":
			return (
				<PrecisionManufacturing sx={{ color: "#BA68C8", fontSize: "1rem" }} />
			);
		case "contract":
		case "contracts":
			return <Description sx={{ color: "#FFF176", fontSize: "1rem" }} />;
		case "financial":
			return (
				<AccountBalanceWallet sx={{ color: "#64FFDA", fontSize: "1rem" }} />
			);
		case "system":
			return <Notifications sx={{ color: "#64FFDA", fontSize: "1rem" }} />;
		default:
			return <Notifications sx={{ color: "#7B68EE", fontSize: "1rem" }} />;
	}
};
