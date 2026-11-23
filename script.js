/* =====================================================
   1. RÉGLAGES — c'est ici que tu modifies le comportement
   ===================================================== */

const NOMBRE_IMAGES = 500;      // nombre total d'images dans le dossier "images"
const DOSSIER = "images/";      // nom du dossier où sont tes images
const PREFIXE = "toits (";    // tout ce qui précède le numéro (attention à l'espace avant la parenthèse)
const SUFFIXE = ").jpg";        // tout ce qui suit le numéro : la parenthèse fermante + l'extension (.png, .jpg...)

const DELAI_DEPART = 500;       // ms entre les 2 premières images (apparition lente au début)
const DELAI_MINI = 25;          // ms minimum entre 2 images (apparition rapide à la fin = surcharge)
const ACCELERATION = 0.95;      // à chaque image, le délai est multiplié par ça (plus petit = accélère vite)

const TAILLE_MIN = 90;          // largeur minimale d'une image (px)
const TAILLE_MAX = 200;         // largeur maximale d'une image (px)

const RAYON = 160;              // distance (px) à laquelle la souris repousse les images
const FORCE = 3.2;              // puissance de la répulsion
const FROTTEMENT = 0.92;        // 0.99 = glisse longtemps, 0.80 = s'arrête vite
const RETOUR = 0;               // 0 = les images restent dispersées. Essaie 0.002 pour qu'elles reviennent doucement.


/* =====================================================
   2. RÉCUPÉRATION DES ÉLÉMENTS DE LA PAGE
   ===================================================== */

const scene = document.getElementById("scene");
const compteur = document.getElementById("compteur");
const consigne = document.getElementById("consigne");

// Tableau qui contiendra toutes nos images avec leurs infos (position, vitesse...)
const cartes = [];

// Position de la souris (null = pas encore bougée)
const souris = { x: null, y: null };

// Passe à true quand toutes les images sont affichées
let toutAffiche = false;


/* =====================================================
   3. CRÉATION D'UNE IMAGE
   ===================================================== */

function creerCarte(numero) {
  const img = document.createElement("img");      // crée une balise <img>
  // ex : "images/prince (12).png" ; encodeURI convertit les espaces et parenthèses pour le web
  img.src = encodeURI(DOSSIER + PREFIXE + numero + SUFFIXE);
  img.className = "carte";                        // applique le style .carte
  img.decoding = "async";                         // décode l'image sans bloquer la page

  const largeur = TAILLE_MIN + Math.random() * (TAILLE_MAX - TAILLE_MIN);
  img.style.width = largeur + "px";
  // La hauteur est fixée plus tard, quand l'image est chargée (on garde ses proportions)

  scene.appendChild(img);                         // ajoute l'image dans la page

  // Position de départ aléatoire (en gardant l'image dans l'écran)
  const x = Math.random() * (window.innerWidth - largeur);
  const y = Math.random() * (window.innerHeight - largeur * 0.8);

  const carte = {
    el: img,
    x: x,                                         // position actuelle
    y: y,
    ox: x,                                        // position d'origine (pour le RETOUR)
    oy: y,
    vx: 0,                                        // vitesse horizontale
    vy: 0,                                        // vitesse verticale
    rot: (Math.random() - 0.5) * 16,              // rotation initiale (-8° à +8°)
    vrot: 0,                                      // vitesse de rotation
    w: largeur,
    h: largeur                                    // sera corrigé au chargement
  };

  // Quand l'image est chargée, on connaît ses vraies proportions
  img.onload = () => {
    carte.h = largeur * (img.naturalHeight / img.naturalWidth);
    img.style.height = carte.h + "px";
  };

  // Si l'image est introuvable, on affiche le chemin exact dans la console (touche F12)
  img.onerror = () => {
    console.error("Image introuvable : " + decodeURI(img.src));
  };

  cartes.push(carte);
  dessiner(carte);

  // Petit délai pour que l'animation de fondu (opacity) se déclenche
  requestAnimationFrame(() => img.classList.add("visible"));
}


/* =====================================================
   4. APPARITION PROGRESSIVE (l'accumulation)
   ===================================================== */

let delai = DELAI_DEPART;

function ajouterSuivante(i) {
  if (i > NOMBRE_IMAGES) {                        // toutes les images sont là
    toutAffiche = true;
    consigne.classList.add("visible");            // affiche le message d'invitation
    return;
  }

  creerCarte(i);
  compteur.textContent = i;                       // met à jour le compteur

  delai = Math.max(DELAI_MINI, delai * ACCELERATION);   // le rythme s'accélère
  setTimeout(() => ajouterSuivante(i + 1), delai);      // programme la suivante
}

ajouterSuivante(1);                               // on démarre avec l'image n°1


/* =====================================================
   5. SUIVI DE LA SOURIS (et du doigt sur mobile)
   ===================================================== */

window.addEventListener("pointermove", (e) => {
  souris.x = e.clientX;
  souris.y = e.clientY;
});

// Quand la souris quitte la page, on la "désactive"
window.addEventListener("pointerleave", () => {
  souris.x = null;
  souris.y = null;
});


/* =====================================================
   6. AFFICHAGE : applique la position à l'image
   ===================================================== */

function dessiner(c) {
  // "transform" est la méthode la plus rapide pour bouger un élément
  c.el.style.transform =
    `translate(${c.x}px, ${c.y}px) rotate(${c.rot}deg)`;
}


/* =====================================================
   7. BOUCLE D'ANIMATION : tourne ~60 fois par seconde
   ===================================================== */

function animer() {

  for (const c of cartes) {

    // On ne repousse que lorsque tout est affiché ET que la souris est présente
    if (toutAffiche && souris.x !== null) {

      // centre de l'image
      const cx = c.x + c.w / 2;
      const cy = c.y + c.h / 2;

      // vecteur entre la souris et le centre de l'image
      const dx = cx - souris.x;
      const dy = cy - souris.y;
      const dist = Math.sqrt(dx * dx + dy * dy);  // distance (Pythagore)

      if (dist < RAYON && dist > 0) {
        // Plus la souris est proche, plus la poussée est forte
        const force = Math.pow(1 - dist / RAYON, 2) * FORCE;
        c.vx += (dx / dist) * force;              // pousse à l'opposé de la souris
        c.vy += (dy / dist) * force;
        c.vrot += (Math.random() - 0.5) * force;  // fait tourner un peu l'image
      }
    }

    // Retour doux vers la position d'origine (désactivé si RETOUR = 0)
    c.vx += (c.ox - c.x) * RETOUR;
    c.vy += (c.oy - c.y) * RETOUR;

    // Déplacement : la position change selon la vitesse
    c.x += c.vx;
    c.y += c.vy;
    c.rot += c.vrot;

    // Frottement : la vitesse diminue peu à peu (effet d'inertie)
    c.vx *= FROTTEMENT;
    c.vy *= FROTTEMENT;
    c.vrot *= FROTTEMENT;

    // Rebond sur les bords de l'écran
    if (c.x < 0)                          { c.x = 0;                          c.vx *= -0.6; }
    if (c.x > window.innerWidth - c.w)    { c.x = window.innerWidth - c.w;    c.vx *= -0.6; }
    if (c.y < 0)                          { c.y = 0;                          c.vy *= -0.6; }
    if (c.y > window.innerHeight - c.h)   { c.y = window.innerHeight - c.h;   c.vy *= -0.6; }

    dessiner(c);
  }

  // Demande au navigateur de rappeler cette fonction à la prochaine image
  requestAnimationFrame(animer);
}

animer();