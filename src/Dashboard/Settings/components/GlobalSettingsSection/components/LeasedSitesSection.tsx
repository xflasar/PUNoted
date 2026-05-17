import React, { useState, useEffect } from "react";
import {
	Box,
	Typography,
	Button,
	List,
	ListItem,
	ListItemText,
	IconButton,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Stack,
	Autocomplete,
	TextField,
	useTheme,
	CircularProgress,
} from "@mui/material";
import {
	Handshake,
	Add as AddIcon,
	Delete as DeleteIcon,
} from "@mui/icons-material";
import { alpha } from "@mui/material/styles";
import { API_BASE } from "../../../constants";
import type { UserSite, LeasedSite, BasicUser } from "../types";

interface Props {
	leasedSites: LeasedSite[];
	allSites: UserSite[];
	headers: any;
	getSiteName: (id: string) => string;
	onChange: (newLeased: LeasedSite[]) => void;
}

export const LeasedSitesSection: React.FC<Props> = ({
	leasedSites,
	allSites,
	headers,
	getSiteName,
	onChange,
}) => {
	const theme = useTheme();
	const [dialogOpen, setDialogOpen] = useState(false);

	const [newLease, setNewLease] = useState<{
		site: UserSite | null;
		tenant: string | BasicUser | null;
		desc: string;
	}>({ site: null, tenant: null, desc: "" });

	const [openSearch, setOpenSearch] = useState(false);
	const [options, setOptions] = useState<BasicUser[]>([]);
	const [loading, setLoading] = useState(false);
	const [inputValue, setInputValue] = useState("");

	useEffect(() => {
		if (inputValue === "") {
			setOptions(inputValue ? [inputValue as any] : []);
			return;
		}

		const timer = setTimeout(async () => {
			setLoading(true);
			try {
				const res = await fetch(
					`${API_BASE}/users/search?q=${encodeURIComponent(inputValue)}`,
					{ headers },
				);
				if (res.ok) {
					const json = await res.json();
					setOptions(json.data || []);
				}
			} catch (e) {
				console.error("Search failed", e);
			} finally {
				setLoading(false);
			}
		}, 400);

		return () => clearTimeout(timer);
	}, [inputValue, headers]);

	const availableSites = allSites.filter(
		(s) => !leasedSites.some((l) => l.siteId === s.siteId),
	);

	const handleAdd = () => {
		if (newLease.site && newLease.desc && newLease.tenant) {
			// 1. Determine if they picked an object or typed a string
			const isManualEntry = typeof newLease.tenant === "string";

			// 2. The database needs a single string identifier (Prefer company code, fallback to username, fallback to raw text)
			const identifierStr = isManualEntry
				? newLease.tenant
				: (newLease.tenant as any).company_code ||
					(newLease.tenant as BasicUser).username;

			// 3. Build the UI mock data so it renders immediately without crashing
			const mockTenantData = isManualEntry
				? null
				: {
						accountId: (newLease.tenant as BasicUser).accountid || null,
						username: (newLease.tenant as BasicUser).username,
						companyCode: (newLease.tenant as any).company_code || "",
					};

			// 4. Update the state
			onChange([
				...leasedSites,
				{
					siteId: newLease.site.siteId,
					tenant: identifierStr as string,
					tenant_data: mockTenantData, // Inject the mock data for immediate UI rendering
					description: newLease.desc,
				},
			]);

			setDialogOpen(false);
			setNewLease({ site: null, tenant: null, desc: "" });
			setInputValue("");
		}
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
					mb: 1,
				}}
			>
				<Typography
					variant="caption"
					fontWeight="bold"
					color="text.secondary"
					sx={{ display: "flex", alignItems: "center", gap: 1 }}
				>
					<Handshake fontSize="inherit" /> LOANED / LEASED SITES
				</Typography>
				<Button
					size="small"
					startIcon={<AddIcon />}
					onClick={() => setDialogOpen(true)}
					sx={{ fontSize: "0.7rem" }}
				>
					Add
				</Button>
			</Box>

			<List
				dense
				disablePadding
				sx={{
					border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
					borderRadius: 1,
					bgcolor: alpha(theme.palette.background.default, 0.2),
				}}
			>
				{leasedSites.length === 0 ? (
					<ListItem>
						<ListItemText
							secondary="No loaned sites configured."
							secondaryTypographyProps={{
								sx: { fontStyle: "italic", opacity: 0.7 },
							}}
						/>
					</ListItem>
				) : (
					leasedSites.map((item) => (
						<ListItem
							key={item.siteId}
							divider
							secondaryAction={
								<IconButton
									size="small"
									edge="end"
									onClick={() => handleRemove(item.siteId)}
								>
									<DeleteIcon fontSize="small" />
								</IconButton>
							}
						>
							<ListItemText
								primary={getSiteName(item.siteId)}
								secondary={`Tenant: ${item.tenant_data.username} (${item.tenant_data.companyCode}) | ${item.tenant_data.isRegistered ? "Registered" : "Unregistered"} | ${item.description}`}
								primaryTypographyProps={{
									fontSize: "0.85rem",
									fontWeight: 500,
								}}
								secondaryTypographyProps={{
									fontSize: "0.75rem",
									color: "info.main",
								}}
							/>
						</ListItem>
					))
				)}
			</List>

			<Dialog
				open={dialogOpen}
				onClose={() => setDialogOpen(false)}
				maxWidth="xs"
				fullWidth
			>
				<DialogTitle sx={{ bgcolor: theme.palette.background.default }}>
					Add Loaned Site
				</DialogTitle>
				<DialogContent sx={{ bgcolor: theme.palette.background.default }}>
					<Stack spacing={2} sx={{ mt: 1 }}>
						<Autocomplete
							options={availableSites}
							getOptionLabel={(option) =>
								`${option.name} (${option.systemName})`
							}
							onChange={(_, val) =>
								setNewLease((prev) => ({ ...prev, site: val }))
							}
							renderInput={(params) => (
								<TextField {...params} label="Select Site" size="small" />
							)}
							slotProps={{
								paper: {
									sx: {
										bgcolor: theme.palette.background.default,
										backgroundImage: "none",
									},
								},
							}}
						/>

						<Autocomplete
							freeSolo
							open={openSearch}
							onOpen={() => setOpenSearch(true)}
							onClose={() => setOpenSearch(false)}
							options={options}
							loading={loading}
							filterOptions={(x) => x}
							getOptionLabel={(option) => {
								if (typeof option === "string") return option;
								return (option as any).company_code
									? `${option.username} (${(option as any).company_code})`
									: option.username;
							}}
							onChange={(_, val) =>
								setNewLease((prev) => ({ ...prev, tenant: val }))
							}
							onInputChange={(_, newInputValue) => {
								setInputValue(newInputValue);
								setNewLease((prev) => ({ ...prev, tenant: newInputValue }));
							}}
							renderInput={(params) => (
								<TextField
									{...params}
									label="Tenant (Username or Company Code)"
									size="small"
									placeholder="Search database or type manually..."
									InputProps={{
										...(params.InputProps || {}), // Safely spread
										endAdornment: (
											<React.Fragment>
												{loading ? (
													<CircularProgress color="inherit" size={20} />
												) : null}
												{params.InputProps?.endAdornment}{" "}
												{/* Add the question mark here */}
											</React.Fragment>
										),
									}}
								/>
							)}
							slotProps={{
								paper: {
									sx: {
										bgcolor: theme.palette.background.default,
										backgroundImage: "none",
									},
								},
							}}
						/>

						<TextField
							label="Description / Notes"
							placeholder="e.g. 50% split contract"
							fullWidth
							size="small"
							value={newLease.desc}
							onChange={(e) =>
								setNewLease((prev) => ({ ...prev, desc: e.target.value }))
							}
						/>
					</Stack>
				</DialogContent>
				<DialogActions sx={{ bgcolor: theme.palette.background.default }}>
					<Button onClick={() => setDialogOpen(false)}>Cancel</Button>
					<Button
						variant="contained"
						onClick={handleAdd}
						disabled={!newLease.site || !newLease.desc || !newLease.tenant}
					>
						Add
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
};
