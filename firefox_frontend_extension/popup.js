const fetchDataButton = document.getElementById("fetchDataButton");
const dropdown = document.getElementById("userDropdown");
const submitButton = document.getElementById("submitButton");
const message = document.getElementById("message");
const message2 = document.getElementById("message2");
const setProxyButton = document.getElementById("setProxyButton");
const apiInput = document.getElementById("endpointhostname");
const hostnameInput = document.getElementById("hostname");
const portInput = document.getElementById("port");
const apiusername = document.getElementById("username");
const apipassword = document.getElementById("password");

fetchDataButton.addEventListener("click", () => {
  const endpoint = apiInput.value;
  fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      username: apiusername.value,
      password: apipassword.value
    })
  })
    .then(response => {
      if (!response.ok) throw new Error("Failed to fetch data");
      return response.json();
    })
    .then(data => {
      populateDropdown(data.cookies);
    })
    .catch(error => {
      console.error("Error:", error);
      setMessage2("Failed to fetch data. Check console for details.");
    });
});

function populateDropdown(cookiesData) {
  dropdown.innerHTML = '<option value="" disabled selected>Select a user</option>';
  
  cookiesData.forEach((entry, index) => {
    const userKey = Object.keys(entry)[0];
    const option = document.createElement("option");
    option.value = index; 
    dropdown.appendChild(option);
  });

  submitButton.disabled = false;
  setMessage2("Data fetched and dropdown populated.");
}


submitButton.addEventListener("click", () => {
  const selectedIndex = dropdown.value;

  if (selectedIndex === "") {
    setMessage2("Please select a user first.");
    return;
  }
  const endpoint = apiInput.value;
  fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      username: apiusername.value,
      password: apipassword.value
    })
  })
    .then(response => response.json())
    .then(data => {
      const selectedUser = data.cookies[selectedIndex];
      const userKey = Object.keys(selectedUser)[0]; 
      const cookies = selectedUser[userKey];

      setCookies(cookies);
    })
    .catch(error => {
      console.error("Error setting cookies:", error);
      setMessage2("Failed to set cookies. Check console for details.");
    });
});

async function setCookies(cookies) {
  try {
    const results = await Promise.all(cookies.map(setBrowserCookie));

    const successCount = results.filter(result => result.success).length;
    const failureCount = results.length - successCount;

    setMessage2(`${successCount} cookie(s) set successfully. ${failureCount} failure(s).`);
  } catch (error) {
    console.error("Error in setting cookies:", error);
    setMessage2("Failed to set cookies. Check console for details.");
  }
}

async function setBrowserCookie(cookie) {
  try {
    const cookieDetails = {
      url: cookie.secure ? `https://${cookie.domain}` : `http://${cookie.domain}`,
      name: cookie.name,
      value: cookie.value,
      domain: cookie.domain,
      path: cookie.path,
      secure: cookie.secure,
      httpOnly: cookie.httpOnly,
      expirationDate: cookie.session ? undefined : cookie.expirationDate
    };

    await browser.cookies.set(cookieDetails); 
    return { success: true };
  } catch (error) {
    console.error(`Failed to set cookie: ${cookie.name}`, error);
    return { success: false, error };
  }
}

function setMessage(str) {
  message.textContent = str;
  message.hidden = false;
}

function clearMessage() {
  message.hidden = true;
  message.textContent = '';
}

function setMessage2(str) {
  message2.textContent = str;
  message2.hidden = false;
}

function clearMessage2() {
  message2.hidden = true;
  message2.textContent = '';
}

setProxyButton.addEventListener("click", () => {
  const hostname = hostnameInput.value;
  const port = parseInt(portInput.value);

  if (!hostname || isNaN(port)) {
    setMessage("Please enter a valid hostname and port.");
    return;
  }

  const proxyConfig = {
    mode: "fixed_servers", 
    rules: {
      singleProxy: {
        scheme: "socks5", 
        host: hostname,
        port: port
      },
      bypassList: ["*.google.com", "*.youtube.com"] 
    }
  };

  browser.proxy.settings.set({ value: proxyConfig, scope: "regular" })
    .then(() => {
      setMessage(`SOCKS5 Proxy set to ${hostname}:${port}`);
    })
    .catch(error => {
      console.error("Error setting proxy:", error);
      setMessage("Failed to set SOCKS5 proxy. Check the console for more details." + error);
    });
});

