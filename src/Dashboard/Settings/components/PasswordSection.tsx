import React, { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  IconButton,
  useTheme,
} from "@mui/material";
import { Lock, Visibility, VisibilityOff, MarkEmailRead } from "@mui/icons-material";
import { SectionHeader, transparentCardStyle } from "../styles";
import { securityGuideSteps } from "../constants";

const PasswordSection: React.FC<{
  onRequestChallenge: () => Promise<boolean>;
  onConfirmChange: (curr: string, newP: string, code: string) => Promise<boolean>;
}> = ({ onRequestChallenge, onConfirmChange }) => {
  const theme = useTheme();
  const [form, setForm] = useState({ current: "", new: "", confirm: "" });
  const [show, setShow] = useState({ current: false, new: false });
  const [isVerifying, setIsVerifying] = useState(false);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleInitiate = async () => {
    if (!form.current || !form.new || !form.confirm) return alert("Fill all fields.");
    if (form.new !== form.confirm) return alert("Passwords do not match.");
    setLoading(true);
    const success = await onRequestChallenge();
    setLoading(false);
    if (success) setIsVerifying(true);
  };

  const handleConfirm = async () => {
    if (!code) return;
    setLoading(true);
    const success = await onConfirmChange(form.current, form.new, code);
    setLoading(false);
    if (success) {
      setIsVerifying(false);
      setForm({ current: "", new: "", confirm: "" });
      setCode("");
    }
  };

  return (
    <Paper sx={transparentCardStyle(theme)}>
      <SectionHeader icon={<Lock />} title="Security" color={theme.palette.warning.main} guideSteps={securityGuideSteps}/>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, flex: 1 }}>
        <TextField
          label="Current Password"
          type={show.current ? "text" : "password"}
          value={form.current}
          onChange={(e) => setForm({ ...form, current: e.target.value })}
          fullWidth
          size="small"
          variant="outlined"
          InputProps={{
            style: { fontSize: "0.85rem" },
            endAdornment: (
              <IconButton size="small" onClick={() => setShow({ ...show, current: !show.current })}>
                {show.current ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
              </IconButton>
            ),
          }}
          InputLabelProps={{ style: { fontSize: "0.85rem" } }}
        />
        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
          <TextField
            label="New Password"
            type={show.new ? "text" : "password"}
            value={form.new}
            onChange={(e) => setForm({ ...form, new: e.target.value })}
            size="small"
            variant="outlined"
            sx={{ flex: "1 1 150px" }}
            InputProps={{
              style: { fontSize: "0.85rem" },
              endAdornment: (
                <IconButton size="small" onClick={() => setShow({ ...show, new: !show.new })}>
                  {show.new ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                </IconButton>
              ),
            }}
            InputLabelProps={{ style: { fontSize: "0.85rem" } }}
          />
          <TextField
            label="Confirm Password"
            type={show.new ? "text" : "password"}
            value={form.confirm}
            onChange={(e) => setForm({ ...form, confirm: e.target.value })}
            size="small"
            variant="outlined"
            sx={{ flex: "1 1 150px" }}
            InputProps={{ style: { fontSize: "0.85rem" } }}
            InputLabelProps={{ style: { fontSize: "0.85rem" } }}
          />
        </Box>
      </Box>
      <Box sx={{ mt: 1.5, display: "flex", justifyContent: "flex-end" }}>
        <Button
          variant="outlined"
          size="small"
          color="warning"
          onClick={handleInitiate}
          startIcon={<Lock />}
          disabled={loading}
          sx={{ height: 28, fontSize: "0.75rem" }}
        >
          Update
        </Button>
      </Box>

      <Dialog open={isVerifying} onClose={() => setIsVerifying(false)}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, fontSize: "1rem" }}>
          <MarkEmailRead color="primary" fontSize="small" /> Verify Identity
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2, fontSize: "0.85rem" }}>
            Enter the 6-digit code sent to your email.
          </DialogContentText>
          <TextField
            autoFocus
            fullWidth
            label="Verification Code"
            size="small"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsVerifying(false)} size="small">
            Cancel
          </Button>
          <Button onClick={handleConfirm} variant="contained" size="small">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default PasswordSection;