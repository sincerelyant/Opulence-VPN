// Model
const connectionExec = document.getElementById("connect-btn");
const postServers = document.getElementById("server-list");
const connectionStatus = document.getElementById("status");
const serverAlias = document.getElementById("serverNames");
const serverFlag = document.getElementById("server-flag");

let connectedOnce = false;
let serverTabs = [];
let serverList = [];
let selectedServer = null;
let timeout = 1500;

// Controller
connectionExec.onclick = () => {
  if (selectedServer == null) {
    alert("Please select a server.");
    return;
  }

  if (connectionStatus.innerText == "Connected") {
    connectionStatus.innerText = "Disconnecting";
    connectionExec.style.background = "#ffb142";
    window.api.disconnect();
    setTimeout(function () {
      onDisconnectedCallback();
    }, timeout);
    return;
  }

  if (connectionStatus.innerText == "Connecting") {
    connectionStatus.innerText = "Disconnecting";
    connectionExec.style.background = "#ffb142";
    window.api.disconnect();
    setTimeout(function () {
      onDisconnectedCallback();
    }, timeout);
    return;
  }

  connectionStatus.innerText = "Connecting";

  if (connectionStatus.innerText == "Connecting") {
    connectionExec.style.background = "#ffb142";
    window.api.connect(selectedServer.parentElement.getAttribute("ovpn"));
    connectionExec.disabled = true;
    setTimeout(function () {
      onConnectedCallback();
    }, timeout);
  }
};

function serverListClear() {
  while (postServers.firstChild) {
    postServers.removeChild(postServers.firstChild);
  }
}

function clientServerSelect(e) {
  let wasReselected = false;
  const stArr = serverTabs.length;
  if (connectionStatus.innerText == "Connecting") {
    e.preventDefault();
    return;
  }
  selectedServer = this.tagName.toLowerCase() == "a" ? this : this.getElementsByTagName("a")[0];
  for (let i = 0; i < stArr; ++i) {
    let a = serverTabs[i].getElementsByTagName("a")[0];
    if (a.parentElement.getAttribute("ovpn")) {
      selectedServer = a;
      wasReselected = true;
      break;
    }
  }
}

// View
function onDisconnectedCallback() {
  if (connectionStatus.innerText == "Disconnecting") {
    connectionExec.style.background = "#eb4d4b";
    connectionStatus.innerText = "Disconnected";
  } else if (connectionStatus.innerText == "Reconnecting") {
    window.api.connect();
  }
}

function onConnectedCallback() {
  connectionStatus.innerText = "Connected";
  connectionExec.style.background = "#2ecc71";
  connectionExec.disabled = false;
  if (connectedOnce == false) {
    connectedOnce = true;
    timeout = 2000;
  }
}

let superString;
const files = window.api.read();
const fnArr = files.length;
serverListClear();

for (let k = 0; k < fnArr; ++k) {
  let file = files[k];
  if (file.includes(".ovpn")) {
    const status = document.createElement("serverStatus");
    const a = document.createElement("a");
    const serverTab = document.createElement("li");
    serverTab.appendChild(status);
    serverTab.appendChild(a);
    serverTab.setAttribute("ovpn", file);
    serverTab.addEventListener("click", clientServerSelect);
    serverList.push(serverTab);
    postServers.appendChild(serverTab);
    status.setAttribute("class", "fa-solid fa-circle fa-sm");
    superString = serverTab.getAttribute("ovpn").replace(".ovpn", "");
    a.innerText = superString;
  }
}

$(".dropdown").on("click", function () {
  $(this).attr("tabindex", 1).trigger("focus");
  $(this).toggleClass("active");
  $(this).find(".dropdown-menu").slideToggle(200);
});

$(".dropdown").on("focusout", function () {
  $(this).removeClass("active");
  $(this).find(".dropdown-menu").slideUp(200);
});

$(".dropdown .dropdown-menu li").on("click", function () {
  $(this).parents(".dropdown").find("txt").text($(this).text());
  $(this).parents(".dropdown").find("img").removeAttr("style");

  switch (true) {
    case $(this).text().startsWith("IS"):
      $(this).parents(".dropdown").find("img").attr("src", `${window.api.icons()}IS.png`);
      break;
    case $(this).text().startsWith("US"):
      $(this).parents(".dropdown").find("img").attr("src", `${window.api.icons()}US.png`);
      break;
    case $(this).text().startsWith("DE"):
      $(this).parents(".dropdown").find("img").attr("src", `${window.api.icons()}DE.png`);
      break;
    case $(this).text().startsWith("UK"):
      $(this).parents(".dropdown").find("img").attr("src", `${window.api.icons()}UK.png`);
      break;
    case $(this).text().startsWith("CH"):
      $(this).parents(".dropdown").find("img").attr("src", `${window.api.icons()}CH.png`);
      break;
    case $(this).text().startsWith("FR"):
      $(this).parents(".dropdown").find("img").attr("src", `${window.api.icons()}FR.png`);
      break;
  }
});
