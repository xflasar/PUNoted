import React, { useMemo } from 'react';
import { Paper, Box, Typography, LinearProgress, Chip, useTheme, Tooltip, Divider } from '@mui/material';
import { CheckCircle, Warning } from '@mui/icons-material';
import { MapPin, Warehouse } from 'lucide-react';
import { Site } from '../types';


interface SiteCardProps {
    site: Site;
    onSelect: (site: Site) => void;
}

const SiteCard: React.FC<SiteCardProps> = ({ site, onSelect }) => {
    const theme = useTheme();

    const getSiteStatus = (site: Site) => {
        const netTonnageChange = site.dailyProduction.reduce((acc, cur) => acc + cur.tonnage, 0) - site.dailyConsumption.reduce((acc, cur) => acc + cur.tonnage, 0);
        const nextDayTonnage = site.siteStorage.currentTonnage + netTonnageChange;

        if (nextDayTonnage > site.siteStorage.maxTonnage * 0.9) {
            return { label: 'Risk of Overflow', color: 'warning' as const };
        }
        if (nextDayTonnage < site.siteStorage.maxTonnage * 0.1) {
            return { label: 'Risk of Shortage', color: 'error' as const };
        }
        return { label: 'Nominal', color: 'success' as const };
    };

    const status = getSiteStatus(site);

    const dailyFlows = useMemo(() => {
        const flows = {
            exportTonnage: 0,
            importTonnage: 0,
            exportVolume: 0,
            importVolume: 0,
        };

        site.dailyProduction.forEach(item => {
            flows.exportTonnage += item.tonnage;
            flows.exportVolume += item.volume;
        });

        site.dailyConsumption.forEach(item => {
            flows.importTonnage += item.tonnage;
            flows.importVolume += item.volume;
        });

        return flows;
    }, [site.dailyProduction, site.dailyConsumption]);

    return (
        <Paper 
            elevation={3} 
            sx={{ 
                p: 2, 
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                    boxShadow: theme.shadows[8],
                    borderColor: 'primary.main'
                },
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                background: 'rgba(255, 255, 255, 0.02)'
            }}
            onClick={() => onSelect(site)}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <MapPin size={20} style={{ marginRight: 8, color: theme.palette.primary.light }} />
                    <Typography variant="h6">{site.name}</Typography>
                </Box>
                {site.warehouse && (
                    <Tooltip title="Warehouse present">
                        <Warehouse size={20} color={theme.palette.info.main} />
                    </Tooltip>
                )}
            </Box>

            <Chip label={status.label} color={status.color} size="small" sx={{ mb: 1 }} />

            <Box sx={{ display: 'flex', gap: 1 }}>
                <Tooltip title={`Tonnage: ${Math.round((site.siteStorage.currentTonnage / site.siteStorage.maxTonnage) * 100)}%`}>
                    <Box sx={{ flex: 1, position: 'relative', p: 1, borderRadius: 1, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
                        <LinearProgress
                            variant="determinate"
                            value={(site.siteStorage.currentTonnage / site.siteStorage.maxTonnage) * 100}
                            sx={{
                                position: 'absolute', width: '100%', height: '100%', top: 0, left: 0, zIndex: 0,
                                '& .MuiLinearProgress-bar': { backgroundColor: 'primary.dark', opacity: 0.6 },
                                backgroundColor: 'action.hover',
                            }}
                        />
                        <Box sx={{ position: 'relative', zIndex: 1 }}>
                            <Typography variant="caption" component="p">
                                <strong>{Math.round(site.siteStorage.currentTonnage).toLocaleString()} / {Math.round(site.siteStorage.maxTonnage).toLocaleString()} t</strong>
                            </Typography>
                        </Box>
                    </Box>
                </Tooltip>
                <Tooltip title={`Volume: ${Math.round((site.siteStorage.currentVolume / site.siteStorage.maxVolume) * 100)}%`}>
                    <Box sx={{ flex: 1, position: 'relative', p: 1, borderRadius: 1, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
                        <LinearProgress
                            variant="determinate"
                            value={(site.siteStorage.currentVolume / site.siteStorage.maxVolume) * 100}
                            sx={{
                                position: 'absolute', width: '100%', height: '100%', top: 0, left: 0, zIndex: 0,
                                '& .MuiLinearProgress-bar': { backgroundColor: 'secondary.dark', opacity: 0.6 },
                                backgroundColor: 'action.hover',
                            }}
                        />
                        <Box sx={{ position: 'relative', zIndex: 1 }}>
                            <Typography variant="caption" component="p">
                                <strong>{Math.round(site.siteStorage.currentVolume).toLocaleString()} / {Math.round(site.siteStorage.maxVolume).toLocaleString()} m³</strong>
                            </Typography>
                        </Box>
                    </Box>
                </Tooltip>
            </Box>

            {(dailyFlows.exportTonnage > 0 || dailyFlows.importTonnage > 0) && (
                <>
                    <Divider sx={{ my: 2 }} />
                    <Box>
                        <Typography variant="subtitle2" gutterBottom>Daily Flow</Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            <Chip icon={<CheckCircle sx={{fontSize: '1rem'}} />}
                                label={`Export: ${dailyFlows.exportTonnage.toLocaleString()} t / ${dailyFlows.exportVolume.toLocaleString()} m³`}
                                size="small"
                                color="success"
                                variant="outlined"
                            />
                             <Chip icon={<Warning sx={{fontSize: '1rem'}} />}
                                label={`Import: ${dailyFlows.importTonnage.toLocaleString()} t / ${dailyFlows.importVolume.toLocaleString()} m³`}
                                size="small"
                                color="error"
                                variant="outlined"
                            />
                        </Box>
                    </Box>
                </>
            )}
        </Paper>
    );
};

export default SiteCard;