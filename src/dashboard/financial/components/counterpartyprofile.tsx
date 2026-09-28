import {
	Box,
	Typography,
	CircularProgress,
	Chip,
	useTheme,
} from "@mui/material";
import BusinessIcon from "@mui/icons-material/Business";
import { DrawerRow, FlexCard } from "./sharedui";
import type { PublicCompanyProfile } from "../types/finances";

interface CounterpartyProps {
	profile: PublicCompanyProfile | null;
	loading: boolean;
	fallbackCode: string | null;
	fallbackName: string | null;
}

export const CounterpartyProfile = ({
	profile,
	loading,
	fallbackCode,
	fallbackName,
}: CounterpartyProps) => {
	return (
		<FlexCard>
			<Box
				px={2.5}
				py={1.25}
				display="flex"
				alignItems="center"
				borderBottom="1px solid rgba(255, 255, 255, 0.06)"
			>
				<BusinessIcon fontSize="small" sx={{ color: "#60a5fa", mr: 1 }} />
				<Typography
					fontWeight={700}
					fontSize="0.75rem"
					sx={{
						textTransform: "uppercase",
						letterSpacing: "0.08em",
						color: "rgba(255,255,255,0.8)",
					}}
				>
					Counterparty
				</Typography>
			</Box>
			<Box sx={{ display: "flex", flexDirection: "column" }}>
				{loading ? (
					<Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
						<CircularProgress size={20} sx={{ color: "#7b68ee" }} />
					</Box>
				) : profile ? (
					<>
						<DrawerRow label="Entity" noBorder>
							<Box
								sx={{
									display: "flex",
									flexDirection: "column",
									alignItems: "flex-end",
									pl: 2,
								}}
							>
								<Typography
									variant="body2"
									fontWeight={800}
									color="#fff"
									sx={{ textAlign: "right" }}
								>
									{profile.CompanyName}
								</Typography>
								<Typography
									variant="caption"
									color="rgba(255,255,255,0.4)"
									fontFamily="monospace"
								>
									{profile.CompanyCode}
								</Typography>
							</Box>
						</DrawerRow>
						{(profile.SubscriptionLevel ||
							profile.Team ||
							profile.Moderator ||
							profile.Pioneer) && (
							<DrawerRow label="Tags" isTopBorder>
								<Box
									sx={{
										display: "flex",
										gap: 0.5,
										flexWrap: "wrap",
										justifyContent: "flex-end",
									}}
								>
									{profile.SubscriptionLevel && (
										<Chip
											label={profile.SubscriptionLevel}
											size="small"
											variant="outlined"
											sx={{
												height: "18px",
												fontSize: "0.62rem",
												fontWeight: 800,
												borderColor: "#7b68ee",
												color: "#7b68ee",
											}}
										/>
									)}
									{profile.Team && (
										<Chip
											label="Team"
											size="small"
											sx={{
												height: "18px",
												fontSize: "0.62rem",
												fontWeight: 800,
												bgcolor: "rgba(248, 113, 113, 0.15)",
												color: "#f87171",
											}}
										/>
									)}
									{profile.Moderator && (
										<Chip
											label="Mod"
											size="small"
											sx={{
												height: "18px",
												fontSize: "0.62rem",
												fontWeight: 800,
												bgcolor: "rgba(251, 191, 36, 0.15)",
												color: "#fbbf24",
											}}
										/>
									)}
									{profile.Pioneer && (
										<Chip
											label="Pioneer"
											size="small"
											sx={{
												height: "18px",
												fontSize: "0.62rem",
												fontWeight: 800,
												bgcolor: "rgba(74, 222, 128, 0.15)",
												color: "#4ade80",
											}}
										/>
									)}
								</Box>
							</DrawerRow>
						)}
						<DrawerRow
							label="Created"
							value={new Date(profile.CreatedTimestamp).toLocaleDateString()}
						/>
						<DrawerRow
							label="Activity"
							value={`${profile.ActiveDaysPerWeek} Days/Week`}
							noBorder
						/>
					</>
				) : (
					<>
						<DrawerRow label="Entity Name" value={fallbackName || "Unknown"} />
						<DrawerRow
							label="Company Code"
							value={fallbackCode}
							isMonospace
							noBorder
						/>
					</>
				)}
			</Box>
		</FlexCard>
	);
};
