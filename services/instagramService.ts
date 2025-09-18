// This is a mock API to simulate calls to the Instagram API.
// Direct calls from a browser would be blocked by CORS.
// This service mimics success, user not found, rate limit, and private profile responses.

export const getMockUserInfo = async (username: string): Promise<any> => {
  // Use a random delay to simulate network latency
  const randomDelay = Math.random() * 2000 + 500; // 0.5s to 2.5s

  return new Promise(resolve => {
    setTimeout(() => {
      const outcome = Math.random();

      if (username.startsWith("notfound_") || outcome < 0.1) {
        // 10% chance of "User not found"
        resolve({ error: "User not found", code: 404 });
      } else if (username.startsWith("ratelimit_") || outcome < 0.15) {
        // 5% chance of "Rate limit"
        resolve({ error: "Rate limit, please wait", code: 429 });
      } else if (username.startsWith("private_") || outcome < 0.25) {
        // 10% chance of a private/empty profile
        resolve({
          data: {
            user: {
              edge_owner_to_timeline_media: {
                edges: [],
              },
            },
          },
        });
      } else {
        // 75% chance of success with a random post date
        const now = Date.now();
        const twoYearsInMillis = 2 * 365 * 24 * 60 * 60 * 1000;
        // Random timestamp within the last two years
        const randomTimestampInSeconds = Math.floor((now - Math.random() * twoYearsInMillis) / 1000);

        resolve({
          data: {
            user: {
              edge_owner_to_timeline_media: {
                edges: [
                  { node: { taken_at_timestamp: randomTimestampInSeconds } },
                  { node: { taken_at_timestamp: randomTimestampInSeconds - 86400 * 30 } }, // an older post
                ],
              },
            },
          },
        });
      }
    }, randomDelay);
  });
};
