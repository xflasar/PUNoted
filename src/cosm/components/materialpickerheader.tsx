import { Box, Button, IconButton, Typography } from "@mui/material";
import { FileUp, X } from "lucide-react";

interface MaterialPickerHeaderProps {
	title: string;
	isMobile?: boolean;
	onImport: () => void;
	onClose?: () => void;
}

const MaterialPickerHeader = ({
	title,
	isMobile = false,
	onImport,
	onClose,
}: MaterialPickerHeaderProps) => (
	<Box
		sx={{
			display: "flex",
			justifyContent: "space-between",
			alignItems: "center",
			p: isMobile ? 0 : 1.5,
			pb: isMobile ? 2 : 1.5,
			borderBottom: isMobile ? 0 : "1px solid rgba(255,255,255,0.1)",
		}}
	>
		<Typography
			variant="subtitle2"
			sx={{ color: "text.primary", fontWeight: "bold", fontSize: "1.05rem" }}
		>
			{title}
		</Typography>
		<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
			<Button
				size="small"
				variant="outlined"
				startIcon={<FileUp className="inline-icon" />}
				onClick={onImport}
				sx={{ fontWeight: "bold" }}
			>
				IMPORT
			</Button>
			{isMobile && onClose && (
				<IconButton onClick={onClose} aria-label={`Close ${title}`}>
					<X className="inline-icon" />
				</IconButton>
			)}
		</Box>
	</Box>
);

export default MaterialPickerHeader;
