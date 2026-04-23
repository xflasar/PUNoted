import { Box, List, ListItem, ListItemText, Typography, useTheme } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime'; // Using an icon for duration
import type { RecipePart, RecipeSelectorProps } from '../types';

/**
 * Converts milliseconds to a human-readable duration string (e.g., 5m 0s).
 * Corrected to use modulo arithmetic for accurate unit breakdown.
 */
const formatDuration = (ms: number) => {
    if (!ms || ms < 0) return 'Instant';
    
    let totalSeconds = Math.floor(ms / 1000); 

    // 1. Calculate Days and remaining seconds
    const SECONDS_IN_DAY = 60 * 60 * 24;
    const days = Math.floor(totalSeconds / SECONDS_IN_DAY);
    totalSeconds %= SECONDS_IN_DAY;

    // 2. Calculate Hours and remaining seconds
    const SECONDS_IN_HOUR = 60 * 60;
    const hours = Math.floor(totalSeconds / SECONDS_IN_HOUR);
    totalSeconds %= SECONDS_IN_HOUR;

    // 3. Calculate Minutes and Seconds
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    const parts = [];
    
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    
    if (seconds > 0 || parts.length === 0) {
        if (seconds > 0) {
             parts.push(`${seconds}s`);
        } else if (parts.length === 0) {
             // This handles the edge case of 0 < ms < 1000, but since ms is checked for > 0, 
             // and totalSeconds is calculated from ms, this shouldn't result in an empty string 
             // if ms > 0. Returning the joined string handles the final case.
        }
    }
    
    // For durations like 60s, parts=['1m']. We ensure a fallback if somehow empty.
    return parts.join(' ') || '0s';
};

/**
 * Formats the recipe inputs/outputs into a string (e.g., "2 SIO + 4 LST").
 */
const formatRecipeParts = (parts: RecipePart[]) => {
    return parts.map((p: RecipePart) => `${p.amount} ${p.ticker}`).join(' + ');
};


/**
 * RecipeSelector component: Allows a user to select a specific manufacturing recipe 
 * for a given material, displaying the inputs, outputs, and duration.
 * * @param {object} props - Component props
 * @param {Material} props.material - The material object containing inputRecipes.
 * @param {InputRecipe | null} props.selectedRecipe - The currently selected recipe.
 * @param {function} props.onSelectRecipe - Handler function to save the selected recipe.
 */
export const RecipeSelector = ({ material, selectedRecipe, onSelectRecipe }: RecipeSelectorProps) => {
    const theme = useTheme()
    // --------------------------------------------------------------------------

    if (!material || !material.inputRecipes || material.inputRecipes.length === 0) {
        return (
            <Typography color="textSecondary" sx={{ textAlign: "center", py: 3 }}>
                No recipes defined for {material?.ticker || 'this material'}.
            </Typography>
        );
    }
    
    const recipes = material.inputRecipes;

    return (
        <Box sx={{ p: 1, height: '100%', borderRadius: 1, background: 'transparent' }}>
            <Typography variant="subtitle2" sx={{ mb: 1, color: theme.palette.text.secondary }}>
                Select Manufacturing Recipe for {material.ticker}:
            </Typography>

            <List sx={{ maxHeight: 300, overflowY: "auto", p: 0 }}>
                {recipes.map((recipe, index) => {
                    const isSelected = selectedRecipe && selectedRecipe.processid === recipe.processid;
                    
                    // Format the core components of the list item
                    const inputSummary = formatRecipeParts(recipe.inputs);
                    const outputSummary = formatRecipeParts(recipe.outputs);
                    const durationText = formatDuration(recipe.durationmillis);

                    return (
                        <ListItem
                            key={recipe.processid || index}
                            component="button"
                            onClick={() => onSelectRecipe(recipe)}
                            sx={{
                                border: `1px solid ${theme.palette.divider}`,
                                borderRadius: 1,
                                mb: 0.5,
                                bgcolor: isSelected ? theme.palette.primary.dark : 'transparent',
                                "&:hover": {
                                    bgcolor: theme.palette.action.selected,
                                },
                            }}
                        >
                            <ListItemText
                                primary={
                                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <Typography variant="body2" sx={{ fontWeight: isSelected ? 'bold' : 'normal' }}>
                                            {inputSummary}
                                        </Typography>

                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', mr: 1, color: theme.palette.text.secondary }}>
                                                <AccessTimeIcon sx={{ fontSize: 16, mr: 0.5 }} />
                                                {durationText}
                                            </Typography>
                                            
                                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                                <span style={{ color: theme.palette.text.secondary }}>={' >'}</span> {outputSummary}
                                            </Typography>
                                        </Box>
                                    </Box>
                                }
                            />
                        </ListItem>
                    );
                })}
            </List>
        </Box>
    );
};