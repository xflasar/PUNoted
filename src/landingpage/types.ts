export interface GitCommit {
	hash: string;
	message: string;
	date: string;
	author: string;
	type: "frontend" | "backend";
}

export interface GroupedCommits {
	dateStr: string;
	relativeStr: string;
	items: GitCommit[];
}
