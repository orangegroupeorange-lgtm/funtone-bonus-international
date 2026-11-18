// ============================================
// FUNTONE BONUS INTERNATIONAL
// ADMINISTRATION - JAVASCRIPT
// ============================================

const API = window.location.origin;

// ============================================
// ÉLÉMENTS HTML
// ============================================

const dashboard = document.getElementById("dashboardSection");

const loginCard = document.querySelector(".login-card");

const logoutBtn = document.getElementById("logoutBtn");

const refreshBtn = document.getElementById("refreshBtn");

const searchInput = document.getElementById("searchParticipant");

const tableBody = document.getElementById("participantsTable");

const dashboardMessage = document.getElementById("dashboardMessage");

// STATISTIQUES

const totalParticipations = document.getElementById("totalParticipations");

const totalAttente = document.getElementById("totalAttente");

const totalAcceptees = document.getElementById("totalAcceptees");

const totalRejetees = document.getElementById("totalRejetees");

// ============================================
// DONNÉES
// ============================================

let participations = [];

// ============================================
// AFFICHAGE DES MESSAGES
// ============================================

function afficherMessage(element, message, type) {

    if (!element) return;

    element.textContent = message;

    element.className = type === "erreur"
        ? "message-error"
        : "message-success";
}

// ============================================
// AFFICHER LE TABLEAU DE BORD
// ============================================

function afficherDashboard() {

    if (loginCard) {
        loginCard.hidden = true;
    }

    if (dashboard) {
        dashboard.hidden = false;
    }

    creerEspacesValidation();
}

// ============================================
// REQUÊTE SERVEUR
// ============================================

async function requete(url, options = {}) {

    const reponse = await fetch(`${API}${url}`, {

        ...options,

        credentials: "same-origin",

        cache: "no-store",

        headers: {

            "Content-Type": "application/json",

            ...(options.headers || {})
        }
    });

    const texte = await reponse.text();

    let resultat;

    try {

        resultat = JSON.parse(texte);

    } catch {

        throw new Error("Réponse du serveur invalide.");
    }

    if (!reponse.ok) {

        throw new Error(
            resultat.message || "Une erreur est survenue."
        );
    }

    return resultat;
}

// ============================================
// CONNEXION ADMINISTRATEUR
// ============================================

const adminLoginForm = document.getElementById("adminLoginForm");

const adminPassword = document.getElementById("adminPassword");

const loginMessage = document.getElementById("loginMessage");

if (adminLoginForm) {

    adminLoginForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        const motDePasse = adminPassword.value;

        try {

            const resultat = await requete(
                "/api/admin/login",
                {
                    method: "POST",
                    body: JSON.stringify({
                        password: motDePasse
                    })
                }
            );

            if (resultat.success) {

                adminPassword.value = "";

                afficherDashboard();

                afficherMessage(
                    loginMessage,
                    "Connexion réussie.",
                    "succes"
                );

                await chargerParticipations();
            }

        } catch (erreur) {

            afficherMessage(
                loginMessage,
                erreur.message,
                "erreur"
            );
        }
    });
}

// ============================================
// VÉRIFIER LA SESSION ADMINISTRATEUR
// ============================================

async function verifierSession() {

    try {

        await requete("/api/admin/me");

        if (loginCard) {
            loginCard.hidden = true;
        }

        afficherDashboard();

        await chargerParticipations();

    } catch {

        if (dashboard) {
            dashboard.hidden = true;
        }

        if (loginCard) {
            loginCard.hidden = false;
        }

        if (adminPassword) {
            adminPassword.value = "";
        }
    }
}

// ============================================
// CRÉER LES DEUX ESPACES DE VALIDATION
// ============================================

function creerEspacesValidation() {

    if (document.getElementById("validationCodes")) {
        return;
    }

    const zone = document.createElement("section");

    zone.id = "validationCodes";

    zone.innerHTML = `

        <div class="codes-heading">

            <h2>Validation des codes fictifs</h2>

            <p>
                Gérez séparément les deux étapes
                de démonstration.
            </p>

        </div>

        <div class="codes-grid">

            <section class="code-validation-card">

                <div class="code-card-header">

                    <span class="code-number">01</span>

                    <div>
                        <h3>Premier code fictif</h3>
                        <p>Validation de la première étape</p>
                    </div>

                </div>

                <div
                    id="premierCodeList"
                    class="code-list">

                </div>

            </section>

            <section class="code-validation-card">

                <div class="code-card-header">

                    <span class="code-number">02</span>

                    <div>
                        <h3>Deuxième code fictif</h3>
                        <p>Validation de la deuxième étape</p>
                    </div>

                </div>

                <div
                    id="secondCodeList"
                    class="code-list">

                </div>

            </section>

        </div>

        <div class="simulation-admin-warning">

            Administration de démonstration :
            ces codes sont fictifs et ne donnent
            accès à aucun paiement réel.

        </div>

    `;

    const participantsCard = document.querySelector(
        ".participants-card"
    );

    if (participantsCard) {

        dashboard.insertBefore(
            zone,
            participantsCard
        );

    } else {

        dashboard.appendChild(zone);
    }

    ajouterStyleValidation();
}

// ============================================
// STYLE DES ESPACES DE VALIDATION
// ============================================

function ajouterStyleValidation() {

    if (document.getElementById("validationCodesStyle")) {
        return;
    }

    const style = document.createElement("style");

    style.id = "validationCodesStyle";

    style.textContent = `

        #validationCodes {
            margin: 30px 0;
        }

        .codes-heading {
            margin-bottom: 20px;
        }

        .codes-heading h2 {
            font-size: 22px;
            color: #222;
            margin-bottom: 7px;
        }

        .codes-heading p {
            color: #777;
            font-size: 13px;
        }

        .codes-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 20px;
        }

        .code-validation-card {
            background: #fff;
            border: 1px solid #f0e3da;
            border-radius: 14px;
            padding: 20px;
            min-width: 0;
            box-shadow: 0 4px 15px rgba(0,0,0,0.04);
        }

        .code-card-header {
            display: flex;
            align-items: center;
            gap: 12px;
            padding-bottom: 17px;
            border-bottom: 1px solid #f0e8e2;
            margin-bottom: 15px;
        }

        .code-number {
            width: 42px;
            height: 42px;
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #fff0e5;
            color: #d96b27;
            border-radius: 10px;
            font-weight: bold;
        }

        .code-card-header h3 {
            font-size: 15px;
            color: #222;
            margin-bottom: 5px;
        }

        .code-card-header p {
            font-size: 11px;
            color: #888;
        }

        .code-list {
            display: flex;
            flex-direction: column;
            gap: 13px;
        }

        .code-item {
            padding: 14px;
            background: #fffaf6;
            border: 1px solid #f2e5db;
            border-radius: 10px;
        }

        .code-item-top {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 8px;
            margin-bottom: 12px;
        }

        .code-item-reference {
            font-size: 11px;
            color: #777;
            overflow-wrap: anywhere;
        }

        .code-item-value {
            display: block;
            font-size: 19px;
            font-weight: bold;
            color: #d96b27;
            letter-spacing: 1px;
            margin: 12px 0;
            overflow-wrap: anywhere;
        }

        .code-participant {
            font-size: 12px;
            color: #555;
            line-height: 1.7;
            overflow-wrap: anywhere;
        }

        .code-status {
            display: inline-block;
            padding: 5px 9px;
            border-radius: 20px;
            font-size: 10px;
            font-weight: bold;
            white-space: nowrap;
        }

        .code-status.pending {
            background: #fff0d8;
            color: #a56800;
        }

        .code-status.accepted {
            background: #e4f6e9;
            color: #258443;
        }

        .code-status.rejected {
            background: #ffe7e7;
            color: #c62828;
        }

        .code-actions {
            display: flex;
            gap: 8px;
            margin-top: 13px;
        }

        .code-actions button {
            flex: 1;
            padding: 10px 7px;
            border: none;
            border-radius: 7px;
            color: white;
            font-size: 12px;
            font-weight: bold;
            cursor: pointer;
        }

        .code-actions button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .code-accept {
            background: #258443;
        }

        .code-reject {
            background: #d94343;
        }

        .code-empty {
            text-align: center;
            padding: 25px 10px;
            color: #999;
            font-size: 12px;
            line-height: 1.6;
        }

        .simulation-admin-warning {
            margin-top: 15px;
            padding: 13px;
            background: #fff0e5;
            border-left: 4px solid #d96b27;
            color: #82543a;
            font-size: 11px;
            line-height: 1.6;
            border-radius: 5px;
        }

        @media(max-width: 750px) {

            .codes-grid {
                grid-template-columns: 1fr;
            }

            .code-validation-card {
                padding: 15px;
            }
        }

    `;

    document.head.appendChild(style);
}

// ============================================
// CHARGER LES PARTICIPATIONS
// ============================================

async function chargerParticipations() {

    try {

        afficherMessage(
            dashboardMessage,
            "Chargement des participants...",
            "succes"
        );

        const resultat = await requete(
            "/api/admin/participations"
        );

        participations = resultat.participations || [];

        actualiserStatistiques();

        afficherParticipations();

        afficherCodes();

        if (dashboardMessage) {
            dashboardMessage.textContent = "";
        }

    } catch (erreur) {

        afficherMessage(
            dashboardMessage,
            erreur.message,
            "erreur"
        );
    }
}

// ============================================
// STATISTIQUES
// ============================================

function actualiserStatistiques() {

    const attente = participations.filter(
        p => p.statut === "simulation_en_attente"
    ).length;

    const acceptees = participations.filter(
        p => p.statut === "simulation_acceptee"
    ).length;

    const rejetees = participations.filter(
        p => p.statut === "simulation_rejetee"
    ).length;

    if (totalParticipations) {
        totalParticipations.textContent = participations.length;
    }

    if (totalAttente) {
        totalAttente.textContent = attente;
    }

    if (totalAcceptees) {
        totalAcceptees.textContent = acceptees;
    }

    if (totalRejetees) {
        totalRejetees.textContent = rejetees;
    }
}

// ============================================
// FORMATER LES MONTANTS
// ============================================

function formaterBonus(bonus, devise) {

    const montant = Number(bonus).toLocaleString("fr-FR");

    return `${montant} ${devise || ""}`;
}

// ============================================
// FORMATER LES DATES
// ============================================

function formaterDate(date) {

    const valeur = new Date(date);

    if (Number.isNaN(valeur.getTime())) {
        return "Date inconnue";
    }

    return valeur.toLocaleString("fr-FR", {

        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

// ============================================
// LIBELLÉ DES STATUTS
// ============================================

function obtenirStatut(statut) {

    if (statut === "simulation_acceptee") {

        return {
            texte: "Acceptée",
            classe: "accepted"
        };
    }

    if (statut === "simulation_rejetee") {

        return {
            texte: "Refusée",
            classe: "rejected"
        };
    }

    return {
        texte: "En attente",
        classe: "pending"
    };
}

// ============================================
// CRÉER UNE CELLULE
// ============================================

function creerCellule(texte) {

    const cellule = document.createElement("td");

    cellule.textContent = texte ?? "";

    return cellule;
}// ============================================
// AFFICHER LES DEUX ESPACES DE VALIDATION
// ============================================

function afficherCodes() {

    const premierList = document.getElementById(
        "premierCodeList"
    );

    const secondList = document.getElementById(
        "secondCodeList"
    );

    if (!premierList || !secondList) return;

    premierList.replaceChildren();

    secondList.replaceChildren();

    let nombrePremier = 0;

    let nombreSecond = 0;

    participations.forEach(participant => {

        const codes = participant.codes || {};

        if (codes.premier) {

            nombrePremier++;

            premierList.appendChild(
                creerCarteCode(
                    participant,
                    codes.premier,
                    "premier"
                )
            );
        }

        if (codes.second) {

            nombreSecond++;

            secondList.appendChild(
                creerCarteCode(
                    participant,
                    codes.second,
                    "second"
                )
            );
        }
    });

    if (nombrePremier === 0) {

        premierList.innerHTML = `
            <div class="code-empty">
                Aucun premier code reçu pour le moment.
            </div>
        `;
    }

    if (nombreSecond === 0) {

        secondList.innerHTML = `
            <div class="code-empty">
                Aucun deuxième code reçu pour le moment.
            </div>
        `;
    }
}

// ============================================
// CRÉER UNE CARTE DE CODE
// ============================================

function creerCarteCode(participant, code, etape) {

    const carte = document.createElement("article");

    carte.className = "code-item";

    const statut = obtenirStatut(code.statut);

    const reference = document.createElement("div");

    reference.className = "code-item-reference";

    reference.textContent = `Référence : ${participant.reference}`;

    const statutBadge = document.createElement("span");

    statutBadge.className = `code-status ${statut.classe}`;

    statutBadge.textContent = statut.texte;

    const haut = document.createElement("div");

    haut.className = "code-item-top";

    haut.appendChild(reference);

    haut.appendChild(statutBadge);

    const valeur = document.createElement("strong");

    valeur.className = "code-item-value";

    valeur.textContent = code.valeur || "Code absent";

    const informations = document.createElement("div");

    informations.className = "code-participant";

    informations.textContent =
        `${participant.nomPays || ""} • ` +
        `${participant.indicatif || ""} ${participant.telephone || ""}`;

    const date = document.createElement("div");

    date.className = "code-item-reference";

    date.style.marginTop = "8px";

    date.textContent = `Reçu le : ${formaterDate(code.date)}`;

    carte.appendChild(haut);

    carte.appendChild(valeur);

    carte.appendChild(informations);

    carte.appendChild(date);

    // Actions uniquement si le code attend une décision

    if (code.statut === "simulation_en_attente") {

        const actions = document.createElement("div");

        actions.className = "code-actions";

        const accepter = document.createElement("button");

        accepter.type = "button";

        accepter.className = "code-accept";

        accepter.textContent = "Accepter";

        accepter.addEventListener("click", () => {

            modifierStatutCode(
                participant.reference,
                etape,
                "simulation_acceptee"
            );
        });

        const refuser = document.createElement("button");

        refuser.type = "button";

        refuser.className = "code-reject";

        refuser.textContent = "Refuser";

        refuser.addEventListener("click", () => {

            modifierStatutCode(
                participant.reference,
                etape,
                "simulation_rejetee"
            );
        });

        actions.appendChild(accepter);

        actions.appendChild(refuser);

        carte.appendChild(actions);
    }

    return carte;
}

// ============================================
// AFFICHER LES PARTICIPANTS
// ============================================

function afficherParticipations() {

    if (!tableBody) return;

    tableBody.replaceChildren();

    const recherche = searchInput
        ? searchInput.value.trim().toLowerCase()
        : "";

    const liste = participations.filter(p => {

        const contenu = [

            p.reference,
            p.nomPays,
            p.pays,
            p.telephone,
            p.statut

        ].join(" ").toLowerCase();

        return contenu.includes(recherche);
    });

    if (liste.length === 0) {

        const ligne = document.createElement("tr");

        const cellule = document.createElement("td");

        cellule.colSpan = 7;

        cellule.textContent = participations.length === 0
            ? "Aucun participant enregistré."
            : "Aucun résultat trouvé.";

        cellule.style.textAlign = "center";

        cellule.style.padding = "25px";

        ligne.appendChild(cellule);

        tableBody.appendChild(ligne);

        return;
    }

    liste.forEach(participant => {

        const ligne = document.createElement("tr");

        ligne.appendChild(
            creerCellule(participant.reference)
        );

        ligne.appendChild(
            creerCellule(participant.nomPays)
        );

        ligne.appendChild(
            creerCellule(
                `${participant.indicatif || ""} ${participant.telephone || ""}`
            )
        );

        ligne.appendChild(
            creerCellule(
                formaterBonus(
                    participant.bonus,
                    participant.devise
                )
            )
        );

        ligne.appendChild(
            creerCellule(formaterDate(participant.date))
        );

        const celluleStatut = document.createElement("td");

        const badge = document.createElement("span");

        const statut = obtenirStatut(participant.statut);

        badge.className = `status ${statut.classe}`;

        badge.textContent = statut.texte;

        celluleStatut.appendChild(badge);

        ligne.appendChild(celluleStatut);

        const celluleActions = document.createElement("td");

        celluleActions.textContent = "Voir les codes ci-dessus";

        ligne.appendChild(celluleActions);

        tableBody.appendChild(ligne);
    });
}

// ============================================
// MODIFIER LE STATUT D'UN CODE INDÉPENDANT
// ============================================

async function modifierStatutCode(reference, etape, status) {

    const nomEtape = etape === "premier"
        ? "premier code"
        : "deuxième code";

    const confirmation = window.confirm(

        status === "simulation_acceptee"

            ? `Confirmer l'acceptation fictive du ${nomEtape} ?`

            : `Confirmer le refus fictif du ${nomEtape} ?`
    );

    if (!confirmation) return;

    try {

        await requete(

            `/api/admin/participations/${encodeURIComponent(reference)}/codes/${etape}/status`,

            {
                method: "PATCH",

                body: JSON.stringify({
                    status: status
                })
            }
        );

        afficherMessage(
            dashboardMessage,
            `Décision enregistrée pour le ${nomEtape}.`,
            "succes"
        );

        await chargerParticipations();

    } catch (erreur) {

        afficherMessage(
            dashboardMessage,
            erreur.message,
            "erreur"
        );
    }
}

// ============================================
// RECHERCHE
// ============================================

if (searchInput) {

    searchInput.addEventListener("input", () => {

        afficherParticipations();
    });
}

// ============================================
// ACTUALISATION
// ============================================

if (refreshBtn) {

    refreshBtn.addEventListener("click", async () => {

        refreshBtn.disabled = true;

        await chargerParticipations();

        refreshBtn.disabled = false;
    });
}

// ============================================
// ACTUALISATION AUTOMATIQUE
// ============================================

let actualisationAutomatique = setInterval(() => {

    if (
        dashboard &&
        !dashboard.hidden
    ) {

        chargerParticipations();
    }

}, 5000);

// ============================================
// DÉCONNEXION
// ============================================

if (logoutBtn) {

    logoutBtn.addEventListener("click", async () => {

        try {

            await requete(
                "/api/admin/logout",
                {
                    method: "POST",

                    body: JSON.stringify({})
                }
            );

            clearInterval(actualisationAutomatique);

            participations = [];

            if (dashboard) {
                dashboard.hidden = true;
            }

            window.location.href = "/";

        } catch (erreur) {

            afficherMessage(
                dashboardMessage,
                erreur.message,
                "erreur"
            );
        }
    });
}

// ============================================
// DÉMARRAGE
// ============================================

document.addEventListener("DOMContentLoaded", () => {

    verifierSession();

});