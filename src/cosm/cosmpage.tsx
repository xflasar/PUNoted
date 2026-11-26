import React, { useState } from "react";
import {
	Box,
	Paper,
	Tabs,
	Tab,
	Tooltip,
	Container,
	useMediaQuery,
	type TabProps,
} from "@mui/material";
import { alpha, useTheme } from "@mui/system";
import ProductionDashboard from "./shipproduction/productiondashboard";
import { useNavigate, useSearchParams } from "react-router-dom";
import VendorsList from "./vendors/vendorlist";
import {
	DollarSign,
	LogOut,
	Rocket,
	ShoppingBasket,
	Store,
} from "lucide-react";
import StorefrontIcon from "@mui/icons-material/Storefront";
import MainDashboard from "./pricelist/maindashboard";
import ShippingMap from "./shipping/shippingmap";
import AuthenticationBox from "../landingpage/auth/authenticationbox";
//import ShippingBoard from './shipping/shippingboard';

const VENDOR_TABS = ["vendors", "cart", "store"] as const;

type VendorTab = (typeof VENDOR_TABS)[number];

const isVendorTab = (tab: string): tab is VendorTab =>
	VENDOR_TABS.includes(tab as VendorTab);

const TabPanel = ({
	children,
	value,
	index,
	keepMounted,
	...other
}: {
	children: React.ReactNode;
	value: string;
	index: string;
	keepMounted: boolean;
}) => {
	const isActive = value === index;
	return (
		<Box
			role="tabpanel"
			hidden={!isActive}
			id={`tabpanel-${index}`}
			aria-labelledby={`tab-${index}`}
			sx={{ height: "100%", maxHeight: "100%" }}
			{...other}
		>
			{(isActive || keepMounted) && (
				<Box sx={{ height: "100%" }}>{children}</Box>
			)}
		</Box>
	);
};

const ShipProductionTab = ({ isMobile }: { isMobile: boolean }) => {
	return (
		<Container
			id="Container"
			sx={{
				minWidth: "100%",
				maxHeight: "100%",
				height: "100%",
				p: 0,
			}}
		>
			<ProductionDashboard isMobile={isMobile} />
		</Container>
	);
};

const NavTab = ({ tooltip, ...props }: TabProps & { tooltip: string }) => (
	<Tooltip title={tooltip} arrow>
		<Tab {...props} />
	</Tooltip>
);

const CosmPage = ({
	isLoggedIn = false,
	onLoginSuccess,
}: {
	isLoggedIn?: boolean;
	onLoginSuccess: () => void;
}) => {
	const [searchParams, setSearchParams] = useSearchParams();
	const navigate = useNavigate();
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
	const isCompactNavbar = useMediaQuery(theme.breakpoints.down("md"));
	const [showAuthentication, setShowAuthentication] = useState(false);

	// Get the current tab value from the URL or default to Market.
	const tabValue = searchParams.get("tab") || "vendors";
	const activePanel = isVendorTab(tabValue) ? "vendors" : tabValue;
	const [visitedPanels, setVisitedPanels] = useState(
		() => new Set([activePanel]),
	);

	const handleTabChange = (_event: React.SyntheticEvent, newValue: string) => {
		if (newValue === "homepage") {
			navigate("/");
		} else {
			const panel = isVendorTab(newValue) ? "vendors" : newValue;
			setVisitedPanels((panels) =>
				panels.has(panel) ? panels : new Set(panels).add(panel),
			);
			setSearchParams({ tab: newValue });
		}
	};

	// Shared hover styles for all tabs
	const tabHoverStyles = {
		minHeight: 56,
		transition: "background-color 0.2s ease",
		"&:hover": {
			backgroundColor: alpha(theme.palette.primary.main, 0.1),
			color: "primary.main",
		},
		"&.Mui-selected": {
			backgroundColor: alpha(theme.palette.primary.main, 0.1),
		},
	};

	return (
		<Container
			disableGutters
			sx={{
				width: "100vw",
				minWidth: "100%",
				height: "100dvh",
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
					bgcolor: alpha(theme.palette.common.white, 0.06),
					border: "none",
					boxShadow: "none",
					borderRadius: 0,
					mt: -2,
					mx: -2,
				}}
			>
				<Tabs
					value={tabValue}
					onChange={handleTabChange}
					textColor="primary"
					indicatorColor="primary"
					variant={isCompactNavbar ? "scrollable" : "fullWidth"}
					scrollButtons="auto"
					allowScrollButtonsMobile
					aria-label="cosm page tabs"
					sx={{
						position: "relative",
						[theme.breakpoints.down("md")]: {
							"& .MuiTabs-list": {
								minWidth: "100%",
							},
							"& .MuiTab-root": {
								flex: "1 0 100px",
							},
						},
						"& > .MuiTabScrollButton-root": {
							position: "absolute",
							top: 0,
							bottom: 0,
							zIndex: 1,
							background: theme.palette.background.surface,
							opacity: 1,
						},
						"& > .MuiTabScrollButton-root:first-of-type": {
							left: 0,
							color: theme.palette.primary.dark,
						},
						"& > .MuiTabScrollButton-root:last-of-type": {
							right: 0,
							color: theme.palette.primary.dark,
						},
						"& .MuiTabScrollButton-root.Mui-disabled": {
							display: "none",
						},
					}}
				>
					<NavTab
						tooltip="See what you can buy and sell on the PX"
						label="Market"
						icon={
							<Store className="inline-icon" style={{ fontSize: "1.5rem" }} />
						}
						iconPosition={isCompactNavbar ? "top" : "start"}
						value="vendors"
						sx={tabHoverStyles}
					/>
					<NavTab
						tooltip="Get CONTDs for mixed vendors and materials"
						label="Cart"
						icon={
							<ShoppingBasket
								className="inline-icon"
								style={{ fontSize: "1.5rem" }}
							/>
						}
						iconPosition={isCompactNavbar ? "top" : "start"}
						value="cart"
						sx={tabHoverStyles}
					/>
					<NavTab
						tooltip="List materials on your own PX store"
						label="Store"
						icon={
							<StorefrontIcon
								className="inline-icon"
								style={{ fontSize: "1.5rem" }}
							/>
						}
						iconPosition={isCompactNavbar ? "top" : "start"}
						value="store"
						sx={tabHoverStyles}
					/>
					<NavTab
						tooltip="Lookup COSM prices and copy CONTDs"
						label="Prices"
						icon={
							<DollarSign
								className="inline-icon"
								style={{ fontSize: "1.5rem" }}
							/>
						}
						iconPosition={isCompactNavbar ? "top" : "start"}
						value="priceList"
						sx={tabHoverStyles}
					/>
					{/* <Tab label="Shipping" icon={<Truck />} iconPosition="start" value="shipping" sx={tabHoverStyles} /> */}
					<NavTab
						tooltip="COSM Shipbuilding operations and orders"
						label="Ships"
						icon={
							<Rocket className="inline-icon" style={{ fontSize: "1.5rem" }} />
						}
						iconPosition={isCompactNavbar ? "top" : "start"}
						value="production"
						sx={tabHoverStyles}
					/>
					<NavTab
						tooltip="Return to PUNoted landing page"
						label="Exit"
						icon={
							<LogOut className="inline-icon" style={{ fontSize: "1.5rem" }} />
						}
						iconPosition={isCompactNavbar ? "top" : "start"}
						value="homepage"
						sx={{
							...tabHoverStyles,
							color: alpha(theme.palette.error.dark, 1),
							backgroundColor: alpha(theme.palette.error.dark, 0.1),
							flex: { md: "0 0 auto" },
							minWidth: { md: 0 },
							"&:hover": {
								color: alpha(theme.palette.error.dark, 1),
								backgroundColor: alpha(theme.palette.error.dark, 0.25),
							},
						}}
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
					pt: 2,
					width: { xs: "100%", sm: "100%" },
				}}
			>
				<TabPanel
					value={activePanel}
					index="vendors"
					keepMounted={visitedPanels.has("vendors")}
				>
					<VendorsList
						loggedIn={isLoggedIn}
						activeTab={isVendorTab(tabValue) ? tabValue : "vendors"}
						onLoginRequest={() => setShowAuthentication(true)}
					/>
				</TabPanel>
				<TabPanel
					value={activePanel}
					index="priceList"
					keepMounted={visitedPanels.has("priceList")}
				>
					<MainDashboard />
				</TabPanel>
				<TabPanel
					value={activePanel}
					index="production"
					keepMounted={visitedPanels.has("production")}
				>
					<ShipProductionTab isMobile={isMobile} />
				</TabPanel>
				<TabPanel
					value={activePanel}
					index="shipping"
					keepMounted={visitedPanels.has("shipping")}
				>
					<ShippingMap />
				</TabPanel>
			</Box>
			{showAuthentication && (
				<AuthenticationBox
					onLoginSuccess={onLoginSuccess}
					onBackToLanding={() => setShowAuthentication(false)}
				/>
			)}
		</Container>
	);
};

export default CosmPage;
