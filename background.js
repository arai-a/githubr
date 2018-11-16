const githubURL = "https://api.github.com/search/issues";

const CACHE_TIMEOUT = 60 * 1000;

let cachedQueryTime = 0;
let cachedRevs = null;

let running = false;
const tabIdQueue = [];

// Perform Conduit API and return result JSON object.
async function GitHubAPI(name, params=[]) {
  const query = params
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join("&");
  const uri = `${githubURL}?${query}`;
  const init = {
    credentials: "omit",
  };
  const response = await fetch(uri, init);
  const responseObject = await response.json();
  return responseObject;
}

// Load username from preference.
async function loadUsername() {
  try {
    const { username } = await browser.storage.local.get("username");
    if (username) {
      return username;
    }
  } catch (e) {
  }
  return "";
}

// Get the list of pending reviews.
async function getPendingReviews(username) {
  return GitHubAPI("differential.query", [
    ["q", `review-requested:${username} type:pr is:open archived:false`],
  ]);
}

// Get the list of pending reviews and return simplified struct for passing
// as message.
async function getSimpleRevs() {
  try {
    const username = await loadUsername();
    if (!username) {
      return { revs: null, status: "username-na" };
    }

    const result = await getPendingReviews(username);

    const simpleRevs = [];
    for (const item of result.items) {
      let bugnumber;
      const m = item.title.match(/bug (\d+)/);
      if (m) {
        bugnumber = m[1];
      }

      simpleRevs.push({
        title: item.title,
        uri: item.html_url,
        author: item.user.login,
        bugnumber,
        dateModified: new Date(item.updated_at).getTime() / 1000,
      });
    }
    return { revs: simpleRevs, username, status: "ok", error: null };
  } catch (e) {
    return { revs: null, username: "", status: "error", message: e ? e.message : "no message" };
  }
}

// Get the simplified list of pending reviews, and send it as message to tabs.
async function query() {
  const message = await getSimpleRevs();

  running = false;
  for (const tabId of tabIdQueue) {
    browser.tabs.sendMessage(tabId, message);
  }
  if (message.revs) {
    cachedRevs = message.revs;
    cachedQueryTime = Date.now();
  }
}

browser.runtime.onMessage.addListener((message, sender) => {
  const tabId = sender.tab.id;

  if (Date.now() < cachedQueryTime + CACHE_TIMEOUT) {
    browser.tabs.sendMessage(tabId, {
      revs: cachedRevs,
      status: "ok"
    });
    return;
  }

  tabIdQueue.push(tabId);
  if (!running) {
    running = true;
    query();
  }
});
