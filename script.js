/* ============================================================
   DN'T B' ORDINARY - site behavior
   Built by OTM Web Design
   ============================================================ */
(function () {
  "use strict";

  /* ------------------------------------------------------------
     STORE URL: the ONE place the Printify Pop-Up Store link lives.
     Swap this single string if the store address ever changes, and
     every buy button, nav CTA, and collection button follows.
     Every store link in the HTML carries data-store-link.
     ------------------------------------------------------------ */
  var STORE_URL = "https://dnt-b-ordinary.printify.me";

  document.querySelectorAll("[data-store-link]").forEach(function (a) {
    a.setAttribute("href", STORE_URL);
    a.setAttribute("rel", "noopener");
    a.setAttribute("target", "_blank");
  });

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Active nav state ---------- */
  var page = document.body.getAttribute("data-page");
  if (page) {
    document.querySelectorAll("[data-nav]").forEach(function (link) {
      if (link.getAttribute("data-nav") === page) link.classList.add("is-active");
    });
  }

  /* ---------- Mobile menu ---------- */
  var hamburger = document.querySelector(".hamburger");
  var mobileMenu = document.querySelector(".mobile-menu");
  var backdrop = document.querySelector(".nav-backdrop");

  function closeMenu() {
    if (!hamburger) return;
    hamburger.classList.remove("is-open");
    if (mobileMenu) mobileMenu.classList.remove("is-open");
    if (backdrop) backdrop.classList.remove("is-open");
    document.body.classList.remove("nav-open");
    hamburger.setAttribute("aria-expanded", "false");
  }

  if (hamburger) {
    hamburger.addEventListener("click", function () {
      var open = hamburger.classList.toggle("is-open");
      if (mobileMenu) mobileMenu.classList.toggle("is-open", open);
      if (backdrop) backdrop.classList.toggle("is-open", open);
      document.body.classList.toggle("nav-open", open);
      hamburger.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }
  if (backdrop) backdrop.addEventListener("click", closeMenu);
  if (mobileMenu) {
    mobileMenu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", closeMenu);
    });
  }
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeMenu();
  });

  /* ---------- Footer year ---------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Scroll reveal ---------- */
  var revealables = document.querySelectorAll(".reveal");
  if (revealables.length) {
    if (reduceMotion || !("IntersectionObserver" in window)) {
      revealables.forEach(function (el) { el.classList.add("is-visible"); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      }, { rootMargin: "0px 0px -60px 0px", threshold: 0.08 });
      revealables.forEach(function (el) { io.observe(el); });
    }
  }

  /* ---------- Gallery carousel: featured-center, auto-advancing ---------- */
  var carousel = document.querySelector(".gallery-carousel");
  if (carousel) {
    var slides = Array.prototype.slice.call(carousel.querySelectorAll(".gallery-slide"));
    var dotsWrap = carousel.querySelector(".carousel-dots");
    var prevBtn = carousel.querySelector(".carousel-prev");
    var nextBtn = carousel.querySelector(".carousel-next");
    var index = 0;
    var timer = null;
    var INTERVAL = 4500;

    slides.forEach(function (_, i) {
      var dot = document.createElement("button");
      dot.className = "carousel-dot";
      dot.type = "button";
      dot.setAttribute("aria-label", "Go to design " + (i + 1));
      dot.addEventListener("click", function () { goTo(i); restart(); });
      dotsWrap.appendChild(dot);
    });
    var dots = Array.prototype.slice.call(dotsWrap.children);

    function goTo(i) {
      index = (i + slides.length) % slides.length;
      var prev = (index - 1 + slides.length) % slides.length;
      var next = (index + 1) % slides.length;
      slides.forEach(function (slide, s) {
        slide.classList.remove("is-active", "is-prev", "is-next");
        if (s === index) slide.classList.add("is-active");
        else if (s === prev) slide.classList.add("is-prev");
        else if (s === next) slide.classList.add("is-next");
      });
      dots.forEach(function (dot, d) { dot.classList.toggle("is-active", d === index); });
    }
    function start() { if (reduceMotion || timer) return; timer = setInterval(function () { goTo(index + 1); }, INTERVAL); }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    function restart() { stop(); start(); }

    if (prevBtn) prevBtn.addEventListener("click", function () { goTo(index - 1); restart(); });
    if (nextBtn) nextBtn.addEventListener("click", function () { goTo(index + 1); restart(); });
    carousel.addEventListener("mouseenter", stop);
    carousel.addEventListener("mouseleave", start);
    carousel.addEventListener("focusin", stop);
    carousel.addEventListener("focusout", start);

    goTo(0);
    start();
  }

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll(".faq-q").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var panel = document.getElementById(btn.getAttribute("aria-controls"));
      var open = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", open ? "false" : "true");
      if (panel) panel.classList.toggle("open", !open);
    });
  });

  /* ---------- Phone fields: live US formatting ---------- */
  document.querySelectorAll('input[type="tel"]').forEach(function (field) {
    field.setAttribute("maxlength", "14");
    field.addEventListener("input", function () {
      var d = field.value.replace(/\D/g, "").slice(0, 10);
      var out = "";
      if (d.length > 6) out = "(" + d.slice(0, 3) + ") " + d.slice(3, 6) + "-" + d.slice(6);
      else if (d.length > 3) out = "(" + d.slice(0, 3) + ") " + d.slice(3);
      else if (d.length > 0) out = "(" + d.slice(0, 3);
      field.value = out;
    });
  });

  /* ---------- Inquiry form: validation + AJAX submit + own redirect ---------- */
  var form = document.querySelector("form[data-validate]");
  if (form) {
    var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;
    var banner = form.querySelector(".form-banner");
    var submitBtn = form.querySelector('button[type="submit"]');
    var submitLabel = submitBtn ? submitBtn.textContent : "";

    function fieldWrap(el) { return el.closest(".field") || el.parentNode; }

    function setError(el, message) {
      var wrap = fieldWrap(el);
      wrap.classList.add("has-error");
      var msg = wrap.querySelector(".field-error");
      if (msg && message) msg.textContent = message;
    }
    function clearError(el) { fieldWrap(el).classList.remove("has-error"); }

    form.querySelectorAll("input, textarea, select").forEach(function (el) {
      var evt = el.tagName === "SELECT" ? "change" : "input";
      el.addEventListener(evt, function () { clearError(el); });
    });

    function validate() {
      var firstBad = null;

      function check(el, ok, message) {
        if (ok) { clearError(el); return; }
        setError(el, message);
        if (!firstBad) firstBad = el;
      }

      var first = form.querySelector('[name="first_name"]');
      var last = form.querySelector('[name="last_name"]');
      var phone = form.querySelector('input[type="tel"]');
      var email = form.querySelector('input[type="email"]');

      if (first) check(first, first.value.trim().length >= 2, "Please enter your first name.");
      if (last) check(last, last.value.trim().length >= 2, "Please enter your last name.");
      if (phone) {
        /* Phone is optional on this build (email-only business), but when it is
           filled in it still has to be a real 10 digit number. */
        var digits = phone.value.replace(/\D/g, "");
        var skippable = !phone.hasAttribute("required") && digits.length === 0;
        check(phone, skippable || digits.length === 10, "Please enter a 10 digit phone number.");
      }
      if (email) check(email, EMAIL_RE.test(email.value.trim()), "Please enter a valid email address.");

      form.querySelectorAll("select[required], textarea[required]").forEach(function (el) {
        check(el, el.value.trim() !== "", "This field is required.");
      });
      form.querySelectorAll('input[type="text"][required]').forEach(function (el) {
        if (el === first || el === last) return;
        check(el, el.value.trim() !== "", "This field is required.");
      });

      if (firstBad) {
        firstBad.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
        firstBad.focus({ preventScroll: true });
        return false;
      }
      return true;
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (banner) banner.classList.remove("show");
      if (!validate()) return;

      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Sending..."; }

      fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { "Accept": "application/json" }
      }).then(function (res) {
        if (!res.ok) throw new Error("bad-response");
        window.location.href = new URL("thank-you.html", window.location.href).href;
      }).catch(function () {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = submitLabel; }
        if (banner) {
          banner.textContent = "Something went wrong sending that. Please try again, or email us directly.";
          banner.classList.add("show");
          banner.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
        }
      });
    });
  }
})();