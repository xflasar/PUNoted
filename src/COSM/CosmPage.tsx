import React from "react";
import {
	Typography,
	Box,
	Paper,
	Button,
	Tabs,
	Tab,
	Container,
	useMediaQuery,
} from "@mui/material";
import { alpha, maxHeight, minHeight, useTheme, width } from "@mui/system";
import ProductionDashboard from "./ShipProduction/ProductionDashboard";
import { FaArrowLeft } from "react-icons/fa";
import { useNavigate, useSearchParams } from "react-router-dom";
import VendorsList from "./Vendors/VendorList";
import { DollarSign, Rocket, Store, Truck } from "lucide-react";
import MainDashboard from "./PriceList/MainDashboard";
import ShippingMap from "./Shipping/ShippingMap";
import { minutesInHour } from "date-fns/constants";
//import ShippingBoard from './Shipping/ShippingBoard';

const TabPanel = (props: any) => {
	const { children, value, index, ...other } = props;
	return (
		<Box
			role="tabpanel"
			hidden={value !== index}
			id={`tabpanel-${index}`}
			aria-labelledby={`tab-${index}`}
			sx={{ height: "100%", maxHeight: "100%" }}
			{...other}
		>
			{value === index && <Box sx={{ height: "100%" }}>{children}</Box>}
		</Box>
	);
};

const VendorsTab = ({ isLoggedIn }: { isLoggedIn: boolean }) => {
	return <VendorsList loggedIn={isLoggedIn} />;
};

const ShipProductionTab = ({ isMobile }: { isMobile: boolean }) => {
	return (
		<Container
			id="Container"
			sx={{
				minWidth: "100%",
				maxHeight: "100%",
				height: "100%",
			}}
		>
			<ProductionDashboard isMobile={isMobile} />
		</Container>
	);
};

const CosmPage = ({ isLoggedIn = false }: { isLoggedIn?: boolean }) => {
	const [searchParams, setSearchParams] = useSearchParams();
	const navigate = useNavigate();
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

	// Get the current tab value from the URL or set a default
	const tabValue =
		searchParams.get("tab") || (isLoggedIn ? "vendors" : "production");

	const handleTabChange = (_event: React.SyntheticEvent, newValue: string) => {
		if (newValue === "homepage") {
			navigate("/");
		} else {
			setSearchParams({ tab: newValue });
		}
	};

	// Shared hover styles for all tabs
	const tabHoverStyles = {
		transition: "background-color 0.2s ease",
		"&:hover": {
			backgroundColor: alpha(theme.palette.primary.main, 0.1),
			color: "primary.main",
		},
	};

	return (
		<Container
			sx={{
				width: "100vw",
				minWidth: "100%",
				height: "100vh",
				overflow: "hidden",
				padding: 2,
				boxSizing: "border-box",
				display: "flex",
				flexDirection: "column",
			}}
		>
			<Paper
				square
				sx={{
					bgcolor: alpha(theme.palette.background.default, 1),
					border: "none",
					boxShadow: "none",
					borderRadius: "16px",
				}}
			>
				<Tabs
					value={tabValue}
					onChange={handleTabChange}
					textColor="primary"
					indicatorColor="primary"
					variant={isMobile ? "scrollable" : "fullWidth"}
					scrollButtons
					allowScrollButtonsMobile
					aria-label="cosm page tabs"
					sx={{
						"& .MuiTabs-scrollButtons": {
							color: "primary.main",
							width: "auto",
						},
					}}
				>
					<Tab
						label="Homepage"
						icon={<FaArrowLeft />}
						value="homepage"
						sx={{
							...tabHoverStyles,
							flexGrow: 0,
							minWidth: 100,
							px: { xs: 2, sm: 3 },
						}}
					/>
					<Tab
						label="Vendors"
						icon={<Store />}
						iconPosition="start"
						value="vendors"
						sx={tabHoverStyles}
					/>
					<Tab
						label="Price List"
						icon={<DollarSign />}
						iconPosition="start"
						value="priceList"
						sx={tabHoverStyles}
					/>
					{/* <Tab label="Shipping" icon={<Truck />} iconPosition="start" value="shipping" sx={tabHoverStyles} /> */}
					<Tab
						label="Ship Production"
						icon={<Rocket />}
						iconPosition="start"
						value="production"
						sx={tabHoverStyles}
					/>
				</Tabs>
			</Paper>
			<Box
				id="Table"
				sx={{
					flexGrow: 1,
					background: alpha(theme.palette.background.default, 0.03),
					boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)",
					backdropFilter: "blur(5px)",
					overflow: "hidden",
					pt: 1,
					width: { xs: "100%", sm: "100%" },
				}}
			>
				<TabPanel value={tabValue} index="vendors">
					<VendorsTab isLoggedIn={isLoggedIn} />
				</TabPanel>
				<TabPanel value={tabValue} index="priceList">
					<MainDashboard />
				</TabPanel>
				<TabPanel value={tabValue} index="production">
					<ShipProductionTab isMobile={isMobile} />
				</TabPanel>
				<TabPanel value={tabValue} index="shipping">
					<ShippingMap />
				</TabPanel>
			</Box>
		</Container>
	);
};

export default CosmPage;
