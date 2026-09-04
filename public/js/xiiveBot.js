// ==========================================
// xiiveBot — guided support prototype
// ==========================================

const XIIVE_BOT_LINKS = Object.freeze({
    review: "https://pebble-salsa-c78.notion.site/3d0ce647c49280a1a735fd4b04b0bb22?pvs=105",
    bug: "https://pebble-salsa-c78.notion.site/3d1ce647c49280e993f9fdd1338d71b0?pvs=105",
    contact: "https://pebble-salsa-c78.notion.site/3d1ce647c49280839344f6cc6b125108?pvs=105",
    play: "https://play.xiivestudio.com",
    github: "https://github.com/austinmhorn"
});

const INSTALL_COMMANDS = Object.freeze({
    macos: "curl -fsSL https://xiivestudio.com/install-basilisk-macos.sh | bash",
    windows: "irm https://xiivestudio.com/install-basilisk-windows.ps1 | iex"
});

const BOT_STYLESHEET_ID = "xiive-bot-stylesheet";
const BOT_ROOT_ID = "xiive-bot-root";

const createAction = (label, action, options = {}) => ({
    label,
    action,
    tone: options.tone ?? "default"
});

const FLOW = Object.freeze({
    home: {
        eyebrow: "BASILISK / GUIDED SUPPORT",
        message: "You’re in the Basilisk support path. What can I help with?",
        actions: [
            createAction("Report a bug", "bug", { tone: "accent" }),
            createAction("Leave a review", "review"),
            createAction("Basilisk help", "help"),
            createAction("Contact xiive", "contact")
        ]
    },
    help: {
        eyebrow: "BASILISK / HELP",
        message: "Pick a topic and I’ll point you in the right direction.",
        actions: [
            createAction("Installing Basilisk", "install"),
            createAction("Play in browser", "browser"),
            createAction("Multiplayer", "multiplayer"),
            createAction("Gameplay / rules", "gameplay"),
            createAction("Back", "home", { tone: "quiet" })
        ]
    },
    install: {
        eyebrow: "BASILISK / INSTALL",
        message: "Which platform are you installing on?",
        actions: [
            createAction("macOS", "macos"),
            createAction("Windows", "windows"),
            createAction("Browser instead", "browser"),
            createAction("Back", "help", { tone: "quiet" })
        ]
    },
    macos: {
        eyebrow: "INSTALL / macOS",
        message: "Use the recommended installer below in Terminal. The current native build targets macOS 14+ and is pre-alpha / unsigned.",
        command: INSTALL_COMMANDS.macos,
        commandLabel: "Terminal",
        actions: [
            createAction("Copy command", "copy-macos", { tone: "accent" }),
            createAction("Something went wrong", "bug"),
            createAction("Back", "install", { tone: "quiet" })
        ]
    },
    windows: {
        eyebrow: "INSTALL / WINDOWS",
        message: "Use the recommended installer below in PowerShell. It installs for your user and does not require administrator access.",
        command: INSTALL_COMMANDS.windows,
        commandLabel: "PowerShell",
        actions: [
            createAction("Copy command", "copy-windows", { tone: "accent" }),
            createAction("Something went wrong", "bug"),
            createAction("Back", "install", { tone: "quiet" })
        ]
    },
    browser: {
        eyebrow: "BASILISK / BROWSER",
        message: "The current browser build is available now. It’s the fastest way to jump into Basilisk without installing anything.",
        actions: [
            createAction("Open browser build", "open-play", { tone: "accent" }),
            createAction("Report a browser bug", "bug"),
            createAction("Back", "help", { tone: "quiet" })
        ]
    },
    multiplayer: {
        eyebrow: "BASILISK / MULTIPLAYER",
        message: "Multiplayer support is still evolving with the current pre-alpha build. If you hit a connection, lobby, or match issue, send it through the bug form so it lands in the right place.",
        actions: [
            createAction("Report multiplayer bug", "bug", { tone: "accent" }),
            createAction("Play current build", "open-play"),
            createAction("Back", "help", { tone: "quiet" })
        ]
    },
    gameplay: {
        eyebrow: "BASILISK / GAMEPLAY",
        message: "Basilisk is a competitive cave hunt built around exploration, searching, hazards, incomplete information, and a rival hunter working the same cavern network. Deeper guided rules are coming to this bot next.",
        actions: [
            createAction("Play current build", "open-play", { tone: "accent" }),
            createAction("Leave gameplay feedback", "review"),
            createAction("Back", "help", { tone: "quiet" })
        ]
    }
});

const openExternal = (url) => {
    window.open(url, "_blank", "noopener,noreferrer");
};

const copyText = async (text) => {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
            return true;
        }
    } catch {
        // Fall back to the legacy copy path below.
    }

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();

    let copied = false;

    try {
        copied = document.execCommand("copy");
    } catch {
        copied = false;
    }

    textarea.remove();
    return copied;
};

const ensureStylesheet = () => {
    if (document.getElementById(BOT_STYLESHEET_ID)) {
        return;
    }

    const stylesheet = document.createElement("link");
    stylesheet.id = BOT_STYLESHEET_ID;
    stylesheet.rel = "stylesheet";
    stylesheet.href = "/css/xiiveBot.css";
    document.head.appendChild(stylesheet);
};

const mountFooterFeedbackLinks = () => {
    const footerLinks = document.querySelector(".basilisk-footer-links");

    if (!footerLinks || footerLinks.querySelector("[data-xiive-feedback-link]")) {
        return;
    }

    const bugLink = document.createElement("a");
    bugLink.href = XIIVE_BOT_LINKS.bug;
    bugLink.target = "_blank";
    bugLink.rel = "noopener";
    bugLink.dataset.xiiveFeedbackLink = "bug";
    bugLink.textContent = "Report a Bug";

    const reviewLink = document.createElement("a");
    reviewLink.href = XIIVE_BOT_LINKS.review;
    reviewLink.target = "_blank";
    reviewLink.rel = "noopener";
    reviewLink.dataset.xiiveFeedbackLink = "review";
    reviewLink.textContent = "Leave a Review";

    footerLinks.prepend(reviewLink);
    footerLinks.prepend(bugLink);
};

const getMarkup = () => `
    <aside class="xiive-bot" data-xiive-bot data-open="false" aria-label="xiive guided support">
        <section class="xiive-bot-panel" data-xiive-bot-panel aria-hidden="true">
            <header class="xiive-bot-header">
                <div class="xiive-bot-identity">
                    <span class="xiive-bot-avatar" aria-hidden="true">
                        <img src="/assets/branding/xiive-icon.svg" alt="">
                    </span>
                    <span class="xiive-bot-brand">
                        <strong>xiive</strong>
                        <span>guided assistant</span>
                    </span>
                </div>

                <div class="xiive-bot-header-actions">
                    <span class="xiive-bot-mode"><i></i> guided</span>
                    <button class="xiive-bot-icon-button" type="button" data-xiive-bot-close aria-label="Close xiive assistant">
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M6 6l12 12M18 6 6 18"></path>
                        </svg>
                    </button>
                </div>
            </header>

            <div class="xiive-bot-body" data-xiive-bot-body>
                <div class="xiive-bot-message-row">
                    <span class="xiive-bot-message-mark" aria-hidden="true">x</span>
                    <div class="xiive-bot-message" data-xiive-bot-message></div>
                </div>

                <div class="xiive-bot-command" data-xiive-bot-command hidden>
                    <div class="xiive-bot-command-topline">
                        <span data-xiive-bot-command-label>Command</span>
                        <span>recommended</span>
                    </div>
                    <code data-xiive-bot-command-code></code>
                </div>

                <div class="xiive-bot-actions" data-xiive-bot-actions></div>
                <p class="xiive-bot-status" data-xiive-bot-status aria-live="polite"></p>
            </div>
        </section>

        <button class="xiive-bot-launcher" type="button" data-xiive-bot-launcher aria-label="Open xiive assistant" aria-expanded="false">
            <span class="xiive-bot-launcher-icon" aria-hidden="true">
                <img src="/assets/branding/xiive-icon.svg" alt="">
            </span>
            <span class="xiive-bot-launcher-copy">
                <strong>xiive</strong>
                <span>need help?</span>
            </span>
            <span class="xiive-bot-launcher-pulse" aria-hidden="true"></span>
        </button>
    </aside>
`;

const createButton = (action) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `xiive-bot-action xiive-bot-action--${action.tone}`;
    button.dataset.xiiveBotAction = action.action;
    button.innerHTML = `<span>${action.label}</span><span aria-hidden="true">→</span>`;
    return button;
};

export const mountXiiveBot = ({ context = "basilisk" } = {}) => {
    if (document.getElementById(BOT_ROOT_ID)) {
        return;
    }

    ensureStylesheet();
    mountFooterFeedbackLinks();

    const root = document.createElement("div");
    root.id = BOT_ROOT_ID;
    root.dataset.context = context;
    root.innerHTML = getMarkup();
    document.body.appendChild(root);

    const bot = root.querySelector("[data-xiive-bot]");
    const panel = root.querySelector("[data-xiive-bot-panel]");
    const launcher = root.querySelector("[data-xiive-bot-launcher]");
    const closeButton = root.querySelector("[data-xiive-bot-close]");
    const message = root.querySelector("[data-xiive-bot-message]");
    const actions = root.querySelector("[data-xiive-bot-actions]");
    const status = root.querySelector("[data-xiive-bot-status]");
    const command = root.querySelector("[data-xiive-bot-command]");
    const commandLabel = root.querySelector("[data-xiive-bot-command-label]");
    const commandCode = root.querySelector("[data-xiive-bot-command-code]");

    let currentNode = "home";
    let statusTimer = null;

    const setStatus = (text, tone = "default") => {
        window.clearTimeout(statusTimer);
        status.textContent = text;
        status.dataset.tone = tone;

        if (!text) {
            return;
        }

        statusTimer = window.setTimeout(() => {
            status.textContent = "";
            status.dataset.tone = "default";
        }, 2600);
    };

    const renderNode = (nodeName) => {
        const node = FLOW[nodeName] ?? FLOW.home;
        currentNode = nodeName in FLOW ? nodeName : "home";

        message.textContent = node.message;
        actions.replaceChildren(...node.actions.map(createButton));
        setStatus("");

        if (node.command) {
            command.hidden = false;
            commandLabel.textContent = node.commandLabel ?? "Command";
            commandCode.textContent = node.command;
        } else {
            command.hidden = true;
            commandCode.textContent = "";
        }

        const body = root.querySelector("[data-xiive-bot-body]");
        body.scrollTop = 0;
    };

    const setOpen = (isOpen) => {
        bot.dataset.open = String(isOpen);
        panel.setAttribute("aria-hidden", String(!isOpen));
        launcher.setAttribute("aria-expanded", String(isOpen));
        launcher.setAttribute("aria-label", isOpen ? "Close xiive assistant" : "Open xiive assistant");

        if (isOpen) {
            window.setTimeout(() => closeButton.focus({ preventScroll: true }), 120);
        } else {
            launcher.focus({ preventScroll: true });
        }
    };

    const handleAction = async (actionName) => {
        switch (actionName) {
            case "bug":
                openExternal(XIIVE_BOT_LINKS.bug);
                setStatus("Bug form opened in a new tab.", "success");
                return;
            case "review":
                openExternal(XIIVE_BOT_LINKS.review);
                setStatus("Review form opened in a new tab.", "success");
                return;
            case "contact":
                openExternal(XIIVE_BOT_LINKS.contact);
                setStatus("Contact form opened in a new tab.", "success");
                return;
            case "open-play":
                openExternal(XIIVE_BOT_LINKS.play);
                setStatus("Opening the current Basilisk build…", "success");
                return;
            case "open-github":
                openExternal(XIIVE_BOT_LINKS.github);
                setStatus("Opening GitHub…", "success");
                return;
            case "copy-macos": {
                const copied = await copyText(INSTALL_COMMANDS.macos);
                setStatus(copied ? "macOS install command copied." : "Copy failed — select the command manually.", copied ? "success" : "error");
                return;
            }
            case "copy-windows": {
                const copied = await copyText(INSTALL_COMMANDS.windows);
                setStatus(copied ? "Windows install command copied." : "Copy failed — select the command manually.", copied ? "success" : "error");
                return;
            }
            default:
                if (FLOW[actionName]) {
                    renderNode(actionName);
                }
        }
    };

    launcher.addEventListener("click", () => {
        setOpen(bot.dataset.open !== "true");
    });

    closeButton.addEventListener("click", () => setOpen(false));

    actions.addEventListener("click", (event) => {
        const button = event.target.closest("[data-xiive-bot-action]");

        if (!button) {
            return;
        }

        void handleAction(button.dataset.xiiveBotAction);
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && bot.dataset.open === "true") {
            setOpen(false);
        }
    });

    renderNode(currentNode);
};
