(function () {
  "use strict";

  /**
   * Turns a GitHub repo "owner/name" pair into a zipball URL via the
   * GitHub REST API, then triggers a browser download of it.
   * Falls back to codeload.github.com if the API redirect can't be
   * followed programmatically (CORS), which is the common case for a
   * fully static site — in that case we just navigate the browser to
   * the URL directly, letting the browser handle the redirect + download.
   */
  function buildZipUrl(cfg) {
    if (cfg.repo_zip_api_url) return cfg.repo_zip_api_url;
    if (cfg.repo_owner && cfg.repo_name) {
      var branch = cfg.repo_branch || "main";
      return "https://api.github.com/repos/" + cfg.repo_owner + "/" + cfg.repo_name + "/zipball/" + branch;
    }
    return null;
  }

  function fetchJSON(path) {
    return fetch(path, { cache: "no-store" }).then(function (res) {
      if (!res.ok) throw new Error("Failed to load " + path);
      return res.json();
    });
  }

  function applyUrls(cfg) {
    // Repo links
    var repoLinks = ["repo-link", "footer-repo"];
    repoLinks.forEach(function (id) {
      var el = document.getElementById(id);
      if (el && cfg.repo_url) el.href = cfg.repo_url;
    });

    var licenseEl = document.getElementById("footer-license");
    if (licenseEl && cfg.license_url) licenseEl.href = cfg.license_url;

    var issuesEl = document.getElementById("footer-issues");
    if (issuesEl && cfg.issues_url) issuesEl.href = cfg.issues_url;

    var fallbackEl = document.getElementById("fallback-link");
    if (fallbackEl && cfg.repo_url) fallbackEl.href = cfg.repo_url;

    // Logo
    if (cfg.logo) {
      document.querySelectorAll("img.brand-logo, img.hero-logo").forEach(function (img) {
        img.src = cfg.logo;
      });
      var favicon = document.querySelector("link[rel='icon']");
      if (favicon) favicon.href = cfg.logo;
    }

    // Screenshots
    if (cfg.screenshots) {
      var shots = document.querySelectorAll(".shot-grid img");
      var order = ["home", "playlist"];
      shots.forEach(function (img, i) {
        var key = order[i];
        if (key && cfg.screenshots[key]) img.src = cfg.screenshots[key];
      });
    }

    // Download buttons
    var btn = document.getElementById("download-btn");
    var winbtn = document.getElementById("download-btn-win64");
    var status = document.getElementById("download-status");
    
    var zipUrl = buildZipUrl(cfg);
    var win64Url = cfg.win64url;

    if (btn && zipUrl) {
      btn.addEventListener("click", function () {
        status.textContent = "İndirme başlatılıyor…";
        btn.disabled = true;
        // Static-site friendly: navigate directly to the GitHub zipball
        // endpoint. GitHub serves this with a redirect + Content-Disposition,
        // so the browser downloads a real .zip without any server of our own.
        var a = document.createElement("a");
        a.href = zipUrl;
        a.rel = "noopener";
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(function () {
          status.textContent = "İndirme başladıysa tarayıcınızın indirilenler klasörünü kontrol edin.";
          btn.disabled = false;
        }, 1200);
      });
    } else if (btn) {
      btn.disabled = true;
      status.textContent = "İndirme bağlantısı urls.json içinde bulunamadı.";
    }
  }
    
    // Windows 64-bit download button
    if (winbtn && win64Url) {
      winbtn.addEventListener("click", function () {
        status.textContent = "Windows 64-bit sürümü indiriliyor…";
        winbtn.disabled = true;
    
        var a = document.createElement("a");
        a.href = win64Url;
        a.rel = "noopener";
        a.download = "";
        document.body.appendChild(a);
        a.click();
        a.remove();
    
        setTimeout(function () {
          status.textContent = "İndirme başladıysa tarayıcınızın indirilenler klasörünü kontrol edin.";
          winbtn.disabled = false;
        }, 1200);
      });
    } else if (winbtn) {
      winbtn.disabled = true;
    }

  function renderNotifications(list) {
    var container = document.getElementById("notice-list");
    if (!container) return;

    if (!Array.isArray(list) || list.length === 0) {
      container.innerHTML = '<p class="notice-empty">Şu anda bir duyuru yok.</p>';
      return;
    }

    var sorted = list.slice().sort(function (a, b) {
      return new Date(b.date) - new Date(a.date);
    });

    container.innerHTML = sorted.map(function (n) {
      var date = escapeHtml(n.date || "");
      var title = escapeHtml(n.title || "");
      var desc = escapeHtml(n.description || "");
      return (
        '<div class="notice">' +
          '<div class="notice-date">' + date + '</div>' +
          '<div class="notice-body"><h3>' + title + '</h3><p>' + desc + '</p></div>' +
        '</div>'
      );
    }).join("");
  }

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = String(str);
    return div.innerHTML;
  }

  fetchJSON("urls.json")
    .then(applyUrls)
    .catch(function (err) {
      console.error(err);
      var status = document.getElementById("download-status");
      if (status) status.textContent = "urls.json yüklenemedi.";
    });

  fetchJSON("notifications.json")
    .then(renderNotifications)
    .catch(function () {
      var container = document.getElementById("notice-list");
      if (container) container.innerHTML = '<p class="notice-empty">Duyurular yüklenemedi.</p>';
    });
})();
