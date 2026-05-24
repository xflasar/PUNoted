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
				<ReceiptLongIcon
					fontSize="small"
					sx={{ color: theme.palette.primary.main, mr: 1 }}
				/>
				<Typography
					fontWeight={700}
					fontSize="0.85rem"
					textTransform="uppercase"
				>
					Event Summary
				</Typography>
			</Box>
			<Box display="flex" flexDirection="column">
				<DrawerRow
					label="Type"
					value={tx.Type}
					valueColor={
						tx.Type.includes("CORP") ? SEMANTIC_COLORS.neonBlue : "text.primary"
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
						tx.Amount >= 0
							? theme.palette.success.main
							: theme.palette.error.main
					}
					isMonospace
					noBorder={!loading && !details}
				/>

				{loading && (
					<Box
						display="flex"
						justifyContent="center"
						py={2}
						borderTop={`1px solid ${alpha(theme.palette.divider, 0.5)}`}
					>
						<CircularProgress size={20} sx={{ color: "primary.main" }} />
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
								valueColor="error.main"
								isMonospace
							/>
						)}
						<DrawerRow
							label="Reference ID"
							value={details.ReferenceId}
							isMonospace
							noBorder
							color="text.secondary"
						/>
					</>
				)}
			</Box>
		</FlexCard>
	);
};
