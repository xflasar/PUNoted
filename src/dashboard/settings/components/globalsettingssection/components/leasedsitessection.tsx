import React, { useState, useMemo } from "react";
import {
	Box,
	Typography,
	Button,
	IconButton,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Stack,
	Autocomplete,
	TextField,
	useTheme,
	Card,
	CardContent,
	Switch,
	FormControlLabel,
	Grid,
	alpha,
	Divider,
	Tooltip,
	Chip,
} from "@mui/material";
import {
	Handshake,
	Add as AddIcon,
	Delete as DeleteIcon,
	Business,
	DescriptionOutlined,
	PrecisionManufacturing,
	Visibility,
	VisibilityOff,
} from "@mui/icons-material";
import type { UserSite, LeasedSite, BasicUser } from "../../../types";

interface Props {
	leasedSites: LeasedSite[];
	allSites: UserSite[];
	allUsers: BasicUser[];
	headers: any;
	getSiteName: (id: string) => string;
	onChange: (newLeased: LeasedSite[]) => void;
}

export const LeasedSitesSection: React.FC<Props> = ({
	leasedSites,
	allSites,
	allUsers,
	getSiteName,
	onChange,
}) => {
	const theme = useTheme();
	const [dialogOpen, setDialogOpen] = useState(false);

	const [newLease, setNewLease] = useState<{
		site: UserSite | null;
		tenant: BasicUser | null;
		desc: string;
		show_in_corp: boolean;
	}>({ site: null, tenant: null, desc: "", show_in_corp: true });

	const [openSearch, setOpenSearch] = useState(false);
	const [inputValue, setInputValue] = useState("");

	const availableSites = allSites.filter(
		(s) => !leasedSites.some((l) => l.siteId === s.siteId),
	);

	const filteredUsers = useMemo(() => {
		if (!inputValue.trim() || !Array.isArray(allUsers)) return [];
		const query = inputValue.toLowerCase();
		console.log(allUsers);
		return allUsers.filter(
			(u) =>
				(u.username || "").toLowerCase().includes(query) ||
				(u.companycode || "").toLowerCase().includes(query),
		);
	}, [inputValue, allUsers]);

	const getTenantDisplayName = (tenantStr: string) => {
		if (!allUsers || !Array.isArray(allUsers)) return tenantStr;

		const user = allUsers.find(
			(u) =>
				u.companycode === tenantStr ||
				u.username === tenantStr ||
				`${u.username} (${u.companycode})` === tenantStr,
		);

		if (user) {
			return user.companycode
				? `${user.username} (${user.companycode})`
				: user.username;
		}
		return tenantStr;
	};

	const handleAdd = () => {
		if (newLease.site && newLease.desc && newLease.tenant) {
			const identifierStr =
				newLease.tenant.companycode || newLease.tenant.username;

			const mockTenantData = {
				username: newLease.tenant.username,
				companycode: newLease.tenant.companycode || "",
				isregistered: newLease.tenant.accountid ? true : false,
			};

			onChange([
				...leasedSites,
				{
					siteId: newLease.site.siteId,
					tenant: identifierStr,
					tenant_data: mockTenantData,
					description: newLease.desc,
					show_in_corp: newLease.show_in_corp,
				},
			]);

			setDialogOpen(false);
			setNewLease({ site: null, tenant: null, desc: "", show_in_corp: true });
			setInputValue("");
		}
	};

	const handleUpdateToggle = (siteId: string, showInCorp: boolean) => {
		onChange(
			leasedSites.map((s) =>
				s.siteId === siteId ? { ...s, show_in_corp: showInCorp } : s,
			),
		);
	};

	const handleRemove = (siteId: string) => {
		onChange(leasedSites.filter((item) => item.siteId !== siteId));
	};

	return (
		<Box>
			<Box
				sx={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					mb: 2,
				}}
			>
				<Typography
					variant="caption"
					color="text.secondary"
					sx={{
						display: "flex",
						alignItems: "center",
						gap: 1,
						fontWeight: 700,
						textTransform: "uppercase",
						letterSpacing: "0.05em",
					}}
				>
					<Handshake fontSize="small" /> OUTBOUND SITE LOANS
				</Typography>
				<Button
					size="small"
					variant="outlined"
					color="primary"
					startIcon={<AddIcon />}
					onClick={() => setDialogOpen(true)}
					sx={{ fontSize: "0.75rem", fontWeight: 700, borderRadius: 2 }}
				>
					Loan Site
				</Button>
			</Box>

			{leasedSites.length === 0 ? (
				<Box
					sx={{
						border: `1px dashed ${alpha(theme.palette.divider, 0.4)}`,
						borderRadius: 2,
						p: 4,
						textAlign: "center",
						bgcolor: alpha(theme.palette.background.default, 0.2),
					}}
				>
					<Typography
						variant="body2"
						color="text.secondary"
						sx={{ fontStyle: "italic" }}
					>
						You are not currently loaning out any sites.
					</Typography>
				</Box>
			) : (
				<Grid container spacing={2}>
					{leasedSites.map((item) => {
						const isVisible = item.show_in_corp ?? true;
						return (
							<Grid item xs={12} md={6} xl={4} key={item.siteId}>
								<Card
									variant="outlined"
									sx={{
										height: "100%",
										display: "flex",
										flexDirection: "column",
										bgcolor: alpha(theme.palette.background.default, 0.4),
										borderColor: isVisible
											? alpha(theme.palette.primary.main, 0.3)
											: alpha(theme.palette.divider, 0.2),
										transition: "all 0.2s ease",
										"&:hover": {
											borderColor: theme.palette.primary.main,
											bgcolor: alpha(theme.palette.background.default, 0.6),
											boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.1)}`,
										},
									}}
								>
									<CardContent sx={{ p: 2, flexGrow: 1 }}>
										<Box
											sx={{
												display: "flex",
												justifyContent: "space-between",
												alignItems: "flex-start",
												mb: 1.5,
											}}
										>
											<Box
												sx={{ display: "flex", alignItems: "center", gap: 1 }}
											>
												<PrecisionManufacturing
													fontSize="small"
													color={isVisible ? "primary" : "disabled"}
												/>
												<Typography
													variant="subtitle2"
													color="text.primary"
													sx={{ fontWeight: 800 }}
												>
													{getSiteName(item.siteId)}
												</Typography>
											</Box>
											<Tooltip title="Revoke Loan">
												<IconButton
													size="small"
													color="error"
													onClick={() => handleRemove(item.siteId)}
													sx={{
														p: 0.5,
														bgcolor: alpha(theme.palette.error.main, 0.1),
													}}
												>
													<DeleteIcon fontSize="small" />
												</IconButton>
											</Tooltip>
										</Box>

										<Divider sx={{ mb: 2, opacity: 0.5 }} />

										<Stack spacing={1.5}>
											<Box
												sx={{ display: "flex", alignItems: "center", gap: 1 }}
											>
												<Business fontSize="small" color="action" />
												<Typography
													variant="body2"
													color="text.secondary"
													sx={{ minWidth: 60 }}
												>
													Partner:
												</Typography>
												<Chip
													size="small"
													label={getTenantDisplayName(item.tenant)}
													color="primary"
													variant="outlined"
													sx={{
														fontWeight: 700,
														fontSize: "0.7rem",
														height: 24,
													}}
												/>
											</Box>

											<Box
												sx={{
													display: "flex",
													alignItems: "flex-start",
													gap: 1,
												}}
											>
												<DescriptionOutlined
													fontSize="small"
													color="action"
													sx={{ mt: 0.2 }}
												/>
												<Typography
													variant="body2"
													color="text.secondary"
													sx={{ minWidth: 60, mt: 0.2 }}
												>
													Notes:
												</Typography>
												<Typography
													variant="body2"
													color="text.primary"
													sx={{ mt: 0.2, fontWeight: 500 }}
												>
													{item.description}
												</Typography>
											</Box>
										</Stack>
									</CardContent>

									<Box
										sx={{
											display: "flex",
											alignItems: "center",
											justifyContent: "space-between",
											bgcolor: alpha(theme.palette.background.default, 0.5),
											borderTop: `1px solid ${theme.palette.divider}`,
											px: 2,
											py: 1,
										}}
									>
										<Typography
											variant="caption"
											color={isVisible ? "text.primary" : "text.secondary"}
											sx={{
												display: "flex",
												alignItems: "center",
												gap: 0.75,
												fontWeight: 600,
											}}
										>
											{isVisible ? (
												<Visibility fontSize="small" color="primary" />
											) : (
												<VisibilityOff fontSize="small" />
											)}
											Corp Production
										</Typography>
										<Switch
											size="small"
											checked={isVisible}
											onChange={(e) =>
												handleUpdateToggle(item.siteId, e.target.checked)
											}
											color="primary"
										/>
									</Box>
								</Card>
							</Grid>
						);
					})}
				</Grid>
			)}

			<Dialog
				open={dialogOpen}
				onClose={() => setDialogOpen(false)}
				maxWidth="sm"
				fullWidth
				slotProps={{
					paper: {
						sx: {
							bgcolor: theme.palette.background.default,
							backgroundImage: "none",
							borderRadius: 2,
						},
					},
				}}
			>
				<DialogTitle sx={{ pb: 1, display: "flex", flexDirection: "column" }}>
					<Box
						component="span"
						sx={{ fontSize: "1.25rem", fontWeight: 800, color: "primary.main" }}
					>
						Loan Site to Partner
					</Box>
					<Box
						component="span"
						sx={{ fontSize: "0.75rem", color: "text.secondary", mt: 0.5 }}
					>
						Grant a partner access to view this site. It will appear as an
						inbound lease on their dashboard.
					</Box>
				</DialogTitle>
				<DialogContent dividers sx={{ borderBottom: "none" }}>
					<Stack spacing={2.5} sx={{ mt: 1 }}>
						<Autocomplete
							options={availableSites}
							getOptionLabel={(option) =>
								`${option.name} (${option.systemName})`
							}
							onChange={(_, val) =>
								setNewLease((prev) => ({ ...prev, site: val }))
							}
							slotProps={{
								paper: {
									sx: {
										bgcolor: theme.palette.background.default,
										backgroundImage: "none",
										border: `1px solid ${theme.palette.divider}`,
									},
								},
							}}
							renderInput={(params) => (
								<TextField
									{...params}
									label="Select Your Site"
									size="small"
									fullWidth
									required
								/>
							)}
						/>

						<Autocomplete
							open={openSearch}
							onOpen={() => setOpenSearch(true)}
							onClose={() => setOpenSearch(false)}
							options={filteredUsers}
							getOptionLabel={(option) => {
								if (typeof option === "string") return option;
								return option.companycode
									? `${option.username} (${option.companycode})`
									: option.username;
							}}
							value={newLease.tenant}
							onChange={(_, val) => {
								setNewLease((prev) => ({ ...prev, tenant: val }));
							}}
							onInputChange={(_, newInputValue) => {
								setInputValue(newInputValue);
								setNewLease((prev) => ({ ...prev, tenant: newInputValue }));
							}}
							slotProps={{
								paper: {
									sx: {
										bgcolor: theme.palette.background.default,
										backgroundImage: "none",
										border: `1px solid ${theme.palette.divider}`,
									},
								},
							}}
							renderInput={(params) => (
								<TextField
									{...params}
									label="Partner (Username or Company Code)"
									size="small"
									required
									placeholder="Type to search system users..."
									slotProps={{
										input: {
											...params.slotProps.input,
										},
									}}
								/>
							)}
						/>

						<TextField
							label="Description / Notes"
							placeholder="e.g. 50% split contract, temporary loan"
							fullWidth
							size="small"
							value={newLease.desc}
							required
							onChange={(e) =>
								setNewLease((prev) => ({ ...prev, desc: e.target.value }))
							}
						/>

						<Box
							sx={{
								bgcolor: alpha(theme.palette.primary.main, 0.05),
								p: 1.5,
								borderRadius: 1,
								border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
							}}
						>
							<FormControlLabel
								control={
									<Switch
										checked={newLease.show_in_corp}
										onChange={(e) =>
											setNewLease((prev) => ({
												...prev,
												show_in_corp: e.target.checked,
											}))
										}
										color="primary"
									/>
								}
								label={
									<Box>
										<Typography variant="body2" sx={{ fontWeight: 600 }}>
											Include in Corp Production
										</Typography>
										<Typography variant="caption" color="text.secondary">
											If disabled, this site's production and storage will be
											hidden from your corporate overview.
										</Typography>
									</Box>
								}
							/>
						</Box>
					</Stack>
				</DialogContent>
				<DialogActions sx={{ p: 2, pt: 0 }}>
					<Button onClick={() => setDialogOpen(false)} color="inherit">
						Cancel
					</Button>
					<Button
						variant="contained"
						onClick={handleAdd}
						disabled={!newLease.site || !newLease.desc || !newLease.tenant}
					>
						Confirm Loan
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
};
