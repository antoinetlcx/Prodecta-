import type {
  MeetingContext,
  ObjectionPlaybookItem,
  ProdectaScript,
  PsychologyCard,
  SalesCheatSheet,
  TrainingCategoryMeta,
  TrainingDrill,
  TrainingModule
} from "./types";
import type {
  CommercialReport,
  FollowupStrategy,
  NegotiationStrategy,
  ObjectionStrategy,
  Preparation,
  Sector
} from "./schemas";
import { calculateCommercialScore, scoreLabel } from "./scoring";

export const sectorLabels: Record<Sector, string> = {
  chateau_domaine: "Chateau / domaine",
  hotel: "Hotel / chambres d'hotes",
  salle_sport: "Salle de sport",
  gite: "Gite / Airbnb",
  restaurant: "Restaurant",
  salle_evenementielle: "Salle evenementielle",
  autre: "Autre"
};

export const sectorQuestions: Record<Sector, string[]> = {
  chateau_domaine: [
    "Qu'est-ce qui declenche l'effet waouh quand les clients visitent sur place ?",
    "Est-ce que cet effet se ressent aujourd'hui sur votre site ?",
    "Combien represente une reservation mariage ou seminaire supplementaire ?"
  ],
  hotel: [
    "Qu'est-ce qui rassure le plus vos clients avant de reserver ?",
    "Votre site pousse-t-il assez a la reservation directe ?",
    "Quel role joue votre site face a Booking ou Airbnb ?"
  ],
  salle_sport: [
    "Qu'est-ce qui declenche une inscription chez vous ?",
    "Votre site donne-t-il envie de venir physiquement ?",
    "Le parcours vers l'essai gratuit est-il clair ?"
  ],
  gite: [
    "Qu'est-ce qui fait choisir votre logement plutot qu'un autre ?",
    "Les photos suffisent-elles a comprendre l'experience ?",
    "Votre site aide-t-il a recuperer des reservations directes ?"
  ],
  restaurant: [
    "Qu'est-ce qu'un client doit ressentir avant de reserver ?",
    "Les espaces, l'ambiance et les offres sont-ils compris assez vite ?",
    "Quelles demandes se perdent faute de projection ou de clarte ?"
  ],
  salle_evenementielle: [
    "Quels evenements recevez-vous le plus ?",
    "Les clients doivent-ils visiter avant de decider ?",
    "Combien de temps perdez-vous a repeter les memes informations ?"
  ],
  autre: [
    "Qu'est-ce que vos prospects doivent comprendre avant de vous contacter ?",
    "Ou se situe le plus gros flou dans leur decision ?",
    "Quelle action commerciale voulez-vous augmenter ?"
  ]
};

export const psychologyCards: PsychologyCard[] = [
  {
    id: "reciprocite",
    principle: "Reciprocite",
    useWhen: "Debut de relation ou prospect prudent.",
    ethicalUse: "Apporter un mini-audit utile avant de demander une suite.",
    phrase: "Je peux deja vous partager ce que je vois comme axe de valeur, meme si on ne travaille pas ensemble.",
    avoid: "Donner un cadeau pour creer une dette artificielle."
  },
  {
    id: "preuve_sociale",
    principle: "Preuve sociale",
    useWhen: "Le prospect demande si ca marche pour des lieux comparables.",
    ethicalUse: "Montrer un cas proche, sans exagerer les resultats.",
    phrase: "Sur des lieux comparables, le sujet principal etait aussi la projection avant visite.",
    avoid: "Inventer une reference ou un chiffre."
  },
  {
    id: "autorite",
    principle: "Autorite calme",
    useWhen: "Le rendez-vous part dans tous les sens.",
    ethicalUse: "Recadrer le process pour aider a acheter plus simplement.",
    phrase: "Je vous propose de separer trois sujets : le rendu, l'impact commercial et le perimetre.",
    avoid: "Dominer la conversation ou couper le client."
  },
  {
    id: "engagement",
    principle: "Cohérence / engagement",
    useWhen: "Le prospect a reconnu un probleme mais hesite.",
    ethicalUse: "Relier sa propre phrase a la prochaine etape.",
    phrase: "Vous disiez que la projection en ligne est trop faible. La suite logique est de chiffrer deux scenarios.",
    avoid: "Pieger le prospect avec ses mots."
  },
  {
    id: "perte",
    principle: "Aversion a la perte",
    useWhen: "Le projet est percu comme une depense esthetique.",
    ethicalUse: "Explorer le cout reel du statu quo.",
    phrase: "La question n'est pas seulement le cout de l'experience, mais ce que coute le manque de projection.",
    avoid: "Faire peur sans preuve."
  },
  {
    id: "contraste",
    principle: "Contraste",
    useWhen: "Prix, options ou perimetre a arbitrer.",
    ethicalUse: "Proposer deux scenarios clairs au lieu d'une remise floue.",
    phrase: "Je vous propose une version essentielle et une version complete, pour comparer proprement.",
    avoid: "Multiplier les options jusqu'a brouiller la decision."
  }
];

export const librarySections = [
  {
    title: "SPIN Selling",
    body: "Situation, Probleme, Implication, Need-payoff. Le but est de faire emerger le besoin profond avant la demo."
  },
  {
    title: "Sandler",
    body: "Contrat initial, douleur, budget, decision. Tres utile pour eviter les rendez-vous flous."
  },
  {
    title: "Challenger Sale",
    body: "Apporter un insight qui aide le prospect a comprendre son probleme autrement."
  },
  {
    title: "Cialdini",
    body: "Reciprocite, preuve sociale, autorite, coherence, rarete saine, sympathie, unite."
  },
  {
    title: "Jobs To Be Done",
    body: "Le prospect n'achete pas une app immersive, il achete un progres : rassurer, faire se projeter, vendre plus vite."
  },
  {
    title: "HBR B2B buying",
    body: "Le vendeur moderne simplifie l'achat : prochaine etape claire, moins d'options, moins de flou."
  }
];

export const trainingCategories: TrainingCategoryMeta[] = [
  {
    id: "fondamentaux",
    label: "Fondamentaux",
    description: "Les frameworks de vente a maitriser pour cadrer, diagnostiquer et qualifier."
  },
  {
    id: "psychologie",
    label: "Psychologie",
    description: "Influence ethique, biais utiles, cadrage et decision sans pression trompeuse."
  },
  {
    id: "decouverte",
    label: "Decouverte",
    description: "Questions puissantes, douleur, impact business, decideur, budget et timing."
  },
  {
    id: "objections",
    label: "Objections",
    description: "Prix, reflexion, associe, concurrence, deja un site, timing et priorite."
  },
  {
    id: "negociation",
    label: "Negociation",
    description: "Defendre la valeur, deux options, concessions et retrait elegant."
  },
  {
    id: "closing",
    label: "Closing",
    description: "Transformer l'interet en prochaine etape datee et decision plus simple."
  },
  {
    id: "relance",
    label: "Relance",
    description: "J+2, J+5, J+10, email, SMS, message court et relances apres silence."
  },
  {
    id: "scripts",
    label: "Scripts Prodecta",
    description: "Phrases pretes pour cadrage, valeur, prix, objections et closing."
  },
  {
    id: "exercices",
    label: "Exercices",
    description: "Drills courts pour entrainer les reflexes avant et apres rendez-vous."
  }
];

export const trainingModules: TrainingModule[] = [
  {
    id: "spin",
    category: "fondamentaux",
    title: "SPIN Selling",
    level: "base",
    goal: "Faire emerger le besoin profond avant de presenter la solution.",
    whyItMatters:
      "Un prospect achete rarement une fonctionnalite. Il achete une consequence positive : plus de demandes, moins de temps perdu, plus de confiance.",
    keyPrinciples: ["Situation", "Probleme", "Implication", "Need-payoff"],
    howToApply: [
      "Commencer par comprendre le parcours client actuel.",
      "Faire nommer le probleme avec les mots du prospect.",
      "Creuser le cout du probleme avant la demo.",
      "Faire verbaliser le resultat desire."
    ],
    script:
      "Avant de parler solution, j'aimerais comprendre ce qui se passe aujourd'hui quand un client doit se projeter a distance.",
    avoid: "Passer en demonstration avant que le prospect ait nomme une douleur.",
    drill: "Prends une objection prix et remonte a l'implication business avec trois questions."
  },
  {
    id: "sandler",
    category: "fondamentaux",
    title: "Sandler Selling System",
    level: "intermediaire",
    goal: "Eviter les rendez-vous flous avec un contrat initial clair.",
    whyItMatters:
      "Un bon cadrage protege le commercial : objectif, temps, decision et prochaine etape sont connus des le depart.",
    keyPrinciples: ["Contrat initial", "Douleur", "Budget", "Decision"],
    howToApply: [
      "Annoncer comment le RDV va se derouler.",
      "Demander l'accord du prospect sur le cadre.",
      "Verifier budget et decision sans agressivite.",
      "Finir par une sortie claire : oui, non, ou prochaine etape datee."
    ],
    script:
      "Ca vous va si on se garde 10 minutes pour comprendre votre contexte, 20 minutes pour voir si Prodecta peut aider, puis 5 minutes pour decider de la suite ?",
    avoid: "Accepter un RDV qui finit par 'envoyez-moi une proposition' sans retour date.",
    drill: "Ecris ton contrat initial en 30 secondes, puis raccourcis-le de moitie."
  },
  {
    id: "challenger",
    category: "fondamentaux",
    title: "Challenger Sale",
    level: "avance",
    goal: "Apporter un insight qui change la lecture du probleme.",
    whyItMatters:
      "Le prospect ne sait pas toujours pourquoi son digital ne vend pas. Le role du commercial est d'eclairer le cout du statu quo.",
    keyPrinciples: ["Teach", "Tailor", "Take control"],
    howToApply: [
      "Nommer un angle que le prospect n'a pas formule.",
      "Relier l'insight a son secteur.",
      "Montrer pourquoi le statu quo coute quelque chose.",
      "Garder le controle du process sans dominer la personne."
    ],
    script:
      "Souvent le probleme n'est pas que le site est mauvais, mais que la valeur physique ne se ressent pas assez pour declencher la decision.",
    avoid: "Faire la lecon ou critiquer le travail existant.",
    drill: "Transforme 'votre site est vieux' en insight business non agressif."
  },
  {
    id: "meddic-bant",
    category: "fondamentaux",
    title: "MEDDIC + BANT",
    level: "intermediaire",
    goal: "Qualifier sans transformer le RDV en interrogatoire.",
    whyItMatters:
      "Une vente avance quand les criteres, l'impact, le budget, le timing et le processus de decision sont explicites.",
    keyPrinciples: ["Metrics", "Economic buyer", "Decision criteria", "Budget", "Authority", "Timing"],
    howToApply: [
      "Demander ce qui rendrait le projet rentable.",
      "Identifier qui valide vraiment.",
      "Demander les criteres de choix.",
      "Faire dater la prochaine etape."
    ],
    script:
      "Pour vous faire une proposition utile, il faut surtout que je comprenne vos criteres de choix : rendu, impact commercial, budget, timing ou facilite de decision ?",
    avoid: "Cocher des cases de qualification sans creer de valeur pour le prospect.",
    drill: "Liste les 5 informations manquantes d'un deal et formule-les en questions naturelles."
  },
  {
    id: "gap-selling",
    category: "decouverte",
    title: "Gap Selling",
    level: "avance",
    goal: "Vendre l'ecart entre la situation actuelle et la situation desiree.",
    whyItMatters:
      "Plus l'ecart est clair, plus le prix devient une consequence du probleme a resoudre.",
    keyPrinciples: ["Etat actuel", "Etat futur", "Impact", "Urgence"],
    howToApply: [
      "Decrire ce qui se passe aujourd'hui.",
      "Faire imaginer le parcours ideal.",
      "Quantifier le cout de l'ecart.",
      "Relier l'offre au pont entre les deux."
    ],
    script:
      "Aujourd'hui, qu'est-ce que vos visiteurs ne comprennent pas assez vite ? Et idealement, qu'est-ce qu'ils devraient ressentir avant meme de vous appeler ?",
    avoid: "Presenter Prodecta comme un bonus visuel plutot que comme un pont commercial.",
    drill: "Ecris un avant/apres pour un chateau, un hotel et une salle de sport."
  },
  {
    id: "cialdini",
    category: "psychologie",
    title: "Cialdini, version ethique",
    level: "base",
    goal: "Utiliser l'influence pour clarifier, pas pour pieger.",
    whyItMatters:
      "La psychologie commerciale aide a rendre la decision plus simple quand elle respecte la liberte du prospect.",
    keyPrinciples: ["Reciprocite", "Preuve sociale", "Autorite", "Engagement", "Rarete saine"],
    howToApply: [
      "Garder la regle centrale : influence oui, pression non, mensonge jamais.",
      "Donner un mini-audit utile avant de demander une suite.",
      "Montrer une reference comparable sans inventer.",
      "Recadrer calmement quand le RDV se disperse.",
      "Relier la prochaine etape aux mots du prospect."
    ],
    script:
      "Je peux deja vous partager ce que je vois comme axe de valeur, meme si on ne travaille pas ensemble.",
    avoid: "Creer une dette artificielle, mentir sur une reference ou inventer une urgence.",
    drill: "Pour chaque principe, ecris une utilisation ethique et une derive interdite."
  },
  {
    id: "loss-aversion",
    category: "psychologie",
    title: "Aversion a la perte",
    level: "intermediaire",
    goal: "Faire regarder le cout du statu quo sans dramatiser.",
    whyItMatters:
      "Un prospect bouge plus facilement quand il comprend ce qu'il perd en ne changeant rien.",
    keyPrinciples: ["Cout du statu quo", "Risque d'inaction", "Impact concret"],
    howToApply: [
      "Demander ce qui se perd quand le client ne se projette pas.",
      "Relier la perte a un indicateur simple.",
      "Rester factuel, jamais anxiogene.",
      "Proposer un test ou un scenario limite."
    ],
    script:
      "La question n'est pas seulement le cout du projet, mais ce que coute le manque de projection avant la visite.",
    avoid: "Faire peur sans preuve ou pousser une fausse urgence.",
    drill: "Transforme 'c'est cher' en discussion sur le cout du non-changement."
  },
  {
    id: "pricing-two-options",
    category: "negociation",
    title: "Contraste et deux options",
    level: "base",
    goal: "Eviter la remise brute en comparant deux perimetres clairs.",
    whyItMatters:
      "Deux options donnent du controle au prospect sans casser la valeur du travail.",
    keyPrinciples: ["Option essentielle", "Option complete", "Perimetre avant prix"],
    howToApply: [
      "Definir ce qui cree vraiment la valeur.",
      "Proposer une version essentielle et une version complete.",
      "Reduire le perimetre avant de reduire le prix.",
      "Faire choisir le bon niveau d'ambition."
    ],
    script:
      "Je vous propose de comparer une version essentielle centree sur les espaces qui vendent le plus, et une version complete avec suivi plus avance.",
    avoid: "Repondre 'je peux faire moins cher' sans contrepartie.",
    drill: "Pour une fourchette a 18-28k, ecris deux options avec perimetres differents."
  },
  {
    id: "impact-questions",
    category: "decouverte",
    title: "Questions d'impact",
    level: "base",
    goal: "Faire passer le RDV de 'joli site' a 'enjeu business'.",
    whyItMatters:
      "Le prix devient defendable quand le besoin est relie a conversion, temps, qualite des demandes ou panier moyen.",
    keyPrinciples: ["Impact financier", "Impact temps", "Impact confiance", "Impact decision"],
    howToApply: [
      "Demander ce qui se passe quand le prospect ne comprend pas.",
      "Creuser les demandes perdues ou mal qualifiees.",
      "Faire nommer le role du site dans la vente.",
      "Relier chaque demo a un enjeu cite."
    ],
    script:
      "Quand un visiteur ne se projette pas assez, il appelle, il compare, il repousse ou il abandonne ?",
    avoid: "Accepter 'on veut moderniser' comme besoin suffisant.",
    drill: "Prepare 10 questions d'impact pour le secteur actuel."
  },
  {
    id: "price-objection",
    category: "objections",
    title: "Objection prix",
    level: "base",
    goal: "Comprendre si le sujet est budget, ROI, priorite ou valeur percue.",
    whyItMatters:
      "La phrase 'c'est trop cher' cache souvent un manque de valeur claire, un risque interne ou une priorite non tranchee.",
    keyPrinciples: ["Clarifier", "Ancrer", "Comparer", "Contrepartie"],
    howToApply: [
      "Valider l'objection sans se justifier.",
      "Demander la nature exacte du frein.",
      "Revenir au cout du probleme.",
      "Proposer deux perimetres plutot qu'une remise."
    ],
    script:
      "Je comprends. Pour etre juste, vous le voyez comme un sujet de budget disponible, de ROI attendu, ou de priorite par rapport a d'autres projets ?",
    avoid: "Baisser le prix tout de suite.",
    drill: "Reponds a 'on n'a pas l'argent' en 20 secondes sans pression."
  },
  {
    id: "associate-objection",
    category: "objections",
    title: "Doit voir avec son associe",
    level: "intermediaire",
    goal: "Transformer un blocage interne en plan de decision.",
    whyItMatters:
      "Si tu ne sais pas qui decide ni avec quels criteres, ta proposition part dans le vide.",
    keyPrinciples: ["Decision map", "Critere interne", "Support de revente"],
    howToApply: [
      "Demander ce qui comptera pour l'associe.",
      "Identifier son role : budget, vision, technique, priorite.",
      "Proposer un support simple a transmettre.",
      "Dater le retour a plusieurs si possible."
    ],
    script:
      "Pour que je vous aide a lui presenter ca simplement, qu'est-ce qui comptera le plus pour lui : budget, rendu, priorite ou impact commercial ?",
    avoid: "Envoyer un devis sans connaitre le vrai decideur.",
    drill: "Ecris un mini-message que ton champion peut transferer a son associe."
  },
  {
    id: "closing-next-step",
    category: "closing",
    title: "Closing prochaine etape",
    level: "base",
    goal: "Sortir du RDV avec une action datee.",
    whyItMatters:
      "Un deal sans prochaine etape datee devient une relance froide.",
    keyPrinciples: ["Choix simple", "Date", "Owner", "Objet du prochain RDV"],
    howToApply: [
      "Resumer ce qui a ete valide.",
      "Proposer deux options de suite.",
      "Faire choisir une date precise.",
      "Clarifier ce qui sera decide a ce moment."
    ],
    script:
      "Le plus simple est que je vous envoie deux scenarios, puis on se garde 20 minutes pour choisir le bon perimetre. Mardi ou mercredi ?",
    avoid: "Finir par 'je vous laisse revenir vers moi'.",
    drill: "Transforme 5 fins de RDV molles en prochaines etapes datees."
  },
  {
    id: "followup-j2",
    category: "relance",
    title: "Relance J+2 utile",
    level: "base",
    goal: "Relancer sans pression en simplifiant la decision.",
    whyItMatters:
      "Une bonne relance n'est pas un 'je reviens vers vous', c'est une aide a choisir.",
    keyPrinciples: ["Rappel du besoin", "Choix simple", "Faible friction"],
    howToApply: [
      "Rappeler l'enjeu avec les mots du prospect.",
      "Proposer un choix entre deux scenarios.",
      "Offrir un court call de clarification.",
      "Eviter le ton impatient."
    ],
    script:
      "Je me permets de revenir sur les deux scenarios. Le plus simple est peut-etre de choisir d'abord le perimetre qui aide le mieux vos visiteurs a se projeter.",
    avoid: "Relancer sans angle, juste pour demander une reponse.",
    drill: "Ecris une relance J+2 apres objection prix, puis une version plus directe."
  },
  {
    id: "prodecta-scripts",
    category: "scripts",
    title: "Scripts Prodecta",
    level: "base",
    goal: "Avoir des phrases pretes pour cadrage, valeur, prix et closing.",
    whyItMatters:
      "Sous pression, un commercial retombe sur ses automatismes. Les bons scripts evitent la justification et gardent le cap.",
    keyPrinciples: ["Phrase courte", "Question ouverte", "Lien valeur", "Suite claire"],
    howToApply: [
      "Memoriser 5 phrases signature.",
      "Adapter au secteur du prospect.",
      "Copier les scripts dans tes notes avant RDV.",
      "Ne jamais reciter si la conversation demande autre chose."
    ],
    script:
      "Un site classique informe. Une experience immersive fait visiter, comprendre et se projeter.",
    avoid: "Sonner comme un robot ou forcer une phrase qui ne colle pas au moment.",
    drill: "Lis chaque script a voix haute et raccourcis-le de 20%."
  }
];

export const objectionPlaybook: ObjectionPlaybookItem[] = [
  {
    id: "prix",
    label: "C'est trop cher",
    triggers: ["prix", "cher", "budget", "tarif", "devis"],
    diagnosis: "La valeur percue n'est pas encore reliee au cout du probleme.",
    question: "Vous le voyez surtout comme un sujet de budget disponible, de ROI, ou de priorite ?",
    phrase:
      "Je comprends. Avant de parler prix, je veux etre sur qu'on compare le cout du projet avec ce que le manque de projection vous coute aujourd'hui.",
    strategy: "Defendre la valeur puis proposer deux perimetres.",
    avoid: "Faire une remise immediate."
  },
  {
    id: "pas-argent",
    label: "Pas d'argent / budget impossible",
    triggers: ["pas d'argent", "pas les moyens", "pas de tresorerie", "budget serre", "budget limite", "pas dargent"],
    diagnosis: "Le prospect dit peut-etre non au risque financier plus qu'a la solution.",
    question:
      "Est-ce que c'est un budget impossible maintenant, ou un budget possible si le perimetre et le retour attendu sont plus clairs ?",
    phrase:
      "Je comprends. Dans ce cas, je ne vais pas vous pousser sur une version trop large. On peut regarder un perimetre essentiel qui preserve la valeur commerciale sans vous mettre en tension.",
    strategy: "Reduire le perimetre, phaser le projet ou poser un retrait elegant.",
    avoid: "Insister comme si l'argent etait un faux probleme."
  },
  {
    id: "associe",
    label: "Je dois voir avec mon associe",
    triggers: ["associe", "direction", "proprietaire", "decideur", "equipe"],
    diagnosis: "Le processus de decision n'est pas cartographie.",
    question: "Qu'est-ce qui comptera le plus pour lui : budget, priorite, rendu ou impact commercial ?",
    phrase:
      "Tres bien. Pour vous aider a lui presenter ca simplement, je peux reformuler le projet autour de ses criteres de decision.",
    strategy: "Identifier le decideur, ses criteres et dater le retour.",
    avoid: "Envoyer une proposition sans savoir qui tranche."
  },
  {
    id: "reflechir",
    label: "Je vais reflechir",
    triggers: ["reflechir", "on verra", "je reviens", "plus tard"],
    diagnosis: "Objection floue : le risque est un deal qui dort.",
    question: "Qu'est-ce qui doit etre clarifie en priorite : budget, rendu, timing ou decision interne ?",
    phrase:
      "Bien sur. Pour que votre reflexion soit simple, j'aimerais identifier le vrai point a clarifier avant de vous laisser repartir avec trop de flou.",
    strategy: "Transformer le flou en critere de decision.",
    avoid: "Repondre seulement 'pas de souci, tenez-moi au courant'."
  },
  {
    id: "pas-prioritaire",
    label: "Pas prioritaire",
    triggers: ["pas prioritaire", "pas maintenant", "cette annee", "plus urgent"],
    diagnosis: "Le cout du statu quo n'est pas assez visible.",
    question:
      "Qu'est-ce qui rendrait ce sujet prioritaire : plus de demandes, moins d'appels, meilleure qualification ou image premium ?",
    phrase:
      "Je comprends. Dans ce cas, le bon sujet est peut-etre de mesurer ce que le manque de projection vous coute avant de decider si ca merite de passer devant.",
    strategy: "Revenir a l'impact business ou sortir proprement.",
    avoid: "Plaider l'urgence sans preuve."
  },
  {
    id: "deja-site",
    label: "On a deja un site",
    triggers: ["deja un site", "site existe", "refait le site", "agence web"],
    diagnosis: "Le prospect confond presence digitale et projection commerciale.",
    question: "Votre site informe-t-il seulement, ou aide-t-il vraiment les visiteurs a se projeter et a agir ?",
    phrase:
      "Justement, l'objectif n'est pas de remplacer ce qui marche. C'est d'ajouter une couche de projection qui aide le visiteur a comprendre la valeur du lieu.",
    strategy: "Positionner Prodecta comme levier de conversion, pas comme site vitrine.",
    avoid: "Critiquer le site existant."
  },
  {
    id: "concurrence",
    label: "On compare avec d'autres",
    triggers: ["concurrent", "autre prestataire", "compare", "agence", "moins cher"],
    diagnosis: "Le prospect compare peut-etre des perimetres non equivalents.",
    question: "Vous comparez surtout le rendu, le prix, l'accompagnement ou l'impact commercial ?",
    phrase:
      "C'est sain de comparer. Pour que ce soit juste, il faut surtout comparer le perimetre et le role commercial que l'experience doit jouer.",
    strategy: "Revenir aux criteres de choix et au resultat attendu.",
    avoid: "Critiquer les concurrents."
  },
  {
    id: "timing",
    label: "Mauvais timing",
    triggers: ["timing", "delai", "planning", "saison", "pas le moment"],
    diagnosis: "La fenetre projet n'est pas alignee avec la saison commerciale.",
    question:
      "Quelle periode aurait le plus d'impact : avant la haute saison, avant les salons, ou avant vos prochaines campagnes ?",
    phrase:
      "On peut adapter le rythme. L'important est de ne pas rater la periode ou la projection en ligne influence le plus vos demandes.",
    strategy: "Phaser, prioriser ou dater une reprise.",
    avoid: "Pousser un calendrier qui ignore la realite operationnelle."
  }
];

export const prodectaScripts: ProdectaScript[] = [
  {
    id: "ouverture",
    title: "Ouverture de RDV",
    moment: "Debut",
    text:
      "L'idee aujourd'hui n'est pas de faire une presentation generique. Je veux comprendre votre parcours client, puis vous montrer uniquement ce qui peut avoir du sens.",
    whyItWorks: "Cadre le RDV et evite la demo prematuree."
  },
  {
    id: "valeur-physique",
    title: "Valeur physique en ligne",
    moment: "Diagnostic",
    text:
      "Souvent, le sujet n'est pas que le site est mauvais, mais que la valeur physique du lieu ne se ressent pas assez a distance.",
    whyItWorks: "Deplace la conversation du design vers la conversion."
  },
  {
    id: "prix",
    title: "Prix sans remise",
    moment: "Prix",
    text:
      "On peut ajuster le perimetre, mais je prefere preserver ce qui cree vraiment la valeur commerciale.",
    whyItWorks: "Defend la valeur sans fermer la discussion."
  },
  {
    id: "closing",
    title: "Closing propre",
    moment: "Fin RDV",
    text:
      "Le plus simple est que je vous propose deux scenarios, puis on se garde 20 minutes pour choisir le bon perimetre.",
    whyItWorks: "Donne une prochaine etape claire sans pression."
  },
  {
    id: "retrait",
    title: "Retrait elegant",
    moment: "Blocage",
    text:
      "Si ce n'est pas le bon moment, je prefere vous le dire franchement et revenir quand le sujet sera plus prioritaire.",
    whyItWorks: "Garde la relation saine et evite la pression inutile."
  }
];

export const trainingDrills: TrainingDrill[] = [
  {
    id: "drill-prix",
    title: "Objection prix en 20 secondes",
    category: "objections",
    situation: "Le prospect dit : 'elle veut pas d'argent' ou 'c'est trop cher'.",
    objective: "Ne pas te justifier, clarifier le vrai frein et proposer un perimetre adapte.",
    prompt: "Reponds avec une validation, une question, puis une option de suite.",
    expectedMove:
      "Je comprends. Est-ce que c'est impossible maintenant, ou possible si on reduit le perimetre aux espaces qui vendent le plus ?",
    selfCheck: ["Pas de remise brute", "Question de clarification", "Lien avec la valeur", "Sortie propre"]
  },
  {
    id: "drill-silence",
    title: "Silence utile",
    category: "decouverte",
    situation: "Le prospect devient silencieux apres la demo.",
    objective: "Rendre la parole au prospect au lieu de combler.",
    prompt: "Formule une phrase courte qui invite un avis franc.",
    expectedMove: "Je m'arrete deux secondes. Qu'est-ce que vous en pensez franchement ?",
    selfCheck: ["Phrase courte", "Pas de justification", "Question ouverte", "Silence apres la question"]
  },
  {
    id: "drill-associe",
    title: "Associe decideur",
    category: "objections",
    situation: "Le prospect doit voir avec son associe.",
    objective: "Comprendre les criteres de l'associe et aider ton champion.",
    prompt: "Pose une question qui revele le critere de decision.",
    expectedMove: "Qu'est-ce qui comptera le plus pour lui : budget, rendu, priorite ou impact commercial ?",
    selfCheck: ["Critere interne", "Support de decision", "Date de retour", "Pas de devis aveugle"]
  },
  {
    id: "drill-closing",
    title: "Closing alternatif",
    category: "closing",
    situation: "Le prospect est interesse mais attend la proposition.",
    objective: "Obtenir une prochaine etape datee.",
    prompt: "Propose deux creneaux et l'objet du prochain echange.",
    expectedMove:
      "Je vous envoie deux scenarios, puis on se garde 20 minutes pour choisir le perimetre. Mardi ou mercredi ?",
    selfCheck: ["Deux options", "Date", "Objet clair", "Pas de fin molle"]
  }
];

export const salesCheatSheets: SalesCheatSheet[] = [
  {
    id: "avant-rdv",
    title: "Avant RDV",
    items: [
      "Connaitre le secteur et le modele economique du prospect.",
      "Preparer 5 questions d'impact.",
      "Preparer une preuve ou demo proche.",
      "Definir l'objectif de sortie : prochaine etape, proposition, decision."
    ]
  },
  {
    id: "pendant-rdv",
    title: "Pendant RDV",
    items: [
      "Cadrer le RDV.",
      "Diagnostiquer avant demo.",
      "Laisser des silences.",
      "Relier chaque fonctionnalite a une douleur dite par le prospect."
    ]
  },
  {
    id: "prix",
    title: "Quand le prix arrive",
    items: [
      "Valider l'objection.",
      "Clarifier budget, ROI, priorite ou decision interne.",
      "Comparer deux perimetres.",
      "Ne jamais baisser sans contrepartie."
    ]
  },
  {
    id: "apres-rdv",
    title: "Apres RDV",
    items: [
      "Envoyer un recap centre sur le besoin reel.",
      "Proposer deux scenarios.",
      "Relancer J+2 avec aide au choix.",
      "Relancer J+10 avec retrait elegant si le sujet dort."
    ]
  }
];

export const defaultMeetingContext: MeetingContext = {
  prospectName: "Chateau de Villeneuve",
  contactName: "Sophie Martin",
  sector: "chateau_domaine",
  meetingType: "decouverte",
  objective: "Comprendre le besoin, montrer une demo ciblee et envoyer deux scenarios de proposition.",
  knownContext:
    "Domaine evenementiel premium. Souhaite augmenter les reservations directes et mieux valoriser les espaces avant visite.",
  website: "chateau-villeneuve.fr",
  offer: "App immersive + dashboard + integration site",
  examplesToShow: "Visite immersive 360, dashboard clics espaces, cas domaine evenementiel",
  maturity: "tiede",
  expectedDuration: 60,
  priceDiscussed: "",
  consentObtained: true,
  noRecordingMode: false
};

export function buildPreparationFallback(context: MeetingContext): Preparation {
  const questions = sectorQuestions[context.sector];
  return {
    primaryAngle:
      "Aider le prospect a transformer la valeur physique de son lieu en preuve commerciale visible en ligne.",
    openingLine:
      "L'idee aujourd'hui n'est pas de faire une presentation generique. Je veux comprendre votre parcours client, puis vous montrer uniquement ce qui peut avoir du sens.",
    priorityQuestions: [
      ...questions,
      "Qu'est-ce qui se passe quand un client ne se projette pas suffisamment ?"
    ],
    likelyObjections: [
      "C'est trop cher",
      "On a deja un site",
      "Je dois voir avec mon associe",
      "Ce n'est pas prioritaire cette annee"
    ],
    influenceLevers: [
      "Autorite calme pour cadrer le rendez-vous",
      "Aversion a la perte pour chiffrer le statu quo",
      "Preuve sociale avec un lieu comparable",
      "Contraste avec deux scenarios"
    ],
    proofToShow: [
      "Avant / apres de projection digitale",
      "Exemple de parcours visiteur avec CTA",
      "Dashboard d'attention par espace"
    ],
    targetClosing:
      "Obtenir l'accord pour une proposition en deux scenarios et une date de retour.",
    mistakesToAvoid: [
      "Commencer par la demo",
      "Baisser le prix sans contrepartie",
      "Finir sans prochaine etape datee"
    ]
  };
}

export function buildReportFallback(context: MeetingContext, transcript: string): CommercialReport {
  const text = `${context.knownContext} ${context.objective} ${transcript}`.toLowerCase();
  const score = calculateCommercialScore({
    needExpressed: /besoin|objectif|veut|souhaite|interesse/.test(text),
    clearPain: /bloque|probleme|difficile|pas clair|projection|hesite/.test(text),
    businessImpact: /reservation|conversion|vente|temps|roi|budget|perd/.test(text),
    decisionMaker: /associe|decideur|direction|proprietaire|equipe/.test(text),
    budgetDiscussed: /prix|budget|cher|tarif|devis/.test(text),
    timingKnown: /date|semaine|mois|t[1-4]|delai|planning/.test(text),
    positiveInterest: /demo|exemple|interesse|envoyez|proposition/.test(text),
    concreteNextStep: /rappelle|rdv|mardi|mercredi|prochaine|date/.test(text),
    riskSignals: (text.match(/reflechir|plus tard|pas prioritaire|budget/g) ?? []).length,
    objections: (text.match(/cher|deja|associe|budget/g) ?? []).length
  });

  return {
    executiveSummary:
      "Le rendez-vous montre un interet credible, avec un besoin de projection et de clarification commerciale. Le risque principal est que le projet soit vu comme une depense visuelle plutot qu'un outil de conversion. La suite recommandee est d'envoyer deux scenarios et de dater un retour.",
    commercialTemperature: {
      score,
      label: scoreLabel(score),
      justification:
        "Score estime a partir des signaux de besoin, impact business, budget, decision et prochaine etape."
    },
    expressedNeed: "Moderniser la presentation digitale et mieux montrer l'offre.",
    realNeed:
      "Faire ressentir la valeur du lieu en ligne pour rassurer, qualifier et convertir plus naturellement.",
    pains: {
      primary: "Projection insuffisante avant le premier contact.",
      secondary: "Le site ne traduit pas assez la qualite reelle du lieu.",
      business: "Demandes qualifiees perdues ou ralentissement de la decision.",
      emotional: "Frustration que le digital ne rende pas justice au lieu."
    },
    positiveSignals: [
      {
        title: "Demande d'exemple",
        quoteOrMoment: "Le prospect veut voir un cas proche.",
        interpretation: "Il cherche a se projeter dans une solution concrete.",
        recommendation: "Envoyer un exemple comparable et relier chaque capture a son enjeu."
      },
      {
        title: "Sujet prix aborde",
        quoteOrMoment: "Le budget ou le tarif apparait dans l'echange.",
        interpretation: "Le prospect teste la valeur et le perimetre.",
        recommendation: "Repondre avec deux scenarios plutot qu'une remise."
      }
    ],
    riskSignals: [
      {
        title: "Decision interne floue",
        quoteOrMoment: "Un associe, proprietaire ou decideur doit valider.",
        interpretation: "Le processus d'achat n'est pas verrouille.",
        recommendation: "Identifier ce qui comptera pour le decideur et proposer un support de decision."
      }
    ],
    objections: [
      {
        apparent: "C'est cher",
        probableReality: "La valeur percue n'est pas encore reliee au ROI.",
        response:
          "Je comprends. Le plus important est de savoir si on regarde ca comme une depense de creation ou comme un outil commercial."
      }
    ],
    performance: {
      framing: "Bon cadrage si le contrat initial a ete pose des le debut.",
      diagnostic: "A renforcer en quantifiant davantage l'impact business.",
      listening: "Surveiller le ratio parole/ecoute et laisser plus de silences.",
      valueSelling: "Continuer a vendre le resultat plutot que la fonctionnalite.",
      objectionHandling: "Clarifier l'objection avant de repondre.",
      closing: "Obtenir une date precise de retour et le role de chaque decideur."
    },
    missedMoments: [
      {
        moment: "Prix percu comme eleve",
        whatHappened: "Risque de concession trop rapide.",
        betterResponse:
          "On peut ajuster le perimetre, mais je prefere preserver ce qui cree vraiment la valeur commerciale."
      }
    ],
    priceStrategy: {
      strategy: "deux_options",
      reasoning:
        "Le prospect semble interesse mais prudent. Deux scenarios simplifient l'achat sans degrader la valeur.",
      recommendedPhrase:
        "Je vous propose une version essentielle centree sur les espaces les plus vendeurs, et une version complete avec dashboard et modules avances."
    },
    negotiationStrategy: {
      posture: "Consultative, calme, orientee valeur.",
      limits: "Ne pas baisser le prix sans reduire le perimetre ou obtenir une contrepartie.",
      possibleConcessions:
        "Acompte, decision rapide, droit d'utiliser le projet comme reference, paiement comptant.",
      nextMove: "Envoyer deux scenarios et fixer un retour court."
    },
    nextAction: {
      action: "Envoyer une proposition en deux niveaux avec un angle ROI/projection.",
      timing: "Sous 24 heures, puis relance J+2.",
      owner: "Vous"
    },
    recommendedEmail: {
      subject: `Suite a notre echange - ${context.prospectName}`,
      body:
        "Bonjour,\n\nMerci pour notre echange. J'ai retenu un enjeu central : mieux faire ressentir la valeur de votre lieu en ligne pour aider vos visiteurs a se projeter plus vite.\n\nJe vous propose deux scenarios : une version essentielle centree sur les espaces prioritaires, et une version complete avec dashboard et suivi des actions.\n\nLe plus simple serait de se garder 20 minutes pour choisir le bon perimetre.\n\nBien a vous,"
    },
    followups: [
      {
        timing: "J+2",
        angle: "Simplifier la decision",
        message: "Avez-vous pu regarder les deux scenarios ? Je peux vous aider a choisir le plus coherent."
      },
      {
        timing: "J+5",
        angle: "Revenir sur la valeur",
        message: "Le point cle reste la projection avant visite et l'impact sur vos demandes qualifiees."
      },
      {
        timing: "J+10",
        angle: "Retrait elegant",
        message: "Si ce n'est pas prioritaire maintenant, je peux simplement revenir vers vous plus tard."
      }
    ]
  };
}

export function buildFollowupFallback(context: string): FollowupStrategy {
  const isPrice = /prix|cher|budget|tarif/i.test(context);
  return {
    diagnosis: isPrice
      ? "Prospect interesse mais pas encore convaincu du ROI. Le sujet est probablement la valeur percue plus que le budget absolu."
      : "La situation manque de prochaine etape claire. Il faut reduire le flou et remettre une decision simple devant le prospect.",
    probableRealObjection: isPrice
      ? "Valeur commerciale insuffisamment ancree."
      : "Priorite ou processus de decision non clarifie.",
    recommendedStrategy: isPrice
      ? "Maintenir la valeur et proposer deux scenarios."
      : "Relance courte, utile, orientee clarification.",
    pricePosture: "Ne pas baisser sans contrepartie. Ajuster le perimetre si necessaire.",
    channel: "Email puis appel court si pas de reponse.",
    timing: "Maintenant si plus de 48h sans retour, sinon attendre J+2.",
    email: {
      subject: "Suite a notre echange",
      body:
        "Bonjour,\n\nJe reviens vers vous avec une idee simple : plutot que de reduire la qualite, on peut comparer deux scenarios et prioriser les espaces qui ont le plus d'impact commercial.\n\nVous preferez que je vous detaille la version essentielle ou la version complete en premier ?\n\nBien a vous,"
    },
    sms:
      "Bonjour, je vous ai envoye deux scenarios pour simplifier la decision. Je peux vous aider a choisir le bon perimetre.",
    shortMessage:
      "Bonjour, je me permets de vous relancer suite a notre echange. L'idee est surtout de clarifier le scenario le plus utile pour votre objectif commercial.",
    softVersion:
      "Je voulais simplement savoir si le sujet est toujours d'actualite ou s'il vaut mieux que je revienne vers vous plus tard.",
    directVersion:
      "Pour avancer proprement, il nous manque surtout un choix : version essentielle, version complete, ou pause du sujet.",
    closingVersion:
      "Si le sujet est prioritaire, je vous propose de valider le perimetre cette semaine. Sinon, je le mets en suivi plus tard.",
    nextAction: "Envoyer l'email, puis relancer par telephone si aucune reponse sous 48h."
  };
}

type ObjectionFallbackInput =
  | string
  | {
      objection: string;
      context?: string;
      price?: string;
      prospectName?: string;
      objective?: string;
    };

function normalizeFallbackInput(input: ObjectionFallbackInput) {
  if (typeof input === "string") {
    return {
      objection: input,
      context: "",
      price: "",
      prospectName: "",
      objective: ""
    };
  }

  return {
    objection: input.objection,
    context: input.context ?? "",
    price: input.price ?? "",
    prospectName: input.prospectName ?? "",
    objective: input.objective ?? ""
  };
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, " ");
}

function getObjectionPlaybookMatch(input: ObjectionFallbackInput): ObjectionPlaybookItem {
  const normalized = normalizeFallbackInput(input);
  const text = normalizeText(
    `${normalized.objection} ${normalized.context} ${normalized.price} ${normalized.objective}`
  );

  const scored = objectionPlaybook
    .map((item) => {
      const matchedTriggers = item.triggers.filter((trigger) =>
        text.includes(normalizeText(trigger))
      );
      return {
        item,
        score: matchedTriggers.reduce((sum, trigger) => sum + normalizeText(trigger).length, 0)
      };
    })
    .sort((a, b) => b.score - a.score);

  return scored[0]?.score ? scored[0].item : objectionPlaybook[0];
}

export function buildNegotiationFallback(input: ObjectionFallbackInput): NegotiationStrategy {
  const normalized = normalizeFallbackInput(input);
  const text = normalizeText(
    `${normalized.objection} ${normalized.context} ${normalized.price} ${normalized.objective}`
  );
  const playbook = getObjectionPlaybookMatch(input);
  const noMoney = playbook.id === "pas-argent";
  const competitor = playbook.id === "concurrence";
  const timing = playbook.id === "timing" || playbook.id === "pas-prioritaire";
  const decision = playbook.id === "associe";
  const limitedBudget =
    noMoney || /budget limite|pas le budget|trop cher|cher|pas d argent|pas les moyens/i.test(text);
  const recommendedStrategy: NegotiationStrategy["recommendedStrategy"] = noMoney
    ? "reduire_perimetre"
    : competitor
      ? "defendre_prix"
      : timing
        ? "retrait_elegant"
        : decision
          ? "concession_contrepartie"
          : limitedBudget
            ? "deux_options"
            : "defendre_prix";
  const priceLabel = normalized.price ? ` autour de ${normalized.price}` : "";

  return {
    diagnosis: `${playbook.diagnosis} Le sujet doit etre traite comme une decision de perimetre et de valeur${priceLabel}, pas comme une remise automatique.`,
    recommendedStrategy,
    valueAnchor:
      "Une app immersive doit etre regardee comme un levier de projection, de qualification et de conversion, pas comme une simple creation visuelle.",
    phraseToSay: noMoney
      ? "Je comprends. Dans ce cas, je prefere reduire le perimetre plutot que degrader la valeur : concentrons-nous sur ce qui peut vraiment aider vos visiteurs a se projeter."
      : playbook.phrase,
    phraseToAvoid: noMoney
      ? "Je vais essayer de vous faire un prix."
      : "Je peux faire moins cher.",
    concessionRules: [
      "Pas de remise sans contrepartie claire.",
      "Reduire le perimetre avant de reduire le prix.",
      "Proposer deux options pour simplifier la decision.",
      decision
        ? "Si un associe decide, obtenir ses criteres avant d'envoyer la proposition."
        : "Demander une date de decision si concession."
    ],
    nextStep: noMoney
      ? "Proposer une version essentielle ou acter un retrait elegant avec reprise datee."
      : `${playbook.strategy} Puis cadrer une prochaine etape datee.`
  };
}

export function buildObjectionFallback(input: ObjectionFallbackInput): ObjectionStrategy {
  const normalized = normalizeFallbackInput(input);
  const playbook = getObjectionPlaybookMatch(input);
  const text = normalizeText(`${normalized.objection} ${normalized.context}`);
  const price = ["prix", "pas-argent"].includes(playbook.id);
  const riskLevel: ObjectionStrategy["riskLevel"] =
    playbook.id === "pas-argent" || text.includes("impossible")
      ? "eleve"
      : playbook.id === "reflechir" || playbook.id === "associe"
        ? "moyen"
        : price
          ? "moyen"
          : "faible";

  return {
    diagnosis: `${playbook.diagnosis} Frein detecte : ${playbook.label}.`,
    riskLevel,
    psychologicalLevers: price
      ? ["Ancrage valeur", "Contraste", "Aversion a la perte"]
      : ["Clarification", "Engagement", "Controle doux du process"],
    questionToAsk: playbook.question,
    phraseToSay: playbook.phrase,
    mistakeToAvoid: playbook.avoid,
    nextAction: `${playbook.strategy} ${
      normalized.price ? `Prix discute : ${normalized.price}. ` : ""
    }Finir par une prochaine etape claire.`
  };
}
