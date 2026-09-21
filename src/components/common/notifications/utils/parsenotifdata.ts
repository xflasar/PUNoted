/**
 * Safely parses notification data payloads.
 * Handles strings, double-encoded JSON, object primitives, and arrays.
 */
export const parseNotifData = (raw: any): Record<string, any> | null => {
	if (raw === null || raw === undefined) return null;

	let parsed = raw;

	// Attempt string JSON parsing (handling potential double-stringified JSON)
	if (typeof raw === "string") {
		try {
			parsed = JSON.parse(raw);
			if (typeof parsed === "string") {
				try {
					parsed = JSON.parse(parsed);
				} catch {
					// Stick with single parse if second parse fails
				}
			}
		} catch {
			return null;
		}
	}

	// Validate parsed object
	if (typeof parsed === "object" && parsed !== null) {
		if (Array.isArray(parsed)) {
			return parsed.length > 0 ? { items: parsed } : null;
		}
		if (Object.keys(parsed).length > 0) {
			return parsed;
		}
	}

	return null;
};
