export const getApiStatus = async (retries = 3, delay = 1000): Promise<'online' | 'offline'> => {
  try {
    const response = await fetch('https://punoted.ddns.net/api/status', {
      method: 'GET',
      cache: 'no-store' // Prevents browser caching, ensuring a fresh check
    });
    if (response.ok) { // Status code 200-299
      return 'online';
    } else {
      console.warn(`API status check failed with status: ${response.status}`);
      return 'offline';
    }
  } catch (error) {
    console.error('Failed to fetch API status:', error);
    if (retries > 0) {
      console.log(`Retrying API status check... (Attempts left: ${retries})`);
      await new Promise(res => setTimeout(res, delay));
      return getApiStatus(retries - 1, delay * 2); // Exponential backoff
    }
    return 'offline';
  }
};