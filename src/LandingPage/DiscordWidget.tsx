import { useEffect, useState, useRef } from "react";
import {
	Box,
	Typography,
	CircularProgress,
	Popover,
	Button,
} from "@mui/material";
import { FaDiscord, FaUsers } from "react-icons/fa";
import { styled } from "@mui/system";

interface Props {
	serverId: string;
	anchorEl?: HTMLElement | null;
	open?: boolean;
	onClose?: () => void;
}

const WidgetBox = styled(Box)(({ theme }) => ({
	display: "flex",
	flexDirection: "column",
	gap: theme.spacing(1),
	alignItems: "center",
	padding: theme.spacing(1.25),
	borderRadius: 10,
	background: theme.palette.background.paper,
	color: theme.palette.text.primary,
	minWidth: 200,
	maxWidth: 320,
	boxShadow: "0 8px 24px rgba(0,0,0,0.45)",
}));

export default function DiscordWidget({
	serverId,
	anchorEl,
	open = false,
	onClose,
}: Props) {
	const [data, setData] = useState<{
		name?: string;
		instant_invite?: string;
		presence_count?: number;
	} | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const anchorRef = useRef<HTMLElement | null>(null);

	const isControlled =
		typeof anchorEl !== "undefined" || typeof open !== "undefined";
	const popOpen = isControlled ? !!open : false;
	const popAnchor = isControlled
		? (anchorEl ?? anchorRef.current)
		: anchorRef.current;

	const cacheKey = `discord_widget_${serverId}`;
	useEffect(() => {
		if (!serverId) {
			setError("No server ID provided");
			return;
		}

		// quick session cache
		const cached = sessionStorage.getItem(cacheKey);
		if (cached) {
			try {
				const parsed = JSON.parse(cached) as { ts: number; payload: any };
				if (Date.now() - parsed.ts < 120000) {
					setData(parsed.payload);
					return;
				}
			} catch {}
		}

		let cancelled = false;
		setLoading(true);
		fetch(`https://discord.com/api/guilds/${serverId}/widget.json`)
			.then(async (res) => {
				if (!res.ok) {
					if (res.status === 403 || res.status === 404)
						throw new Error("Discord widget disabled or not found.");
					throw new Error(`Failed to fetch widget (${res.status}).`);
				}
				const payload = await res.json();
				if (!cancelled) {
					const minimal = {
						name: payload.name,
						instant_invite: payload.instant_invite,
						presence_count:
							payload.presence_count ?? payload.members?.length ?? 0,
					};
					sessionStorage.setItem(
						cacheKey,
						JSON.stringify({ ts: Date.now(), payload: minimal }),
					);
					setData(minimal);
				}
			})
			.catch((err: any) => {
				if (!cancelled)
					setError(
						err.message || "Network error while fetching Discord widget.",
					);
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, [serverId]);

	const handleJoin = () => {
		const url = data?.instant_invite;
		if (url) window.open(url, "_blank", "noopener,noreferrer");
		else
			window.open(
				`https://discord.com/invite/${serverId}`,
				"_blank",
				"noopener,noreferrer",
			);
		onClose?.();
	};

	return (
		<Popover
			open={popOpen}
			anchorEl={popAnchor}
			onClose={onClose}
			anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
			transformOrigin={{ vertical: "top", horizontal: "left" }}
			PaperProps={{
				sx: {
					p: 0,
					borderRadius: 1.5,
					overflow: "visible",
					width: { xs: "92vw", sm: 220 },
				},
			}}
		>
			<WidgetBox>
				{loading ? (
					<CircularProgress size={20} />
				) : error ? (
					<Typography variant="body2" color="error" textAlign="center">
						{error}
					</Typography>
				) : (
					<>
						<Box style={{ display: "flex", alignItems: "center", gap: 8 }}>
							<FaDiscord style={{ color: "#5865F2" }} />
							<Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
								{data?.name ?? "Discord"}
							</Typography>
						</Box>

						<Box style={{ display: "flex", alignItems: "center", gap: 6 }}>
							<FaUsers />
							<Typography variant="body2" color="text.secondary">
								{data?.presence_count ?? 0} online
							</Typography>
						</Box>

						<Button
							onClick={handleJoin}
							fullWidth
							variant="contained"
							sx={{
								mt: 0.5,
								bgcolor: "#7b68ee",
								"&:hover": { bgcolor: "#6a5acd" },
								textTransform: "none",
							}}
						>
							Join
						</Button>
					</>
				)}
			</WidgetBox>
		</Popover>
	);
}
