/* ====================================================================
   site.js — Richard Jiang's site
   Projects + Art + Diary ("Usual Bullshit") loader
   ==================================================================== */

(function () {
    "use strict";
    const PAGE_NAV_DELAY_MS = 300;
    const MODAL_CLOSE_MS = 220;
    const PAGE_ENTER_KEY = "rj-page-enter";
    const RETURN_SECTION_KEY = "rj-return-section";
    const LANDING_SEEN_KEY = "rj-landing-seen";
    let isNavigating = false;

    /* BFCache restores the previous JS heap; `isNavigating` can stay true and
       block card transitions on subsequent clicks. Reset on every show. */
    window.addEventListener("pageshow", function () {
        isNavigating = false;
        document.body.classList.remove("is-page-leaving");
        document.documentElement.classList.remove("is-page-leaving");
    });

    function prepareBodyForPageLeave() {
        document.body.classList.remove("is-page-entering", "is-page-entered");
        /* Restart opacity transition so leave animation runs after return-from-detail. */
        void document.body.offsetHeight;
    }

    /* ============================================================
       1. CONTENT REGISTRIES
       Edit these lists to add new projects / art pieces.
       ============================================================ */

    const PROJECTS = [
        {
            title: "Musical Bridges (A Retrospective Documentary)",
            date: "2026-04-26",
            summary: "My journey into the making of my first project, bridging music and AI",
            url: "blogs/projects/musical-bridges.html",
            tag: "template"
        }
    ];

    const ART = [
        {
            title: "Lincoln",
            date: "2026-02-01",
            category: "film",
            // summary: "Spielberg, Day-Lewis, and the architecture of moral perseverance — a close reading of the 13th Amendment film.",
            url: "blogs/art/lincoln.html"
        },
        {
            title: "My Favourite Lyrics",
            date: "2026-01-15",
            category: "music",
            // summary: "A running playlist of the lines that have refused to leave my head.",
            url: "blogs/art/playlist.html"
        }
    ];

    /* ============================================================
       2. PROJECTS RENDERER
       ============================================================ */

    function renderProjects() {
        const c = document.getElementById("projects-container");
        if (!c) return;

        if (!PROJECTS.length) {
            c.innerHTML = '<div class="empty">sitting here in silence on my own.</div>';
            return;
        }

        c.innerHTML = PROJECTS.map(function (p) {
            return (
                '<a class="card" href="' + p.url + '">' +
                    '<div class="card-main">' +
                        '<div class="card-kicker">' + (p.tag || "report") + '</div>' +
                        '<div class="card-title">' + p.title + '</div>' +
                        (p.summary ? '<div class="card-excerpt">' + p.summary + '</div>' : '') +
                    '</div>' +
                    '<div class="card-meta">' + formatDate(p.date) + '</div>' +
                '</a>'
            );
        }).join("");
    }

    /* ============================================================
       3. ART RENDERER + TABS
       ============================================================ */

    function renderArt(filter) {
        const c = document.getElementById("art-container");
        if (!c) return;

        const items = (filter && filter !== "all")
            ? ART.filter(function (a) { return a.category === filter; })
            : ART;

        if (!items.length) {
            c.innerHTML = '<div class="empty">nothing here yet in this category.</div>';
            return;
        }

        c.innerHTML = items.map(function (a) {
            return (
                '<a class="card" href="' + a.url + '">' +
                    '<div class="card-main">' +
                        '<div class="card-kicker">' + a.category + '</div>' +
                        '<div class="card-title">' + a.title + '</div>' +
                        (a.summary ? '<div class="card-excerpt">' + a.summary + '</div>' : '') +
                    '</div>' +
                    '<div class="card-meta">' + formatDate(a.date) + '</div>' +
                '</a>'
            );
        }).join("");
    }

    function bindArtTabs() {
        const tabs = document.querySelectorAll(".art-tab");
        tabs.forEach(function (t) {
            t.addEventListener("click", function () {
                tabs.forEach(function (x) { x.classList.remove("is-active"); });
                t.classList.add("is-active");
                renderArt(t.getAttribute("data-tab"));
            });
        });
    }

    /* ============================================================
       4. DIARY ("USUAL BULLSHIT") LOADER
       ============================================================ */

    let DIARY_CACHE = [];

    async function loadDiary() {
        const c = document.getElementById("diary-container");
        if (!c) return;
        try {
            const res = await fetch("diary/index.json", { cache: "no-cache" });
            if (!res.ok) throw new Error("fetch failed: " + res.status);
            const entries = await res.json();
            DIARY_CACHE = entries.slice().sort(function (a, b) {
                return (b.date || "").localeCompare(a.date || "");
            });
            renderDiary();
        } catch (err) {
            console.warn("Diary not available:", err);
            c.innerHTML = '<div class="empty">no entries yet.</div>';
        }
    }

    function renderDiary() {
        const c = document.getElementById("diary-container");
        if (!DIARY_CACHE.length) {
            c.innerHTML = '<div class="empty">no entries yet.</div>';
            return;
        }
        c.innerHTML = DIARY_CACHE.map(function (e, i) {
            return (
                '<div class="diary-entry" data-idx="' + i + '">' +
                    '<div class="diary-date">' + formatDate(e.date) + '</div>' +
                    (e.title ? '<div class="diary-title">' + escapeHtml(e.title) + '</div>' : '') +
                    '<div class="diary-preview">' + escapeHtml(e.preview || (e.content || '').slice(0, 220)) + '</div>' +
                '</div>'
            );
        }).join("");

        c.querySelectorAll(".diary-entry").forEach(function (el) {
            el.addEventListener("click", function () {
                openDiaryEntry(parseInt(el.getAttribute("data-idx"), 10));
            });
        });
    }

    function openDiaryEntry(idx) {
        const entry = DIARY_CACHE[idx];
        if (!entry) return;
        const html = markdownToHtml(entry.content || "");
        const body = document.getElementById("modal-body");
        body.innerHTML =
            '<h2 class="entry-title">' + escapeHtml(entry.title || "Diary Entry") + '</h2>' +
            '<p class="entry-date">' + formatDate(entry.date) + '</p>' +
            '<div class="entry-body">' + html + '</div>';
        const modal = document.getElementById("entry-modal");
        modal.classList.remove("is-closing");
        modal.classList.add("is-open");
        modal.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden";
    }

    window.closeModal = function () {
        const modal = document.getElementById("entry-modal");
        if (!modal || !modal.classList.contains("is-open")) return;
        modal.classList.add("is-closing");
        setTimeout(function () {
            modal.classList.remove("is-open", "is-closing");
            modal.setAttribute("aria-hidden", "true");
            document.body.style.overflow = "";
        }, MODAL_CLOSE_MS);
    };

    function bindCardNavigationTransitions() {
        document.addEventListener("click", function (e) {
            const cardLink = e.target.closest(".card[href]");
            if (!cardLink) return;
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
            if (cardLink.target === "_blank" || cardLink.hasAttribute("download")) return;
            if (isNavigating) return;

            const next = new URL(cardLink.href, window.location.href);
            if (next.origin !== window.location.origin) return;

            e.preventDefault();
            isNavigating = true;
            try {
                window.sessionStorage.setItem(PAGE_ENTER_KEY, "1");
                const section = cardLink.closest(".section");
                if (section && section.id) {
                    window.sessionStorage.setItem(RETURN_SECTION_KEY, "#" + section.id);
                }
            } catch (_) {}
            prepareBodyForPageLeave();
            document.body.classList.add("is-page-leaving");
            setTimeout(function () {
                window.location.href = next.href;
            }, PAGE_NAV_DELAY_MS);
        });
    }

    function triggerPageEnterTransition() {
        try {
            if (window.sessionStorage.getItem(PAGE_ENTER_KEY) !== "1") return;
            window.sessionStorage.removeItem(PAGE_ENTER_KEY);
        } catch (_) {
            return;
        }

        document.body.classList.add("is-page-entering");
        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                document.body.classList.add("is-page-entered");
            });
        });
    }

    function restoreSectionOnReturn() {
        if (window.location.hash) return;
        let targetHash = "";
        try {
            targetHash = window.sessionStorage.getItem(RETURN_SECTION_KEY) || "";
            if (targetHash) window.sessionStorage.removeItem(RETURN_SECTION_KEY);
        } catch (_) {
            return;
        }
        if (!targetHash) return;
        const target = document.querySelector(targetHash);
        if (!target) return;
        requestAnimationFrame(function () {
            target.scrollIntoView({ block: "start", behavior: "auto" });
        });
    }

    function triggerFirstLandingTransition() {
        if (!document.documentElement.classList.contains("is-first-landing")) return;
        try {
            window.sessionStorage.setItem(LANDING_SEEN_KEY, "1");
        } catch (_) {}

        document.body.classList.add("is-first-landing");
        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                document.body.classList.add("is-first-landing-done");
                setTimeout(function () {
                    document.documentElement.classList.remove("is-first-landing");
                    document.body.classList.remove("is-first-landing");
                }, 920);
            });
        });
    }

    /* ============================================================
       5. UTILITIES
       ============================================================ */

    function formatDate(s) {
        if (!s) return "";
        const d = new Date(s);
        if (isNaN(d.getTime())) return s;
        return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
    }

    function escapeHtml(s) {
        return String(s)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function markdownToHtml(md) {
        // Lightweight: paragraphs, headings, emphasis, images. Inputs are trusted (your own diary).
        let html = String(md);
        // protect images first
        html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%; height:auto; margin:1rem 0;">');
        html = html.replace(/^### (.*?)$/gm, "<h3>$1</h3>");
        html = html.replace(/^## (.*?)$/gm, "<h2>$1</h2>");
        html = html.replace(/^# (.*?)$/gm, "<h2>$1</h2>");
        html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
        html = html.replace(/(^|[\s(])\*([^*\n]+)\*/g, "$1<em>$2</em>");
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

        // paragraphs: split on blank lines
        const blocks = html.split(/\n\s*\n/);
        return blocks.map(function (b) {
            const trimmed = b.trim();
            if (!trimmed) return "";
            if (/^<(h\d|img|p|ul|ol|blockquote)/.test(trimmed)) return trimmed;
            return "<p>" + trimmed.replace(/\n/g, "<br>") + "</p>";
        }).join("\n");
    }

    /* ============================================================
       6. INIT
       ============================================================ */

    function init() {
        triggerFirstLandingTransition();
        triggerPageEnterTransition();
        restoreSectionOnReturn();
        renderProjects();
        renderArt("all");
        bindArtTabs();
        loadDiary();
        bindCardNavigationTransitions();

        // close modal on overlay click
        const modal = document.getElementById("entry-modal");
        if (modal) {
            modal.addEventListener("click", function (e) {
                if (e.target === modal) window.closeModal();
            });
        }
        // close on Esc
        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape") window.closeModal();
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
