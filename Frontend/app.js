// ==================================
// FUNTONE BONUS INTERNATIONAL
// Navigation de la page d'accueil
// ==================================

document.addEventListener("DOMContentLoaded", function () {

    const participerBtn = document.getElementById("participerBtn");

    // Vérification du bouton
    if (participerBtn) {

        participerBtn.addEventListener("click", function () {

            // Direction vers la page d'inscription
            window.location.href = "inscription.html";

        });

    }

});
// ==================================
// ANIMATION DU BOUTON PARTICIPER
// ==================================

const bouton = document.getElementById("participerBtn");

if (bouton) {

    bouton.addEventListener("mouseenter", function () {
        bouton.style.transition = "0.3s ease";
    });

}