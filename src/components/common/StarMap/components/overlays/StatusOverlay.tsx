import React from 'react';
import { Box, CircularProgress, Alert } from '@mui/material';

interface StatusOverlayProps {
    isLoading: boolean;
    fetchError: string | null;
}

export const StatusOverlay: React.FC<StatusOverlayProps> = ({ isLoading, fetchError }) => {
    return (
        <>
            {isLoading && (
                <Box
                    sx={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%,-50%)",
                    }}
                >
                    <CircularProgress />
                </Box>
            )}
            {fetchError && (
                <Alert
                    severity="error"
                    sx={{ position: "absolute", top: 8, left: 8 }}
                >
                    Error: {fetchError}
                </Alert>
            )}
        </>
    );
};
