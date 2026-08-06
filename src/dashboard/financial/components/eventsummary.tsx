import {
	Box,
	Typography,
	CircularProgress,
	alpha,
	useTheme,
} from "@mui/material";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import { DrawerRow, FlexCard } from "./sharedui";
import {
	formatCurrency,
	SEMANTIC_COLORS,
	formatCompactTimestamp,
} from "../utils/financeutils";
import type { Transaction, TransactionDetail } from "../types/finances";

interface EventSummaryProps {
	tx: Transaction;
	currency: string;
	details: TransactionDetail | null;
	loading: boolean;
}

export const EventSummary = ({
	tx,
	currency,
	details,
	loading,
}: EventSummaryProps) => {
	return (
		<FlexCard>
			<Box
				px={2.5}
				py={1.25}
				display="flex"
				alignItems="center"
				borderBottom="1px solid rgba(255, 255, 255, 0.06)"
			>
				<ReceiptLongIcon fontSize="small" sx={{ color: "#7b68ee", mr: 1 }} />
				<Typography
					fontWeight={700}
					fontSize="0.75rem"
					sx={{
						textTransform: "uppercase",
						letterSpacing: "0.08em",
						color: "rgba(255,255,255,0.8)",
					}}
				>
					Event Summary
				</Typography>
			</Box>
			<Box sx={{ display: "flex", flexDirection: "column" }}>
				<DrawerRow
					label="Type"
					value={tx.Type}
					valueColor={
						tx.Type.includes("CORP") ? SEMANTIC_COLORS.neonPurple : "#fff"
					}
				/>
				<DrawerRow
					label="Timestamp (UTC)"
					value={formatCompactTimestamp(tx.Timestamp)}
					isMonospace
				/>
				<DrawerRow
					label="Amount"
					value={`${tx.Amount > 0 ? "+" : ""}${formatCurrency(tx.Amount)} ${currency}`}
					valueColor={
						tx.Amount >= 0 ? SEMANTIC_COLORS.neonGreen : SEMANTIC_COLORS.neonRed
					}
					isMonospace
					noBorder={!loading && !details}
				/>
				{loading && (
					<Box
						display="flex"
						justifyContent="center"
						py={2}
						borderTop="1px solid rgba(255, 255, 255, 0.06)"
					>
						<CircularProgress size={20} sx={{ color: "#7b68ee" }} />
					</Box>
				)}
				{details && (
					<>
						<DrawerRow label="Location" value={details.Location} isTopBorder />
						<DrawerRow label="Context" value={details.ContextData} />
						{details.FeeAmount > 0 && (
							<DrawerRow
								label="Fees"
								value={`${formatCurrency(details.FeeAmount)} ${details.FeeCurrency}`}
								valueColor={SEMANTIC_COLORS.neonRed}
								isMonospace
							/>
						)}
						<DrawerRow
							label="Reference ID"
							value={details.ReferenceId}
							isMonospace
							noBorder
						/>
					</>
				)}
			</Box>
		</FlexCard>
	);
};
