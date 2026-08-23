// ==========================================
// xiive studio
// ==========================================


// ------------------------------------------
// Current year
// ------------------------------------------

const yearElement = document.getElementById("year");

if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
}


// ------------------------------------------
// Scroll reveal
// ------------------------------------------

const revealElements = document.querySelectorAll(".reveal");

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
        threshold: 0.12
    }
);

revealElements.forEach((element) => {
    revealObserver.observe(element);
});


// ------------------------------------------
// Very subtle hero parallax
// ------------------------------------------

const hero = document.querySelector(".hero");
const heroContent = document.querySelector(".hero-content");
const heroGrid = document.querySelector(".hero-grid");

window.addEventListener("scroll", () => {
    if (!hero || !heroContent || !heroGrid) {
        return;
    }

    const scrollY = window.scrollY;
    const heroHeight = hero.offsetHeight;

    if (scrollY > heroHeight) {
        return;
    }

    heroContent.style.transform =
        `translateY(${scrollY * 0.08}px)`;

    heroGrid.style.transform =
        `translateY(${scrollY * 0.03}px)`;
});


// ------------------------------------------
// Mouse atmosphere
// ------------------------------------------

const orb = document.querySelector(".hero-orb-one");

if (orb && window.matchMedia("(pointer: fine)").matches) {
    window.addEventListener("mousemove", (event) => {
        const x =
            (event.clientX / window.innerWidth - 0.5) * 20;

        const y =
            (event.clientY / window.innerHeight - 0.5) * 20;

        orb.style.transform =
            `translate(calc(-50% + ${x}px), ${y}px)`;
    });
}


// ------------------------------------------
// Gameplay video
// ------------------------------------------

const gameVideos = document.querySelectorAll("[data-game-video]");
const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
).matches;

gameVideos.forEach((video) => {
    const visual = video.closest(".game-visual");

    const markVideoReady = () => {
        visual?.classList.add("video-ready");
    };

    video.addEventListener("canplay", markVideoReady, { once: true });

    if (video.readyState >= 3) {
        markVideoReady();
    }

    if (prefersReducedMotion) {
        video.pause();
        return;
    }

    const videoObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting && entry.intersectionRatio >= 0.35) {
                    video.play().catch(() => {
                        // Poster image remains visible if autoplay is unavailable.
                    });
                } else {
                    video.pause();
                }
            });
        },
        {
            threshold: [0, 0.35, 1]
        }
    );

    videoObserver.observe(video);
});