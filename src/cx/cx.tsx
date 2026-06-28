import React, { useCallback, useEffect, useState } from "react";
import {
	Box,
	Button,
	CircularProgress,
	Container,
	Typography,
} from "@mui/material";
import { API_BASE_URL } from "../config/api";
import { FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import MarketPricesTab from "../cosm/pricelist/pricelist";

type MarketDataRecord = Record<string, any>;

const CX = () => {
	const navigate = useNavigate();
	const [marketData, setMarketData] = useState<MarketDataRecord[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

	const fetchMarketData = useCallback(async () => {
		try {
			const response = await fetch(`${API_BASE_URL}market_price_all`);
			if (!response.ok) {
				throw new Error("Network response was not ok");
			}
			const json = await response.json();
			const data = Array.isArray(json) ? json : json.data || [];
			setMarketData(data);
			setLastUpdated(new Date());
		} catch (err) {
			console.error("Failed to fetch", err);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchMarketData();
		const interval = setInterval(fetchMarketData, 60000);
		return () => clearInterval(interval);
	}, [fetchMarketData]);

	return (
		<Container
			maxWidth={false}
			sx={{
				width: "100%",
				py: 2,
				display: "flex",
				flexDirection: "column",
				height: "100vh",
				overflow: "hidden",
			}}
		>
			<Box sx={{ mb: { xs: 4, sm: 6 }, position: "relative" }}>
				<Box
					sx={{
						display: { xs: "none", sm: "flex" },
						position: "absolute",
						left: 0,
						top: 0,
					}}
				>
					<Button
						variant="outlined"
						startIcon={<FaArrowLeft style={{ color: "#7B68EE" }} />}
						onClick={() => navigate("/")}
						sx={{
							color: "white",
							borderColor: "#7B68EE",
							fontSize: { xs: "0.75rem", sm: "1rem" },
						}}
					>
						Back to Homepage
					</Button>
				</Box>

				<Typography
					variant="h3"
					component="h1"
					align="center"
					sx={{
						fontWeight: "bold",
						letterSpacing: "0.05em",
						background: "linear-gradient(90deg, #5D80F7, #7B68EE)",
						WebkitBackgroundClip: "text",
						WebkitTextFillColor: "transparent",
						backgroundClip: "text",
						textFillColor: "transparent",
						fontSize: { xs: "2rem", sm: "3rem" },
					}}
				>
					CX Prices
				</Typography>
			</Box>

			<Box
				sx={{
					flex: 1,
					overflow: "hidden",
					position: "relative",
					display: "flex",
					flexDirection: "column",
					minHeight: 0,
				}}
			>
				{loading && marketData.length === 0 ? (
					<Box
						sx={{
							display: "flex",
							height: "100%",
							alignItems: "center",
							justifyContent: "center",
						}}
					>
						<CircularProgress color="primary" />
					</Box>
				) : (
					<MarketPricesTab
						isLoggedIn={false}
						marketData={marketData}
						lastUpdated={lastUpdated}
					/>
				)}
			</Box>
		</Container>
	);
};

export default CX;
