import React, { useState } from "react";
import { Box, Paper, Tabs, Tab, Container, useMediaQuery } from "@mui/material";
import { alpha, useTheme } from "@mui/system";
import ProductionDashboard from "./shipproduction/productiondashboard";
import { FaArrowLeft } from "react-icons/fa";
import { useNavigate, useSearchParams } from "react-router-dom";
import VendorsList from "./vendors/vendorlist";
import { DollarSign, Rocket, ShoppingBasket, Store } from "lucide-react";
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
	};

	return (
		<Container
			sx={{
				width: "100vw",
				minWidth: "100%",
				height: "100vh",
				overflow: "hidden",
				padding: { xs: 0.5, sm: 2 },
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
						label="Home"
						icon={<FaArrowLeft />}
						iconPosition="start"
						value="homepage"
						sx={{
							...tabHoverStyles,
							flexGrow: 0,
							minWidth: 120,
							px: { xs: 2, sm: 3 },
						}}
					/>
					<Tab
						label="Market"
						icon={<Store />}
						iconPosition="start"
						value="vendors"
						sx={tabHoverStyles}
					/>
					<Tab
						label="Cart"
						icon={<ShoppingBasket />}
						iconPosition="start"
						value="cart"
						sx={tabHoverStyles}
					/>
					<Tab
						label="Store"
						icon={<StorefrontIcon />}
						iconPosition="start"
						value="store"
						sx={tabHoverStyles}
					/>
					<Tab
						label="Prices"
						icon={<DollarSign />}
						iconPosition="start"
						value="priceList"
						sx={tabHoverStyles}
					/>
					{/* <Tab label="Shipping" icon={<Truck />} iconPosition="start" value="shipping" sx={tabHoverStyles} /> */}
					<Tab
						label="Ships"
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
