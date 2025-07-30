import React, { useState, useMemo, useRef } from 'react';
import { Box, Typography, Chip, IconButton, Tooltip } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { ContractEntry } from '../../../app/dashboard/page';
import { ContractEntryWithDisplayDate } from './ContractsHistory'


interface ContractCalendarViewProps {
  contracts: ContractEntryWithDisplayDate[];
  onContractClick: (localId: string) => void;
}

const ContractCalendarView: React.FC<ContractCalendarViewProps> = ({ contracts, onContractClick }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const calendarRef = useRef<HTMLDivElement>(null);

  const getStatusChipColor = (status: string | null) => {
    switch (status?.toUpperCase()) {
      case 'FULFILLED':
        return 'success';
      case 'PARTIALLY_FULFILLED':
        return 'warning';
      case 'CLOSED':
        return 'info';
      case 'TERMINATED':
        return 'error';
      default:
        return 'default';
    }
  };

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay(); // 0 for Sunday, 1 for Monday

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const numDays = daysInMonth(year, month);
    const firstDay = firstDayOfMonth(year, month);

    const days = [];

    // Add leading empty days to align the first day of the month
    const startDayAdjusted = firstDay === 0 ? 6 : firstDay - 1;
    for (let i = 0; i < startDayAdjusted; i++) {
      days.push(null);
    }

    // Add actual days of the month
    for (let i = 1; i <= numDays; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  }, [currentMonth]);

  const dayCellWidth = 150;
  const chipHeight = 28;
  const verticalPadding = 4;

  const positionedContracts = useMemo(() => {
    const contractsInMonth: Array<ContractEntry & {
      startDayIndex: number;
      endDayIndex: number;
      lane: number;
      left: number;
      width: number;
      top: number;
    }> = [];

    // Filter contracts to only include those relevant to the current month's display
    // A contract is relevant if its start or end date falls within the current month,
    // or if it spans across the entire current month.
    const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

    const relevantContracts = contracts.filter(contract => {
      const startDate = contract.date_timestamp ? new Date(contract.date_timestamp) : null;
      const endDate = (contract as any).dueDate_timestamp ? new Date((contract as any).dueDate_timestamp) : null;

      if (!startDate || !endDate) return false;

      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      monthStart.setHours(0, 0, 0, 0);
      monthEnd.setHours(0, 0, 0, 0);

      // Contract starts in or before month and ends in or after month
      return (startDate.getTime() <= monthEnd.getTime() && endDate.getTime() >= monthStart.getTime());
    });

    // Sort relevant contracts by their start date to facilitate lane assignment
    relevantContracts.sort((a, b) => {
      const startDateA = a.date_timestamp ? new Date(a.date_timestamp).getTime() : 0;
      const startDateB = b.date_timestamp ? new Date(b.date_timestamp).getTime() : 0;
      return startDateA - startDateB;
    });

    // Lane management: Keep track of the end time for each lane
    const lanes: { endTime: number; contracts: ContractEntry[] }[] = [];

    relevantContracts.forEach(contract => {
      const startDate = contract.date_timestamp ? new Date(contract.date_timestamp) : null;
      const endDate = (contract as any).dueDate_timestamp ? new Date((contract as any).dueDate_timestamp) : null;

      if (!startDate || !endDate) return;

      // Normalize dates to start of day for calculations
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);

      // Clamp start and end dates to the current month's visible range
      const clampedStartDate = new Date(Math.max(startDate.getTime(), monthStart.getTime()));
      const clampedEndDate = new Date(Math.min(endDate.getTime(), monthEnd.getTime()));

      // Calculate start and end day indices relative to the first day of the calendar grid
      const firstCalendarDayTime = calendarDays[0] ? calendarDays[0].getTime() : monthStart.getTime();

      const startDayIndex = Math.floor((clampedStartDate.getTime() - firstCalendarDayTime) / (24 * 60 * 60 * 1000));
      const endDayIndex = Math.floor((clampedEndDate.getTime() - firstCalendarDayTime) / (24 * 60 * 60 * 1000));

      if (startDayIndex < 0 || endDayIndex < 0) {
        // This contract doesn't visually start or end within the current calendar view, skip
        return;
      }
      
      // Find an available lane
      let assignedLane = -1;
      for (let i = 0; i < lanes.length; i++) {
        if (clampedStartDate.getTime() > lanes[i].endTime) {
          assignedLane = i;
          break;
        }
      }

      if (assignedLane === -1) {
        // No available lane, create a new one
        assignedLane = lanes.length;
        lanes.push({ endTime: 0, contracts: [] });
      }

      // Update the lane's end time
      lanes[assignedLane].endTime = clampedEndDate.getTime();
      lanes[assignedLane].contracts.push(contract);

      // Calculate position and width
      const left = startDayIndex * dayCellWidth;
      const width = (endDayIndex - startDayIndex + 1) * dayCellWidth;
      const top = assignedLane * (chipHeight + verticalPadding);

      contractsInMonth.push({
        ...contract,
        startDayIndex,
        endDayIndex,
        lane: assignedLane,
        left,
        width,
        top,
      });
    });

    return contractsInMonth;
  }, [contracts, currentMonth, calendarDays]);

  const handlePrevMonth = () => {
    setCurrentMonth(prevMonth => {
      const newMonth = new Date(prevMonth.getFullYear(), prevMonth.getMonth() - 1, 1);
      return newMonth;
    });
  };

  const handleNextMonth = () => {
    setCurrentMonth(prevMonth => {
      const newMonth = new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 1);
      return newMonth;
    });
  };

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: '8px', color: 'text.primary' }}>
      {/* Calendar Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <IconButton onClick={handlePrevMonth} color="primary">
          <ArrowBackIosNewIcon />
        </IconButton>
        <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
          {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </Typography>
        <IconButton onClick={handleNextMonth} color="primary">
          <ArrowForwardIosIcon />
        </IconButton>
      </Box>

      {/* Weekday Headers - Scrollable with days */}
      <Box
        sx={{
          display: 'flex',
          overflowX: 'hidden',
          mb: 1,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        {/* Render weekday headers for the entire month's span */}
        {calendarDays.map((day, index) => (
          <Box
            key={`header-${index}`}
            sx={{
              minWidth: dayCellWidth,
              textAlign: 'center',
              p: 1,
              bgcolor: 'primary.dark',
              color: 'text.primary',
              fontWeight: 'bold',
              flexShrink: 0,
            }}
          >
            {day ? weekDays[day.getDay() === 0 ? 6 : day.getDay() - 1] : ''}
          </Box>
        ))}
      </Box>

      {/* Calendar Days and Contracts - Horizontally Scrollable */}
      <Box
        ref={calendarRef}
        sx={{
          display: 'flex',
          overflowX: 'auto',
          position: 'relative',
          minHeight: '200px',
          pb: 1,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: '4px',
        }}
      >
        {calendarDays.map((day, index) => (
          <Box
            key={index}
            sx={{
              minHeight: '100%',
              minWidth: dayCellWidth,
              p: 1,
              bgcolor: day ? 'background.default' : '#1a1a1a',
              color: day ? 'text.primary' : 'text.secondary',
              opacity: day ? 1 : 0.6,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              flexShrink: 0,
              borderRight: index < calendarDays.length - 1 ? '1px solid' : 'none',
              borderColor: 'divider',
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
              {day ? day.getDate() : ''}
            </Typography>
          </Box>
        ))}

        {/* Absolutely positioned contract chips */}
        {positionedContracts.map(contract => (
          <Tooltip
            key={contract.localId}
            title={
              <Box>
                <Typography variant="caption">Created: {contract.date_timestamp ? new Date(contract.date_timestamp).toLocaleString() : 'N/A'}</Typography>
                <br />
                <Typography variant="caption">Due: { contract.dueDate_timestamp ? new Date(contract.dueDate_timestamp).toLocaleString() : 'N/A'}</Typography>
              </Box>
            }
            arrow
          >
            <Chip
              label={contract.name || contract.localId?.substring(0, 8) || 'Contract'}
              size="small"
              onClick={(e) => { e.stopPropagation(); onContractClick(contract.localId!); }}
              sx={{
                position: 'absolute',
                left: contract.left,
                width: contract.width,
                top: contract.top + 20,
                height: chipHeight,
                bgcolor: getStatusChipColor(contract.status),
                color: 'white',
                justifyContent: 'flex-start',
                '& .MuiChip-label': {
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  px: 1,
                },
                cursor: 'pointer',
                borderRadius: '16px',
              }}
            />
          </Tooltip>
        ))}
      </Box>
      {contracts.length === 0 && (
        <Typography color="text.secondary" sx={{ mt: 2 }}>No contracts with due dates found from PUCExt Data.</Typography>
      )}
    </Box>
  );
};

export default ContractCalendarView;
