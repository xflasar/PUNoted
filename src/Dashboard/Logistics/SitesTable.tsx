import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Collapse, Box, Typography } from '@mui/material';
import { Site } from './types';
import SiteStats from './SiteStats';
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';

interface SitesTableProps {
    sites: Site[];
}

const SitesTable: React.FC<SitesTableProps> = ({ sites }) => {
    const [openSiteId, setOpenSiteId] = useState<string | null>(null);

    const getSiteStatus = (site: Site) => {
        const netTonnageChange = Object.values(site.dailyProduction).reduce((acc, cur) => acc + cur, 0) - Object.values(site.dailyConsumption).reduce((acc, cur) => acc + cur, 0);
        const nextDayTonnage = site.storage.currentTonnage + netTonnageChange;

        if (nextDayTonnage > site.storage.maxTonnage * 0.9) {
            return <Typography component="span" variant="body2" sx={{ color: 'warning.main' }}>Risk of Overflow</Typography>;
        }

        if (nextDayTonnage < site.storage.maxTonnage * 0.1) {
            return <Typography component="span" variant="body2" sx={{ color: 'error.main' }}>Risk of Shortage</Typography>;
        }

        return <Typography component="span" variant="body2" sx={{ color: 'success.main' }}>Nominal</Typography>;
    };

    return (
        <Paper elevation={3}>
            <Box p={2}>
                <Typography variant="h6" component="h2" gutterBottom>Site Operations</Typography>
            </Box>
            <TableContainer>
                <Table aria-label="sites table">
                    <TableHead>
                        <TableRow>
                            <TableCell />
                            <TableCell>Name</TableCell>
                            <TableCell align="right">Storage (Tons)</TableCell>
                            <TableCell align="right">Storage (m³)</TableCell>
                            <TableCell>Status</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {sites.map((site) => (
                            <React.Fragment key={site.id}>
                                <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
                                    <TableCell>
                                        <Button
                                            aria-label="expand row"
                                            size="small"
                                            onClick={() => setOpenSiteId(openSiteId === site.id ? null : site.id)}
                                        >
                                            {openSiteId === site.id ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                                        </Button>
                                    </TableCell>
                                    <TableCell component="th" scope="row">{site.name}</TableCell>
                                    <TableCell align="right">{`${site.storage.currentTonnage} / ${site.storage.maxTonnage}`}</TableCell>
                                    <TableCell align="right">{`${site.storage.currentVolume} / ${site.storage.maxVolume}`}</TableCell>
                                    <TableCell>{getSiteStatus(site)}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                                        <Collapse in={openSiteId === site.id} timeout="auto" unmountOnExit>
                                            <Box sx={{ margin: 1 }}>
                                                <SiteStats site={site} />
                                            </Box>
                                        </Collapse>
                                    </TableCell>
                                </TableRow>
                            </React.Fragment>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Paper>
    );
};

export default SitesTable;
