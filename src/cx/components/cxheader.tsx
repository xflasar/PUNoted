import { ShowChart, SwapHoriz, ViewList } from "@mui/icons-material";
import { Box, Button, ToggleButton, ToggleButtonGroup } from "@mui/material";
import React from "react";
import { FaArrowLeft } from "react-icons/fa";

interface CXHeaderProps {
    viewMode: "terminal" | "market" | "arbitrage";
    setViewMode: (viewMode: "terminal" | "market" | "arbitrage") => void;
    isMobile: boolean;
    navigate: (path: string) => void;
}

export const CXHeader: React.FC<CXHeaderProps> = ({ viewMode, setViewMode, isMobile, navigate }) => {
    return (
        <Box
            sx={{
                height: 60,
                px: { xs: 1.5, sm: 3 },
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: "1px solid rgba(123, 104, 238, 0.2)",
                bgcolor: "rgba(6, 6, 14, 0.85)",
                backdropFilter: "blur(12px)",
                flexShrink: 0,
            }}
        >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Button
                    variant="outlined"
                    size="small"
                    startIcon={<FaArrowLeft style={{ color: "#7B68EE" }} />}
                    onClick={() => navigate("/")}
                    sx={{
                        color: "white",
                        borderColor: "#7B68EE",
                        fontSize: { xs: "0.75rem", sm: "0.85rem" },
                        fontWeight: 600,
                        textTransform: "none",
                        "&:hover": {
                            borderColor: "#6a5acd",
                            bgcolor: "rgba(123, 104, 238, 0.12)",
                            boxShadow: "0 0 12px rgba(123, 104, 238, 0.3)",
                        },
                    }}
                >
                    Back
                </Button>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <ToggleButtonGroup
                    value={viewMode}
                    exclusive
                    onChange={(_, val) => {
                        if (val) {
                            console.log("[CX DEBUG] ViewMode changed to:", val);
                            setViewMode(val);
                        }
                    }}
                    size="small"
                    sx={{
                        bgcolor: "rgba(255, 255, 255, 0.04)",
                        border: "1px solid rgba(123, 104, 238, 0.2)",
                        borderRadius: "8px",
                        overflow: "hidden",
                        "& .MuiToggleButton-root": {
                            color: "rgba(255, 255, 255, 0.6)",
                            fontSize: { xs: "0.65rem", sm: "0.75rem" },
                            px: { xs: 1, sm: 1.5 },
                            py: 0.5,
                            gap: 0.5,
                            border: "none",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            transition: "all 0.2s ease",
                            "&.Mui-selected": {
                                color: "white",
                                bgcolor: "#7B68EE",
                                boxShadow: "0 0 15px rgba(123, 104, 238, 0.5)",
                                "&:hover": { bgcolor: "#6a5acd" },
                            },
                            "&:hover": {
                                bgcolor: "rgba(123, 104, 238, 0.15)",
                                color: "white",
                            },
                        },
                    }}
                >
                    <ToggleButton value="terminal">
                        <ShowChart fontSize="small" />{" "}
                        {isMobile ? "Terminal" : "Terminal View"}
                    </ToggleButton>
                    <ToggleButton value="market">
                        <ViewList fontSize="small" />{" "}
                        {isMobile ? "Overview" : "Market Overview"}
                    </ToggleButton>
                    <ToggleButton value="arbitrage" disabled>
                        <SwapHoriz fontSize="small" />{" "}
                        {isMobile ? "Arbitrage" : "Trade & Arbitrage"}
                    </ToggleButton>
                </ToggleButtonGroup>
            </Box>
        </Box>

    )
}