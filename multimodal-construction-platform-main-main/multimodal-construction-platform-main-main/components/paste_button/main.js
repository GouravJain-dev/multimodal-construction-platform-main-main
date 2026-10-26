function sendValue(value) {
  Streamlit.setComponentValue(value);
}

function processBlob(blob, btn) {
  if (btn) {
    btn.innerText = "⏳ Loading Image from Clipboard...";
    btn.style.borderColor = "#10b981";
  }
  const reader = new FileReader();
  reader.onloadend = function () {
    const base64data = reader.result;
    if (btn) {
      btn.innerText = "✅ Image Loaded from Clipboard!";
      setTimeout(() => {
        btn.innerText = btn.getAttribute("data-original-label") || "📋 Paste Image from Clipboard (Ctrl+V)";
        btn.style.borderColor = "#334155";
      }, 2500);
    }
    sendValue(base64data);
  };
  reader.readAsDataURL(blob);
}

async function parseClipboardData(btn) {
  try {
    if (!navigator.clipboard || !navigator.clipboard.read) {
      alert("Clipboard API is restricted by the browser or iframe permissions. Please use the 'Upload Custom Site Photo' option or press Ctrl+V directly.");
      return;
    }
    const items = await navigator.clipboard.read();
    for (const item of items) {
      // Find any supported image MIME type
      const imgType = item.types.find(t => t.startsWith('image/'));
      if (imgType) {
        const blob = await item.getType(imgType);
        processBlob(blob, btn);
        return;
      }
    }
    alert("No image found in clipboard.\n\nTip: Take a screenshot (Win + Shift + S on Windows, or Cmd + Shift + 4 on Mac), or right-click any image and select 'Copy Image', then click this button again.");
  } catch (error) {
    console.warn("Clipboard read error:", error);
    alert("Clipboard access error: " + (error.message || error) + "\n\nPlease ensure clipboard permissions are allowed, or use the file upload option.");
  }
}

function handlePasteEvent(e) {
  const cd = e.clipboardData || window.clipboardData;
  if (!cd) return;
  const items = cd.items;
  if (!items) return;
  for (let i = 0; i < items.length; i++) {
    if (items[i].type.indexOf("image") !== -1) {
      const blob = items[i].getAsFile();
      const btn = document.getElementById("paste_button");
      processBlob(blob, btn);
      e.preventDefault();
      return;
    }
  }
}

function onRender(event) {
  if (!window.rendered) {
    const btn = document.getElementById("paste_button");
    const args = event.detail.args || {};
    const label = args.label || "📋 Paste Image from Clipboard (Ctrl+V)";
    btn.innerHTML = label;
    btn.setAttribute("data-original-label", label);

    btn.addEventListener("click", () => parseClipboardData(btn));
    window.addEventListener("paste", handlePasteEvent);
    document.addEventListener("paste", handlePasteEvent);

    window.rendered = true;
  }
}

Streamlit.events.addEventListener(Streamlit.RENDER_EVENT, onRender);
Streamlit.setComponentReady();
Streamlit.setFrameHeight(42);
