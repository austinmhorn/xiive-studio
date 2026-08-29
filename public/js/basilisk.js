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
