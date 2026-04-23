// Save this as FilterPanel.tsx (or add it above your main component)

import { 
    Dialog, 
    DialogTitle, 
    DialogContent, 
    IconButton, 
    Typography, 
    Box, 
    RadioGroup, 
    FormControlLabel, 
    Radio, 
    FormControl, 
    FormLabel, 
    Divider, 
    Switch,
    useTheme
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const FilterPanel = ({ open, onClose, popFilterSetting, setPopFilterSetting } : {open: boolean, onClose: any, popFilterSetting: string, setPopFilterSetting: any}) => {
    const theme = useTheme()
    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
            <DialogTitle  sx={{background: theme.palette.background.paper}}>
                <Box display="flex" justifyContent="space-between" alignItems="center" >
                    <Typography variant="h6">Advanced Map Filters</Typography>
                    <IconButton onClick={onClose}>
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>
            <DialogContent dividers  sx={{background: theme.palette.background.paper}}>
                {/* ======================= Population Ring Filter ======================= */}
                <FormControl component="fieldset" fullWidth sx={{ mb: 3 }}>
                    <FormLabel component="legend" sx={{ mb: 1 }}>System Dot Visualization</FormLabel>
                    <RadioGroup
                        aria-label="population-filter"
                        name="pop-filter"
                        value={popFilterSetting}
                        onChange={(e) => setPopFilterSetting(e.target.value)}
                    >
                        <FormControlLabel value="Off" control={<Radio size="small" />} label="Off (Default Dot)" />
                        <FormControlLabel value="Program" control={<Radio size="small" />} label="Color by Government Program" />
                        <FormControlLabel 
                            value="PopRings" 
                            control={<Radio size="small" />} 
                            label="Population Rings (Size by Count)" 
                        />
                    </RadioGroup>
                </FormControl>
                <Divider sx={{ my: 2 }} />

                {/* ======================= Resource Filtering (Future Implementation) ======================= */}
                <FormControl component="fieldset" fullWidth>
                    <FormLabel component="legend" sx={{ mb: 1 }}>Planet Resource Filter</FormLabel>
                    <Typography variant="body2" color="textSecondary">
                        *Filters planets based on specific resource presence (API Integration Pending).
                    </Typography>
                    {/* Placeholder for resource checkboxes */}
                    <Box sx={{ mt: 1 }}>
                        <FormControlLabel disabled control={<Switch size="small" />} label="Has Rare Metals" />
                        <FormControlLabel disabled control={<Switch size="small" />} label="Has Volatiles" />
                        {/* Add more resource filters here */}
                    </Box>
                </FormControl>
            </DialogContent>
        </Dialog>
    );
};
export default FilterPanel;