import { useTheme } from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGlobalData } from "../../context/globaldatacontext";
import type { GitCommit, GroupedCommits } from "../types";

interface UseLandingPageProps {
	isLoggedIn: boolean;
	onLogout: () => void;
}

export const useLandingPage = (props: UseLandingPageProps) => {
	const { isLoggedIn, onLogout } = props;

	const navigate = useNavigate();
	const globalData = useGlobalData();
	const apiStatus = globalData?.apiStatus || "online";
	const [showAuth, setShowAuth] = useState(false);
	const loggedInUsername = isLoggedIn
		? (localStorage.getItem("username") ?? undefined)
		: undefined;
	const [showInstructionsDialog, setShowInstructionsDialog] = useState(false);
	const [targetExtensionUrl, setTargetExtensionUrl] = useState("");
	const [showChangelog, setShowChangelog] = useState(false);
	const [snackbar, setSnackbar] = useState({
		open: false,
		message: "",
		severity: "success",
	});
	const theme = useTheme();

	const [changelog, setChangelog] = useState<GitCommit[]>([]);
	const [loadingChangelog, setLoadingChangelog] = useState(false);

	const fetchCommits = async (repo: string, type: "frontend" | "backend") => {
		try {
			const res = await fetch(
				`https://api.github.com/repos/xflasar/${repo}/commits?sha=main`,
			);
			if (!res.ok) return [];
			const data = await res.json();
			if (!Array.isArray(data)) return [];
			return data.map((item: any) => ({
				hash: item.sha.substring(0, 7),
				message: item.commit.message.split("\n")[0],
				date: item.commit.author.date,
				author: item.commit.author.name,
				type,
			}));
		} catch (e) {
			console.error(`Failed to fetch commits for ${repo}:`, e);
			return [];
		}
	};

	const handleOpenChangelog = async () => {
		setShowChangelog(true);
		setLoadingChangelog(true);
		try {
			const [feCommits, beCommits] = await Promise.all([
				fetchCommits("PUNoted", "frontend"),
				fetchCommits("PUNoted-API", "backend"),
			]);
			const combined = [...feCommits, ...beCommits];
			combined.sort(
				(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
			);
			setChangelog(combined.slice(0, 100));
		} catch (error) {
			console.error("Failed to fetch changelog:", error);
		} finally {
			setLoadingChangelog(false);
		}
	};

	const groupCommitsByDay = (commitsList: GitCommit[]): GroupedCommits[] => {
		const groups: { [key: string]: GroupedCommits } = {};

		commitsList.forEach((commit) => {
			const d = new Date(commit.date);
			const dateKey = d.toDateString();

			if (!groups[dateKey]) {
				const dateStr = d.toLocaleDateString(undefined, {
					month: "long",
					day: "numeric",
					year: "numeric",
				});

				const diffTime = Math.abs(new Date().getTime() - d.getTime());
				const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
				let relativeStr = `${diffDays} days ago`;
				if (diffDays === 0) relativeStr = "Today";
				else if (diffDays === 1) relativeStr = "Yesterday";
				else if (diffDays > 30) {
					const months = Math.floor(diffDays / 30);
					relativeStr = `${months} month${months > 1 ? "s" : ""} ago`;
				}

				groups[dateKey] = {
					dateStr,
					relativeStr,
					items: [],
				};
			}

			groups[dateKey].items.push(commit);
		});

		return Object.values(groups);
	};

	const handleAuthButton = (type: "cosm" | "account" | "dashboard") => {
		if (type === "cosm") {
			navigate("/cosm");
		} else if (type === "account") {
			setShowAuth(true);
		} else if (type === "dashboard") {
			navigate("/dashboard/galaxy-map");
		}
	};

	const handleLogout = () => {
		localStorage.clear();
		onLogout();
		setSnackbar({
			open: true,
			message: "Logged out successfully!",
			severity: "success",
		});
	};

	const handleExtensionClick = (url: string) => {
		setTargetExtensionUrl(url);
		setShowInstructionsDialog(true);
	};

	return {
		showAuth,
		showInstructionsDialog,
		showChangelog,
		changelog,
		loadingChangelog,
		snackbar,
		theme,
		apiStatus,
		loggedInUsername,
		targetExtensionUrl,
		setTargetExtensionUrl,
		groupCommitsByDay,
		handleAuthButton,
		handleLogout,
		handleExtensionClick,
		handleOpenChangelog,
		setShowAuth,
		setShowChangelog,
		setShowInstructionsDialog,
	};
};
