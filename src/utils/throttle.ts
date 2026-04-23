// Light throttle
export const throttle = (fn: Function, ms = 120) => {
	let last = 0;
	let pending: any = null;
	return (...args: any[]) => {
		const now = performance.now();
		if (now - last > ms) {
			last = now;
			fn(...args);
		} else {
			pending = args;
			setTimeout(() => {
				if (pending) {
					last = performance.now();
					fn(...pending);
					pending = null;
				}
			}, ms);
		}
	};
};
