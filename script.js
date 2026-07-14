/* ==========================================
   SeeMe! v2
   Landing Page Script
========================================== */

console.log("✨ SeeMe! Loaded");

/* ==========================================
   NAVBAR ACTIVE
========================================== */

const navLinks = document.querySelectorAll("nav a");

navLinks.forEach(link => {

    link.addEventListener("click", () => {

        navLinks.forEach(item => {

            item.classList.remove("active");

        });

        link.classList.add("active");

    });

});

/* ==========================================
   SMOOTH SCROLL
========================================== */

document.querySelectorAll('a[href^="#"]').forEach(anchor => {

    anchor.addEventListener("click", function (e) {

        e.preventDefault();

        const target = document.querySelector(this.getAttribute("href"));

        if (target) {

            target.scrollIntoView({

                behavior: "smooth"

            });

        }

    });

});

/* ==========================================
   COLLECTION CARD CLICK
========================================== */

const cards = document.querySelectorAll(".theme-card");

cards.forEach(card => {

    card.addEventListener("click", () => {

        card.animate([

            {
                transform: "scale(1)"
            },

            {
                transform: "scale(.97)"
            },

            {
                transform: "scale(1)"
            }

        ], {

            duration: 220

        });

    });

});

/* ==========================================
   BUTTON RIPPLE
========================================== */

const buttons = document.querySelectorAll(".btn-primary,.btn-secondary");

buttons.forEach(button => {

    button.addEventListener("mousedown", () => {

        button.style.transform = "scale(.96)";

    });

    button.addEventListener("mouseup", () => {

        button.style.transform = "";

    });

    button.addEventListener("mouseleave", () => {

        button.style.transform = "";

    });

});

/* ==========================================
   FEATURE CARD FLOAT
========================================== */

const featureCards = document.querySelectorAll(".feature");

featureCards.forEach((card, index) => {

    card.style.animationDelay = `${index * 120}ms`;

});

/* ==========================================
   PAGE READY
========================================== */

window.addEventListener("load", () => {

    document.body.classList.add("loaded");

});