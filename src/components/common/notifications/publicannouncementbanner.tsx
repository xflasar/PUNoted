import React, { useState, useEffect } from "react";
import {
	Box,
	Alert,
	AlertTitle,
	IconButton,
	Collapse,
	Typography,
	Button,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

export interface PublicAnnouncement {
	id: number;
	title: string;
	message: string;
	severity?: "info" | "warning" | "success" | "error";
	link?: string;
}

export const PublicAnnouncementBanner: React.FC = () => {
	const [announcements, setAnnouncements] = useState<PublicAnnouncement[]>([]);
	const [open, setOpen] = useState<boolean>(true);

	useEffect(() => {
		const fetchAnnouncements = async () => {
			try {
				const res = await fetch("/public/announcements");
				if (res.ok) {
					const json = await res.json();
					if (json.announcements && json.announcements.length > 0) {
						const dismissed = sessionStorage.getItem(
							"dismissed_announcement_id",
						);
						const latest = json.announcements[0];
						if (dismissed !== String(latest.id)) {
							setAnnouncements(json.announcements);
						}
					}
				}
			} catch {
				// Silent catch
			}
		};
		fetchAnnouncements();
	}, []);

	if (announcements.length === 0 || !open) return null;

	const current = announcements[0];

	const handleDismiss = () => {
		sessionStorage.setItem("dismissed_announcement_id", String(current.id));
		setOpen(false);
	};

	return (
		<Collapse in={open}>
			<Box sx={{ width: "100%", px: 2, pt: 1, pb: 0.5 }}>
				<Alert
					severity={current.severity || "info"}
					variant="filled"
					action={
						<IconButton
							aria-label="close"
							color="inherit"
							size="small"
							onClick={handleDismiss}
						>
							<CloseIcon fontSize="inherit" />
						</IconButton>
					}
					sx={{
						borderRadius: 2,
						bgcolor:
							current.severity === "warning"
								? "#F57C00"
								: current.severity === "success"
									? "#2E7D32"
									: "#5E35B1",
						color: "white",
						boxShadow: "0px 4px 16px rgba(0,0,0,0.3)",
					}}
				>
					<AlertTitle sx={{ fontWeight: 700, fontSize: "0.9rem", mb: 0.25 }}>
						📢 {current.title}
					</AlertTitle>
					<Typography
						variant="body2"
						sx={{ fontSize: "0.82rem", lineHeight: 1.4 }}
					>
						{current.message}
					</Typography>
					{current.link && (
						<Button
							size="small"
							color="inherit"
							href={current.link}
							target="_blank"
							sx={{
								mt: 0.5,
								fontWeight: 700,
								textTransform: "none",
								fontSize: "0.78rem",
							}}
						>
							Learn More →
						</Button>
					)}
				</Alert>
			</Box>
		</Collapse>
	);
};
