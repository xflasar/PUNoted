import React, { useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  LinearProgress,
  Tooltip,
  Divider,
  Chip,
  useTheme,
  alpha,
  TextField,
  InputAdornment,
} from "@mui/material";
import {
  MapPin,
  Flame,
  Factory,
  Archive,
  ArrowUpCircle,
  ArrowDownCircle,
  Clock,
  Package,
} from "lucide-react";
import { SiteSummary, FlowData } from "./types";

// --- HELPERS ---
const formatFlow = (val: number) => `${val > 0 ? "+" : ""}${val.toFixed(1)}`;

// Smart Formatter for Need values
const smartFormat = (val: number) => {
  if (val >= 1000000) {
    return { 
      text: `${(val / 1000000).toFixed(1)}M`, 
      full: val.toLocaleString("en-US", { maximumFractionDigits: 0 }),
      isAbbreviated: true 
    };
  }
  return { 
    text: val.toLocaleString("en-US", { maximumFractionDigits: 0 }), 
    full: "", 
    isAbbreviated: false 
  };
};

interface ProductionCardProps {
  site: SiteSummary;
  richFlows: Record<string, FlowData>;
  siteId: string;
  targetDays: number;
  onTargetDaysChange: (val: string) => void;
  onSelect: (siteId: string) => void;
}

export const ProductionCard = React.memo(
  ({
    site,
    richFlows,
    siteId,
    targetDays,
    onTargetDaysChange,
    onSelect,
  }: ProductionCardProps) => {
    const theme = useTheme();

    // --- MEMOIZED CALCULATIONS ---
    const { productionList, consumptionList, statusColor, activeLines, activeProducts } =
      useMemo(() => {
        const prod: FlowData[] = [];
        const cons: FlowData[] = [];
        let minDays = 999;
        const products = new Set<string>();

        // 1. Process Flows
        Object.values(richFlows)
          .sort((a, b) => a.ticker.localeCompare(b.ticker))
          .forEach((f) => {
            if (f.flow > 0) {
              prod.push(f);
            } else if (f.flow < 0) {
              const dailyBurn = Math.abs(f.flow);
              const daysLeft = f.currentAmount / dailyBurn;
              const targetAmount = dailyBurn * targetDays;
              const missing = Math.max(0, targetAmount - f.currentAmount);

              if (daysLeft < minDays) minDays = daysLeft;

              cons.push({ ...f, daysRemaining: daysLeft, missing });
            }
          });

        // 2. Status Color
        let color = theme.palette.success.main;
        if (minDays < targetDays / 5) color = theme.palette.error.main;
        else if (minDays < targetDays) color = theme.palette.warning.main;

        // 3. Active Lines Summary
        let linesCount = 0;
        site.production_lines.forEach((l) => {
          if (l.production_orders.length > 0) {
            linesCount++;
            for (const f of l.production_orders || []) {
              if (f.production_recipe) {
                f.production_recipe.outputs?.forEach((out) => {
                  products.add(out.ticker);
                });
              }
            }
          }
        });

        return {
          productionList: prod,
          consumptionList: cons,
          statusColor: color,
          activeLines: linesCount,
          activeProducts: Array.from(products).slice(0, 5), // Limit to 5 products
        };
      }, [richFlows, site.production_lines, targetDays, theme]);

    const conditionColor =
      site.overall_platform_condition > 0.9
        ? theme.palette.success.main
        : site.overall_platform_condition > 0.5
        ? theme.palette.warning.main
        : theme.palette.error.main;

    return (
      <Paper
        onClick={() => onSelect(siteId)}
        elevation={2}
        sx={{
          display: "flex",
          flexDirection: "column",
          borderRadius: 2,
          overflow: "hidden",
          border: `1px solid ${alpha(statusColor, 0.4)}`,
          bgcolor: alpha(theme.palette.background.default, 0.6),
          backdropFilter: "blur(12px)",
          transition: "all 0.1s ease",
          cursor: "pointer",
          width: "100%",
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: `0 4px 12px -2px ${alpha(statusColor, 0.2)}`,
            borderColor: statusColor,
          },
        }}
      >
        {/* --- HEADER --- */}
        <Box
          sx={{
            px: 1.5,
            py: 0.75, // Extra compact header
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            bgcolor: alpha(statusColor, 0.08),
            borderBottom: `1px solid ${alpha(statusColor, 0.15)}`,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, overflow: "hidden" }}>
            <MapPin size={16} color={statusColor} />
            <Typography variant="body1" fontWeight={700} color="text.primary" noWrap sx={{ fontSize: '1rem' }}>
              {site.planet_name_alt === site.planet_name ? site.planet_name : `${site.planet_name_alt} (${site.planet_name})`}
            </Typography>
          </Box>
          <Chip
            icon={<Flame size={10} />}
            label={`${(site.overall_platform_condition * 100).toFixed(0)}%`}
            size="medium"
            sx={{
              height: 18,
              fontSize: "0.7rem",
              fontWeight: 600,
              bgcolor: alpha(conditionColor, 0.1),
              color: conditionColor,
              border: `1px solid ${alpha(conditionColor, 0.25)}`,
              "& .MuiChip-icon": { color: conditionColor },
            }}
          />
        </Box>

        {/* --- BODY --- */}
        <Box sx={{ p: 1, flex: 1, display: "flex", flexDirection: "column", gap: 1 }}>
          
          {/* Permits & Target Input */}
          <Box sx={{ display: "flex", gap: 1, alignItems: "flex-end" }}>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.25 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, opacity: 0.7 }}>
                  <Archive size={12} />
                  <Typography variant="caption" fontWeight={600} fontSize="0.65rem">PERMITS</Typography>
                </Box>
                <Typography variant="caption" fontWeight={600} color="text.primary" fontSize="0.75rem">
                  {site.invested_permits} / {site.maximum_permits}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={(site.invested_permits / (site.maximum_permits || 1)) * 100}
                sx={{ height: 3, borderRadius: 1.5 }}
                color="primary"
              />
            </Box>

            <TextField
              label="Target"
              type="number"
              variant="outlined"
              size="medium"
              value={targetDays}
              onChange={(e) => onTargetDaysChange(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              InputProps={{
                endAdornment: <InputAdornment position="end"><Typography variant="subtitle2" color="text.secondary" sx={{ fontSize: '0.8rem', marginRight: 1}}>d</Typography></InputAdornment>,
              }}
              sx={{
                width: 70,
                flexShrink: 0,
                "& .MuiInputBase-root": { fontSize: "0.8rem", borderRadius: 1, height: 26, paddingRight: 0 },
                "& .MuiInputLabel-root": { fontSize: "0.8rem", transform: "translate(8px, 5px) scale(1)" },
                "& .MuiInputLabel-shrink": { transform: "translate(8px, -8px) scale(0.85)" },
                "& .MuiOutlinedInput-input": { p: "2px 6px" }
              }}
            />
          </Box>

          <Divider sx={{ opacity: 0.2 }} />

          {/* --- DATA SECTION --- */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            
            {/* 1. PRODUCTION LIST */}
            {productionList.length > 0 && (
                <Box>
                    <Typography variant="subtitle2" sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 0.5, mb: 0.25, color: theme.palette.success.main, fontWeight: 700, fontSize: '0.7rem' }}>
                        <ArrowUpCircle size={14} /> PRODUCTION
                    </Typography>
                    
                    <Box sx={{ display: 'grid', gap: 0.25 }}>
                        {productionList.map((p) => (
                            <Box 
                                key={p.ticker} 
                                sx={{ 
                                    display: "grid", 
                                    gridTemplateColumns: "40px 1fr", 
                                    alignItems: "center", 
                                    gap: 1,
                                    py: 0.15,
                                    borderBottom: `1px dashed ${alpha(theme.palette.divider, 0.05)}`
                                }}
                            >
                                <Typography variant="caption" fontWeight={600} color="text.primary" fontSize="0.85rem">{p.ticker}</Typography>
                                <Typography variant="caption" fontWeight={400} color="success.main" textAlign="right" fontSize="0.85rem">{formatFlow(p.flow)}</Typography>
                            </Box>
                        ))}
                    </Box>
                </Box>
            )}

            {/* 2. CONSUMPTION LIST */}
            {consumptionList.length > 0 && (
                <Box>
                    <Typography variant="subtitle2" sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 0.5, mb: 0.25, color: theme.palette.warning.main, fontWeight: 700, fontSize: '0.7rem' }}>
                        <ArrowDownCircle size={14} /> CONSUMPTION
                    </Typography>
                    
                    <Box sx={{ display: 'grid', gap: 0.25 }}>
                        {consumptionList.map((c) => {
                            const isCritical = c.daysRemaining < targetDays / 5;
                            const isWarning = c.daysRemaining < targetDays;
                            const daysColor = isCritical ? "error.main" : isWarning ? "warning.main" : "success.main";
                            
                            // Smart Format for Need
                            const { text: needText, full: needFull, isAbbreviated } = smartFormat(c.missing);

                            return (
                                <Box key={c.ticker} sx={{ 
                                    display: "grid", 
                                    // COLUMNS: Ticker (3ch) | Flow (Flex) | Days (Compact) | Need (Flex)
                                    // Using minmax(0, 1fr) for flex columns ensures they don't overflow
                                    gridTemplateColumns: "40px minmax(0, 1fr) min-content minmax(0, 1fr)", 
                                    alignItems: "center", 
                                    gap: 1, // Space between columns
                                    py: 0.15,
                                    borderBottom: `1px dashed ${alpha(theme.palette.divider, 0.05)}`
                                }}>
                                    {/* 1. Ticker */}
                                    <Typography variant="caption" fontWeight={600} color="text.primary" fontSize="0.85rem" noWrap>{c.ticker}</Typography>
                                    
                                    {/* 2. Flow Rate (Responsive) */}
                                    <Typography variant="caption" color="text.secondary" textAlign="center" fontSize="0.85rem" sx={{ opacity: 0.9 }}>
                                        {formatFlow(c.flow)}
                                    </Typography>
                                    
                                    {/* 3. Days (Small fixed) */}
                                    <Tooltip title="Days remaining">
                                        <Typography variant="caption" fontWeight={500} sx={{ color: daysColor, cursor: "help", whiteSpace: 'nowrap' }} textAlign="right" fontSize="0.85rem">
                                            {c.daysRemaining > 999 ? "∞" : `${c.daysRemaining.toFixed(1)}d`}
                                        </Typography>
                                    </Tooltip>

                                    {/* 4. Need Value (Responsive) */}
                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                        {c.missing > 0 ? (
                                            <Tooltip title={isAbbreviated ? `Need ${needFull}` : ""} disableHoverListener={!isAbbreviated}>
                                                <Typography 
                                                    variant="caption" 
                                                    fontWeight={500} 
                                                    color="error.main"
                                                    sx={{ 
                                                        fontSize: "0.85rem",
                                                        textAlign: 'right',
                                                        cursor: isAbbreviated ? "help" : "default",
                                                        textDecoration: isAbbreviated ? "underline dotted" : "none",
                                                        textUnderlineOffset: "2px"
                                                    }}
                                                >
                                                    {needText}
                                                </Typography>
                                            </Tooltip>
                                        ) : (
                                            <Box />
                                        )}
                                    </Box>
                                </Box>
                            );
                        })}
                    </Box>
                </Box>
            )}

            {!productionList.length && !consumptionList.length && (
                <Typography variant="caption" color="text.disabled" fontStyle="italic" textAlign="center" sx={{ py: 1 }}>
                    No active flow data
                </Typography>
            )}
          </Box>
        </Box>

        {/* --- FOOTER: ACTIVE LINES --- */}
        <Box
          sx={{
            px: 1,
            py: 0.5,
            bgcolor: alpha(theme.palette.action.hover, 0.05),
            borderTop: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Factory size={12} color={theme.palette.text.secondary} />
            <Typography variant="caption" fontWeight={600} color="text.secondary" fontSize="0.7rem">
              {site.production_lines.length} Lines
            </Typography>
          </Box>

          {activeLines > 0 ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                <Box sx={{ display: "flex", gap: 0.25, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {activeProducts.map((ticker) => (
                        <Chip 
                            key={ticker} 
                            label={ticker} 
                            size="small" 
                            variant="outlined" 
                            sx={{ 
                                height: 16, 
                                fontSize: "0.6rem", 
                                fontWeight: 600, 
                                borderColor: alpha(theme.palette.info.main, 0.3),
                                color: theme.palette.text.primary,
                                px: 0,
                                '& .MuiChip-label': { px: 0.5 }
                            }} 
                        />
                    ))}
                </Box>
                <Package size={12} color={theme.palette.info.main} />
            </Box>
          ) : (
             <Typography variant="caption" color="text.disabled" fontSize="0.7rem">Idle</Typography>
          )}
        </Box>
      </Paper>
    );
  }
);