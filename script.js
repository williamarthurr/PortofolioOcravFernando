jkjkjk

const bootSkeleton = document.getElementById("skeleton-boot");

const bootReady = (() => {
  if (!bootSkeleton) return Promise.resolve();

  const dismissBootSkeleton = () => {
    bootSkeleton.classList.add("is-done");
    window.setTimeout(() => bootSkeleton.remove(), 260);
  };

  const fontsReady =
    document.fonts && document.fonts.ready
      ? Promise.race([
          document.fonts.ready,
          new Promise((resolve) => window.setTimeout(resolve, 600)),
        ])
      : Promise.resolve();

  return fontsReady.then(dismissBootSkeleton);
})();

const introScreen = document.querySelector(".intro-screen");
const introOpen = document.querySelector(".intro-open");
const introGauge = document.querySelector(".intro-gauge");

if (
  introScreen &&
  introOpen &&
  introGauge &&
  !document.documentElement.classList.contains("intro-skipped")
) {
  const introAnime = window.anime;
  const introReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canAnimateIntro =
    !introReducedMotion &&
    introAnime &&
    typeof introAnime.animate === "function";
  let introClosing = false;

  document.documentElement.style.overflow = "hidden";
  introOpen.focus({ preventScroll: true });

  if (canAnimateIntro) {
    const playIntroEntrance = () => {
      if (introClosing) return;

      introAnime.animate(introGauge, {
        opacity: [0, 1],
        scale: [0.72, 1],
        rotate: [-26, 0],
        duration: 1100,
        ease: "out(4)",
      });
      introAnime.animate(".intro-ring-colors", {
        opacity: [0, 1],
        scale: [0.82, 1],
        duration: 1100,
        delay: 100,
        ease: "out(3)",
      });
      introAnime.animate(".intro-ring-ticks", {
        opacity: [0, 1],
        scale: [0.82, 1],
        duration: 1100,
        delay: 180,
        ease: "out(3)",
      });
      introAnime.animate(".intro-ring-lines", {
        opacity: [0, 1],
        duration: 1200,
        delay: 260,
        ease: "out(2)",
      });
      introAnime.animate(".intro-core", {
        opacity: [0, 1],
        scale: [0.7, 1],
        duration: 1100,
        delay: 220,
        ease: "out(4)",
      });
      introAnime.animate(".intro-open", {
        opacity: [0, 1],
        duration: 800,
        delay: 650,
        ease: "out(3)",
      });

      introAnime.animate(".intro-ring-colors", {
        rotate: 360,
        duration: 24000,
        ease: "linear",
        loop: true,
      });
      introAnime.animate(".intro-ring-ticks", {
        rotate: -360,
        duration: 36000,
        ease: "linear",
        loop: true,
      });
      introAnime.animate(".intro-sweep", {
        rotate: 360,
        duration: 4500,
        ease: "linear",
        loop: true,
      });
      introAnime.animate(".intro-radar", {
        opacity: 0.9,
        scale: 1.06,
        duration: 1300,
        ease: "inOut(2)",
        loop: true,
        alternate: true,
      });
    };

    bootReady.then(() => {
      if (bootSkeleton) {
        window.setTimeout(playIntroEntrance, 240);
      } else {
        playIntroEntrance();
      }
    });
  }

  const closeIntro = () => {
    if (introClosing) return;
    introClosing = true;

    try {
      sessionStorage.setItem("intro-seen", "true");
    } catch (error) {}

    let introFinished = false;
    const finishIntro = () => {
      if (introFinished) return;
      introFinished = true;
      introScreen.classList.add("is-closing");
      document.documentElement.classList.add("intro-skipped");
      document.documentElement.style.overflow = "";
      window.setTimeout(() => introScreen.remove(), 400);
    };

    if (canAnimateIntro) {
      introAnime.animate(introGauge, {
        scale: 1.14,
        opacity: 0,
        duration: 460,
        ease: "in(3)",
      });
      introAnime.animate(introScreen, {
        opacity: 0,
        duration: 520,
        ease: "in(2)",
        onComplete: finishIntro,
      });
      window.setTimeout(finishIntro, 700);
    } else {
      finishIntro();
    }
  };

  introOpen.addEventListener("click", closeIntro);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeIntro();
  });
}

const menuToggle = document.querySelector(".menu-toggle");
const navigationLinks = document.querySelector(".navigation-links");
const navigationItems = document.querySelectorAll(".navigation-link");

function closeMenu() {
  navigationLinks.classList.remove("is-open");
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute(
    "aria-label",
    document.documentElement.lang === "id" ? "Buka navigasi" : "Open navigation",
  );
}

menuToggle.addEventListener("click", () => {
  const isExpanded = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!isExpanded));
  menuToggle.setAttribute(
    "aria-label",
    document.documentElement.lang === "id"
      ? isExpanded ? "Buka navigasi" : "Tutup navigasi"
      : isExpanded ? "Open navigation" : "Close navigation",
  );
  navigationLinks.classList.toggle("is-open", !isExpanded);
});

navigationItems.forEach((item) => {
  item.addEventListener("click", () => {
    navigationItems.forEach((link) => link.classList.remove("is-active"));
    item.classList.add("is-active");
    closeMenu();
  });
});

const sections = document.querySelectorAll("main section[id]");
const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const activeLink = document.querySelector(
        `.navigation-link[href="#${entry.target.id}"]`,
      );
      if (!activeLink) return;
      navigationItems.forEach((link) => link.classList.remove("is-active"));
      activeLink.classList.add("is-active");
    });
  },
  { rootMargin: "-35% 0px -55% 0px" },
);

sections.forEach((section) => sectionObserver.observe(section));

const scrollProgress = document.querySelector(".scroll-progress");

if (scrollProgress) {
  let progressFrame = 0;

  const updateScrollProgress = () => {
    progressFrame = 0;
    const scrollable =
      document.documentElement.scrollHeight - window.innerHeight;
    const ratio = scrollable > 0 ? window.scrollY / scrollable : 0;
    const percent = Math.min(1, Math.max(0, ratio)) * 100;
    scrollProgress.style.setProperty("--progress", `${percent}%`);
  };

  const requestScrollProgress = () => {
    if (progressFrame) return;
    progressFrame = window.requestAnimationFrame(updateScrollProgress);
  };

  window.addEventListener("scroll", requestScrollProgress, { passive: true });
  window.addEventListener("resize", requestScrollProgress);
  window.addEventListener("load", updateScrollProgress);
  updateScrollProgress();
}

const revealTargets = document.querySelectorAll(
  ".about-grid > *, .experience-section .section-heading, .experience-card, .skills-grid > *, .skill-item, .education-section .shell > .eyebrow, .education-section .shell > h2, .background-column, .contact-content",
);
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const anime = window.anime;

if (
  !prefersReducedMotion.matches &&
  anime &&
  typeof anime.animate === "function"
) {
  const SIDE_REVEAL_DISTANCE = 56;
  const sideSelector = ".experience-card, .skill-item";

  const isSideReveal = (target) => target.matches(sideSelector);

  const getSideRevealIndex = (target) =>
    Array.from(target.parentElement.children)
      .filter((child) => child.matches(sideSelector))
      .indexOf(target);

  const hideReveal = (target) => {
    target.classList.add("scroll-reveal");
    target.style.opacity = "";
    target.style.transform = "";
    target.style.translate = "";
  };

  const showReveal = (target) => {
    const sideways = isSideReveal(target);
    const index = sideways ? getSideRevealIndex(target) : 0;

    anime.animate(target, {
      opacity: [0, 1],
      ...(sideways
        ? {
            translateX: [
              (index % 2 === 0 ? -1 : 1) * SIDE_REVEAL_DISTANCE,
              0,
            ],
          }
        : { translateY: [18, 0] }),
      duration: 800,
      delay: sideways ? Math.min(index, 5) * 70 : 0,
      ease: "out(3)",
      onComplete: () => {
        target.classList.remove("scroll-reveal");
        target.style.opacity = "";
        target.style.transform = "";
        target.style.translate = "";
      },
    });
  };

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          showReveal(entry.target);
        } else {
          hideReveal(entry.target);
        }
      });
    },
    { threshold: 0 },
  );

  revealTargets.forEach((target) => {
    target.classList.add("scroll-reveal");
    revealObserver.observe(target);
  });
}

const experienceSection = document.querySelector(".experience-section");
const galaxyCanvas = document.querySelector(".experience-galaxy");

if (experienceSection && galaxyCanvas instanceof HTMLCanvasElement) {
  const galaxyContext = galaxyCanvas.getContext("2d");

  if (galaxyContext) {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const galaxyStars = [];
    const galaxyBursts = [];
    const galaxyPointer = { x: -1, y: -1, active: false };
    let galaxyWidth = 0;
    let galaxyHeight = 0;
    let galaxyVisible = false;
    let galaxyFrame = 0;
    let lastGalaxyFrame = 0;

    function resizeGalaxy() {
      const bounds = experienceSection.getBoundingClientRect();
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      galaxyWidth = bounds.width;
      galaxyHeight = bounds.height;
      galaxyCanvas.width = Math.round(galaxyWidth * pixelRatio);
      galaxyCanvas.height = Math.round(galaxyHeight * pixelRatio);
      galaxyContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

      galaxyStars.length = 0;
      const fieldStarCount = Math.min(180, Math.max(70, Math.round(galaxyWidth * galaxyHeight / 6500)));
      for (let index = 0; index < fieldStarCount; index += 1) {
        galaxyStars.push({
          x: Math.random() * galaxyWidth,
          y: Math.random() * galaxyHeight,
          radius: 0.35 + Math.random() * 0.9,
          alpha: 0.16 + Math.random() * 0.38,
          phase: Math.random() * Math.PI * 2,
          drift: (Math.random() - 0.5) * 0.12,
        });
      }

      const centerX = galaxyWidth * 0.72;
      const centerY = galaxyHeight * 0.5;
      const galaxyRadius = Math.min(galaxyWidth * 0.58, galaxyHeight * 0.48);
      for (let arm = 0; arm < 3; arm += 1) {
        for (let index = 0; index < 95; index += 1) {
          const distance = Math.sqrt(Math.random()) * galaxyRadius;
          const angle = arm * (Math.PI * 2 / 3) + distance * 0.024 + (Math.random() - 0.5) * 0.38;
          galaxyStars.push({
            x: centerX + Math.cos(angle) * distance,
            y: centerY + Math.sin(angle) * distance * 0.68,
            radius: 0.35 + Math.random() * 1.15,
            alpha: 0.12 + Math.random() * 0.38,
            phase: Math.random() * Math.PI * 2,
            drift: (Math.random() - 0.5) * 0.08,
          });
        }
      }

      drawGalaxy(performance.now());
    }

    function drawGalaxy(time) {
      galaxyContext.clearRect(0, 0, galaxyWidth, galaxyHeight);

      const centerGlow = galaxyContext.createRadialGradient(
        galaxyWidth * 0.72,
        galaxyHeight * 0.5,
        0,
        galaxyWidth * 0.72,
        galaxyHeight * 0.5,
        Math.min(galaxyWidth * 0.55, galaxyHeight * 0.48),
      );
      centerGlow.addColorStop(0, "rgba(126, 153, 103, 0.12)");
      centerGlow.addColorStop(0.52, "rgba(126, 153, 103, 0.045)");
      centerGlow.addColorStop(1, "rgba(126, 153, 103, 0)");
      galaxyContext.fillStyle = centerGlow;
      galaxyContext.fillRect(0, 0, galaxyWidth, galaxyHeight);

      if (galaxyPointer.active) {
        const pointerGlow = galaxyContext.createRadialGradient(
          galaxyPointer.x,
          galaxyPointer.y,
          0,
          galaxyPointer.x,
          galaxyPointer.y,
          150,
        );
        pointerGlow.addColorStop(0, "rgba(126, 153, 103, 0.16)");
        pointerGlow.addColorStop(1, "rgba(126, 153, 103, 0)");
        galaxyContext.fillStyle = pointerGlow;
        galaxyContext.fillRect(
          galaxyPointer.x - 150,
          galaxyPointer.y - 150,
          300,
          300,
        );
      }

      galaxyStars.forEach((star) => {
        if (!reducedMotion.matches && galaxyVisible) {
          star.x += star.drift;
          if (star.x > galaxyWidth + 2) star.x = -2;
          if (star.x < -2) star.x = galaxyWidth + 2;
        }

        let x = star.x;
        let y = star.y;
        let alpha = star.alpha;
        if (!reducedMotion.matches) {
          alpha *= 0.72 + Math.sin(time * 0.0012 + star.phase) * 0.28;
        }

        if (galaxyPointer.active) {
          const dx = galaxyPointer.x - x;
          const dy = galaxyPointer.y - y;
          const distance = Math.hypot(dx, dy);
          if (distance > 0 && distance < 125) {
            const influence = (1 - distance / 125) * 10;
            x += (dx / distance) * influence;
            y += (dy / distance) * influence;
            alpha = Math.min(1, alpha + (1 - distance / 125) * 0.45);
          }
        }

        galaxyContext.beginPath();
        galaxyContext.arc(x, y, star.radius, 0, Math.PI * 2);
        galaxyContext.fillStyle = `rgba(101, 126, 83, ${alpha})`;
        galaxyContext.fill();
      });

      const now = performance.now();
      for (let index = galaxyBursts.length - 1; index >= 0; index -= 1) {
        const burst = galaxyBursts[index];
        const progress = (now - burst.startedAt) / 850;
        if (progress >= 1) {
          galaxyBursts.splice(index, 1);
          continue;
        }

        galaxyContext.beginPath();
        galaxyContext.arc(burst.x, burst.y, 8 + progress * 92, 0, Math.PI * 2);
        galaxyContext.strokeStyle = `rgba(111, 138, 92, ${(1 - progress) * 0.48})`;
        galaxyContext.lineWidth = 1.5 - progress;
        galaxyContext.stroke();
      }
    }

    function animateGalaxy(time) {
      if (!galaxyVisible) {
        galaxyFrame = 0;
        return;
      }

      if (time - lastGalaxyFrame >= 1000 / 30) {
        drawGalaxy(time);
        lastGalaxyFrame = time;
      }

      if (!reducedMotion.matches || galaxyBursts.length > 0) {
        galaxyFrame = window.requestAnimationFrame(animateGalaxy);
      } else {
        galaxyFrame = 0;
      }
    }

    function startGalaxyAnimation() {
      if (galaxyVisible && !galaxyFrame && !reducedMotion.matches) {
        galaxyFrame = window.requestAnimationFrame(animateGalaxy);
      }
    }

    const galaxyObserver = new IntersectionObserver(([entry]) => {
      galaxyVisible = entry.isIntersecting;
      if (galaxyVisible) {
        startGalaxyAnimation();
      } else if (galaxyFrame) {
        window.cancelAnimationFrame(galaxyFrame);
        galaxyFrame = 0;
      }
    });
    galaxyObserver.observe(experienceSection);

    const galaxyResizeObserver = new ResizeObserver(resizeGalaxy);
    galaxyResizeObserver.observe(experienceSection);

    experienceSection.addEventListener("pointermove", (event) => {
      const bounds = experienceSection.getBoundingClientRect();
      galaxyPointer.x = event.clientX - bounds.left;
      galaxyPointer.y = event.clientY - bounds.top;
      galaxyPointer.active = true;
      if (reducedMotion.matches) drawGalaxy(performance.now());
    });

    experienceSection.addEventListener("pointerleave", () => {
      galaxyPointer.active = false;
      if (reducedMotion.matches) drawGalaxy(performance.now());
    });

    experienceSection.addEventListener("pointerdown", (event) => {
      const bounds = experienceSection.getBoundingClientRect();
      galaxyBursts.push({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
        startedAt: performance.now(),
      });
      drawGalaxy(performance.now());
      if (galaxyVisible && !galaxyFrame) {
        galaxyFrame = window.requestAnimationFrame(animateGalaxy);
      }
    });

    reducedMotion.addEventListener("change", () => {
      if (reducedMotion.matches && galaxyFrame && galaxyBursts.length === 0) {
        window.cancelAnimationFrame(galaxyFrame);
        galaxyFrame = 0;
      } else {
        startGalaxyAnimation();
      }
      drawGalaxy(performance.now());
    });
  }
}
