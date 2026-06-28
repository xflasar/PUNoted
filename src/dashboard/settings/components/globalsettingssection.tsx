import React, { useState, useEffect } from "react";
import { Box, Paper, Stack, Button, useTheme } from "@mui/material";
import { SettingsApplications } from "@mui/icons-material";

import type { GlobalSettings } from "../types";
import { globalConfigurationGuideSteps } from "../constants";
import { SectionHeader, transparentCardStyle } from "../styles";

import { useReferenceData } from "./globalsettingssection/hooks/usereferencedata";
import { DefaultsSection } from "./globalsettingssection/components/defaultssection";
import { ExcludedSitesSection } from "./globalsettingssection/components/excludedsitessection";
import { LeasedSitesSection } from "./globalsettingssection/components/leasedsitessection";

interface Props {
	initialSettings: GlobalSettings;
	headers: any;
	onSave: (settings: Partial<GlobalSettings>) => Promise<void>;
	showSnackbar: (msg: string, type: any) => void;
}

const GlobalSettingsSection: React.FC<Props> = ({
	initialSettings,
	headers,
	onSave,
}) => {
	const theme = useTheme();

	const [form, setForm] = useState<GlobalSettings>(initialSettings);
	const [hasChanges, setHasChanges] = useState(false);

	// Destructure the new 'users' array from the hook
	const { exchanges, sites, users, getSiteName } = useReferenceData(headers);

	useEffect(() => {
		setForm(initialSettings);
		setHasChanges(false);
	}, [initialSettings]);

	const handleChange = (field: keyof GlobalSettings, value: any) => {
		setForm((prev) => ({ ...prev, [field]: value }));
		setHasChanges(true);
	};

	const handleSave = async () => {
		await onSave(form);
		setHasChanges(false);
	};

	return (
		<Paper sx={transparentCardStyle(theme)}>
			<Box
				sx={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					mb: 2,
				}}
			>
				<SectionHeader
					icon={<SettingsApplications />}
					title="Global Configuration"
					color={theme.palette.secondary.main}
					guideSteps={globalConfigurationGuideSteps}
				/>
				<Button
					variant="contained"
					size="small"
					color="secondary"
					disabled={!hasChanges}
					onClick={handleSave}
				>
					Save Changes
				</Button>
			</Box>

			<Stack spacing={3}>
				<DefaultsSection
					cxCode={form.default_cx_code}
					currency={form.default_currency}
					exchanges={exchanges}
					onChange={handleChange}
				/>

				<ExcludedSitesSection
					excludedSites={form.internal_excluded_sites}
					allSites={sites}
					getSiteName={getSiteName}
					onChange={(newExcluded) =>
						handleChange("internal_excluded_sites", newExcluded)
					}
				/>

				<LeasedSitesSection
					leasedSites={form.internal_leased_sites}
					allSites={sites}
					allUsers={users} // Pass the users down here
					getSiteName={getSiteName}
					onChange={(newLeased) =>
						handleChange("internal_leased_sites", newLeased)
					}
				/>
			</Stack>
		</Paper>
	);
};

export default GlobalSettingsSection;
