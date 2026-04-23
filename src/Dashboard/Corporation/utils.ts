export const formatSmartNumber = (num: number, threshold = 1000000) => {
    if (Math.abs(num) >= threshold) {
        return new Intl.NumberFormat('en-US', {
            notation: "compact",
            compactDisplay: "short",
            maximumFractionDigits: 1
        }).format(num);
    }
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(num);
};

export const formatExactNumber = (num: number) =>
    new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(num);

export const isUserStale = (lastActive?: string) => {
    if (!lastActive) return false;
    const diff = new Date().getTime() - new Date(lastActive).getTime();
    return diff >= 3 * 24 * 60 * 60 * 1000;
};

export const getNetColor = (net: number, theme: any) => 
    net > 0 ? theme.palette.success.main : net < 0 ? theme.palette.error.main : theme.palette.text.secondary;