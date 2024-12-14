async function isPrivateBrowsingMode() {
    try {
      const privateBrowsingEnabled = await browser.privateBrowsing.isEnabled();
      return privateBrowsingEnabled;
    } catch (error) {
      console.error("Error checking private browsing mode:", error);
      return false;
    }
  }
  
  async function setSOCKS5Proxy(hostname, port) {
    if (await isPrivateBrowsingMode()) {
      alert("Proxy settings cannot be changed in Private Browsing mode.");
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
        bypassList: [] 
      }
    };
  
    try {
      await browser.proxy.settings.set({ value: proxyConfig, scope: "regular" });
      console.log(`SOCKS5 Proxy set to ${hostname}:${port}`);
      alert(`SOCKS5 Proxy set to ${hostname}:${port}`);
    } catch (error) {
      console.error("Failed to set SOCKS5 proxy:", error);
      alert("Failed to set SOCKS5 proxy.");
    }
  }
  
  
  document.getElementById("setProxyButton").addEventListener("click", async () => {
    const hostname = document.getElementById("hostnameInput").value;
    const port = parseInt(document.getElementById("portInput").value);
  
    if (!hostname || isNaN(port)) {
      alert("Please enter a valid hostname and port.");
      return;
    }
  
    await setSOCKS5Proxy(hostname, port);
  });
  