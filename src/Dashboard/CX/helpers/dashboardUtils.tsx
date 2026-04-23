// src/Dashboard/CX/helpers/dashboardUtils.tsx
import React, { useState, useMemo } from 'react';
import { Box, Typography, Tooltip, Popover, IconButton, alpha, useTheme, Divider, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { HelpOutline, KeyboardArrowUp, KeyboardArrowDown, Bolt, AutoFixHigh, InfoOutlined, SettingsSuggest } from '@mui/icons-material';

export type SortDirection = 'asc' | 'desc' | null;

export function useSort<T>(data: T[], initialKey: keyof T) {
    const [sortConfig, setSortConfig] = useState<{ key: keyof T; direction: SortDirection }>({
        key: initialKey,
        direction: 'desc',
    });

    const sortedData = useMemo(() => {
        if (!sortConfig.direction) return data;
        return [...data].sort((a, b) => {
            const aVal = a[sortConfig.key];
            const bVal = b[sortConfig.key];
            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [data, sortConfig]);

    const requestSort = (key: keyof T) => {
        let direction: SortDirection = 'desc';
        if (sortConfig.key === key && sortConfig.direction === 'desc') direction = 'asc';
        setSortConfig({ key, direction });
    };

    return { sortedData, requestSort, sortConfig };
}

export interface GuideStep {
    title: string;
    description: string;
    type?: 'info' | 'action' | 'feature';
}

interface SectionGuideProps {
    title: string;
    steps?: GuideStep[]; // Made optional to prevent crash
}

export const SectionGuide = ({ title, steps = [] }: SectionGuideProps) => {
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    const theme = useTheme();

    const getIcon = (type?: string) => {
        switch (type) {
            case 'action': return <Bolt sx={{ fontSize: 16, color: theme.palette.warning.main }} />;
            case 'feature': return <AutoFixHigh sx={{ fontSize: 16, color: theme.palette.primary.main }} />;
            default: return <InfoOutlined sx={{ fontSize: 16, color: theme.palette.info.main }} />;
        }
    };

    return (
        <>
            <IconButton 
                size="small" 
                onClick={(e) => setAnchorEl(e.currentTarget)} 
                sx={{ opacity: 0.6, ml: 0.5, p: 0.3 }}
            >
                <HelpOutline sx={{ fontSize: 16 }} />
            </IconButton>
            <Popover
                open={Boolean(anchorEl)}
                anchorEl={anchorEl}
                onClose={() => setAnchorEl(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                PaperProps={{
                    sx: {
                        bgcolor: alpha(theme.palette.background.default, 0.98),
                        backdropFilter: 'blur(12px)',
                        border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                        width: 320,
                        maxHeight: 450,
                        boxShadow: theme.shadows[20],
                        borderRadius: 2,
                        backgroundImage: 'none'
                    }
                }}
            >
                <Box sx={{ p: 2 }}>
                    <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                        <SettingsSuggest color="primary" />
                        <Typography variant="subtitle1" fontWeight="bold">
                            {title} Guide
                        </Typography>
                    </Box>
                    <Divider sx={{ mb: 1, opacity: 0.5 }} />
                    {steps && steps.length > 0 ? (
                        <List dense disablePadding>
                            {steps.map((step, idx) => (
                                <ListItem key={idx} sx={{ px: 0, py: 0, alignItems: 'flex-start' }}>
                                    <ListItemIcon sx={{ minWidth: 30, mt: 0.5 }}>
                                        {getIcon(step.type)}
                                    </ListItemIcon>
                                    <ListItemText 
                                        primary={<Typography variant="caption" fontWeight="bold" color="text.primary">{step.title}</Typography>}
                                        secondary={<Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, lineHeight: 1.4 }}>{step.description}</Typography>}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    ) : (
                        <Typography variant="caption" color="error">No steps defined for this guide.</Typography>
                    )}
                </Box>
            </Popover>
        </>
    );
};

export const getCurrencySymbol = (exchange: string) => {
        switch (exchange) {
            case 'IC1': return 'ICA';
            case 'AI1': return 'AIC';
            case 'NC1': return 'NCC';
            case 'NC2': return 'NCC';
            case 'CI1': return 'CIS';
            case 'CI2': return 'CIS';
            default: return '';
        }
    };