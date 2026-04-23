import React, { useMemo, useContext } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  useReactFlow,
  type EdgeProps,
} from 'reactflow';
import { Box, Typography, Chip, Stack } from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { useTheme } from '@mui/material/styles';
import { ScaleIcon } from 'lucide-react';
import { LocalDrink } from '@mui/icons-material';

import { ConnectionToolContext } from './helpers';

const TransshipmentEdge: React.FC<EdgeProps<any>> = ({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
  style = {},
}) => {
  const theme = useTheme();
  const { getNode } = useReactFlow();
  const { materials } = useContext(ConnectionToolContext);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  const shippingMetrics = useMemo(() => {
    const sourceNode = getNode(source);
    const targetNode = getNode(target);
    if (!sourceNode || !targetNode) return null;

    const sourcePlanetId = sourceNode.data?.planet?.planetid;
    const targetPlanetId = targetNode.data?.planet?.planetid;
    
    const materialTicker = sourceNode.data?.materialTicker || data?.materialTicker || 'UNK';
    const material = materials?.find(m => m.ticker === materialTicker) || { weight: 0, volume: 0 };

    const isCrossPlanet = sourcePlanetId && targetPlanetId && sourcePlanetId !== targetPlanetId;

    const flowRatePerDay = Number(data?.flowRate) || 0;

    return {
      isCrossPlanet,
      flowRatePerDay,
      totalMass: flowRatePerDay * (material.weight || 0),
      totalVolume: flowRatePerDay * (material.volume || 0),
      materialTicker,
    };
  }, [source, target, getNode, data, materials]);

  if (!shippingMetrics) return null;

  const { isCrossPlanet, flowRatePerDay, totalMass, totalVolume, materialTicker } = shippingMetrics;

  const edgeColor = isCrossPlanet
    ? theme.palette.error.main
    : theme.palette.primary.main;

  const edgeStyle = {
    ...style,
    strokeWidth: 3.5,
    opacity: flowRatePerDay > 0 ? 0.95 : 0.4,
    transition: 'stroke 0.3s ease, opacity 0.3s ease',
  };

  const renderLabel = (
    <Box
        sx={{
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            background: theme.palette.background.paper,
            border: `1px solid ${edgeColor}`,
            borderRadius: 1,
            p: 1,
            pointerEvents: 'all',
            boxShadow: theme.shadows[5],
            color: theme.palette.text.primary,
            minWidth: 100,
            maxWidth: 200,
        }}
    >
        <Typography
            variant="caption"
            sx={{
                fontWeight: 700,
                display: 'block',
                color: edgeColor,
                mb: isCrossPlanet ? 0.5 : 0,
                textAlign: 'center',
                whiteSpace: 'nowrap',
            }}
        >
            {materialTicker} | {flowRatePerDay.toFixed(1)}/d
        </Typography>

        {isCrossPlanet ? (
            <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }}>
                <Chip
                    size="small"
                    label={`${totalMass.toFixed(1)} t/d`}
                    icon={<ScaleIcon fontSize="small" />}
                    sx={{
                        bgcolor: theme.palette.error.dark,
                        color: theme.palette.common.white,
                        fontSize: '0.65rem',
                        height: 30,
                    }}
                />
                
                <Chip
                    size="small"
                    label={`${totalVolume.toFixed(1)} m³/d`}
                    icon={<LocalDrink fontSize="small" />}
                    sx={{
                        bgcolor: theme.palette.warning.dark,
                        color: theme.palette.common.white,
                        fontSize: '0.65rem',
                        height: 30,
                    }}
                />
            </Stack>
        ) : (
            <Typography
                variant="caption"
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    color: theme.palette.text.secondary,
                    justifyContent: 'center',
                    mt: 0.5,
                }}
            >
                <LocationOnIcon sx={{ fontSize: '1rem', mr: 0.5 }} /> Local
            </Typography>
        )}
    </Box>
  );

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={edgeStyle} id={id} />
      <EdgeLabelRenderer>{renderLabel}</EdgeLabelRenderer>
    </>
  );
};

export default TransshipmentEdge;