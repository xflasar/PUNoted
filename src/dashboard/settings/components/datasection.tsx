import React, { useState, useEffect } from "react";
import {
	Box,
	Typography,
	Paper,
	Button,
	CircularProgress,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogContentText,
	DialogActions,
	Chip,
	Stack,
} from "@mui/material";
import {
	DeleteForever,
	Delete,
	Storage,
	WarningAmber,
	CleaningServices,
	SportsEsports,
	VpnKey,
} from "@mui/icons-material";
import { fetchClient } from "../../../utils/apiclient";

export interface SubTableSummary {
	label: string;
	count: number;
}

export interface DataCategory {
	id: string;
	label: string;
	count: number;
	description: string;
	subTables?: SubTableSummary[];
}

export interface DataSectionGroup {
	sectionId: string;
	sectionTitle: string;
	sectionBadge: string;
	description: string;
	categories: DataCategory[];
}

export interface DataSectionProps {
	onShowMsg: (
		msg: string,
		severity: "success" | "error" | "warning" | "info",
	) => void;
}

export const DataSection: React.FC<DataSectionProps> = ({ onShowMsg }) => {
	const [sections, setSections] = useState<DataSectionGroup[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [confirmModal, setConfirmModal] = useState<{
		open: boolean;
		categoryId: string;
		categoryLabel: string;
	}>({ open: false, categoryId: "", categoryLabel: "" });
	const [deleting, setDeleting] = useState<boolean>(false);

	const loadSummary = async () => {
		setLoading(true);
		try {
			const res = await fetchClient("/internal/users/data-summary");
			if (res.ok) {
				const json = await res.json();
				if (json.sections) {
					setSections(json.sections);
				} else if (json.categories) {
					setSections([
						{
							sectionId: "ingame",
							sectionTitle: "In-Game Telemetry & Operations Data",
							sectionBadge: "Linked to users_data.userid",
							description:
								"Telemetry, assets, production queues, and market trade logs.",
							categories: json.categories,
						},
					]);
				}
			} else {
				onShowMsg("Failed to load user data categories", "error");
			}
		} catch {
			onShowMsg("Error loading data summary", "error");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadSummary();
	}, []);

	const handleDeleteCategory = async (categoryId: string) => {
		setDeleting(true);
		try {
			const res = await fetchClient(
				`/internal/users/delete-data?category=${categoryId}`,
				{
					method: "DELETE",
				},
			);
			if (res.ok) {
				const json = await res.json();
				onShowMsg(json.message || "Data deleted successfully", "success");
				if (
					categoryId === "whole_account" ||
					categoryId === "account_identity"
				) {
					localStorage.clear();
					window.location.href = "/";
					return;
				}
				loadSummary();
			} else {
				onShowMsg("Failed to delete requested data category", "error");
			}
		} catch {
			onShowMsg("Network error deleting data category", "error");
		} finally {
			setDeleting(false);
			setConfirmModal({ open: false, categoryId: "", categoryLabel: "" });
		}
	};

	if (loading) {
		return (
			<Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
				<CircularProgress size={32} />
			</Box>
		);
	}

	return (
		<Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
			{/* Top Header Card */}
			<Paper
				elevation={0}
				sx={{
					p: 2,
					bgcolor: "rgba(255, 255, 255, 0.02)",
					border: "1px solid rgba(255, 255, 255, 0.08)",
					borderRadius: 2,
				}}
			>
				<Box
					sx={{
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						flexWrap: "wrap",
						gap: 1.5,
					}}
				>
					<Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
						<Storage sx={{ color: "#7B68EE", fontSize: "1.4rem" }} />
						<Box>
							<Typography
								variant="subtitle1"
								sx={{ fontWeight: 700, color: "white", lineHeight: 1.2 }}
							>
								Data Management & Database Record Explorer
							</Typography>
							<Typography
								variant="caption"
								sx={{ color: "rgba(255, 255, 255, 0.55)" }}
							>
								Database records separated by <strong>users_data.userid</strong>{" "}
								(FIO Game ID) and <strong>users.accountid</strong> (Auth Web
								Account).
							</Typography>
						</Box>
					</Box>

					{/* Global Bulk Actions */}
					<Stack direction="row" spacing={1}>
						<Button
							size="small"
							variant="outlined"
							color="warning"
							startIcon={<CleaningServices sx={{ fontSize: "1rem" }} />}
							onClick={() =>
								setConfirmModal({
									open: true,
									categoryId: "all_ingame",
									categoryLabel:
										"ALL Synced In-Game Telemetry Data Across All Sub-Tables",
								})
							}
							sx={{
								borderRadius: 1.5,
								fontWeight: 700,
								fontSize: "0.78rem",
								textTransform: "none",
								py: 0.5,
								px: 1.5,
							}}
						>
							Purge Telemetry Data
						</Button>
						<Button
							size="small"
							variant="contained"
							color="error"
							startIcon={<DeleteForever sx={{ fontSize: "1rem" }} />}
							onClick={() =>
								setConfirmModal({
									open: true,
									categoryId: "whole_account",
									categoryLabel: "Entire Account & All Associated Data",
								})
							}
							sx={{
								borderRadius: 1.5,
								fontWeight: 700,
								fontSize: "0.78rem",
								textTransform: "none",
								py: 0.5,
								px: 1.5,
							}}
						>
							Delete Whole Account
						</Button>
					</Stack>
				</Box>
			</Paper>

			{/* Section Groups */}
			{sections.map((sec) => (
				<Paper
					key={sec.sectionId}
					elevation={0}
					sx={{
						p: 2,
						bgcolor: "rgba(255, 255, 255, 0.02)",
						border: "1px solid rgba(255, 255, 255, 0.08)",
						borderRadius: 2,
					}}
				>
					<Box
						sx={{
							display: "flex",
							alignItems: "center",
							justifyContent: "space-between",
							flexWrap: "wrap",
							mb: 1.5,
							gap: 1,
						}}
					>
						<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
							{sec.sectionId === "ingame" ? (
								<SportsEsports sx={{ color: "#7B68EE", fontSize: "1.2rem" }} />
							) : (
								<VpnKey sx={{ color: "#00E5FF", fontSize: "1.2rem" }} />
							)}
							<Typography
								variant="subtitle1"
								sx={{ fontWeight: 700, color: "white" }}
							>
								{sec.sectionTitle}
							</Typography>
							<Chip
								size="small"
								label={sec.sectionBadge}
								sx={{
									height: 20,
									fontSize: "0.68rem",
									fontWeight: 700,
									bgcolor:
										sec.sectionId === "ingame"
											? "rgba(123, 104, 238, 0.15)"
											: "rgba(0, 229, 255, 0.15)",
									color: sec.sectionId === "ingame" ? "#A594FF" : "#64FFDA",
									border:
										sec.sectionId === "ingame"
											? "1px solid rgba(123, 104, 238, 0.3)"
											: "1px solid rgba(0, 229, 255, 0.3)",
								}}
							/>
						</Box>
						<Typography
							variant="caption"
							sx={{ color: "rgba(255, 255, 255, 0.5)" }}
						>
							{sec.description}
						</Typography>
					</Box>

					{/* Category Rows */}
					<Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
						{sec.categories.map((cat) => (
							<Paper
								key={cat.id}
								elevation={0}
								sx={{
									p: 1.25,
									px: 1.5,
									bgcolor: "rgba(0, 0, 0, 0.2)",
									border: "1px solid rgba(255, 255, 255, 0.05)",
									borderRadius: 1.5,
									transition: "background-color 0.15s ease",
									"&:hover": {
										bgcolor: "rgba(255, 255, 255, 0.03)",
									},
								}}
							>
								<Box
									sx={{
										display: "flex",
										alignItems: "center",
										justifyContent: "space-between",
										gap: 1.5,
									}}
								>
									<Box sx={{ flex: 1, minWidth: 0 }}>
										<Box
											sx={{
												display: "flex",
												alignItems: "center",
												gap: 1,
												flexWrap: "wrap",
												mb: 0.25,
											}}
										>
											<Typography
												variant="body2"
												sx={{ fontWeight: 700, color: "#FFFFFF" }}
											>
												{cat.label}
											</Typography>
											<Chip
												size="small"
												label={`${cat.count.toLocaleString()} records`}
												color={cat.count > 0 ? "primary" : "default"}
												sx={{
													height: 18,
													fontSize: "0.68rem",
													fontWeight: 700,
													px: 0.25,
												}}
											/>
										</Box>
										<Typography
											variant="caption"
											sx={{
												color: "rgba(255, 255, 255, 0.5)",
												display: "block",
												fontSize: "0.75rem",
												whiteSpace: "nowrap",
												overflow: "hidden",
												textOverflow: "ellipsis",
											}}
										>
											{cat.description}
										</Typography>
									</Box>

									<Button
										size="small"
										variant="outlined"
										color="error"
										disabled={cat.count === 0}
										startIcon={<Delete sx={{ fontSize: "0.9rem" }} />}
										onClick={() =>
											setConfirmModal({
												open: true,
												categoryId: cat.id,
												categoryLabel: cat.label,
											})
										}
										sx={{
											borderRadius: 1.5,
											textTransform: "none",
											fontSize: "0.75rem",
											fontWeight: 700,
											py: 0.25,
											px: 1.25,
											whiteSpace: "nowrap",
											minWidth: "max-content",
										}}
									>
										Delete
									</Button>
								</Box>

								{/* Compact Sub-table Chips */}
								{cat.subTables && cat.subTables.length > 0 && (
									<Box
										sx={{
											pt: 0.75,
											mt: 0.75,
											borderTop: "1px solid rgba(255, 255, 255, 0.05)",
											display: "flex",
											flexWrap: "wrap",
											gap: 0.75,
										}}
									>
										{cat.subTables.map((sub, idx) => (
											<Chip
												key={idx}
												variant="outlined"
												size="small"
												label={`${sub.label}: ${sub.count.toLocaleString()}`}
												sx={{
													height: 20,
													borderColor:
														sub.count > 0
															? "rgba(123, 104, 238, 0.35)"
															: "rgba(255, 255, 255, 0.08)",
													color:
														sub.count > 0
															? "#B4A6FF"
															: "rgba(255, 255, 255, 0.35)",
													bgcolor:
														sub.count > 0
															? "rgba(123, 104, 238, 0.06)"
															: "transparent",
													fontWeight: sub.count > 0 ? 600 : 400,
													fontSize: "0.68rem",
												}}
											/>
										))}
									</Box>
								)}
							</Paper>
						))}
					</Box>
				</Paper>
			))}

			{/* Deletion Confirmation Modal */}
			<Dialog
				open={confirmModal.open}
				onClose={() =>
					setConfirmModal({ open: false, categoryId: "", categoryLabel: "" })
				}
				PaperProps={{
					sx: {
						bgcolor: "#1E1E2F",
						color: "white",
						borderRadius: 2.5,
						border: "1px solid rgba(255,255,255,0.1)",
					},
				}}
			>
				<DialogTitle
					sx={{
						display: "flex",
						alignItems: "center",
						gap: 1,
						color: "#FF5252",
						fontSize: "1.1rem",
					}}
				>
					<WarningAmber /> Confirm Permanent Deletion
				</DialogTitle>
				<DialogContent>
					<DialogContentText
						sx={{ color: "rgba(255,255,255,0.7)", fontSize: "0.9rem" }}
					>
						Are you sure you want to permanently delete{" "}
						<strong>{confirmModal.categoryLabel}</strong>? This will clear all
						associated main tables and sub-table records from the database.
					</DialogContentText>
				</DialogContent>
				<DialogActions sx={{ p: 2 }}>
					<Button
						onClick={() =>
							setConfirmModal({
								open: false,
								categoryId: "",
								categoryLabel: "",
							})
						}
						sx={{ color: "rgba(255,255,255,0.7)", fontSize: "0.85rem" }}
					>
						Cancel
					</Button>
					<Button
						size="small"
						variant="contained"
						color="error"
						disabled={deleting}
						startIcon={
							deleting ? <CircularProgress size={14} /> : <DeleteForever />
						}
						onClick={() => handleDeleteCategory(confirmModal.categoryId)}
						sx={{
							borderRadius: 1.5,
							fontWeight: 700,
							fontSize: "0.85rem",
							textTransform: "none",
						}}
					>
						{deleting ? "Deleting..." : "Confirm Deletion"}
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
};
