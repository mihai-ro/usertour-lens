document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btn').addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'toggle' }, () => {
      window.close();
    });
  });
});
