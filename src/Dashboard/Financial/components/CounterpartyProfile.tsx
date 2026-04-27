import {
	Box,
	Typography,
	CircularProgress,
	Chip,
	useTheme,
} from "@mui/material";
import BusinessIcon from "@mui/icons-material/Business";
import { DrawerRow, FlexCard } from "./SharedUi";
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
	const theme = useTheme();

	return (
		<FlexCard>
			<Box
				px={2}
				py={1}
				display="flex"
				alignItems="center"
				borderBottom={`1px solid ${theme.palette.divider}`}
			>
				<BusinessIcon
					fontSize="small"
					sx={{ color: theme.palette.info.main, mr: 1 }}
				/>
				<Typography
					fontWeight={700}
					fontSize="0.85rem"
					textTransform="uppercase"
				>
					Counterparty
				</Typography>
			</Box>
			<Box display="flex" flexDirection="column">
				{loading ? (
					<Box display="flex" justifyContent="center" py={3}>
						<CircularProgress size={20} sx={{ color: "primary.main" }} />
					</Box>
				) : profile ? (
					<>
						<DrawerRow label="Entity" noBorder>
							<Box
								display="flex"
								flexDirection="column"
								alignItems="flex-end"
								pl={2}
							>
								<Typography
									variant="body2"
									fontWeight={800}
									color="text.primary"
									textAlign="right"
								>
									{profile.CompanyName}
								</Typography>
								<Typography
									variant="caption"
									color="text.secondary"
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
									display="flex"
									gap={0.5}
									flexWrap="wrap"
									justifyContent="flex-end"
								>
									{profile.SubscriptionLevel && (
										<Chip
											label={profile.SubscriptionLevel}
											size="small"
											sx={{
												height: "20px",
												fontSize: "0.65rem",
												fontWeight: 800,
											}}
											variant="outlined"
											color="primary"
										/>
									)}
									{profile.Team && (
										<Chip
											label="Team"
											size="small"
											sx={{
												height: "20px",
												fontSize: "0.65rem",
												fontWeight: 800,
											}}
											color="error"
										/>
									)}
									{profile.Moderator && (
										<Chip
											label="Mod"
											size="small"
											sx={{
												height: "20px",
												fontSize: "0.65rem",
												fontWeight: 800,
											}}
											color="warning"
										/>
									)}
									{profile.Pioneer && (
										<Chip
											label="Pioneer"
											size="small"
											sx={{
												height: "20px",
												fontSize: "0.65rem",
												fontWeight: 800,
											}}
											color="success"
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
