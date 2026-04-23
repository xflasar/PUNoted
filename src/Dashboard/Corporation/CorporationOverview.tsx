import React, { useMemo, useEffect, useState } from "react";
import {
  Box,
  Alert,
  useTheme,
  useMediaQuery,
  Paper,
  Typography,
  Chip,
  Tabs,
  Tab,
  alpha,
  Skeleton,
  Select,
  MenuItem,
  FormControl,
  SelectChangeEvent
} from "@mui/material";
import GroupIcon from "@mui/icons-material/Group";
import FactoryIcon from "@mui/icons-material/Factory";
import AssessmentIcon from "@mui/icons-material/Assessment";
import DomainIcon from "@mui/icons-material/Domain";
import { CorpOverviewData, ProductionSummaryItem } from "./types"; 
import { CorpProductionView } from "./CorpProductionView"; 
import CorpMembersTable from "./CorpMembersTable"; 

// --- ANIMATED 3 DOTS LOADER ---
const ThreeDotsLoader = () => (
    <Box sx={{ display: 'inline-flex', gap: 0.5, alignItems: 'baseline' }}>
        {[0, 1, 2].map(i => (
            <Box 
                key={i} 
                sx={{ 
                    width: 4, 
                    height: 4, 
                    borderRadius: '50%', 
                    bgcolor: 'currentColor', 
                    animation: 'pulse 1.4s infinite ease-in-out both',
                    animationDelay: `${i * 0.16}s`,
                    '@keyframes pulse': {
                        '0%, 80%, 100%': { transform: 'scale(0)', opacity: 0.5 },
                        '40%': { transform: 'scale(1)', opacity: 1 }
                    }
                }} 
            />
        ))}
    </Box>
);

export const CorporationOverview: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [tabValue, setTabValue] = useState(1);
  
  // STATE: Now holds a LIST of corporations
  const [corpList, setCorpList] = useState<CorpOverviewData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // FILTER STATE
  const [selectedCorpFilter, setSelectedCorpFilter] = useState<string>("ALL");

  const glassyStyle = useMemo(() => ({
      backgroundColor: alpha(theme.palette.background.default, 0.4),
      backdropFilter: 'blur(12px)',
      border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
      backgroundImage: 'none',
      boxShadow: 'none',
  }), [theme]);

  // 1. FETCH DATA (Expect Array)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setIsLoading(true);
        const res = await fetch("https://api.punoted.net/internal/corporation/", { 
            headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` } 
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        
        if (mounted) {
            // Ensure we handle both single object (legacy) and array (new)
            const list = Array.isArray(data) ? data : [data];
            setCorpList(list);
        }
      } catch {
        if (mounted) setError("Failed to load corporation data");
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // 2. COMPUTE ACTIVE DATA (Aggregated vs Single)
  const activeViewData = useMemo(() => {
      if (!corpList.length) return null;

      // CASE A: Single Corporation Selected
      if (selectedCorpFilter !== 'ALL') {
          const selected = corpList.find(c => c.code === selectedCorpFilter);
          return selected || corpList[0]; // Fallback
      }

      // CASE B: "ALL" -> Aggregate Everything
      // 1. Merge Members
      const allMembers = corpList.flatMap(c => c.members || []);
      
      // 2. Merge Production Summary
      // We use a map to combine items with the same ticker
      const prodMap = new Map<string, ProductionSummaryItem>();

      corpList.forEach(corp => {
          (corp.productionSummary || []).forEach(item => {
              const existing = prodMap.get(item.ticker);
              if (existing) {
                  // MERGE LOGIC
                  existing.productionTotal += item.productionTotal;
                  existing.productionAccurate += item.productionAccurate;
                  existing.productionEstimated += item.productionEstimated;
                  
                  existing.consumptionTotal += item.consumptionTotal;
                  existing.consumptionAccurate += item.consumptionAccurate;
                  existing.consumptionEstimated += item.consumptionEstimated;
                  
                  existing.net += item.net;

                  // Concatenate details
                  existing.producers = [...existing.producers, ...item.producers];
                  existing.consumers = [...existing.consumers, ...item.consumers];
              } else {
                  // CLONE logic to avoid mutating the original reference in state
                  prodMap.set(item.ticker, { 
                      ...item, 
                      producers: [...item.producers], 
                      consumers: [...item.consumers] 
                  });
              }
          });
      });

      const aggregatedProduction = Array.from(prodMap.values());

      return {
          name: "All Corporations",
          code: "ALL",
          headquarters: "Aggregated",
          memberCount: allMembers.length,
          members: allMembers,
          productionSummary: aggregatedProduction,
          // Helper counts
          productionCount: aggregatedProduction.length,
          consumptionCount: aggregatedProduction.length
      } as CorpOverviewData;

  }, [corpList, selectedCorpFilter]);

  const syncedCount = useMemo(() => activeViewData?.members?.filter(m => m.isSynchronized).length || 0, [activeViewData]);

  if (error) {
    return <Alert severity="error">{error ?? "No data"}</Alert>;
  }

  const displayName = activeViewData?.name || <Skeleton width={180} height={40} />;
  
  const widgets = [
      { 
          title: "Members", 
          value: isLoading ? <ThreeDotsLoader /> : ` ${activeViewData?.memberCount || 0} (${syncedCount})`, 
          icon: <GroupIcon />, 
          color: theme.palette.primary.main 
      },
      { 
          title: "Headquarters", 
          value: isLoading ? <ThreeDotsLoader /> : activeViewData?.headquarters, 
          icon: <FactoryIcon />, 
          color: theme.palette.info.main 
      },
      { 
          title: "Materials", 
          value: isLoading ? <ThreeDotsLoader /> : `${(activeViewData?.productionSummary?.length || 0)}`, 
          icon: <AssessmentIcon />, 
          color: theme.palette.secondary.main 
      },
  ];

  return (
    <Box sx={{ height: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden', p: isMobile ? 0 : 2, gap: isMobile ? 1 : 2 }}>
        
        {/* HEADER */}
        <Paper sx={{ ...glassyStyle, p: isMobile ? 1 : 2, borderRadius: isMobile ? 0 : 2, flexShrink: 0 }}>
            <Box display="flex" flexDirection={isMobile ? 'column' : 'row'} justifyContent="space-between" alignItems="center" gap={isMobile ? 1 : 2}>
                
                {/* LEFT: Title & Filter */}
                <Box display="flex" alignItems="center" gap={2} width={isMobile ? '100%' : 'auto'} sx={{ minWidth: 0, flexWrap: 'wrap' }}>
                    <Typography variant={isMobile ? "h6" : "h4"} fontWeight="bold" color="primary.main" noWrap component="div">
                        {displayName}
                    </Typography>

                    {/* CORPORATION FILTER DROPDOWN */}
                    {!isLoading && corpList.length > 0 && (
                        <FormControl size="small" sx={{ minWidth: 140 }}>
                            <Select
                                value={selectedCorpFilter}
                                onChange={(e: SelectChangeEvent) => setSelectedCorpFilter(e.target.value)}
                                displayEmpty
                                variant="outlined"
                                sx={{ 
                                    height: 32, 
                                    fontSize: '0.8rem', 
                                    fontWeight: 'bold',
                                    bgcolor: alpha(theme.palette.background.default, 0.5),
                                    '& .MuiOutlinedInput-notchedOutline': { borderColor: alpha(theme.palette.primary.main, 0.3) }
                                }}
                                renderValue={(selected) => (
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <DomainIcon sx={{ fontSize: 16, color: theme.palette.primary.main }} />
                                        {selected === "ALL" ? "All Corps" : selected}
                                    </Box>
                                )}
                            >
                                <MenuItem value="ALL" sx={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <DomainIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                        All Corporations
                                    </Box>
                                </MenuItem>
                                {corpList.map(corp => (
                                    <MenuItem key={corp.code} value={corp.code} sx={{ fontSize: '0.8rem' }}>
                                        {corp.code} - {corp.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}
                </Box>
                
                {/* RIGHT: Widgets */}
                <Box display="flex" gap={1.5} sx={{ width: isMobile ? '100%' : 'auto', overflowX: 'auto', pb: isMobile ? 0.5 : 0, '::-webkit-scrollbar': { display: 'none' }, maxWidth: '100%' }}>
                    {widgets.map((w, i) => (
                        <Box key={i} sx={{ ...glassyStyle, p: 1, borderRadius: 2, minWidth: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', bgcolor: alpha(theme.palette.background.default, 0.3), flexShrink: 0 }}>
                            <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
                                {React.cloneElement(w.icon, { sx: { fontSize: 14, color: w.color } })}
                                <Typography variant="caption" color="text.secondary" fontWeight="bold" fontSize="0.7rem">{w.title}</Typography>
                            </Box>
                            <Typography variant="body2" fontWeight="bold" component="div">
                                {w.value}
                            </Typography>
                        </Box>
                    ))}
                </Box>
            </Box>
        </Paper>

        {/* CONTENT */}
        <Paper sx={{ ...glassyStyle, flex: 1, display: 'flex', flexDirection: 'column', borderRadius: isMobile ? 0 : 2, overflow: 'hidden', minHeight: 0 }}>
            <Tabs 
                value={tabValue} 
                onChange={(_, v) => setTabValue(v)} 
                centered={!isMobile} 
                variant={isMobile ? "fullWidth" : "standard"}
                textColor="primary" 
                indicatorColor="primary" 
                sx={{ borderBottom: 1, borderColor: 'divider', px: 2, minHeight: 40 }}
            >
                <Tab label="Members" sx={{ fontSize: '0.85rem' }} />
                <Tab label="Production" sx={{ fontSize: '0.85rem' }} />
            </Tabs>
            
            <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: tabValue === 0 ? 'flex' : 'none', flex: 1, height: '100%', overflow: 'hidden', flexDirection: 'column' }}>
                    <CorpMembersTable members={activeViewData?.members || []} isLoading={isLoading} />
                </Box>
                <Box sx={{ display: tabValue === 1 ? 'flex' : 'none', flex: 1, height: '100%', overflow: 'hidden', flexDirection: 'column' }}>
                    <CorpProductionView productionSummary={activeViewData?.productionSummary || []} members={activeViewData?.members} isLoading={isLoading} />
                </Box>
            </Box>
        </Paper>
    </Box>
  );
};

export default CorporationOverview;