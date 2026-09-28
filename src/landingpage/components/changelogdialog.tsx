import React from "react";
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	Typography,
	Box,
	Link,
} from "@mui/material";
import {
	TimelineBadge,
	TimelineContainer,
	TimelineItem,
	TimelineNode,
} from "../styles";
import type { GitCommit, GroupedCommits } from "../types";

interface ChangeLogDialogProps {
	showChangelog: boolean;
	setShowChangelog: (value: boolean) => void;
	changelog: GitCommit[];
	loadingChangelog: boolean;
	groupCommitsByDay: (commits: GitCommit[]) => GroupedCommits[];
}

export const ChangeLogDialog: React.FC<ChangeLogDialogProps> = ({
	showChangelog,
	setShowChangelog,
	changelog,
	loadingChangelog,
	groupCommitsByDay,
}) => {
	return (
		<Dialog
			open={showChangelog}
			onClose={() => setShowChangelog(false)}
			maxWidth="sm"
			fullWidth
		>
			<DialogTitle sx={{ bgcolor: "#0f0f1b", color: "white", pb: 2 }}>
				<Typography variant="h6" sx={{ fontWeight: "bold" }}>
					System Changelog
				</Typography>
			</DialogTitle>
			<DialogContent
				dividers
				sx={{
					bgcolor: "#06060e",
					color: "rgba(255,255,255,0.85)",
					py: 3,
					maxHeight: "60vh",
					overflowY: "auto",
				}}
			>
				{loadingChangelog ? (
					<Typography
						variant="body2"
						sx={{
							color: "rgba(255,255,255,0.5)",
							textAlign: "center",
							my: 4,
						}}
					>
						Loading commits from git...
					</Typography>
				) : changelog.length === 0 ? (
					<Typography
						variant="body2"
						sx={{
							color: "rgba(255,255,255,0.5)",
							textAlign: "center",
							my: 4,
						}}
					>
						No commits found.
					</Typography>
				) : (
					<TimelineContainer>
						{groupCommitsByDay(changelog).map((group, groupIdx) => (
							<TimelineItem key={groupIdx}>
								<TimelineNode />
								<Box
									sx={{
										display: "flex",
										justifyContent: "space-between",
										alignItems: "center",
										mb: 1.5,
									}}
								>
									<Typography
										variant="body2"
										sx={{
											color: "white",
											fontWeight: "bold",
											fontSize: "0.9rem",
										}}
									>
										{group.dateStr}
									</Typography>
									<TimelineBadge>{group.relativeStr}</TimelineBadge>
								</Box>
								<Box
									sx={{
										display: "flex",
										flexDirection: "column",
										gap: 1.5,
										pl: 0.5,
									}}
								>
									{group.items.map((item: GitCommit, itemIdx: number) => (
										<Box
											key={itemIdx}
											sx={{
												display: "flex",
												alignItems: "flex-start",
												gap: 1.5,
											}}
										>
											<Box
												sx={{
													px: 1,
													py: 0.2,
													borderRadius: 1,
													fontSize: "0.6rem",
													fontWeight: "bold",
													border: "1px solid",
													textTransform: "uppercase",
													lineHeight: 1,
													mt: 0.3,
													borderColor:
														item.type === "frontend"
															? "rgba(96, 165, 250, 0.4)"
															: "rgba(167, 139, 250, 0.4)",
													color:
														item.type === "frontend" ? "#60a5fa" : "#a78bfa",
													bgcolor:
														item.type === "frontend"
															? "rgba(96, 165, 250, 0.05)"
															: "rgba(167, 139, 250, 0.05)",
													minWidth: 65,
													textAlign: "center",
												}}
											>
												{item.type}
											</Box>

											<Typography
												variant="body2"
												sx={{
													color: "rgba(255,255,255,0.7)",
													fontSize: "0.8rem",
													lineHeight: 1.4,
												}}
											>
												{item.hash && (
													<Link
														href={
															item.type === "frontend"
																? `https://github.com/xflasar/PUNoted/commit/${item.hash}`
																: `https://github.com/xflasar/PUNoted-API/commit/${item.hash}`
														}
														target="_blank"
														sx={{
															color: "#7b68ee",
															fontFamily: "monospace",
															fontWeight: "bold",
															textDecoration: "none",
															mr: 1,
															"&:hover": { textDecoration: "underline" },
														}}
													>
														[{item.hash}]
													</Link>
												)}
												{item.message}
												<Typography
													component="span"
													variant="caption"
													sx={{
														color: "rgba(255,255,255,0.35)",
														fontSize: "0.7rem",
														fontStyle: "italic",
														display: "block",
														mt: 0.5,
													}}
												>
													— by {item.author}
												</Typography>
											</Typography>
										</Box>
									))}
								</Box>
							</TimelineItem>
						))}
					</TimelineContainer>
				)}
			</DialogContent>
			<DialogActions sx={{ bgcolor: "#0f0f1b" }}>
				<Button
					onClick={() => setShowChangelog(false)}
					variant="contained"
					sx={{ bgcolor: "#7b68ee", "&:hover": { bgcolor: "#6a5acd" } }}
				>
					Close
				</Button>
			</DialogActions>
		</Dialog>
	);
};
