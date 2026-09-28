import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

describe("Import Path Case Sensitivity Test", () => {
	it("should verify all relative imports match exact file casing on disk", () => {
		const srcDir = path.resolve(__dirname, "../src");
		const allFiles = new Set<string>();
		const lowerFiles = new Map<string, string>();

		function collectFiles(dir: string) {
			const entries = fs.readdirSync(dir, { withFileTypes: true });
			for (const entry of entries) {
				const fullPath = path.join(dir, entry.name).replace(/\\/g, "/");
				if (entry.isDirectory()) {
					collectFiles(fullPath);
				} else {
					allFiles.add(fullPath);
					lowerFiles.set(fullPath.toLowerCase(), fullPath);
				}
			}
		}

		collectFiles(srcDir);

		const sourceFileExtensions = [".ts", ".tsx"];
		const targetExtensions = [
			"",
			".ts",
			".tsx",
			".js",
			".jsx",
			".css",
			".png",
			".svg",
			"/index.ts",
			"/index.tsx",
			"/index.js",
		];

		const importRegex = /(?:import|from)\s+['"]([^'"]+)['"]/g;
		const mismatches: Array<{ file: string; importPath: string }> = [];

		for (const filePath of allFiles) {
			if (!sourceFileExtensions.some((ext) => filePath.endsWith(ext))) {
				continue;
			}

			const content = fs.readFileSync(filePath, "utf-8");
			const fileDir = path.dirname(filePath);

			let match: RegExpExecArray | null;
			while ((match = importRegex.exec(content)) !== null) {
				const importPath = match[1];
				if (!importPath.startsWith(".")) {
					continue;
				}

				const resolvedPath = path
					.resolve(fileDir, importPath)
					.replace(/\\/g, "/");

				let exactFound = false;
				for (const ext of targetExtensions) {
					if (allFiles.has(resolvedPath + ext)) {
						exactFound = true;
						break;
					}
				}

				if (!exactFound) {
					for (const ext of targetExtensions) {
						const lowerTarget = (resolvedPath + ext).toLowerCase();
						if (lowerFiles.has(lowerTarget)) {
							const actualCase = lowerFiles.get(lowerTarget);
							mismatches.push({
								file: path.relative(srcDir, filePath),
								importPath,
							});
							break;
						}
					}
				}
			}
		}

		if (mismatches.length > 0) {
			console.error(
				"Found import casing mismatches (will break on Linux builds):",
				mismatches,
			);
		}

		expect(mismatches).toEqual([]);
	});
});
