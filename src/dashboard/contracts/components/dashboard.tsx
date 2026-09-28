import React, { useEffect, useState } from "react";
import {
	Box,
	Typography,
	List,
	ListItem,
	ListItemText,
	Chip,
	CircularProgress,
	useTheme,
	IconButton,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
	TablePagination,
	TableContainer,
	Stack,
	Select,
	MenuItem,
	useMediaQuery,
	Paper,
	Divider,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
	TrendingUp,
	TrendingDown,
	Warning,
	AccessTime,
	CheckCircle,
	ArrowCircleLeft,
	ArrowCircleRight,
	LocalShipping,
	AccountBalance,
	Handshake,
} from "@mui/icons-material";
import { fetchClient } from "../../../utils/apiclient";
import { formatCurrency, getStatusColor, getStatusBg } from "../helpers/helper";
import type {
	DashboardStats,
	DashboardWidgets,
	ContractListItem,
} from "../types";
import { useGlobalData } from "../../../context/globaldatacontext";
import GlobalLoadingOverlay from "../../../components/common/globalloadingoverlay";
import ContractRow from "./contractrow";

// --- Helper Components ---

const Comparison = ({
	current,
	last,
	inverse = false,
}: {
	current: number;
	last: number;
	inverse?: boolean;
}) => {
	const diff = current - last;
	const percent = last !== 0 ? (diff / last) * 100 : current > 0 ? 100 : 0;
	const isGood = inverse ? diff <= 0 : diff >= 0;

	const color = isGood ? "success.main" : "error.main";
	const Icon = diff >= 0 ? TrendingUp : TrendingDown;

	return (
		<Box
			sx={{
				display: "flex",
				flexDirection: "row",
				justifyContent: "center",
				alignItems: "center",
				gap: 0.5,
				mt: 0,
			}}
		>
			<Icon sx={{ fontSize: 12, color }} />
			<Typography
				variant="caption"
				sx={{ color, fontWeight: "bold", fontSize: "0.65rem" }}
			>
				{Math.abs(percent).toFixed(1)}%
			</Typography>
			<Typography
				variant="caption"
				color="text.secondary"
				sx={{ opacity: 0.7, fontSize: "0.65rem" }}
			>
				vs Last Week ({formatCurrency(last, "ICA")})
			</Typography>
		</Box>
	);
};

const StatCard = ({ title, value, lastValue, type = "neutral" }: any) => {
	const theme = useTheme();
	const color =
		type === "revenue" ? "#64FFDA" : type === "expense" ? "#ff5252" : "#7b68ee";

	return (
		<Box
			sx={{
				p: 1.5,
				flex: 1,
				minWidth: "110px",
				height: "100%",
				bgcolor: "rgba(4, 4, 10, 0.75)",
				border: "1px solid rgba(123, 104, 238, 0.2)",
				borderRadius: "14px",
				boxShadow: "0 0 30px rgba(123, 104, 238, 0.08)",
				backdropFilter: "blur(20px)",
				transition: "all 0.22s ease-in-out",
				"&:hover": {
					borderColor: "rgba(123, 104, 238, 0.45)",
					boxShadow: "0 4px 20px rgba(123, 104, 238, 0.15)",
				},
				display: "flex",
				flexDirection: "column",
				justifyContent: "center",
				textAlign: "center",
			}}
		>
			<Typography
				variant="caption"
				color="text.secondary"
				fontWeight={800}
				textTransform="uppercase"
				fontSize="0.68rem"
				sx={{ lineHeight: 1, letterSpacing: "0.05em" }}
			>
				{title}
			</Typography>
			<Typography
				variant="body1"
				fontWeight={800}
				sx={{ color, my: 0.5, fontSize: "1.05rem", fontFamily: "monospace" }}
			>
				{typeof value === "number" ? formatCurrency(value, "ICA") : value}
			</Typography>
			{lastValue !== undefined && (
				<Comparison
					current={value}
					last={lastValue}
					inverse={type === "expense"}
				/>
			)}
		</Box>
	);
};

const WidgetList = ({ title, items, icon, emptyMsg, onViewDetail }: any) => {
	const theme = useTheme();
	return (
		<Box
			sx={{
				flex: 1,
				height: "100%",
				minHeight: 180,
				display: "flex",
				flexDirection: "column",
				bgcolor: "rgba(4, 4, 10, 0.75)",
				border: "1px solid rgba(255, 255, 255, 0.08)",
				borderRadius: "10px",
				backdropFilter: "blur(20px)",
				overflow: "hidden",
				transition: "all 0.18s ease-in-out",
				"&:hover": {
					borderColor: "rgba(255, 255, 255, 0.18)",
				},
			}}
		>
			<Box
				sx={{
					p: 0.75,
					px: 1.5,
					borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
					display: "flex",
					alignItems: "center",
					gap: 1,
					bgcolor: "rgba(255, 255, 255, 0.02)",
				}}
			>
				{icon}
				<Typography
					variant="subtitle2"
					fontWeight={800}
					fontSize="0.75rem"
					letterSpacing="0.05em"
				>
					{title}
				</Typography>
				<Chip
					label={items.length}
					size="small"
					sx={{
						ml: "auto",
						height: 18,
						fontSize: "0.65rem",
						fontWeight: 800,
						bgcolor: "rgba(123, 104, 238, 0.2)",
						color: "#7b68ee",
						border: "1px solid rgba(123, 104, 238, 0.3)",
					}}
				/>
			</Box>
			<List dense sx={{ overflowY: "auto", flexGrow: 1, p: 0 }}>
				{items.length === 0 ? (
					<Box sx={{ p: 2, textAlign: "center" }}>
						<Typography
							variant="caption"
							color="text.secondary"
							fontSize="0.7rem"
						>
							{emptyMsg}
						</Typography>
					</Box>
				) : (
					items.map((c: any) => (
						<ListItem
							key={c.id}
							divider
							button
							onClick={() => onViewDetail(c.id)}
							sx={{
								"&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.05) },
								cursor: "pointer",
								py: 0.25,
								px: 1,
							}}
						>
							<ListItemText
								primary={
									<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
										<Typography
											variant="body2"
											fontWeight={700}
											fontSize="0.75rem"
											sx={{ lineHeight: 1 }}
										>
											{c.localid}
										</Typography>
										<Typography
											variant="caption"
											color="text.secondary"
											noWrap
											sx={{ fontSize: "0.7rem" }}
										>
											{c.name ? `- ${c.name}` : ""}
										</Typography>
									</Box>
								}
								secondary={
									<Box
										sx={{
											display: "flex",
											justifyContent: "space-between",
											alignItems: "center",
										}}
									>
										<Typography
											variant="caption"
											color="text.primary"
											fontSize="0.65rem"
											fontFamily="monospace"
										>
											{formatCurrency(c.total_amount, c.currency)}
										</Typography>
										{c.duedate && (
											<Typography
												variant="caption"
												color={
													dayjs(c.duedate).diff(dayjs(), "hour") < 24
														? "error.main"
														: "text.secondary"
												}
												fontWeight="bold"
												fontSize="0.65rem"
											>
												{dayjs(c.duedate).format("MMM D")}
											</Typography>
										)}
									</Box>
								}
							/>
						</ListItem>
					))
				)}
			</List>
		</Box>
	);
};

// --- Mobile Card Component ---
const MobileContractCard = ({
	contract,
	onClick,
}: {
	contract: ContractListItem;
	onClick: () => void;
}) => {
	const theme = useTheme();

	const getIcon = () => {
		switch (contract.operation_type) {
			case "BUY":
				return <ArrowCircleLeft fontSize="small" color="success" />;
			case "SELL":
				return <ArrowCircleRight fontSize="small" color="warning" />;
			case "SHIPMENT":
				return <LocalShipping fontSize="small" color="info" />;
			case "LOAN":
				return <AccountBalance fontSize="small" color="error" />;
			default:
				return <Handshake fontSize="small" color="secondary" />;
		}
	};

	return (
		<Paper
			onClick={onClick}
			sx={{
				p: 2,
				mb: 1.5,
				bgcolor: alpha(theme.palette.background.default, 0.6),
				border: `1px solid ${theme.palette.divider}`,
				cursor: "pointer",
				display: "flex",
				flexDirection: "column",
				gap: 1.5,
			}}
		>
			<Box
				sx={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
				}}
			>
				<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
					{getIcon()}
					<Typography variant="subtitle2" fontWeight={700}>
						{contract.localid || "No ID"}
					</Typography>
				</Box>
				<Chip
					label={contract.status}
					size="small"
					sx={{
						height: 20,
						fontSize: "0.65rem",
						fontWeight: "800",
						color: getStatusColor(contract.status, theme),
						bgcolor: getStatusBg(contract.status, theme),
						border: `1px solid ${getStatusColor(contract.status, theme)}`,
					}}
				/>
			</Box>
			<Divider sx={{ opacity: 0.5 }} />
			<Box sx={{ display: "flex", justifyContent: "space-between" }}>
				<Box>
					<Typography variant="caption" color="text.secondary" display="block">
						PARTNER
					</Typography>
					<Typography variant="body2" fontWeight={500}>
						{contract.partnername || "Unknown"}
					</Typography>
					<Typography
						variant="caption"
						color="text.secondary"
						fontFamily="monospace"
					>
						{contract.partnercode}
					</Typography>
				</Box>
				<Box sx={{ textAlign: "right" }}>
					<Typography variant="caption" color="text.secondary" display="block">
						DATE
					</Typography>
					<Typography variant="body2">
						{dayjs(contract.date).format("MMM D, YY")}
					</Typography>
					{contract.duedate && (
						<Typography
							variant="caption"
							color={
								dayjs(contract.duedate).diff(dayjs(), "hour") < 24
									? "error.main"
									: "text.secondary"
							}
							fontWeight="bold"
						>
							Due: {dayjs(contract.duedate).format("MMM D")}
						</Typography>
					)}
				</Box>
			</Box>
			<Box
				sx={{
					bgcolor: alpha(theme.palette.background.default, 0.5),
					p: 1,
					borderRadius: 1,
					textAlign: "center",
				}}
			>
				<Typography
					variant="h6"
					fontFamily="monospace"
					fontWeight={700}
					sx={{ fontSize: "1rem" }}
				>
					{formatCurrency(contract.total_amount, contract.currency)}
				</Typography>
			</Box>
		</Paper>
	);
};

// --- Main Dashboard Component ---

import { ContractsTab } from "../../financial/components/contractstab";

export const ContractsDashboard: React.FC<{
	onViewDetail: (id: string) => void;
}> = ({ onViewDetail }) => {
	const { financialData } = useGlobalData();

	return (
		<Box
			sx={{
				p: 1.5,
				height: "100%",
				width: "100%",
				bgcolor: "#020205",
				backgroundImage:
					"radial-gradient(circle at 50% 10%, #080816 0%, #030308 60%, #000000 100%)",
				overflow: "hidden",
			}}
		>
			<ContractsTab
				currentData={financialData}
				netPending={financialData?.NetPending || 0}
				timeRange="ALL"
				onSelectTx={(tx) => onViewDetail(tx.ContractId || tx.Id || tx.id)}
			/>
		</Box>
	);
};
