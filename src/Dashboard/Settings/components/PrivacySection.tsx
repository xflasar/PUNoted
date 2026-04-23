import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Stack,
  FormControlLabel,
  Switch,
  useTheme,
  Tooltip,
} from "@mui/material";
import { Security, Save } from "@mui/icons-material";
import { alpha } from "@mui/material/styles";
import type { WebPrivacySettings } from "../types";
import { 
  PAGE_CONTEXTS, 
  privacyGuideSteps, 
  PREFERENCE_DESCRIPTIONS 
} from "../constants";
import { transparentCardStyle } from "../styles";
import { SectionGuide } from "../../../helpers/GlobalGuide";

const PrivacySection: React.FC<{
  initialPrivacy: WebPrivacySettings;
  onSave: (data: WebPrivacySettings) => Promise<void>;
}> = ({ initialPrivacy, onSave }) => {
  const theme = useTheme();
  const [privacySettings, setPrivacySettings] = useState(initialPrivacy);
  const [unsaved, setUnsaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setPrivacySettings(initialPrivacy);
  }, [initialPrivacy]);

  const handleToggle = (context: string, key: string, currentVal: boolean) => {
    setPrivacySettings((prev) => ({
      ...prev,
      [context]: { ...prev[context], [key]: !currentVal },
    }));
    setUnsaved(true);
  };

  const handleSave = async () => {
    setLoading(true);
    await onSave(privacySettings);
    setUnsaved(false);
    setLoading(false);
  };

  return (
    <Paper sx={transparentCardStyle(theme)}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 1.5,
          borderBottom: `1px solid ${alpha(theme.palette.secondary.main, 0.3)}`,
          pb: 0.5,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Security sx={{ color: theme.palette.secondary.main, mr: 1, fontSize: 20 }} />
          <Typography
            variant="subtitle2"
            fontWeight={700}
            sx={{ textTransform: "uppercase", letterSpacing: "0.5px", color: theme.palette.secondary.main }}
          >
            Privacy
          </Typography>
          <SectionGuide title="Privacy" steps={privacyGuideSteps} />
        </Box>
        <Button
          variant="outlined"
          size="small"
          color="secondary"
          onClick={handleSave}
          startIcon={<Save />}
          disabled={!unsaved || loading}
          sx={{ height: 24, fontSize: "0.7rem", px: 1 }}
        >
          Save
        </Button>
      </Box>

      <Stack spacing={1} sx={{ flex: 1, overflowY: "auto", maxHeight: "250px" }}>
        {Object.entries(privacySettings).map(([context, prefs]) => (
          <Box
            key={context}
            sx={{
              p: 1,
              border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
              borderRadius: 1,
            }}
          >
            <Typography
              variant="caption"
              fontWeight="bold"
              color="text.secondary"
              sx={{ textTransform: "uppercase", mb: 0.5, display: "block", fontSize: "0.7rem" }}
            >
              {PAGE_CONTEXTS[context as keyof typeof PAGE_CONTEXTS] || context}
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {Object.entries(prefs).map(([key, val]) => {
                const isMandatory = context === "CORP_PAGE" && key === "share_production";
                
                const label = key
                  .replace("share_", "")
                  .replace("_", " ")
                  .replace(/\b\w/g, (c) => c.toUpperCase());

                const description = PREFERENCE_DESCRIPTIONS[key] || "Toggle visibility for this data type.";

                return (
                  <Tooltip 
                    key={key} 
                    title={description} 
                    arrow 
                    placement="top"
                    enterDelay={100}
                    leaveDelay={0}
                    componentsProps={{
                        tooltip: {
                            sx: {
                                bgcolor: theme.palette.background.default,
                                color: theme.palette.text.primary,
                                border: `1px solid ${theme.palette.divider}`,
                                boxShadow: theme.shadows[4]
                            }
                        },
                        arrow: {
                            sx: {
                                color: theme.palette.background.default
                            }
                        }
                    }}
                  >
                    <FormControlLabel
                      control={
                        <Switch
                          checked={isMandatory ? true : val}
                          disabled={isMandatory}
                          onChange={() => handleToggle(context, key, val)}
                          size="small"
                          sx={{ transform: "scale(0.8)" }}
                        />
                      }
                      label={
                        <Typography variant="caption" sx={{ fontSize: "0.75rem" }}>
                          {label}
                        </Typography>
                      }
                      sx={{ mr: 1, ml: 0 }}
                    />
                  </Tooltip>
                );
              })}
            </Box>
          </Box>
        ))}
      </Stack>
    </Paper>
  );
};

export default PrivacySection;