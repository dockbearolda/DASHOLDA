export type OrderStatus =
  | "COMMANDE_A_TRAITER"
  | "COMMANDE_EN_ATTENTE"
  | "COMMANDE_A_PREPARER"
  | "MAQUETTE_A_FAIRE"
  | "PRT_A_FAIRE"
  | "EN_ATTENTE_VALIDATION"
  | "EN_COURS_IMPRESSION"
  | "PRESSAGE_A_FAIRE"
  | "CLIENT_A_CONTACTER"
  | "CLIENT_PREVENU"
  | "ARCHIVES";

export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";

export interface OrderItem {
  id: string;
  orderId: string;
  name: string;
  sku?: string | null;
  quantity: number;
  price: number;
  imageUrl?: string | null;
}

export interface Address {
  street?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  state?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  total: number;
  subtotal: number;
  shipping: number;
  tax: number;
  currency: string;
  notes?: string | null;
  category?: string | null;
  /** Peut contenir une Address OU des OldaExtraData selon l'origine de la commande */
  shippingAddress?: Record<string, unknown> | null;
  billingAddress?: Address | null;
  items: OrderItem[];
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface OrderStats {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  shippedOrders: number;
  paidOrders: number;
  todayOrders: number;
  todayRevenue: number;
}

// ── Nouveau format JSON envoyé par Olda Studio ────────────────────────────────

/** Champs extra stockés dans shippingAddress (JSONB) pour les commandes Olda Studio */
export interface OldaExtraData {
  reference?: string;            // Référence produit (ex: "H-001 · NS300")
  logoAvant?: string;            // Code fichier DTF avant (finit par "AV")
  logoArriere?: string;          // Code fichier DTF arrière (finit par "AR")
  deadline?: string;             // Date limite (ISO 8601 ou texte lisible)
  coteLogoAr?: string;           // Taille DTF arrière (ex: "A4", "270 mm")
  _source?: "olda_studio";       // Marqueur d'origine — ne pas modifier
  // Champs produit
  collection?: string;           // ex: "Homme", "Femme", "Enfant"
  coloris?: string;              // ex: "Noir", "Blanc", "Rouge"
  taille?: string;               // ex: "M", "L", "XL"
  typeProduit?: string;          // ex: "T-Shirt Premium", "Polo"
  // Couleurs logos
  couleurLogoAvant?: string;     // ex: "Rose", "Blanc"
  couleurLogoArriere?: string;   // ex: "Argent", "Or"
  // Bloc PRT (pressage)
  prt?: {
    type?: string;               // ex: "Plastisol", "Sublimation"
    refPrt?: string;             // ex: "PRT-001"
    taillePrt?: string;          // ex: "A4", "A3"
    quantite?: string;           // ex: "50"
    statutPrt?: string;          // ex: "En attente", "Programmé"
  };
}

/** Payload JSON envoyé directement par Olda Studio vers POST /api/orders */
export interface OldaCommandePayload {
  commande: string;          // ID unique de la commande (= orderNumber)
  nom: string;               // Prénom Nom du client
  telephone?: string;
  reference?: string;        // Référence produit
  logoAvant?: string;        // Finit par "AV"
  logoArriere?: string;      // Finit par "AR"
  deadline?: string;         // Date limite
  fiche?: {
    coteLogoAr?: string;     // Taille DTF arrière
  };
  prix?: {
    total?: number;
  };
  paiement?: {
    statut?: "OUI" | "NON";  // OUI = PAID, NON = PENDING
  };
  // Champs extra produit (passés dans shippingAddress)
  collection?: string;
  coloris?: string;
  taille?: string;
  typeProduit?: string;
  prt?: {
    type?: string;
    refPrt?: string;
    taillePrt?: string;
    quantite?: string;
    statutPrt?: string;
  };
}

export interface WebhookOrderPayload {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  total: number;
  subtotal: number;
  shipping?: number;
  tax?: number;
  currency?: string;
  notes?: string;
  category?: string;
  shippingAddress?: Address;
  billingAddress?: Address;
  items: {
    name: string;
    sku?: string;
    quantity: number;
    price: number;
    imageUrl?: string;
  }[];
}
