import React, { useState, useEffect } from "react";
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	Box,
	Typography,
	Slider,
	Chip,
	Stack,
	CircularProgress,
	Divider,
	IconButton,
	TextField,
} from "@mui/material";
import { Target, X, Plus, Trash2, Layers } from "lucide-react";
import MaterialBadge from "../../../cosm/components/materialbadge";
import { fetchClient } from "../../../utils/apiclient";

export interface SiteTargetModalProps {
	open: boolean;
	onClose: () => void;
	siteId: string;
	planetName: string;
	currentTargetDays: number;
	consumptionList?: Array<{
		ticker: string;
		dailyFlow?: number;
		flow?: number;
	}>;
	onTargetDaysChange?: (val: string) => void;
	onShowMsg?: (
		msg: string,
		severity: "success" | "error" | "warning" | "info",
	) => void;
}

export const SiteTargetModal: React.FC<SiteTargetModalProps> = ({
	open,
	onClose,
	siteId,
	planetName,
	currentTargetDays,
	consumptionList = [],
	onTargetDaysChange,
	onShowMsg,
}) => {
	const [loading, setLoading] = useState<boolean>(true);
	const [saving, setSaving] = useState<boolean>(false);
	const [globalDays, setGlobalDays] = useState<number>(
		currentTargetDays || 30.0,
	);
	const [materialTargets, setMaterialTargets] = useState<
		Record<string, number>
	>({});

	// Draft input for extra material
	const [matTicker, setMatTicker] = useState<string>("");
	const [matDays, setMatDays] = useState<string>("");

	// Unique list of tickers from CONS
	const consTickers = Array.from(
		new Set((consumptionList || []).map((c) => c.ticker).filter(Boolean)),
	);

	useEffect(() => {
		if (open && siteId) {
			loadSiteTargets();
		}
	}, [open, siteId]);

	const loadSiteTargets = async () => {
		setLoading(true);
		try {
			const res = await fetchClient("/internal/entity-settings?domain=site");
			if (res.ok) {
				const json = await res.json();
				if (json.entities && json.entities[siteId]) {
					const s = json.entities[siteId];
					setGlobalDays(s.global_target_days ?? currentTargetDays ?? 30.0);
					setMaterialTargets(s.material_target_days || {});
				}
			}
		} catch {
			// Silent catch
		} finally {
			setLoading(false);
		}
	};

	const handleSetMaterialDays = (ticker: string, val: number) => {
		setMaterialTargets((prev) => ({
			...prev,
			[ticker]: val,
		}));
	};

	const handleRemoveMaterialTarget = (ticker: string) => {
		setMaterialTargets((prev) => {
			const next = { ...prev };
			delete next[ticker];
			return next;
		});
	};

	const handleAddCustomTicker = () => {
		const ticker = matTicker.trim().toUpperCase();
		const days = parseFloat(matDays);
		if (!ticker || isNaN(days) || days <= 0) return;

		setMaterialTargets((prev) => ({
			...prev,
			[ticker]: days,
		}));
		setMatTicker("");
		setMatDays("");
	};

	const handleSave = async () => {
		setSaving(true);
		try {
			const res = await fetchClient("/internal/entity-settings?domain=site");
			let currentSettings: any = {};
			if (res.ok) {
				const json = await res.json();
				if (json.entities && json.entities[siteId]) {
					currentSettings = json.entities[siteId];
				}
			}

			const entityPayload = {
				domain: "site",
				entity_id: siteId,
				settings: {
					...currentSettings,
					global_target_days: globalDays,
					material_target_days: materialTargets,
				},
			};

			const saveRes = await fetchClient("/internal/entity-settings", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(entityPayload),
			});

			if (saveRes.ok) {
				if (onTargetDaysChange) onTargetDaysChange(String(globalDays));
				if (onShowMsg)
					onShowMsg(`Target supply days saved for ${planetName}!`, "success");
				onClose();
			} else {
				if (onShowMsg) onShowMsg("Failed to save site target days", "error");
			}
		} catch {
			if (onShowMsg) onShowMsg("Error saving site target days", "error");
		} finally {
			setSaving(false);
		}
	};

	return (
		<Dialog
			open={open}
			onClose={onClose}
			maxWidth="xs"
			fullWidth
			PaperProps={{
				sx: {
					bgcolor: "#141424",
					color: "white",
					borderRadius: 2.5,
					border: "1px solid rgba(255, 255, 255, 0.12)",
					boxShadow: "0px 8px 32px rgba(0,0,0,0.6)",
				},
			}}
		>
			<DialogTitle
				sx={{
					p: 2,
					pb: 1,
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
				}}
			>
				<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
					<Target size={18} color="#7B68EE" />
					<Box>
						<Typography
							variant="subtitle1"
							sx={{ fontWeight: 800, lineHeight: 1.2 }}
						>
							Site Target Supply Configuration
						</Typography>
						<Typography variant="caption" sx={{ color: "#A594FF" }}>
							{planetName}
						</Typography>
					</Box>
				</Box>
				<IconButton
					size="small"
					onClick={onClose}
					sx={{ color: "rgba(255,255,255,0.6)" }}
				>
					<X size={16} />
				</IconButton>
			</DialogTitle>

			<Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />

			<DialogContent
				sx={{ p: 2.5, display: "flex", flexDirection: "column", gap: 2 }}
			>
				{loading ? (
					<Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
						<CircularProgress size={24} />
					</Box>
				) : (
					<>
						{/* Single Site Global Target Supply Days */}
						<Box
							sx={{
								bgcolor: "rgba(123, 104, 238, 0.08)",
								p: 1.5,
								borderRadius: 2,
								border: "1px solid rgba(123, 104, 238, 0.2)",
							}}
						>
							<Box
								sx={{
									display: "flex",
									alignItems: "center",
									justifyContent: "space-between",
									mb: 0.5,
								}}
							>
								<Typography
									variant="body2"
									sx={{ fontWeight: 800, color: "white" }}
								>
									Site Global Target Supply:
								</Typography>
								<Typography
									variant="body2"
									sx={{ fontWeight: 900, color: "#7B68EE" }}
								>
									{globalDays} Day(s)
								</Typography>
							</Box>
							<Slider
								value={globalDays}
								onChange={(_, v) => setGlobalDays(v as number)}
								min={1}
								max={60}
								step={1}
								sx={{ color: "#7B68EE" }}
							/>
						</Box>

						{/* Pre-filled Consumed Input Materials (CONS) */}
						<Box
							sx={{
								border: "1px solid rgba(255,255,255,0.08)",
								p: 1.5,
								borderRadius: 2,
								bgcolor: "rgba(0,0,0,0.2)",
							}}
						>
							<Typography
								variant="caption"
								sx={{
									fontWeight: 800,
									color: "#64FFDA",
									display: "block",
									mb: 1.25,
								}}
							>
								Consumed Materials Target Supply (CONS):
							</Typography>

							{consTickers.length === 0 ? (
								<Typography
									variant="caption"
									sx={{ color: "rgba(255,255,255,0.4)" }}
								>
									No active consumption on this site.
								</Typography>
							) : (
								<Stack spacing={1.5}>
									{consTickers.map((ticker) => {
										const customVal = materialTargets[ticker];
										const effectiveVal =
											customVal !== undefined ? customVal : globalDays;
										const isCustom = customVal !== undefined;

										return (
											<Box
												key={ticker}
												sx={{
													display: "flex",
													alignItems: "center",
													justifyContent: "space-between",
													gap: 1,
												}}
											>
												<Box
													sx={{
														display: "flex",
														alignItems: "center",
														gap: 0.75,
														width: 80,
													}}
												>
													<MaterialBadge ticker={ticker} />
												</Box>
												<Slider
													value={effectiveVal}
													min={1}
													max={60}
													step={1}
													onChange={(_, v) =>
														handleSetMaterialDays(ticker, v as number)
													}
													sx={{
														flex: 1,
														color: isCustom ? "#64FFDA" : "#7B68EE",
														mx: 1,
													}}
												/>
												<Typography
													variant="caption"
													sx={{
														width: 42,
														textAlign: "right",
														fontWeight: 800,
														color: isCustom ? "#64FFDA" : "white",
													}}
												>
													{effectiveVal}d
												</Typography>
												{isCustom && (
													<IconButton
														size="small"
														onClick={() => handleRemoveMaterialTarget(ticker)}
														sx={{ p: 0.25, color: "rgba(255,255,255,0.4)" }}
													>
														<Trash2 size={12} />
													</IconButton>
												)}
											</Box>
										);
									})}
								</Stack>
							)}

							{/* Custom Material Addition */}
							<Box
								sx={{
									display: "flex",
									gap: 1,
									alignItems: "center",
									mt: 2,
									pt: 1.5,
									borderTop: "1px dashed rgba(255,255,255,0.1)",
								}}
							>
								<TextField
									size="small"
									placeholder="Add Extra Ticker"
									value={matTicker}
									onChange={(e) => setMatTicker(e.target.value)}
									sx={{
										width: 130,
										input: { color: "white", fontSize: "0.78rem", py: 0.4 },
									}}
								/>
								<TextField
									size="small"
									type="number"
									placeholder="Days"
									value={matDays}
									onChange={(e) => setMatDays(e.target.value)}
									sx={{
										width: 90,
										input: { color: "white", fontSize: "0.78rem", py: 0.4 },
									}}
								/>
								<Button
									size="small"
									variant="outlined"
									color="success"
									onClick={handleAddCustomTicker}
									disabled={!matTicker.trim() || !matDays}
									sx={{ minWidth: 32, p: 0.5, height: 28 }}
								>
									<Plus size={14} />
								</Button>
							</Box>
						</Box>
					</>
				)}
			</DialogContent>

			<DialogActions sx={{ p: 2, pt: 1 }}>
				<Button
					size="small"
					onClick={onClose}
					sx={{ color: "rgba(255,255,255,0.6)", fontSize: "0.8rem" }}
				>
					Cancel
				</Button>
				<Button
					size="small"
					variant="contained"
					disabled={saving}
					onClick={handleSave}
					sx={{
						bgcolor: "#7B68EE",
						"&:hover": { bgcolor: "#6C5CE7" },
						borderRadius: 1.5,
						fontWeight: 700,
						fontSize: "0.8rem",
						textTransform: "none",
					}}
				>
					{saving ? "Saving..." : "Save Targets"}
				</Button>
			</DialogActions>
		</Dialog>
	);
};
