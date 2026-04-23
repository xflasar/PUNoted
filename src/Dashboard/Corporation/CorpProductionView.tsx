import React, { useState, useEffect, useCallback, useTransition, useMemo } from "react";
import { 
    Box, 
    TextField, 
    InputAdornment, 
    Stack, 
    Tooltip, 
    IconButton, 
    ToggleButtonGroup, 
    ToggleButton, 
    Collapse, 
    Paper, 
    Table, 
    TableHead, 
    TableRow, 
    TableCell, 
    TableBody, 
    alpha, 
    useTheme, 
    TableContainer, 
    CircularProgress,
    FormControl,
    Select,
    MenuItem,
    SelectChangeEvent,
    OutlinedInput,
    Checkbox,
    ListItemText,
    ListSubheader,
    Typography 
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CenterFocusStrongIcon from "@mui/icons-material/CenterFocusStrong";
import FilterListIcon from "@mui/icons-material/FilterList";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import ViewListIcon from "@mui/icons-material/ViewList";
import PersonSearchIcon from "@mui/icons-material/PersonSearch";
import CloseIcon from "@mui/icons-material/Close";
import { TableVirtuoso } from "react-virtuoso"; 

import type { ProductionSummaryItem, CorpMember, CustomCategory } from "./types";
import { ALL_CATEGORIES, getCategory } from "./production/constants";
import { CategoryCard } from "./production/CategoryCard";
import { CategoryHeaderRow } from "./production/CategoryHeaderRow";
import { CompactProductionRow } from "./production/CompactProductionRow";

interface Props {
    productionSummary: ProductionSummaryItem[];
    members?: CorpMember[];
    isLoading?: boolean;
}

// --- ISOLATED MEMBER FILTER COMPONENT ---
const MemberFilterSelect = React.memo(({ members, selectedMembers, onChange, theme }: { members: CorpMember[], selectedMembers: string[], onChange: (vals: string[]) => void, theme: any }) => {
    const [searchText, setSearchText] = useState("");

    const handleMemberChange = (event: SelectChangeEvent<string[]>) => {
        const { target: { value } } = event;
        // IMPORTANT: value is an array of companyCodes
        onChange(typeof value === 'string' ? value.split(',') : value);
    };

    // Filter list for display
    const filteredOptions = useMemo(() => {
        const list = members || [];
        if (!searchText) return list;
        const lower = searchText.toLowerCase();
        return list.filter(m => 
            (m.companyName || "").toLowerCase().includes(lower) || 
            (m.companyCode || "").toLowerCase().includes(lower)
        );
    }, [members, searchText]);

    const glassyInputStyle = { 
        backgroundColor: alpha(theme.palette.background.default, 0.4), 
        backdropFilter: 'blur(12px)', 
        border: `1px solid ${alpha(theme.palette.divider, 0.2)}`, 
        boxShadow: 'none',
        borderRadius: 1, 
        height: 40, 
        fontSize: '0.85rem' 
    };

    const MenuProps = {
        PaperProps: {
            sx: {
                maxHeight: 400,
                width: 280,
                bgcolor: alpha(theme.palette.background.default, 0.95),
                backdropFilter: 'blur(16px)',
                border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                boxShadow: theme.shadows[8],
                '& .MuiList-root': { pt: 0 }
            },
        },
        autoFocus: false
    };

    return (
        <FormControl size="small" sx={{ minWidth: 200, maxWidth: 300, flexGrow: 1 }}>
            <Select
                multiple
                displayEmpty
                value={selectedMembers}
                onChange={handleMemberChange}
                input={<OutlinedInput sx={glassyInputStyle} />}
                onClose={() => setSearchText("")} 
                MenuProps={MenuProps}
                renderValue={(selected) => {
                    if (selected.length === 0) {
                        return (
                            <Box display="flex" alignItems="center" gap={1} color="text.secondary">
                                <PersonSearchIcon fontSize="small" />
                                All Members
                            </Box>
                        );
                    }
                    return (
                        <Box display="flex" alignItems="center" gap={0.5}>
                            <PersonSearchIcon fontSize="small" color="primary" />
                            <Typography variant="caption" fontWeight="bold">{selected.length} Selected</Typography>
                        </Box>
                    );
                }}
            >
                <ListSubheader sx={{ bgcolor: 'transparent', p: 1 }}>
                    <TextField
                        size="small"
                        autoFocus
                        placeholder="Search Member..."
                        fullWidth
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        onKeyDown={(e) => e.stopPropagation()} 
                        InputProps={{
                            startAdornment: (<InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>),
                            sx: { fontSize: '0.85rem', bgcolor: alpha(theme.palette.background.default, 0.6) }
                        }}
                    />
                </ListSubheader>

                <MenuItem disabled value="">
                    <Typography variant="caption" fontWeight="bold" color="text.secondary">
                        Select Members to Filter
                    </Typography>
                </MenuItem>
                
                {filteredOptions.length > 0 ? filteredOptions.map((member) => (
                    // KEY & VALUE are companyCode (The unique ID)
                    <MenuItem key={member.companyCode} value={member.companyCode || ""}>
                        <Checkbox checked={selectedMembers.indexOf(member.companyCode || "") > -1} size="small" />
                        <ListItemText 
                            primary={member.companyName} 
                            secondary={member.companyCode}
                            primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 600 }} 
                            secondaryTypographyProps={{ fontSize: '0.7rem' }}
                        />
                    </MenuItem>
                )) : (
                    <MenuItem disabled>
                        <Typography variant="caption" fontStyle="italic">No matches found</Typography>
                    </MenuItem>
                )}
            </Select>
        </FormControl>
    );
});

// --- MAIN COMPONENT ---
export const CorpProductionView = React.memo(({ productionSummary, members, isLoading = false }: Props) => {
    const theme = useTheme();
    const isMobile = false; 
    const [isPending, startTransition] = useTransition();

    // UI STATE
    const [inputValue, setInputValue] = useState("");
    const [searchTerm, setSearchTerm] = useState(""); 
    const [exactMatch, setExactMatch] = useState(false);
    
    // FILTERS
    const [selectedCategories, setSelectedCategories] = useState<string[]>(["ALL"]);
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]); // Stores Company CODES
    
    const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);
    const [filterOpen, setFilterOpen] = useState(false);
    const [layoutMode, setLayoutMode] = useState<'masonry' | 'list'>(() => 
        (localStorage.getItem('corpProductionLayout') as 'masonry' | 'list') || 'masonry'
    );

    // PROCESSED DATA STATE
    const [isProcessing, setIsProcessing] = useState(false);
    const [processedList, setProcessedList] = useState<any[]>([]);
    const [processedGroups, setProcessedGroups] = useState<Record<string, ProductionSummaryItem[]>>({});
    const [processedSortedCats, setProcessedSortedCats] = useState<string[]>([]);

    // Search Debounce
    useEffect(() => {
        const handler = setTimeout(() => {
            startTransition(() => { setSearchTerm(inputValue); });
        }, 300);
        return () => clearTimeout(handler);
    }, [inputValue]);

    const handleLayoutChange = (event: React.MouseEvent<HTMLElement>, newAlignment: 'masonry' | 'list' | null) => {
        if (newAlignment !== null) {
            startTransition(() => { setLayoutMode(newAlignment); });
            localStorage.setItem('corpProductionLayout', newAlignment);
        }
    };

    const toggleCategory = useCallback((cat: string) => {
        setSelectedCategories(prev => {
            if (cat === "ALL") return ["ALL"];
            let newCats = prev.includes("ALL") ? [] : [...prev];
            if (newCats.includes(cat)) {
                newCats = newCats.filter(c => c !== cat);
            } else {
                newCats.push(cat);
            }
            return newCats.length === 0 ? ["ALL"] : newCats;
        });
    }, []);

    const hideCategory = useCallback((cat: string) => {
        if (cat.startsWith("drill-")) {
            setCustomCategories(prev => prev.filter(c => c.id !== cat));
            return;
        }
        setSelectedCategories(prev => {
            if (prev.includes("ALL")) {
                return ALL_CATEGORIES.filter(c => c !== cat);
            }
            const newCats = prev.filter(c => c !== cat);
            return newCats.length === 0 ? ["ALL"] : newCats;
        });
    }, []);

    const handleDrilldown = useCallback((item: ProductionSummaryItem, type: 'prod' | 'cons') => {
        const newCat: CustomCategory = {
            id: `drill-${item.ticker}-${type}-${Date.now()}`,
            title: `${item.ticker} (${type === 'prod' ? 'Producers' : 'Consumers'})`,
            items: [item],
            isDrilldown: true,
            drillType: type
        };
        setCustomCategories(prev => [newCat, ...prev]);
    }, []);

    // --- HEAVY DATA PROCESSING EFFECT ---
    useEffect(() => {
        if (isLoading) return;

        setIsProcessing(true);
        const timer = setTimeout(() => {
            let filtered = productionSummary;

            // 1. FILTER BY MEMBER (Strict Code Match & Recalculate)
            if (selectedMembers.length > 0) {
                filtered = filtered.map(row => {
                    // Filter producers/consumers where 'player' matches one of the selected Company CODES
                    const filteredProducers = row.producers.filter(p => selectedMembers.includes(p.player));
                    const filteredConsumers = row.consumers.filter(c => selectedMembers.includes(c.player));

                    // If NO match in either list, this ticker is irrelevant to the selection
                    if (filteredProducers.length === 0 && filteredConsumers.length === 0) return null;

                    // Recalculate totals based on the FILTERED lists
                    const pTotal = filteredProducers.reduce((acc, curr) => acc + curr.amount, 0);
                    const cTotal = filteredConsumers.reduce((acc, curr) => acc + curr.amount, 0);

                    // Reconstruct the item with updated values
                    return {
                        ...row,
                        producers: filteredProducers,
                        consumers: filteredConsumers,
                        productionTotal: pTotal,
                        productionAccurate: filteredProducers.filter(x => x.isAccurate).reduce((s, x) => s + x.amount, 0),
                        productionEstimated: filteredProducers.filter(x => !x.isAccurate).reduce((s, x) => s + x.amount, 0),
                        consumptionTotal: cTotal,
                        consumptionAccurate: filteredConsumers.filter(x => x.isAccurate).reduce((s, x) => s + x.amount, 0),
                        consumptionEstimated: filteredConsumers.filter(x => !x.isAccurate).reduce((s, x) => s + x.amount, 0),
                        net: pTotal - cTotal
                    };
                }).filter((item): item is ProductionSummaryItem => item !== null);
            }

            // 2. FILTER BY SEARCH (Ticker)
            const terms = searchTerm.toLowerCase().split(" ").filter(t => t);
            if (terms.length > 0) {
                filtered = filtered.filter(row => {
                    if (exactMatch) return terms.some(t => row.ticker.toLowerCase() === t);
                    return terms.some(t => row.ticker.toLowerCase().includes(t));
                });
            }

            // 3. FILTER BY CATEGORY
            const catFiltered = filtered.filter(row => {
                if (selectedCategories.includes("ALL")) return true;
                const cat = getCategory(row.ticker);
                return selectedCategories.includes(cat);
            });

            // 4. GROUP DATA
            const groups: Record<string, ProductionSummaryItem[]> = {};
            catFiltered.forEach(row => {
                const cat = getCategory(row.ticker);
                if (!groups[cat]) groups[cat] = [];
                groups[cat].push(row);
            });

            // 5. SORT
            const sortedCats = Object.keys(groups).sort();
            Object.keys(groups).forEach(key => {
                groups[key].sort((a, b) => a.ticker.localeCompare(b.ticker));
            });

            // 6. BUILD FLAT LIST
            const list: Array<{ type: 'header' | 'row', data: any, drillType?: 'prod' | 'cons', isDrilldown?: boolean }> = [];
            
            customCategories.forEach(cat => {
                list.push({ type: 'header', data: { category: cat.title, count: cat.items.length, id: cat.id, isDrilldown: true }, isDrilldown: true });
                cat.items.forEach(item => {
                    list.push({ type: 'row', data: item, drillType: cat.drillType, isDrilldown: true });
                });
            });

            sortedCats.forEach(cat => {
                list.push({ type: 'header', data: { category: cat, count: groups[cat].length } });
                groups[cat].forEach(item => {
                    list.push({ type: 'row', data: item });
                });
            });

            setProcessedGroups(groups);
            setProcessedSortedCats(sortedCats);
            setProcessedList(list);
            setIsProcessing(false);
        }, 50);

        return () => clearTimeout(timer);
    }, [productionSummary, searchTerm, exactMatch, selectedCategories, customCategories, selectedMembers, isLoading]);

    const glassyStyle = { 
        backgroundColor: alpha(theme.palette.background.default, 0.4), 
        backdropFilter: 'blur(12px)', 
        border: `1px solid ${alpha(theme.palette.divider, 0.2)}`, 
        boxShadow: 'none' 
    };

    return (
        <Box sx={{ display: "flex", flexDirection: "column", flexGrow: 1, minHeight: 0, p: isMobile ? 0 : 1, gap: 2, height: '100%' }}>
            {/* TOOLBAR */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, px: isMobile ? 1 : 0, flexShrink: 0 }}>
                <Box display="flex" gap={1} flexWrap="wrap">
                    
                    {/* SEARCH */}
                    <TextField 
                        placeholder="Search Ticker..." 
                        disabled={isLoading} 
                        variant="outlined" 
                        size="small" 
                        value={inputValue} 
                        onChange={(e) => setInputValue(e.target.value)} 
                        InputProps={{ 
                            startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>, 
                            endAdornment: (
                                <Stack direction="row" spacing={1}>
                                    <Tooltip title={exactMatch ? "Exact Match: ON" : "Exact Match: OFF"}>
                                        <IconButton size="small" onClick={() => setExactMatch(!exactMatch)} color={exactMatch ? "primary" : "default"}>
                                            <CenterFocusStrongIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Filter Categories">
                                        <IconButton size="small" onClick={() => setFilterOpen(!filterOpen)} color={filterOpen || !selectedCategories.includes("ALL") ? "primary" : "default"}>
                                            <FilterListIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </Stack>
                            ), 
                            sx: { ...glassyStyle, borderRadius: 1, fontSize: '0.85rem' } 
                        }} 
                        sx={{ flexGrow: 1, minWidth: 200 }} 
                    />

                    {/* MEMBER FILTER */}
                    <MemberFilterSelect 
                        members={members || []} 
                        selectedMembers={selectedMembers} 
                        onChange={setSelectedMembers} 
                        theme={theme} 
                    />

                    {/* CLEAR FILTER BTN */}
                    {selectedMembers.length > 0 && (
                        <Tooltip title="Clear Member Filters">
                            <IconButton onClick={() => setSelectedMembers([])} size="small" sx={{ ...glassyStyle, borderRadius: 1 }}>
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )}

                    {/* LAYOUT TOGGLE */}
                    <ToggleButtonGroup value={layoutMode} exclusive onChange={handleLayoutChange} size="small" disabled={isLoading} sx={{ ...glassyStyle, borderRadius: 1 }}>
                        <ToggleButton value="masonry" size="small"><ViewModuleIcon fontSize="small" /></ToggleButton>
                        <ToggleButton value="list" size="small"><ViewListIcon fontSize="small" /></ToggleButton>
                    </ToggleButtonGroup>
                </Box>

                {/* CATEGORY FILTER COLLAPSE */}
                <Collapse in={filterOpen}>
                    <Paper sx={{ ...glassyStyle, p: 1, borderRadius: 1 }}>
                        <Box display="flex" flexWrap="wrap" gap={0.5}>
                            <ToggleButton
                                value="ALL"
                                selected={selectedCategories.includes("ALL")}
                                onClick={() => toggleCategory("ALL")}
                                size="small"
                                sx={{ py: 0.5, px: 1, fontSize: '0.7rem', fontWeight: 'bold', borderRadius: 1 }}
                            >
                                ALL
                            </ToggleButton>
                            {ALL_CATEGORIES.map(cat => (
                                <ToggleButton
                                    key={cat}
                                    value={cat}
                                    selected={selectedCategories.includes(cat)}
                                    onClick={() => toggleCategory(cat)}
                                    size="small"
                                    sx={{ py: 0.5, px: 1, fontSize: '0.7rem', borderRadius: 1 }}
                                >
                                    {cat}
                                </ToggleButton>
                            ))}
                        </Box>
                    </Paper>
                </Collapse>
            </Box>

            {/* MAIN CONTENT */}
            <Box sx={{ flexGrow: 1, overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                
                {(isLoading || isProcessing || isPending) && (
                    <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: alpha(theme.palette.background.default, 0.5), zIndex: 20, backdropFilter: 'blur(2px)' }}>
                        <CircularProgress />
                    </Box>
                )}

                {/* GRID VIEW */}
                <Box sx={{ display: layoutMode === 'masonry' ? 'block' : 'none', flexGrow: 1 }}>
                    <Box sx={{ columnCount: { xs: 1, md: 2, lg: 3, xl: 4 }, columnGap: 2, '& > *': { breakInside: 'avoid', marginBottom: 2 } }}>
                         {customCategories.map(cat => (
                            <Box key={cat.id} sx={{ mb: 2 }}>
                                <CategoryCard 
                                    category={cat.title} 
                                    items={cat.items} 
                                    isMobile={isMobile} 
                                    onHide={() => hideCategory(cat.id)} 
                                    isDrilldown={true}
                                    drillType={cat.drillType}
                                    onDrilldown={handleDrilldown} 
                                    members={members} 
                                />
                            </Box>
                         ))}

                         {!isLoading && processedSortedCats.map(cat => (
                            <Box key={cat}>
                                <CategoryCard 
                                    category={cat} 
                                    items={processedGroups[cat]} 
                                    isMobile={isMobile} 
                                    onHide={hideCategory} 
                                    onDrilldown={handleDrilldown} 
                                    members={members} 
                                />
                            </Box>
                         ))}
                    </Box>
                </Box>

                {/* LIST VIEW */}
                <Box sx={{ display: layoutMode === 'list' ? 'block' : 'none', flexGrow: 1, height: '100%' }}>
                    <Paper sx={{ ...glassyStyle, height: '100%', overflow: 'hidden', borderRadius: 2 }}>
                        <TableVirtuoso
                            data={isLoading ? [] : processedList}
                            components={{
                                Scroller: React.forwardRef((props, ref) => <TableContainer component={Paper} {...props} ref={ref} sx={{ height: '100%', boxShadow: 'none', bgcolor: 'transparent', overflowX: 'auto' }} />),
                                Table: (props) => <Table {...props} size="small" sx={{ tableLayout: 'fixed', width: isMobile ? '600px' : '100%', borderCollapse: 'separate' }} stickyHeader />,
                                TableHead: TableHead,
                                TableRow: ({ item: _item, ...props }) => <TableRow {...props} />,
                                TableBody: React.forwardRef((props, ref) => <TableBody {...props} ref={ref} />),
                            }}
                            fixedHeaderContent={() => (
                                <TableRow>
                                    <TableCell sx={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'text.secondary', bgcolor: theme.palette.background.paper, width: '70px' }}>ITEM</TableCell>
                                    <TableCell align="right" sx={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'text.secondary', bgcolor: theme.palette.background.paper, width: '30%' }}>PROD</TableCell>
                                    <TableCell align="right" sx={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'text.secondary', bgcolor: theme.palette.background.paper, width: '30%' }}>CONS</TableCell>
                                    <TableCell align="right" sx={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'text.secondary', bgcolor: theme.palette.background.paper, width: 'auto' }}>NET</TableCell>
                                    <TableCell align="right" sx={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'text.secondary', bgcolor: theme.palette.background.paper, width: '50px' }}>RATIO</TableCell>
                                </TableRow>
                            )}
                            itemContent={(_index, data) => {
                                 if (data.type === 'header') {
                                    return <CategoryHeaderRow 
                                        category={data.data.category} 
                                        count={data.data.count} 
                                        onHide={data.isDrilldown ? () => hideCategory(data.data.id) : hideCategory} 
                                        isDrilldown={data.isDrilldown} 
                                        colSpan={5} 
                                        noWrapper={true} 
                                    />;
                                } else {
                                    return <CompactProductionRow 
                                        row={data.data} 
                                        isMobile={isMobile} 
                                        useFullNumbers={true} 
                                        isGridMode={false} 
                                        onDrilldown={handleDrilldown} 
                                        members={members} 
                                        isDrilldown={data.isDrilldown} 
                                        drillType={data.drillType} 
                                        noWrapper={true} 
                                    />;
                                }
                            }}
                        />
                    </Paper>
                </Box>
            </Box>
        </Box>
    );
});