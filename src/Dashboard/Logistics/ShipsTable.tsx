import React from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    Select, MenuItem, FormControl, InputLabel, Box, Typography, SelectChangeEvent
} from '@mui/material';
import { Ship, Site } from './types';

interface ShipsTableProps {
    ships: Ship[];
    sites: Site[];
    onAssignShip: (shipId: string, siteId: string) => void;
}

const ShipsTable: React.FC<ShipsTableProps> = ({ ships, sites, onAssignShip }) => {
    return (
        <Paper elevation={3}>
            <Box p={2}>
                <Typography variant="h6" component="h2" gutterBottom>Fleet Management</Typography>
            </Box>
            <TableContainer>
                <Table aria-label="ships table">
                    <TableHead>
                        <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell align="right">Capacity (Tons)</TableCell>
                            <TableCell align="right">Capacity (m³)</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Location</TableCell>
                            <TableCell>Assigned Site</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {ships.map((ship) => (
                            <TableRow key={ship.id}>
                                <TableCell component="th" scope="row">{ship.name}</TableCell>
                                <TableCell align="right">{ship.maxTonnage}</TableCell>
                                <TableCell align="right">{ship.maxVolume}</TableCell>
                                <TableCell>{ship.status}</TableCell>
                                <TableCell>{ship.location}</TableCell>
                                <TableCell>
                                    <FormControl fullWidth size="small" sx={{ m: 1, minWidth: 120 }}>
                                        <InputLabel id={`assign-site-label-${ship.id}`}>Site</InputLabel>
                                        <Select
                                            labelId={`assign-site-label-${ship.id}`}
                                            value={ship.assignedSiteId || ''}
                                            label="Site"
                                            onChange={(e: SelectChangeEvent<string>) => onAssignShip(ship.id, e.target.value)}
                                        >
                                            <MenuItem value="">
                                                <em>None</em>
                                            </MenuItem>
                                            {sites.map((site) => (
                                                <MenuItem key={site.id} value={site.id}>
                                                    {site.name}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Paper>
    );
};

export default ShipsTable;
