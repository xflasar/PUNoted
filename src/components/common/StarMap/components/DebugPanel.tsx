import React from "react";
import { Box, Paper, Typography, Divider, Grid } from "@mui/material";

export const DebugPanel: React.FC<{
  fps: number;
  workerStats: any;
  layerUpdateCount: number;
  activeShipCount: number;
  memory: any;
}> = ({ fps, workerStats, layerUpdateCount, activeShipCount, memory }) => {
  
  const toMB = (bytes: number) => (bytes ? (bytes / 1024 / 1024).toFixed(0) : "-");

  return (
    <Paper sx={{ position: "absolute", left: 8, bottom: 8, zIndex: 9999, p: 1.5, minWidth: 200, opacity: 0.9, backgroundColor: "rgba(0,0,0,0.8)", color: "#0f0" }}>
      <Typography variant="subtitle2" sx={{ color: "#fff", mb: 1 }}>PERFORMANCE MONITOR</Typography>
      
      <Grid container spacing={1} sx={{ fontSize: "11px", fontFamily: "monospace" }}>
        {/* MAIN THREAD */}
        <Grid item xs={6}>Main FPS</Grid>
        <Grid item xs={6} sx={{ color: fps < 30 ? "red" : "#0f0", textAlign: "right" }}>{fps}</Grid>

        <Grid item xs={6}>Layer Updates</Grid>
        <Grid item xs={6} sx={{ textAlign: "right" }}>{layerUpdateCount}</Grid>

        {/* WORKER TIMING */}
        <Grid item xs={12}><Divider sx={{ borderColor: "#333", my: 0.5 }} /></Grid>
        
        <Grid item xs={6}>Orbit Tick</Grid>
        <Grid item xs={6} sx={{ textAlign: "right" }}>{workerStats?.orbitTickAvgMs?.toFixed(1) ?? "-"} ms</Grid>

        <Grid item xs={6}>Ship Tick</Grid>
        <Grid item xs={6} sx={{ textAlign: "right" }}>{workerStats?.shipTickAvgMs?.toFixed(1) ?? "-"} ms</Grid>

        {/* COUNTS */}
        <Grid item xs={12}><Divider sx={{ borderColor: "#333", my: 0.5 }} /></Grid>

        <Grid item xs={6}>Planets</Grid>
        <Grid item xs={6} sx={{ textAlign: "right" }}>{workerStats?.planetCount ?? 0}</Grid>

        <Grid item xs={6}>Trail Segs</Grid>
        <Grid item xs={6} sx={{ textAlign: "right" }}>{workerStats?.trailCount ?? 0}</Grid>

        <Grid item xs={6}>Ships (Active)</Grid>
        <Grid item xs={6} sx={{ textAlign: "right" }}>{activeShipCount}</Grid>

        {/* MEMORY */}
        <Grid item xs={12}><Divider sx={{ borderColor: "#333", my: 0.5 }} /></Grid>

        <Grid item xs={6}>JS Heap Used</Grid>
        <Grid item xs={6} sx={{ textAlign: "right" }}>{toMB(memory?.usedJSHeapSize)} MB</Grid>

        <Grid item xs={6}>JS Heap Limit</Grid>
        <Grid item xs={6} sx={{ textAlign: "right" }}>{toMB(memory?.jsHeapSizeLimit)} MB</Grid>
      </Grid>
    </Paper>
  );
};