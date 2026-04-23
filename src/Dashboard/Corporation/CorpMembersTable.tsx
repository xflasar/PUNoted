import React, { useState, useMemo } from "react";
import {
    Box,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    TableContainer,
    TextField,
    InputAdornment,
    Typography,
    Stack,
    Avatar,
    Paper,
    alpha,
    ToggleButton,
    ToggleButtonGroup,
    Tooltip,
    useMediaQuery,
    CircularProgress
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import CircleIcon from "@mui/icons-material/Circle";
import { useTheme } from "@mui/material/styles";
import { TableVirtuoso } from "react-virtuoso"; 
import { CorpMember } from "./types";

// ... (getTimeAgo, getActiveStatus, MemberRow implementation remains exactly same as before) ...

const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return "Just now";
};

const getActiveStatus = (lastActive?: string) => {
    if (!lastActive) return { label: "Unknown", color: "text.disabled", dotColor: "grey.500" };
    const diff = Date.now() - new Date(lastActive).getTime();
    const days = diff / (1000 * 60 * 60 * 24);
    if (days >= 7) return { label: "Inactive", color: "error.main", dotColor: "error.main" };
    if (days >= 3) return { label: getTimeAgo(lastActive), color: "warning.main", dotColor: "warning.main" };
    return { label: getTimeAgo(lastActive), color: "success.main", dotColor: "success.main" };
};

const MemberRow = React.memo(({ member, theme, isMobile }: { member: CorpMember; theme: any; isMobile: boolean }) => {
    const status = getActiveStatus(member.lastActive);
    const avatarColor = status.color === "warning.main" ? "warning.main" 
                      : status.color === "success.main" ? "primary.main" 
                      : status.color === "text.disabled" ? "grey.500" 
                      : "error.main";

    return (
        <>
            <TableCell sx={{ py: 1 }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                    <Avatar sx={{ 
                        width: 36, 
                        height: 36, 
                        bgcolor: avatarColor, 
                        color: '#fff', 
                        fontSize: '0.65rem', 
                        fontWeight: 'bold' 
                    }}>
                        {member.companyCode}
                    </Avatar>
                    <Box>
                        <Typography variant="body2" fontWeight="bold" sx={{ color: status.color }}>
                            {member.companyName}
                        </Typography>
                    </Box>
                </Stack>
            </TableCell>
            <TableCell sx={{ py: 1 }}>
                <Typography variant="body2" fontSize="0.8rem">
                    {member.joinedDate ? new Date(member.joinedDate).toLocaleDateString() : "-"}
                </Typography>
            </TableCell>
            <TableCell align={isMobile ? "right" : "center"} sx={{ py: 1 }}>
                <Box display="flex" alignItems="center" justifyContent={isMobile ? "flex-end" : "center"} gap={0.5}>
                    <CircleIcon sx={{ width: 8, height: 8, color: status.dotColor }} />
                    <Typography variant="caption" sx={{ color: status.color, fontWeight: 'bold' }}>
                        {status.label}
                    </Typography>
                </Box>
            </TableCell>
            <TableCell align="center" sx={{ py: 1 }}>
                {member.isSynchronized ? (
                    <Tooltip title="Synchronized">
                        <CheckCircleIcon color="success" fontSize="small" />
                    </Tooltip>
                ) : (
                    <Tooltip title="Not Synchronized">
                        <CancelIcon color="disabled" fontSize="small" />
                    </Tooltip>
                )}
            </TableCell>
        </>
    );
});

type FilterMode = 'all' | 'active' | 'inactive';

// UPDATED: Now accepts isLoading
const CorpMembersTable = ({ members, isLoading }: { members: CorpMember[], isLoading?: boolean }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [searchTerm, setSearchTerm] = useState("");
    const [filterMode, setFilterMode] = useState<FilterMode>('all');

    const handleFilterChange = (event: React.MouseEvent<HTMLElement>, newMode: FilterMode | null) => {
        if (newMode !== null) setFilterMode(newMode);
    };

    const filteredMembers = useMemo(() => {
        if (isLoading) return []; // Don't filter if loading

        let res = [...members];
        res.sort((a, b) => {
            const dateA = a.joinedDate ? new Date(a.joinedDate).getTime() : 0;
            const dateB = b.joinedDate ? new Date(b.joinedDate).getTime() : 0;
            if (dateA === 0 && dateB !== 0) return 1;
            if (dateA !== 0 && dateB === 0) return -1;
            if (dateA !== dateB) return dateA - dateB; 
            return a.companyName.localeCompare(b.companyName);
        });

        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            res = res.filter(m => m.companyName.toLowerCase().includes(lower) || m.companyCode.toLowerCase().includes(lower));
        }

        if (filterMode !== 'all') {
            res = res.filter(m => {
                if (!m.lastActive) return false; 
                const diff = Date.now() - new Date(m.lastActive).getTime();
                const days = diff / (1000 * 60 * 60 * 24);
                return filterMode === 'active' ? days < 7 : days >= 7;
            });
        }
        return res;
    }, [members, searchTerm, filterMode, isLoading]);

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 2, p: 1 }}>
            {/* BOILERPLATE: TOOLBAR - Always Visible */}
            <Box display="flex" flexDirection={isMobile ? 'column' : 'row'} gap={1}>
                <TextField
                    placeholder="Search Member..."
                    size="small"
                    variant="outlined"
                    fullWidth
                    value={searchTerm}
                    disabled={isLoading} // Disable input while loading
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                        startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
                        sx: { bgcolor: alpha(theme.palette.background.default, 0.4), backdropFilter: 'blur(12px)', fontSize: '0.85rem' }
                    }}
                    sx={{ flexGrow: 1 }}
                />
                <ToggleButtonGroup
                    value={filterMode}
                    exclusive
                    onChange={handleFilterChange}
                    size="small"
                    disabled={isLoading} // Disable filters while loading
                    sx={{ 
                        bgcolor: alpha(theme.palette.background.default, 0.4), 
                        backdropFilter: 'blur(12px)',
                        flexShrink: 0,
                        '& .MuiToggleButton-root': {
                            px: 2,
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                            '&.Mui-selected': { bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', borderColor: 'primary.main', '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) } }
                        }
                    }}
                >
                    <ToggleButton value="all">ALL</ToggleButton>
                    <ToggleButton value="active"><Tooltip title="Active & Stale (< 7 Days)"><span>ACTIVE</span></Tooltip></ToggleButton>
                    <ToggleButton value="inactive"><Tooltip title="Inactive (> 7 Days)"><span>INACTIVE</span></Tooltip></ToggleButton>
                </ToggleButtonGroup>
            </Box>

            {/* BOILERPLATE: CONTAINER */}
            <Paper sx={{ flex: 1, bgcolor: alpha(theme.palette.background.default, 0.4), backdropFilter: 'blur(12px)', border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, overflow: 'hidden', position: 'relative' }}>
                
                {/* LOADING STATE */}
                {isLoading && (
                    <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: alpha(theme.palette.background.default, 0.5), zIndex: 10 }}>
                        <CircularProgress size={40} />
                    </Box>
                )}

                <TableVirtuoso
                    data={filteredMembers}
                    components={{
                        Scroller: React.forwardRef((props, ref) => <TableContainer component={Box} {...props} ref={ref} />),
                        Table: (props) => <Table {...props} size="small" stickyHeader sx={{ borderCollapse: 'separate' }} />,
                        TableHead: TableHead,
                        TableRow: ({ item: _item, ...props }) => <TableRow {...props} />,
                        TableBody: React.forwardRef((props, ref) => <TableBody {...props} ref={ref} />),
                    }}
                    fixedHeaderContent={() => (
                        <TableRow>
                            {/* Static Headers always render */}
                            <TableCell sx={{ bgcolor: theme.palette.background.default, fontWeight: "bold", fontSize: '0.7rem', py: 1 }}>MEMBER</TableCell>
                            <TableCell sx={{ bgcolor: theme.palette.background.default, fontWeight: "bold", fontSize: '0.7rem', py: 1 }}>JOINED</TableCell>
                            <TableCell align={isMobile ? "right" : "center"} sx={{ bgcolor: theme.palette.background.default, fontWeight: "bold", fontSize: '0.7rem', py: 1 }}>ACTIVE</TableCell>
                            <TableCell align="center" sx={{ bgcolor: theme.palette.background.default, fontWeight: "bold", fontSize: '0.7rem', width: isMobile ? 40 : 80, py: 1 }}>SYNC</TableCell>
                        </TableRow>
                    )}
                    itemContent={(_index, member) => <MemberRow member={member} theme={theme} isMobile={isMobile} />}
                />
            </Paper>
        </Box>
    );
};
export default CorpMembersTable;