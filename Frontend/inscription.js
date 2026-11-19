// ============================================
// FUNTONE BONUS INTERNATIONAL
// INSCRIPTION CONNECTÉE AU BACKEND
// VERSION AVEC CONTINUATION
// ============================================

document.addEventListener("DOMContentLoaded", function () {

    const API = window.location.origin;

    const paysSelect = document.getElementById("pays");
    const telephoneInput = document.getElementById("telephone");
    const indicatif = document.getElementById("indicatif");
    const montantBonus = document.getElementById("montantBonus");
    const formulaire = document.getElementById("inscriptionForm");

    // ======================================
    // DONNÉES DES 15 PAYS
    // ======================================

    const paysData = {

        CM: {
            nom: "Cameroun",
            indicatif: "+237",
            bonus: "100 000 FCFA"
        },

        CD: {
            nom: "RDC (Kinshasa)",
            indicatif: "+243",
            bonus: "200 USD"
        },

        CG: {
            nom: "Congo-Brazzaville",
            indicatif: "+242",
            bonus: "100 000 FCFA"
        },

        CI: {
            nom: "Côte d'Ivoire",
            indicatif: "+225",
            bonus: "100 000 FCFA"
        },

        SN: {
            nom: "Sénégal",
            indicatif: "+221",
            bonus: "100 000 FCFA"
        },

        GA: {
            nom: "Gabon",
            indicatif: "+241",
            bonus: "100 000 FCFA"
        },

        BF: {
            nom: "Burkina Faso",
            indicatif: "+226",
            bonus: "100 000 FCFA"
        },

        ML: {
            nom: "Mali",
            indicatif: "+223",
            bonus: "100 000 FCFA"
        },

        TG: {
            nom: "Togo",
            indicatif: "+228",
            bonus: "100 000 FCFA"
        },

        BJ: {
            nom: "Bénin",
            indicatif: "+229",
            bonus: "100 000 FCFA"
        },

        GN: {
            nom: "Guinée",
            indicatif: "+224",
            bonus: "1 500 000 GNF"
        },

        NG: {
            nom: "Nigeria",
            indicatif: "+234",
            bonus: "155 000 NGN"
        },

        GH: {
            nom: "Ghana",
            indicatif: "+233",
            bonus: "650 GHS"
        },

        KE: {
            nom: "Kenya",
            indicatif: "+254",
            bonus: "10 000 KES"
        },

        ZA: {
            nom: "Afrique du Sud",
            indicatif: "+27",
            bonus: "60 000 ZAR"
        }

    };

    // ======================================
    // CHANGEMENT DE PAYS
    // ======================================

    paysSelect.addEventListener("change", function () {

        const code = paysSelect.value;

        if (paysData[code]) {

            indicatif.textContent =
                paysData[code].indicatif;

            montantBonus.textContent =
                paysData[code].bonus;

        } else {

            indicatif.textContent = "+237";

            montantBonus.textContent =
                "Sélectionnez votre pays";
        }

    });

    // ======================================
    // AFFICHAGE DU RÉSULTAT
    // ======================================

    function afficherResultat(titre, message, reference) {

        let resultat = document.getElementById(
            "resultatInscription"
        );

        if (!resultat) {

            resultat = document.createElement("div");

            resultat.id = "resultatInscription";

            formulaire.appendChild(resultat);
        }

        resultat.style.cssText = `
            margin-top: 22px;
            padding: 20px;
            background: #111111;
            border: 1px solid #FF7900;
            border-radius: 10px;
            color: white;
            text-align: center;
            line-height: 1.8;
        `;

        resultat.replaceChildren();

        const titreElement = document.createElement("h3");

        titreElement.textContent = titre;

        titreElement.style.color = "#FF9B38";

        const messageElement = document.createElement("p");

        messageElement.textContent = message;

        messageElement.style.fontSize = "13px";

        resultat.append(titreElement, messageElement);

        if (reference) {

            const referenceElement =
                document.createElement("strong");

            referenceElement.textContent = reference;

            referenceElement.style.color = "#FF9B38";

            resultat.appendChild(referenceElement);

            const boutonContinuer =
                document.createElement("button");

            boutonContinuer.type = "button";

            boutonContinuer.textContent =
                "Continuer";

            boutonContinuer.style.cssText = `
                display: block;
                width: 100%;
                margin-top: 18px;
                padding: 14px;
                border: none;
                border-radius: 8px;
                background: #FF7900;
                color: white;
                font-weight: bold;
                cursor: pointer;
            `;

            boutonContinuer.addEventListener("click", function () {

                const destination = new URL(
                    "premier-code.html",
                    window.location.href
                );

                destination.searchParams.set(
                    "reference",
                    reference
                );

                window.location.href = destination.href;
            });

            resultat.appendChild(boutonContinuer);
        }

        resultat.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });

    }
      // ======================================
    // ENVOI DE L'INSCRIPTION AU SERVEUR
    // ======================================

    formulaire.addEventListener("submit", async function (event) {

        event.preventDefault();

        const codePays = paysSelect.value;

        const telephone = telephoneInput.value.trim();

        if (!paysData[codePays]) {

            alert("Veuillez sélectionner votre pays.");

            return;
        }

        if (!/^[0-9]{6,15}$/.test(telephone)) {

            alert("Veuillez entrer un numéro valide.");

            telephoneInput.focus();

            return;
        }

        const bouton = formulaire.querySelector(
            ".submit-button"
        );

        bouton.disabled = true;

        bouton.textContent = "Enregistrement...";

        try {

            const reponse = await fetch(
                `${API}/api/participations`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({

                        pays: codePays,

                        telephone: telephone

                    })
                }
            );

            const donnees = await reponse.json();

            if (!reponse.ok) {

                throw new Error(
                    donnees.message ||
                    "Une erreur est survenue."
                );
            }

            if (!donnees.reference) {

                throw new Error(
                    "La référence est absente."
                );
            }

            // ==================================
            // AFFICHER LA RÉFÉRENCE CORRECTE
            // ==================================

            afficherResultat(

                "Participation enregistrée !",

                "Votre participation a été enregistrée.",

                donnees.reference

            );

            // ==================================
            // RÉINITIALISER LES CHAMPS
            // ==================================

            formulaire.reset();

            indicatif.textContent = "+237";

            montantBonus.textContent =
                "Sélectionnez votre pays";

            // Désactiver le bouton après inscription
            bouton.disabled = true;

        } catch (erreur) {

            afficherResultat(

                "Erreur",

                erreur.message ||
                "Impossible de contacter le serveur."

            );

            bouton.disabled = false;

        } finally {

            if (!bouton.disabled) {

                bouton.innerHTML =
                    'Valider ma participation <i class="fa-solid fa-arrow-right"></i>';

            }

        }

    });

});