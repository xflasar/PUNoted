// src/app/settings/page.tsx
'use client';

import { Box, Typography, TextField, Button, Alert } from '@mui/material';
import { useLocalStorage } from '@/lib/hooks/useLocalStorage';
import { useState } from 'react';

export default function SettingsPage() {
  const [fioApiKey, setFioApiKey] = useLocalStorage<string>('fioApiKey', '');
  const [apiKeyInput, setApiKeyInput] = useState(fioApiKey);
  const [saveStatus, setSaveStatus] = useState<'none' | 'success' | 'error'>('none');

  const handleSave = () => {
    setFioApiKey(apiKeyInput);
    setSaveStatus('success');
    setTimeout(() => setSaveStatus('none'), 3000);
  };

  return (
    <Box sx={{
      py: 4,
      px: { xs: 2, sm: 3, md: 4 },
      flexGrow: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4 }}>
        Application Settings
      </Typography>

      <Box sx={{ maxWidth: 600, width: '100%', mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          FIO API Key
        </Typography>
        <TextField
          label="Your FIO API Key"
          type="password" // maybe not for when user types and then when its saved there it will change to password type
          fullWidth
          value={apiKeyInput}
          onChange={(e) => {
            setApiKeyInput(e.target.value);
            setSaveStatus('none');
          }}
          sx={{ mb: 2 }}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={handleSave}
          disabled={apiKeyInput === fioApiKey}
        >
          Save API Key
        </Button>
        {saveStatus === 'success' && (
          <Alert severity="success" sx={{ mt: 2 }}>
            API Key saved successfully!
          </Alert>
        )}
        {saveStatus === 'error' && (
          <Alert severity="error" sx={{ mt: 2 }}>
            Error saving API Key.
          </Alert>
        )}
      </Box>
    </Box>
  );
}