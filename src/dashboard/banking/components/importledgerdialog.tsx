import React, { useState, useRef } from "react";
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	Box,
	Typography,
	Alert,
	CircularProgress,
	Paper,
	Chip,
	useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import DownloadIcon from "@mui/icons-material/Download";
import RefreshIcon from "@mui/icons-material/Refresh";

import { fetchClient } from "../../../utils/apiclient";
import {
	CsvColumnMapper,
	BANK_LEDGER_SYSTEM_FIELDS,
	autoDetectMapping,
	parseCsv,
	buildStandardizedCsv,
	type ParsedCsvData,
} from "./csvcolumnmapper";
import {
	CheckCircleOutlineOutlined,
	HelpOutlineOutlined,
} from "@mui/icons-material";

interface ImportLedgerDialogProps {
	open: boolean;
	bankId: number;
	bankName: string;
	onClose: () => void;
	onSuccess: () => void;
}

const SAMPLE_CSV = `type,user,amount,interest_rate,term_days,contract_localid,status,date
LOAN,StarTrader,50000,5.0,14,PRUN-10492,REPAID,2026-08-01
DEPOSIT,MiningGuild,200000,2.0,30,PRUN-10510,ACTIVE,2026-08-10
WITHDRAWAL,MiningGuild,50000,,,PRUN-10650,APPROVED,2026-09-01
LOAN,NovaCorp,75000,6.0,21,,ACTIVE,2026-09-15`;

export const ImportLedgerDialog: React.FC<ImportLedgerDialogProps> = ({
	open,
	bankId,
	bankName,
	onClose,
	onSuccess,
}) => {
	const theme = useTheme();
	const fileInputRef = useRef<HTMLInputElement>(null);

	const [file, setFile] = useState<File | null>(null);
	const [parsedData, setParsedData] = useState<ParsedCsvData | null>(null);
	const [mapping, setMapping] = useState<Record<string, string>>({});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [result, setResult] = useState<{
		imported: number;
		verified: number;
		unverified: number;
		errors: string[];
	} | null>(null);

	const resetState = () => {
		setFile(null);
		setParsedData(null);
		setMapping({});
		setLoading(false);
		setError(null);
		setResult(null);
	};

	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const selected = e.target.files?.[0];
		if (!selected) return;

		setFile(selected);
		setError(null);
		setResult(null);

		const reader = new FileReader();
		reader.onload = (event) => {
			const text = (event.target?.result as string) || "";
			try {
				const parsed = parseCsv(text);
				if (!parsed.headers || parsed.headers.length === 0) {
					throw new Error(
						"No column headers detected in the uploaded CSV file.",
					);
				}
				if (!parsed.rows || parsed.rows.length === 0) {
					throw new Error(
						"The uploaded CSV has column headers but contains no transaction rows.",
					);
				}

				setParsedData(parsed);
				// Auto-detect initial column mappings
				const detected = autoDetectMapping(
					BANK_LEDGER_SYSTEM_FIELDS,
					parsed.headers,
				);
				setMapping(detected);
			} catch (err: any) {
				setError(err.message || "Failed to parse CSV file.");
				setParsedData(null);
			}
		};
		reader.onerror = () => {
			setError("Failed to read the selected file.");
		};
		reader.readAsText(selected);
	};

	const handleMappingChange = (targetKey: string, sourceHeader: string) => {
		setMapping((prev) => ({
			...prev,
			[targetKey]: sourceHeader,
		}));
	};

	const handleDownloadSample = () => {
		const blob = new Blob([SAMPLE_CSV], { type: "text/csv;charset=utf-8;" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.setAttribute("href", url);
		link.setAttribute("download", "bank_ledger_template.csv");
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	const handleImport = async () => {
		if (!parsedData || !parsedData.rows.length) {
			setError("Please choose a CSV file with ledger records.");
			return;
		}

		// Validate required fields
		const missing = BANK_LEDGER_SYSTEM_FIELDS.filter(
			(f) => f.required && !mapping[f.key],
		);
		if (missing.length > 0) {
			setError(
				`Please assign columns for: ${missing.map((f) => f.label).join(", ")}`,
			);
			return;
		}

		setLoading(true);
		setError(null);
		setResult(null);

		try {
			// Convert user's mapped CSV into standardized CSV text
			const standardizedCsv = buildStandardizedCsv(
				BANK_LEDGER_SYSTEM_FIELDS,
				parsedData.headers,
				parsedData.rows,
				mapping,
			);

			const res = await fetchClient("/internal/banking/loans/import-csv", {
				method: "POST",
				body: JSON.stringify({
					bank_id: bankId,
					csv_content: standardizedCsv,
				}),
			});

			if (!res.ok) {
				const errData = await res.json().catch(() => ({}));
				throw new Error(errData.detail || "Failed to import ledger CSV.");
			}

			const data = await res.json();
			setResult(data);
			onSuccess();
		} catch (err: any) {
			setError(err.message || "An unexpected error occurred during import.");
		} finally {
			setLoading(false);
		}
	};

	const hasRequiredMapped = Boolean(mapping.user && mapping.amount);

	return (
		<Dialog
			open={open}
			onClose={() => {
				resetState();
				onClose();
			}}
			maxWidth="md"
			fullWidth
			slotProps={{
				paper: {
					sx: {
						borderRadius: 3,
						background:
							"linear-gradient(135deg, rgba(20, 24, 38, 0.98) 0%, rgba(12, 14, 24, 0.98) 100%)",
						border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
						backdropFilter: "blur(20px)",
						color: "#fff",
					},
				},
			}}
		>
			<DialogTitle
				sx={{
					pb: 1,
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
				}}
			>
				<Box>
					<Typography variant="h6" sx={{ fontWeight: 800 }}>
						Import Ledger CSV
					</Typography>
					<Typography variant="caption" sx={{ color: "text.secondary" }}>
						Bank:{" "}
						<strong style={{ color: theme.palette.primary.main }}>
							{bankName}
						</strong>
					</Typography>
				</Box>
				<Button
					size="small"
					variant="outlined"
					startIcon={<DownloadIcon fontSize="small" />}
					onClick={handleDownloadSample}
					sx={{
						fontSize: "0.75rem",
						borderColor: alpha(theme.palette.primary.main, 0.4),
						color: theme.palette.primary.light,
						"&:hover": {
							borderColor: theme.palette.primary.main,
							bgcolor: alpha(theme.palette.primary.main, 0.1),
						},
					}}
				>
					Sample CSV
				</Button>
			</DialogTitle>

			<DialogContent
				sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}
			>
				<Typography
					variant="body2"
					sx={{ color: "text.secondary", lineHeight: 1.5 }}
				>
					Upload your spreadsheet to import historical loans, deposits, and
					withdrawals. In-game contracts matching local IDs will be
					auto-verified.
				</Typography>

				{/* Step 1: Upload Dropzone (if no file parsed yet) */}
				{!parsedData ? (
					<>
						<Paper
							variant="outlined"
							onClick={() => fileInputRef.current?.click()}
							sx={{
								p: 3.5,
								textAlign: "center",
								cursor: "pointer",
								borderRadius: 2,
								borderStyle: "dashed",
								borderWidth: 2,
								borderColor: alpha(theme.palette.divider, 0.3),
								bgcolor: alpha(theme.palette.background.paper, 0.2),
								transition: "all 0.2s ease",
								"&:hover": {
									borderColor: theme.palette.primary.main,
									bgcolor: alpha(theme.palette.primary.main, 0.04),
								},
							}}
						>
							<input
								type="file"
								ref={fileInputRef}
								accept=".csv"
								style={{ display: "none" }}
								onChange={handleFileSelect}
							/>
							<UploadFileIcon
								sx={{ fontSize: 44, color: theme.palette.primary.main, mb: 1 }}
							/>
							<Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
								Click or drag to select a CSV file
							</Typography>
							<Typography
								variant="caption"
								sx={{ color: "text.secondary", display: "block", mt: 0.5 }}
							>
								Supports comma (,), semicolon (;), or tab delimiters with any
								column order
							</Typography>
						</Paper>

						{/* Supported Columns Reference */}
						<Box
							sx={{
								p: 1.5,
								borderRadius: 1.5,
								bgcolor: alpha("#6366f1", 0.08),
								border: `1px solid ${alpha("#6366f1", 0.2)}`,
								display: "flex",
								gap: 1.2,
								alignItems: "flex-start",
							}}
						>
							<HelpOutlineOutlined
								sx={{ fontSize: 18, color: "#818cf8", mt: 0.2, flexShrink: 0 }}
							/>
							<Box>
								<Typography
									variant="caption"
									sx={{ fontWeight: 800, color: "#818cf8", display: "block" }}
								>
									Flexible Column Mapping:
								</Typography>
								<Typography
									variant="caption"
									sx={{
										color: "text.secondary",
										lineHeight: 1.4,
										display: "block",
										mt: 0.25,
									}}
								>
									Your spreadsheet doesn't need exact column names. Once
									uploaded, you can link your columns (e.g. "Borrower",
									"Capital", "Interest Rate") directly to system fields.
								</Typography>
							</Box>
						</Box>
					</>
				) : (
					/* Step 2: Active File Info + Column Assignment Checker */
					<>
						{/* File Badge Banner */}
						<Paper
							variant="outlined"
							sx={{
								p: 1.25,
								px: 1.75,
								borderRadius: 2,
								bgcolor: alpha(theme.palette.background.default, 0.7),
								borderColor: alpha(theme.palette.primary.main, 0.25),
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
								flexWrap: "wrap",
								gap: 1,
							}}
						>
							<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
								<UploadFileIcon
									sx={{ fontSize: 20, color: theme.palette.primary.main }}
								/>
								<Typography
									variant="subtitle2"
									sx={{ fontWeight: 800, fontSize: "0.85rem" }}
								>
									{file?.name}
								</Typography>
								<Chip
									label={`${parsedData.rows.length} rows`}
									size="small"
									color="primary"
									variant="outlined"
									sx={{ height: 20, fontSize: "0.68rem", fontWeight: 700 }}
								/>
								<Chip
									label={`${parsedData.headers.length} columns`}
									size="small"
									sx={{ height: 20, fontSize: "0.68rem", fontWeight: 700 }}
								/>
							</Box>

							<Button
								size="small"
								variant="text"
								startIcon={<RefreshIcon sx={{ fontSize: "14px !important" }} />}
								onClick={() => {
									resetState();
									setTimeout(() => fileInputRef.current?.click(), 50);
								}}
								sx={{
									color: "text.secondary",
									textTransform: "none",
									fontSize: "0.72rem",
								}}
							>
								Choose Different File
							</Button>
							<input
								type="file"
								ref={fileInputRef}
								accept=".csv"
								style={{ display: "none" }}
								onChange={handleFileSelect}
							/>
						</Paper>

						<CsvColumnMapper
							userHeaders={parsedData.headers}
							previewRows={parsedData.rows}
							systemFields={BANK_LEDGER_SYSTEM_FIELDS}
							mapping={mapping}
							onMappingChange={handleMappingChange}
						/>
					</>
				)}

				{error && (
					<Alert
						severity="error"
						sx={{ bgcolor: alpha("#ef4444", 0.1), color: "#f87171" }}
					>
						{error}
					</Alert>
				)}

				{result && (
					<Alert
						icon={<CheckCircleOutlineOutlined fontSize="inherit" />}
						severity="success"
						sx={{
							bgcolor: alpha("#10b981", 0.15),
							color: "#34d399",
							border: "1px solid rgba(16, 185, 129, 0.3)",
						}}
					>
						<Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
							Successfully imported {result.imported} transactions!
						</Typography>
						<Typography variant="caption" sx={{ display: "block", mt: 0.5 }}>
							🛡️ {result.verified} verified with in-game contract snapshots
							<br />📋 {result.unverified} recorded as self-reported spreadsheet
							entries
						</Typography>
						{result.errors.length > 0 && (
							<Typography
								variant="caption"
								sx={{ color: "#fbbf24", display: "block", mt: 0.5 }}
							>
								Warnings: {result.errors.slice(0, 3).join(", ")}
							</Typography>
						)}
					</Alert>
				)}
			</DialogContent>

			<DialogActions sx={{ p: 2.5, pt: 1 }}>
				<Button
					onClick={() => {
						resetState();
						onClose();
					}}
					sx={{ color: "text.secondary" }}
				>
					{result ? "Close" : "Cancel"}
				</Button>

				{!result && parsedData && (
					<Button
						variant="contained"
						color="primary"
						disabled={!hasRequiredMapped || loading}
						onClick={handleImport}
						startIcon={
							loading ? (
								<CircularProgress size={16} color="inherit" />
							) : (
								<UploadFileIcon />
							)
						}
						sx={{
							fontWeight: 800,
							boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.4)}`,
						}}
					>
						{loading
							? "Importing..."
							: `Confirm & Import ${parsedData.rows.length ? `${parsedData.rows.length} Rows` : ""}`}
					</Button>
				)}
			</DialogActions>
		</Dialog>
	);
};
