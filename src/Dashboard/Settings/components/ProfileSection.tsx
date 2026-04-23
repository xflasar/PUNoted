import React, { useState } from "react";
import { Box, TextField, Button, Paper, useTheme } from "@mui/material";
import { AccountCircle, Save, Key } from "@mui/icons-material";
import type { UserSettings } from "../types";
import { SectionHeader, transparentCardStyle } from "../styles";
import { profileandcompanyGuideSteps } from "../constants";

const ProfileSection: React.FC<{
  initialSettings: UserSettings;
  onSave: (data: Partial<UserSettings>) => Promise<void>;
}> = ({ initialSettings, onSave }) => {
  const theme = useTheme();
  const [displayName, setDisplayName] = useState(initialSettings.displayName || "");
  const [fioApiKey, setFioApiKey] = useState(initialSettings.fioApiKey || "");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    await onSave({ displayName, fioApiKey });
    setLoading(false);
  };

  return (
    <Paper sx={transparentCardStyle(theme)}>
      <SectionHeader icon={<AccountCircle />} title="Profile & Company" color={theme.palette.primary.main} guideSteps={profileandcompanyGuideSteps}/>
      
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, flex: 1 }}>
        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
          <TextField
            label="Username"
            value={initialSettings.username}
            disabled
            variant="outlined"
            size="small"
            sx={{ flex: "1 1 150px" }}
            InputProps={{ style: { fontSize: "0.85rem" } }}
            InputLabelProps={{ style: { fontSize: "0.85rem" } }}
          />
          <TextField
            label="Company"
            value={initialSettings.companyName || "N/A"}
            disabled
            variant="outlined"
            size="small"
            sx={{ flex: "1 1 150px" }}
            InputProps={{ style: { fontSize: "0.85rem" } }}
            InputLabelProps={{ style: { fontSize: "0.85rem" } }}
          />
        </Box>
        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
          <TextField
            label="Display Name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            variant="outlined"
            size="small"
            disabled={initialSettings.isSynchronized}
            sx={{ flex: "1 1 150px" }}
            InputProps={{ style: { fontSize: "0.85rem" } }}
            InputLabelProps={{ style: { fontSize: "0.85rem" } }}
          />
          <TextField
            label="FIO API Key"
            value={fioApiKey}
            onChange={(e) => setFioApiKey(e.target.value)}
            variant="outlined"
            size="small"
            placeholder="Optional"
            sx={{ flex: "1 1 150px" }}
            InputProps={{
              style: { fontSize: "0.85rem" },
              startAdornment: <Key color="action" sx={{ mr: 1, fontSize: 14 }} />,
            }}
            InputLabelProps={{ style: { fontSize: "0.85rem" } }}
          />
        </Box>
      </Box>
      <Box sx={{ mt: 1.5, display: "flex", justifyContent: "flex-end" }}>
        <Button
          variant="contained"
          size="small"
          color="primary"
          onClick={handleSave}
          startIcon={<Save />}
          disabled={loading}
          sx={{ height: 28, fontSize: "0.75rem" }}
        >
          Save
        </Button>
      </Box>
    </Paper>
  );
};

export default ProfileSection;