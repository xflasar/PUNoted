import React from "react";
import {
	Box,
	Typography,
	Paper,
	Select,
	MenuItem,
	FormControl,
	Chip,
	Table,
	TableHead,
	TableBody,
	TableRow,
	TableCell,
	useTheme,
	Alert,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import TableViewIcon from "@mui/icons-material/TableView";

export interface SystemField {
	key: string;
	label: string;
	required?: boolean;
	description: string;
	aliases: string[];
}

export const BANK_LEDGER_SYSTEM_FIELDS: SystemField[] = [
	{
		key: "user",
		label: "Borrower / Counterparty",
		required: true,
		description: "Player username, company code, or display name",
		aliases: [
			"user",
			"borrower",
			"partner",
			"counterparty",
			"player",
			"depositor",
			"company",
			"customer",
			"client",
			"name",
			"username",
			"requester",
			"partnername",
			"partnercode",
		],
	},
	{
		key: "amount",
		label: "Amount",
		required: true,
		description: "Principal or transaction amount in ICA",
		aliases: [
			"amount",
			"capital",
			"value",
			"sum",
			"principal",
			"ica",
			"money",
			"loan",
			"total",
		],
	},
	{
		key: "type",
		label: "Transaction Type",
		required: false,
		description: "LOAN, DEPOSIT, or WITHDRAWAL (defaults to LOAN)",
		aliases: [
			"type",
			"transaction_type",
			"trans_type",
			"category",
			"kind",
			"action",
		],
	},
	{
		key: "interest_rate",
		label: "Interest Rate (%)",
		required: false,
		description: "Interest percentage (defaults to bank default rate)",
		aliases: [
			"interest_rate",
			"interest",
			"rate",
			"apr",
			"interest%",
			"rate%",
			"fee",
		],
	},
	{
		key: "term_days",
		label: "Term (Days)",
		required: false,
		description: "Loan duration in days (defaults to bank default term)",
		aliases: [
			"term_days",
			"term",
			"days",
			"duration",
			"period",
			"weeks",
			"length",
		],
	},
	{
		key: "contract_localid",
		label: "Contract Local ID",
		required: false,
		description: "In-game contract ID (e.g. PRUN-12345) to auto-verify",
		aliases: [
			"contract_localid",
			"contract_id",
			"contract",
			"localid",
			"id",
			"contract_code",
			"local_id",
		],
	},
	{
		key: "status",
		label: "Status",
		required: false,
		description: "APPROVED, REPAID, PENDING, REJECTED (defaults to APPROVED)",
		aliases: ["status", "state", "condition"],
	},
	{
		key: "date",
		label: "Date",
		required: false,
		description: "Transaction date (e.g. 2026-08-01)",
		aliases: [
			"date",
			"timestamp",
			"created_at",
			"time",
			"datetime",
			"date_created",
		],
	},
];

export interface ParsedCsvData {
	headers: string[];
	rows: string[][];
	delimiter: string;
}

/**
 * Robust CSV parser that parses text into headers and data rows,
 * handling comma/semicolon delimiters, escaped quotes, and multiline values.
 */
export function parseCsv(text: string): ParsedCsvData {
	const cleanText = text.replace(/^\uFEFF/, "").trim();
	if (!cleanText) return { headers: [], rows: [], delimiter: "," };

	const firstLine = cleanText.split(/\r?\n/)[0];
	let delimiter = ",";
	if (firstLine.includes(";") && !firstLine.includes(",")) {
		delimiter = ";";
	} else if (firstLine.includes("\t") && !firstLine.includes(",")) {
		delimiter = "\t";
	}

	const rows: string[][] = [];
	let currentRow: string[] = [];
	let currentCell = "";
	let inQuotes = false;

	for (let i = 0; i < cleanText.length; i++) {
		const char = cleanText[i];
		const nextChar = cleanText[i + 1];

		if (char === '"') {
			if (inQuotes && nextChar === '"') {
				currentCell += '"';
				i++;
			} else {
				inQuotes = !inQuotes;
			}
		} else if (char === delimiter && !inQuotes) {
			currentRow.push(currentCell.trim());
			currentCell = "";
		} else if ((char === "\r" || char === "\n") && !inQuotes) {
			if (char === "\r" && nextChar === "\n") i++;
			currentRow.push(currentCell.trim());
			if (currentRow.some((c) => c !== "")) {
				rows.push(currentRow);
			}
			currentRow = [];
			currentCell = "";
		} else {
			currentCell += char;
		}
	}
	if (currentCell || currentRow.length > 0) {
		currentRow.push(currentCell.trim());
		if (currentRow.some((c) => c !== "")) {
			rows.push(currentRow);
		}
	}

	if (rows.length === 0) return { headers: [], rows: [], delimiter };

	const headers = rows[0].map((h) => h.replace(/^["']|["']$/g, "").trim());
	const dataRows = rows.slice(1);

	return { headers, rows: dataRows, delimiter };
}

/**
 * Converts mapped user CSV data into a standardized CSV string expected by backend.
 */
export function buildStandardizedCsv(
	systemFields: SystemField[],
	headers: string[],
	rows: string[][],
	mapping: Record<string, string>,
): string {
	const headerIndices: Record<string, number> = {};
	headers.forEach((h, idx) => {
		headerIndices[h] = idx;
	});

	const targetKeys = systemFields.map((f) => f.key);
	const csvLines = [targetKeys.join(",")];

	for (const row of rows) {
		const lineValues = targetKeys.map((key) => {
			const mappedHeader = mapping[key];
			if (!mappedHeader || headerIndices[mappedHeader] === undefined) {
				return "";
			}
			const val = row[headerIndices[mappedHeader]] || "";
			if (
				val.includes(",") ||
				val.includes('"') ||
				val.includes("\n") ||
				val.includes(";")
			) {
				return `"${val.replace(/"/g, '""')}"`;
			}
			return val;
		});
		csvLines.push(lineValues.join(","));
	}

	return csvLines.join("\n");
}

/**
 * Auto-detects the best match between user CSV headers and system target fields.
 */
export function autoDetectMapping(
	systemFields: SystemField[],
	userHeaders: string[],
): Record<string, string> {
	const mapping: Record<string, string> = {};
	const usedHeaders = new Set<string>();

	for (const field of systemFields) {
		const normalizedAliases = field.aliases.map((a) =>
			a.toLowerCase().replace(/[^a-z0-9]/g, ""),
		);

		let bestMatch = "";
		let bestScore = 0;

		for (const rawHeader of userHeaders) {
			if (usedHeaders.has(rawHeader)) continue;
			const normalizedHeader = rawHeader
				.toLowerCase()
				.replace(/[^a-z0-9]/g, "");

			// Exact match on key or alias
			if (
				normalizedHeader === field.key.toLowerCase().replace(/[^a-z0-9]/g, "")
			) {
				bestMatch = rawHeader;
				bestScore = 100;
				break;
			}

			for (const alias of normalizedAliases) {
				if (normalizedHeader === alias && bestScore < 90) {
					bestMatch = rawHeader;
					bestScore = 90;
				} else if (normalizedHeader.includes(alias) && bestScore < 70) {
					bestMatch = rawHeader;
					bestScore = 70;
				} else if (alias.includes(normalizedHeader) && bestScore < 50) {
					bestMatch = rawHeader;
					bestScore = 50;
				}
			}
		}

		if (bestMatch && bestScore >= 50) {
			mapping[field.key] = bestMatch;
			usedHeaders.add(bestMatch);
		} else {
			mapping[field.key] = "";
		}
	}

	return mapping;
}

interface CsvColumnMapperProps {
	userHeaders: string[];
	previewRows: string[][];
	systemFields: SystemField[];
	mapping: Record<string, string>;
	onMappingChange: (targetKey: string, sourceHeader: string) => void;
}

export const CsvColumnMapper: React.FC<CsvColumnMapperProps> = ({
	userHeaders,
	previewRows,
	systemFields,
	mapping,
	onMappingChange,
}) => {
	const theme = useTheme();

	// Check if required fields are satisfied
	const missingRequired = systemFields.filter(
		(f) => f.required && !mapping[f.key],
	);

	// Build map of header index for fast preview lookup
	const headerIndexMap = React.useMemo(() => {
		const map: Record<string, number> = {};
		userHeaders.forEach((h, i) => {
			map[h] = i;
		});
		return map;
	}, [userHeaders]);

	return (
		<Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
			{/* Instructions Header */}
			<Box>
				<Typography
					variant="subtitle2"
					sx={{ fontWeight: 800, fontSize: "0.85rem", color: "text.primary" }}
				>
					Column Assignment Checker
				</Typography>
				<Typography
					variant="caption"
					sx={{ color: "text.secondary", lineHeight: 1.4, display: "block" }}
				>
					Match your spreadsheet columns on the right to our system's expected
					fields on the left. Unmapped optional fields will use their default
					values.
				</Typography>
			</Box>

			{missingRequired.length > 0 && (
				<Alert
					severity="warning"
					sx={{
						py: 0.5,
						bgcolor: alpha("#fbbf24", 0.1),
						color: "#fbbf24",
						border: "1px solid rgba(251, 191, 36, 0.3)",
					}}
				>
					<Typography variant="caption" sx={{ fontWeight: 700 }}>
						Required columns not mapped:{" "}
						{missingRequired.map((f) => f.label).join(", ")}. Please assign a
						column from your CSV.
					</Typography>
				</Alert>
			)}

			{/* Column Mapping Grid */}
			<Paper
				variant="outlined"
				sx={{
					p: 1.5,
					borderRadius: 2,
					bgcolor: alpha(theme.palette.background.default, 0.6),
					borderColor: alpha(theme.palette.divider, 0.15),
					display: "flex",
					flexDirection: "column",
					gap: 1.25,
					maxHeight: 280,
					overflowY: "auto",
					"&::-webkit-scrollbar": { width: 6 },
					"&::-webkit-scrollbar-thumb": {
						bgcolor: alpha(theme.palette.divider, 0.3),
						borderRadius: 3,
					},
				}}
			>
				{systemFields.map((field) => {
					const assignedHeader = mapping[field.key] || "";
					const isAssigned = Boolean(assignedHeader);

					return (
						<Box
							key={field.key}
							sx={{
								display: "flex",
								alignItems: "center",
								justifyContent: "space-between",
								gap: 1.5,
								p: 1,
								borderRadius: 1.5,
								bgcolor: isAssigned
									? alpha(theme.palette.background.paper, 0.5)
									: alpha(theme.palette.background.paper, 0.2),
								border: `1px solid ${
									field.required && !isAssigned
										? alpha("#f59e0b", 0.4)
										: isAssigned
											? alpha(theme.palette.primary.main, 0.25)
											: alpha(theme.palette.divider, 0.1)
								}`,
								transition: "all 0.15s ease",
							}}
						>
							{/* Left: System Target Field */}
							<Box sx={{ minWidth: 200, flex: 1 }}>
								<Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
									<Typography
										variant="caption"
										sx={{
											fontWeight: 800,
											fontSize: "0.78rem",
											color: "text.primary",
										}}
									>
										{field.label}
									</Typography>
									{field.required ? (
										<Chip
											label="REQUIRED"
											size="small"
											color="warning"
											sx={{ height: 16, fontSize: "0.55rem", fontWeight: 800 }}
										/>
									) : (
										<Chip
											label="OPTIONAL"
											size="small"
											variant="outlined"
											sx={{
												height: 16,
												fontSize: "0.55rem",
												color: "text.secondary",
											}}
										/>
									)}
								</Box>
								<Typography
									variant="caption"
									sx={{
										color: "text.secondary",
										fontSize: "0.68rem",
										display: "block",
									}}
								>
									{field.description}
								</Typography>
							</Box>

							{/* Arrow */}
							<ArrowForwardIcon
								sx={{
									fontSize: 16,
									color: isAssigned ? "primary.main" : "text.secondary",
									opacity: 0.7,
								}}
							/>

							{/* Right: User's CSV Column Selector */}
							<Box sx={{ width: 220, flexShrink: 0 }}>
								<FormControl fullWidth size="small">
									<Select
										value={assignedHeader}
										onChange={(e) => onMappingChange(field.key, e.target.value)}
										displayEmpty
										sx={{
											fontSize: "0.78rem",
											height: 32,
											bgcolor: alpha(theme.palette.background.default, 0.7),
											"& .MuiSelect-select": {
												py: 0.5,
												fontWeight: isAssigned ? 700 : 400,
												color: isAssigned ? "text.primary" : "text.secondary",
											},
											"& fieldset": {
												borderColor: isAssigned
													? alpha(theme.palette.primary.main, 0.4)
													: alpha(theme.palette.divider, 0.2),
											},
										}}
									>
										<MenuItem
											value=""
											sx={{
												fontSize: "0.78rem",
												color: "text.secondary",
												fontStyle: "italic",
											}}
										>
											-- Not Mapped (Skip / Default) --
										</MenuItem>
										{userHeaders.map((header) => (
											<MenuItem
												key={header}
												value={header}
												sx={{ fontSize: "0.78rem" }}
											>
												{header}
											</MenuItem>
										))}
									</Select>
								</FormControl>
							</Box>
						</Box>
					);
				})}
			</Paper>

			{/* Mini Data Preview */}
			{previewRows.length > 0 && (
				<Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
					<Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
						<TableViewIcon sx={{ fontSize: 16, color: "text.secondary" }} />
						<Typography
							variant="caption"
							sx={{
								fontWeight: 800,
								color: "text.secondary",
								fontSize: "0.72rem",
								textTransform: "uppercase",
							}}
						>
							Data Preview (Mapped First {Math.min(previewRows.length, 3)} Rows)
						</Typography>
					</Box>

					<Paper
						variant="outlined"
						sx={{
							borderRadius: 1.5,
							overflow: "hidden",
							bgcolor: alpha(theme.palette.background.default, 0.7),
							borderColor: alpha(theme.palette.divider, 0.15),
						}}
					>
						<Table
							size="small"
							sx={{ "& th, & td": { py: 0.5, px: 1, fontSize: "0.7rem" } }}
						>
							<TableHead>
								<TableRow
									sx={{ bgcolor: alpha(theme.palette.background.paper, 0.6) }}
								>
									{systemFields.map((f) => {
										const mappedCol = mapping[f.key];
										return (
											<TableCell
												key={f.key}
												sx={{
													fontWeight: 800,
													color: mappedCol ? "primary.main" : "text.secondary",
												}}
											>
												{f.label}
												{mappedCol && (
													<Typography
														variant="caption"
														sx={{
															display: "block",
															fontSize: "0.58rem",
															color: "text.secondary",
															fontWeight: 500,
														}}
													>
														from "{mappedCol}"
													</Typography>
												)}
											</TableCell>
										);
									})}
								</TableRow>
							</TableHead>
							<TableBody>
								{previewRows.slice(0, 3).map((row, rIdx) => (
									<TableRow key={rIdx}>
										{systemFields.map((f) => {
											const mappedCol = mapping[f.key];
											const colIdx = mappedCol ? headerIndexMap[mappedCol] : -1;
											const val =
												colIdx !== undefined && colIdx >= 0 ? row[colIdx] : "";
											return (
												<TableCell
													key={f.key}
													sx={{
														color: val ? "text.primary" : "text.secondary",
														fontStyle: val ? "normal" : "italic",
													}}
												>
													{val || "—"}
												</TableCell>
											);
										})}
									</TableRow>
								))}
							</TableBody>
						</Table>
					</Paper>
				</Box>
			)}
		</Box>
	);
};
