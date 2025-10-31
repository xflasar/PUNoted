import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, CircularProgress, Alert, Divider, Grid } from '@mui/material';
import SitesTable from './SitesTable';
import ShipsTable from './ShipsTable';
import type { Site, Ship } from './types';
import LogisticsOverview from './LogisticsOverview';

// Define the API URL - in a real app, use an env variable
const API_BASE_URL = 'http://localhost:9900'; 

const Logistics: React.FC = () => {
    const [sites, setSites] = useState<Site[]>([]);
    const [ships, setShips] = useState<Ship[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Mock User ID for the fetch headers - Replace with your auth context
    const userId = "YOUR_USER_ID_HERE"; 

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch Ships and Sites in parallel
                const [shipsRes, sitesRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/logistics/ships`, {
						method: "GET",
						headers: {
							Authorization: `Bearer ${localStorage.getItem("authToken")}`,
						},
					}),
                    fetch(`${API_BASE_URL}/logistics/sites`, {
						method: "GET",
						headers: {
							Authorization: `Bearer ${localStorage.getItem("authToken")}`,
						},
					})
                ]);

                if (!shipsRes.ok || !sitesRes.ok) {
                    throw new Error("Failed to fetch logistics data");
                }

                const shipsData = await shipsRes.json();
                const sitesData = await sitesRes.json();

                setShips(shipsData);
                setSites(sitesData);
            } catch (err) {
                console.error(err);
                setError("Could not load logistics data.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [userId]);

    const handleAssignShip = async (shipId: string, siteId: string) => {
        // 1. Optimistic UI Update
        const previousShips = [...ships];
        setShips(ships.map(ship => ship.id === shipId ? { ...ship, assignedSiteId: siteId } : ship));

        try {
            // 2. Call API to persist assignment
            // await fetch(`${API_BASE_URL}/logistics/assign`, { 
            //     method: 'POST', 
            //     body: JSON.stringify({ shipId, siteId }) 
            // });
            console.log(`Assigned ship ${shipId} to site ${siteId}`);
        } catch (err) {
            // Revert on error
            console.error("Failed to assign ship", err);
            setShips(previousShips);
            alert("Failed to assign ship. Please try again.");
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <CircularProgress />
                <Typography variant="h6" sx={{ ml: 2 }}>Loading Logistics Data...</Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Alert severity="error">{error}</Alert>
            </Container>
        );
    }

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ mb: 2 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Logistics Operations
                </Typography>
                <Typography variant="subtitle1" color="text.secondary">
                    Manage fleet distribution, monitor site stockpiles, and optimize material flow.
                </Typography>
            </Box>
            <Divider sx={{ mb: 4 }} />

            <Box component="section" sx={{ mb: 4 }}>
                <LogisticsOverview sites={sites} ships={ships} />
            </Box>

            <Grid container spacing={4}>
                <Grid item xs={12} xl={6}>
                    <SitesTable sites={sites} />
                </Grid>
                <Grid item xs={12} xl={6}>
                    <ShipsTable
                        ships={ships}
                        sites={sites}
                        onAssignShip={handleAssignShip}
                    />
                </Grid>
            </Grid>
        </Container>
    );
};

export default Logistics;