// Define types for clarity
type StarIcon = {
	type: string; // The key used in getIcon (e.g., 'O', 'G')
	url: string; // The imported image URL
	size: number; // The size of the icon in pixels (e.g., 64)
};
type IconMapping = Record<
	string,
	{ x: number; y: number; width: number; height: number; mask: boolean }
>;

/**
 * Builds a single texture atlas image from a list of individual icon sources.
 */
export async function buildStarAtlas(
	icons: StarIcon[],
): Promise<{ atlas: ImageBitmap; mapping: IconMapping }> {
	const iconSize = icons[0]?.size || 512;
	const padding = 0;
	const width = icons.length * (iconSize + padding) + padding;
	const height = iconSize + padding * 2;

	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;

	const ctx = canvas.getContext("2d");
	if (!ctx) {
		throw new Error("Could not create canvas context for icon atlas.");
	}
	ctx.imageSmoothingEnabled = false;

	const mapping: IconMapping = {};
	let currentX = padding;

	const promises = icons.map((icon) => {
		return new Promise<void>((resolve, reject) => {
			const img = new Image();
			img.onload = () => {
				ctx.drawImage(img, currentX, padding, iconSize, iconSize);

				mapping[icon.type] = {
					x: currentX,
					y: padding,
					width: iconSize,
					height: iconSize,
					mask: false,
				};

				currentX += iconSize + padding;
				resolve();
			};
			img.onerror = reject;
			img.src = icon.url;
		});
	});

	await Promise.all(promises);

	// ⚡ The fast part
	const atlas = await createImageBitmap(canvas);

	return { atlas, mapping };
}
