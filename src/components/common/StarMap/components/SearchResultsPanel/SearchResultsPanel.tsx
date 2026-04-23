import React, { useState } from 'react';
import {
    Box,
    List,
    ListItemText,
    Typography,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    IconButton,
    Paper,
    Card,
    CardContent,
    Fade,
    Collapse,
    LinearProgress,
    useMediaQuery,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CloseIcon from '@mui/icons-material/Close';
import type { MapPoint, PlanetData, PlanetResource } from '../../types/mapTypes';
import { useTheme } from '@mui/material/styles';

interface SearchResultsPanelProps {
    systems: MapPoint[];
    planets: (PlanetData & { systemInfo: MapPoint })[];
    onSearchResultClick: (x: number, y: number) => void;
    onClose: () => void;
}

const ResourceBar: React.FC<{ resource: PlanetResource }> = ({ resource }) => {
    const theme = useTheme();
    return (
        <Box sx={{ mb: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption">{resource.name}</Typography>
                <Typography variant="caption">{resource.value.toFixed(0)} u/day</Typography>
            </Box>
            <LinearProgress
                variant="determinate"
                value={resource.value}
                sx={{
                    height: 4,
                    borderRadius: 2,
                    background: theme.palette.grey[700],
                    '& .MuiLinearProgress-bar': {
                        background: `linear-gradient(90deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.light} 100%)`,
                    },
                }}
            />
        </Box>
    );
};

const MemoizedSearchResultsPanel: React.FC<SearchResultsPanelProps> = ({
    systems,
    planets,
    onSearchResultClick,
    onClose,
}) => {
    const theme = useTheme();
    const [expandedResult, setExpandedResult] = useState<string | null>(null);
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const handleResultClick = (x: number, y: number, id: string) => {
        onSearchResultClick(x, y);
        setExpandedResult(expandedResult === id ? null : id);
    };

    if (systems.length === 0 && planets.length === 0) {
        return null;
    }

    return (
        <Fade in={true} timeout={150}>
            <Paper
                elevation={10}
                sx={{
                    position: 'absolute',
                    top: isMobile ? 'auto' : '50%',
                    bottom: isMobile ? 0 : 'auto',
                    right: isMobile ? 0 : 10,
                    left: isMobile ? 0 : 'auto',
                    transform: isMobile ? 'none' : 'translateY(-50%)',
                    width: isMobile ? '100%' : 350,
                    maxHeight: isMobile ? '40vh' : '50vh',
                    background: theme.palette.background.paper,
                    borderTopLeftRadius: isMobile ? 16 : 8,
                    borderTopRightRadius: isMobile ? 16 : 8,
                    borderBottomLeftRadius: isMobile ? 0 : 8,
                    borderBottomRightRadius: isMobile ? 0 : 8,
                    boxShadow: `0 0 20px ${theme.palette.primary.main}`,
                    zIndex: 12,
                    color: theme.palette.text.primary,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    border: `1px solid ${theme.palette.primary.main}`,
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        p: 1,
                        background: `linear-gradient(180deg, ${theme.palette.background.default} 0%, ${theme.palette.background.paper} 100%)`,
                        borderBottom: `1px solid ${theme.palette.primary.main}`,
                    }}
                >
                    <Typography variant="h6" sx={{ ml: 1, fontSize: '1rem' }}>
                        Search Results
                    </Typography>
                    <IconButton onClick={onClose} size="small">
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </Box>
                <Box sx={{ overflowY: 'auto', p: 1 }}>
                    {systems.length > 0 && (
                        <Accordion disableGutters elevation={0} defaultExpanded sx={{ backgroundImage: 'none', background: 'transparent' }}>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ minHeight: 40, '&.Mui-expanded': { minHeight: 40 } }}>
                                <Typography variant="subtitle2">Systems ({systems.length})</Typography>
                            </AccordionSummary>
                            <AccordionDetails sx={{ p: 0.5 }}>
                                <List dense>
                                    {systems.map((system) => (
                                        <Card key={system.id} sx={{ mb: 1, background: 'rgba(0,0,0,0.2)' }}>
                                            <CardContent onClick={() => handleResultClick(system.x, system.y, system.id)} sx={{ cursor: 'pointer', p: 1, '&:last-child': { pb: 1 } }}>
                                                <ListItemText primary={system.label} primaryTypographyProps={{ variant: 'body2' }} />
                                            </CardContent>
                                            <Collapse in={expandedResult === system.id} timeout={150}>
                                                <CardContent sx={{ p: 1, pt: 0 }}>
                                                    <Typography variant="caption">Population: {system.population?.toLocaleString() ?? 'N/A'}</Typography>
                                                    <Typography variant="caption" sx={{ ml: 1 }}>Type: {system.systemtype}</Typography>
                                                </CardContent>
                                            </Collapse>
                                        </Card>
                                    ))}
                                </List>
                            </AccordionDetails>
                        </Accordion>
                    )}
                    {planets.length > 0 && (
                        <Accordion disableGutters elevation={0} defaultExpanded sx={{ backgroundImage: 'none', background: 'transparent' }}>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ minHeight: 40, '&.Mui-expanded': { minHeight: 40 } }}>
                                <Typography variant="subtitle2">Planets ({planets.length})</Typography>
                            </AccordionSummary>
                            <AccordionDetails sx={{ p: 0.5 }}>
                                <List dense>
                                    {planets.map((planet) => (
                                        <Card key={planet.planetid} sx={{ mb: 1, background: 'rgba(0,0,0,0.2)' }}>
                                            <CardContent onClick={() => handleResultClick(planet.systemInfo.x, planet.systemInfo.y, planet.planetid)} sx={{ cursor: 'pointer', p: 1, '&:last-child': { pb: 1 } }}>
                                                <ListItemText
                                                    primary={planet.planetname}
                                                    secondary={`in ${planet.systemInfo.label}`}
                                                    primaryTypographyProps={{ variant: 'body2' }}
                                                    secondaryTypographyProps={{ variant: 'caption' }}
                                                />
                                            </CardContent>
                                            <Collapse in={expandedResult === planet.planetid} timeout={150}>
                                                <CardContent sx={{ p: 1.5, pt: 0 }}>
                                                    <Typography variant="caption">System: {planet.systemInfo.label}</Typography>
                                                    <Typography variant="caption" sx={{ ml: 1 }}>Population: {planet.planetPopulation?.toLocaleString() ?? 'N/A'}</Typography>
                                                    <Typography variant="subtitle2" sx={{ mt: 1, mb: 0.5 }}>Resources:</Typography>
                                                    <Box>
                                                        {planet.resources?.map(resource => (
                                                            <ResourceBar key={resource.name} resource={resource} />
                                                        ))}
                                                    </Box>
                                                </CardContent>
                                            </Collapse>
                                        </Card>
                                    ))}
                                </List>
                            </AccordionDetails>
                        </Accordion>
                    )}
                </Box>
            </Paper>
        </Fade>
    );
};

export default MemoizedSearchResultsPanel;
