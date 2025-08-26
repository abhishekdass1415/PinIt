// PinIt Settings Page Script
const pinColorInput = document.getElementById('pinColor');
const pinsDiv = document.getElementById('pins');
// Use the domain of the current tab (from chrome.tabs API), fallback to location.hostname
let domain = 'current';
function getDomainFromUrl(url) {
  try {
    return new URL(url).hostname;
  } catch (e) {
    return location.hostname || 'current';
  }
}

if (chrome.tabs && chrome.tabs.query) {
  chrome.tabs.query({active: true, lastFocusedWindow: true}, (tabs) => {
    if (tabs && tabs[0] && tabs[0].url) {
      domain = getDomainFromUrl(tabs[0].url);
    } else {
      domain = location.hostname || 'current';
    }
    loadSettings();
  });
} else {
  domain = location.hostname || 'current';
  loadSettings();
}

function loadSettings() {
  chrome.storage.local.get(null, (result) => {
    pinColorInput.value = result[`pinColor_${domain}`] || '#f1c40f';
    const pins = result[domain] || [];
    renderPins(pins);
  });
  pinColorInput.addEventListener('input', () => {
    chrome.storage.local.set({ [`pinColor_${domain}`]: pinColorInput.value });
  });
}

// ...existing code...

function renderPins(pins) {
  pinsDiv.innerHTML = '';
  if (!pins.length) {
    pinsDiv.innerHTML = '<em>No pins yet.</em>';
    return;
  }
  pins.forEach((pin, idx) => {
    const div = document.createElement('div');
    div.className = 'pin-item';
    div.innerHTML = `<span class="pin-label">ScrollY: ${pin.y} <small>(${new Date(pin.time).toLocaleString()})</small></span>`;
    // Go to pin button
    const goBtn = document.createElement('button');
    goBtn.textContent = 'Go';
    goBtn.style.marginRight = '8px';
    goBtn.onclick = () => {
      // Save the scrollY in localStorage for the opener page
      if (window.opener) {
        try {
          window.opener.localStorage.setItem('PinItScrollY', pin.y);
          window.opener.location.reload();
        } catch (e) {
          alert('Unable to set scroll position in the pinned page.');
        }
      } else {
        alert('No pinned page found. Open settings from the page you want to scroll.');
      }
    };
    div.appendChild(goBtn);
    // Remove button
    const btn = document.createElement('button');
    btn.className = 'remove-btn';
    btn.textContent = 'Remove';
    btn.onclick = () => removePin(idx);
    div.appendChild(btn);
    pinsDiv.appendChild(div);
  });
}

function removePin(idx) {
  chrome.storage.local.get([domain], (result) => {
    let pins = result[domain] || [];
    pins.splice(idx, 1);
    chrome.storage.local.set({ [domain]: pins }, () => renderPins(pins));
  });
}
