let pinButtons = [];

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "pin") {
    const y = window.scrollY;
    chrome.runtime.sendMessage({
      action: "saveScrollPosition",
      domain: window.location.hostname,
      scrollY: y
    });
    showPinningAnimation();
    injectPinButtons();
  }
});

function showPinningAnimation() {
  const pin = document.createElement("div");
  pin.innerText = "📌";
  pin.style.position = "fixed";
  pin.style.top = "50%";
  pin.style.left = "50%";
  pin.style.transform = "translate(-50%, -50%)";
  pin.style.fontSize = "3rem";
  pin.style.zIndex = "9999";
  pin.style.animation = "pop 1s ease-out";
  document.body.appendChild(pin);
  setTimeout(() => pin.remove(), 1000);
}

function injectPinButtons() {
  // Remove old pin buttons
  pinButtons.forEach(btn => btn.remove());
  pinButtons = [];
  chrome.runtime.sendMessage({
    action: "getScrollPositions",
    domain: window.location.hostname
  }, (response) => {
    if (!response || !Array.isArray(response.pins)) return;
    response.pins.forEach((pin, idx) => {
      chrome.runtime.sendMessage({
        action: "getPinColor",
        domain: window.location.hostname
      }, (colorResp) => {
        const btn = document.createElement("div");
        btn.innerText = "📍";
        btn.title = `Go to pin #${idx + 1} (ScrollY: ${pin.y})`;
        btn.style.position = "fixed";
        btn.style.bottom = `${20 + idx * 60}px`;
        btn.style.right = "20px";
        btn.style.background = colorResp && colorResp.color ? colorResp.color : "#f1c40f";
        btn.style.color = "black";
        btn.style.padding = "10px";
        btn.style.borderRadius = "50%";
        btn.style.cursor = "pointer";
        btn.style.boxShadow = "0 0 10px rgba(0,0,0,0.3)";
        btn.style.zIndex = "9999";
        btn.style.display = "flex";
        btn.style.alignItems = "center";
        btn.style.justifyContent = "center";
        btn.style.fontSize = "1.5rem";
        // Remove button
        const removeBtn = document.createElement("span");
        removeBtn.innerText = "✖";
        removeBtn.title = "Remove this pin";
        removeBtn.style.marginLeft = "8px";
        removeBtn.style.fontSize = "1rem";
        removeBtn.style.cursor = "pointer";
        removeBtn.style.color = "#e74c3c";
        removeBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          chrome.runtime.sendMessage({
            action: "removePin",
            domain: window.location.hostname,
            index: idx
          }, () => {
            injectPinButtons();
          });
        });
        btn.appendChild(removeBtn);
        btn.addEventListener("click", (e) => {
          if (e.target === removeBtn) return;
          // Use setTimeout to ensure scroll works even if event bubbling interferes
          setTimeout(() => {
            window.scrollTo({ top: Number(pin.y), behavior: "smooth" });
          }, 10);
        });
        document.body.appendChild(btn);
        pinButtons.push(btn);
      });
    });
  });
}

// On page load, inject pin buttons if pins exist
window.addEventListener('DOMContentLoaded', () => {
  // If a scrollY is set in localStorage (from settings), scroll to it and remove it
  const scrollY = localStorage.getItem('PinItScrollY');
  if (scrollY !== null) {
    window.scrollTo({ top: parseInt(scrollY, 10), behavior: 'smooth' });
    localStorage.removeItem('PinItScrollY');
  }
  injectPinButtons();
});
// Also on focus, so if pins are added/removed from settings page
window.addEventListener('focus', injectPinButtons);