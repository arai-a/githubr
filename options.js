async function saveOptions(e) {
  e.preventDefault();

  browser.storage.local.set({
    "username": document.getElementById("username").value
  });
}

async function restoreOptions() {
  try {
    const { username } = await browser.storage.local.get("username");
    if (username) {
      document.getElementById("username").value = username;
      return;
    }
  } catch (e) {
  }
  document.getElementById("username").value = "";
}

document.addEventListener("DOMContentLoaded", restoreOptions);
document.getElementById("options").addEventListener("submit", saveOptions);
