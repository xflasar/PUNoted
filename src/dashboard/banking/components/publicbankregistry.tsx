import React from "react";
import {
	Box,
	Paper,
	Typography,
	Card,
	CardContent,
	Chip,
	Divider,
	useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import type { Bank } from "../types";

interface PublicBankRegistryProps {
	banks: Bank[];
	onRefresh: () => void;
}

export const PublicBankRegistry: React.FC<PublicBankRegistryProps> = ({
	banks,
}) => {
	const theme = useTheme();
	const publicBanks = banks.filter((b) => b.is_public !== false);

	return (
		<Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
			{/* Explanatory Header */}
			<Paper
				elevation={0}
				sx={{
					p: 3,
					borderRadius: 2,
					border: `1px solid ${alpha(theme.palette.primary.main, 0.25)}`,
					background: "linear-gradient(135deg, rgba(20, 24, 40, 0.85) 0%, rgba(26, 32, 54, 0.85) 100%)",
					backdropFilter: "blur(12px)",
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					flexWrap: "wrap",
					gap: 2,
				}}
			>
				<Box sx={{ maxWidth: 700 }}>
					<Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}>
						<VerifiedUserIcon sx={{ color: "primary.main", fontSize: 24 }} />
						<Typography variant="h6" sx={{ fontWeight: 800 }}>
							Public Solvency & Bank Transparency Registry
						</Typography>
					</Box>
					<Typography variant="body2" sx={{ color: "text.secondary", lineHeight: 1.5 }}>
						PrUn banking depends on trust and mutual transparency. This registry publishes registered player vaults, stated liquidity reserves, and standard lending terms so prospective borrowers can verify bank solvency before executing high-value trade transfers.
					</Typography>
				</Box>

				<Chip
					label={`${publicBanks.length} PUBLIC BANK${publicBanks.length === 1 ? "" : "S"}`}
					color="primary"
					variant="outlined"
					sx={{ fontWeight: 800, fontSize: "0.75rem", height: 28 }}
				/>
			</Paper>

			{/* Bank Directory Grid */}
			{publicBanks.length === 0 ? (
				<Paper
					elevation={0}
					sx={{
						p: 6,
						textAlign: "center",
						borderRadius: 2,
						bgcolor: alpha(theme.palette.background.paper, 0.4),
						border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
					}}
				>
					<AccountBalanceIcon sx={{ fontSize: 48, color: "text.secondary", mb: 1, opacity: 0.5 }} />
					<Typography variant="h6" sx={{ fontWeight: 700, color: "text.secondary" }}>
						No Public Banks Registered Yet
					</Typography>
					<Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
						Be the first player to establish a recognized player bank in the Banker's Office tab!
					</Typography>
				</Paper>
			) : (
				<Box
					sx={{
						display: "grid",
						gridTemplateColumns: { xs: "1fr", md: "1fr 1fr", lg: "1fr 1fr 1fr" },
						gap: 2.5,
					}}
				>
					{publicBanks.map((bank) => (
						<Card
							key={bank.id}
							elevation={0}
							sx={{
								borderRadius: 2,
								border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
								bgcolor: alpha(theme.palette.background.paper, 0.5),
								backdropFilter: "blur(8px)",
								display: "flex",
								flexDirection: "column",
								justifyContent: "space-between",
								transition: "transform 0.15s ease, border-color 0.15s ease",
								"&:hover": {
									transform: "translateY(-2px)",
									borderColor: alpha(theme.palette.primary.main, 0.4),
								},
							}}
						>
							<CardContent sx={{ p: 2.5, display: "flex", flexDirection: "column", gap: 2 }}>
								<Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
									<Box>
										<Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
											{bank.name}
										</Typography>
										<Typography variant="caption" sx={{ color: "text.secondary", mt: 0.5, display: "block" }}>
											Banker: <strong style={{ color: theme.palette.text.primary }}>{bank.owner_username}</strong>
										</Typography>
									</Box>

									<Chip
										label={`${bank.default_interest_rate}% Interest`}
										size="small"
										color="primary"
										sx={{ fontWeight: 800, fontSize: "0.7rem" }}
									/>
								</Box>

								<Typography
									variant="body2"
									sx={{
										color: "text.secondary",
										fontSize: "0.825rem",
										minHeight: 40,
										lineHeight: 1.4,
									}}
								>
									{bank.description || "Player-run bank offering customized trade liquidity and financing."}
								</Typography>

								<Divider sx={{ borderColor: alpha(theme.palette.divider, 0.1) }} />

								<Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
									<Box>
										<Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
											PLEDGED RESERVES
										</Typography>
										<Typography variant="body1" sx={{ fontWeight: 800, color: "text.primary" }}>
											{bank.liquidity.toLocaleString()}{" "}
											<span style={{ fontSize: "0.75rem", color: theme.palette.text.secondary }}>ICA</span>
										</Typography>
									</Box>
								</Box>
							</CardContent>
						</Card>
					))}
				</Box>
			)}
		</Box>
	);
};
