import { Box, Typography } from "@mui/material";
import { styled } from "@mui/system";

interface ApiStatusProps {
  apiStatus: "online" | "offline";
}

const StatusBox = styled(Box)(({ theme }) => ({
  position: "fixed",
  bottom: theme.spacing(2),
  left: "50%",
  transform: "translateX(-50%)",
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
  color: "white",
  zIndex: 9999,
  padding: theme.spacing(1),
  borderRadius: theme.spacing(1),
  backgroundColor: "rgba(25, 25, 50, 0.8)",
  backdropFilter: "blur(5px)",
  boxShadow: "0 0 10px rgba(123, 104, 238, 0.4)",
}));

const StatusIndicator = styled(Box)(
  ({ statusColor }: { statusColor: string }) => ({
    width: 8,
    height: 8,
    borderRadius: "50%",
    backgroundColor: statusColor,
    boxShadow: `0 0 5px ${statusColor}`,
  })
);

const ApiStatus = ({ apiStatus = 'online' }: ApiStatusProps) => {
  let statusText = "";
  let statusColor = "";

  if (apiStatus === "online") {
    statusText = "API STATUS: ONLINE";
    statusColor = "#90ee90";
  } else {
    statusText = "API STATUS: OFFLINE";
    statusColor = "red";
  }

  return apiStatus == "offline" ? (
    <StatusBox>
      <StatusIndicator statusColor={statusColor} />
      <Typography
        variant="caption"
        sx={{ letterSpacing: "0.05em", fontWeight: 500 }}
      >
        {statusText}
      </Typography>
    </StatusBox>
  ) : null;
};

export default ApiStatus;