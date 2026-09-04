// ==========================================
// Basilisk page interactions
// ==========================================

const yearElement = document.getElementById("year");

if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
}


// ------------------------------------------
// Header state
// ------------------------------------------

const gameHeader = document.querySelector(".game-header");

const updateHeaderState = () => {
    if (!gameHeader) {
        return;
    }

    gameHeader.classList.toggle("scrolled", window.scrollY > 32);
};

updateHeaderState();
window.addEventListener("scroll", updateHeaderState, { passive: true });


// ------------------------------------------
// Reveal on scroll
// ------------------------------------------

const revealElements = document.querySelectorAll(".game-reveal");

if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    revealElements.forEach((element) => {
        element.classList.add("visible");
    });
} else {
    const revealObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) {
                    return;
                }

                entry.target.classList.add("visible");
                revealObserver.unobserve(entry.target);
            });
        },
        {
            threshold: 0.12,
            rootMargin: "0px 0px -6% 0px"
        }
    );

    revealElements.forEach((element) => {
        revealObserver.observe(element);
    });
}


// ------------------------------------------
// Video readiness + viewport playback
// ------------------------------------------

const basiliskVideos = document.querySelectorAll("[data-basilisk-video]");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const markVideoReady = (video) => {
    const stage = video.closest(".basilisk-hero, .cosmetics-stage");

    if (stage) {
        stage.classList.add("video-ready");
    }
};

basiliskVideos.forEach((video) => {
    video.addEventListener("canplay", () => markVideoReady(video), { once: true });
    video.addEventListener("playing", () => markVideoReady(video), { once: true });

    if (video.readyState >= 3) {
        markVideoReady(video);
    }

    if (reduceMotion) {
        video.pause();
    }
});

if (!reduceMotion && basiliskVideos.length) {
    const videoObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                const video = entry.target;

                if (entry.isIntersecting) {
                    const playPromise = video.play();

                    if (playPromise && typeof playPromise.catch === "function") {
                        playPromise.catch(() => {
                            // Poster / fallback remains visible if autoplay fails.
                        });
                    }
                } else {
                    video.pause();
                }
            });
        },
        {
            threshold: 0.18
        }
    );

    basiliskVideos.forEach((video) => {
        videoObserver.observe(video);
    });
}


// ------------------------------------------
// Installer command copy
// ------------------------------------------

const copyButtons = document.querySelectorAll("[data-copy-command]");
const copyStatus = document.querySelector("[data-copy-status]");

const fallbackCopyText = (text) => {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    textarea.remove();
    return copied;
};

const copyInstallCommand = async (button) => {
    const command = button.dataset.copyCommand;

    if (!command) {
        return;
    }

    let copied = false;

    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(command);
            copied = true;
        } else {
            copied = fallbackCopyText(command);
        }
    } catch {
        copied = fallbackCopyText(command);
    }

    if (!copied) {
        if (copyStatus) {
            copyStatus.textContent = "Copy failed. Select the command and copy it manually.";
        }
        return;
    }

    const label = button.querySelector("span");
    const originalLabel = label?.textContent ?? "Copy";

    if (label) {
        label.textContent = "Copied";
    }

    button.classList.add("copied");

    if (copyStatus) {
        copyStatus.textContent = "Install command copied to clipboard.";
    }

    window.setTimeout(() => {
        if (label) {
            label.textContent = originalLabel;
        }

        button.classList.remove("copied");

        if (copyStatus) {
            copyStatus.textContent = "";
        }
    }, 1800);
};

copyButtons.forEach((button) => {
    button.addEventListener("click", () => {
        void copyInstallCommand(button);
    });
});


// ------------------------------------------
// Subtle hero drift
// ------------------------------------------

const hero = document.querySelector(".basilisk-hero");
const heroContent = document.querySelector(".basilisk-hero-content");
const heroGrid = document.querySelector(".basilisk-hero-grid");

if (hero && heroContent && heroGrid && !reduceMotion) {
    let heroDriftFrameRequested = false;

    const updateHeroDrift = () => {
        heroDriftFrameRequested = false;

        const scrollY = window.scrollY;
        const heroHeight = hero.offsetHeight;

        if (scrollY > heroHeight) {
            return;
        }

        heroContent.style.transform = `translateY(${scrollY * 0.055}px)`;
        heroGrid.style.transform = `translateY(${scrollY * 0.025}px)`;
    };

    window.addEventListener(
        "scroll",
        () => {
            if (heroDriftFrameRequested) {
                return;
            }

            heroDriftFrameRequested = true;
            window.requestAnimationFrame(updateHeroDrift);
        },
        { passive: true }
    );
}


// ------------------------------------------
// xiive guided assistant prototype
// ------------------------------------------

import("/js/xiiveBot.js")
    .then(({ mountXiiveBot }) => {
        mountXiiveBot({ context: "basilisk" });
    })
    .catch((error) => {
        console.error("Unable to mount xiiveBot.", error);
    });
