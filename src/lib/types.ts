// ─────────────────────────────────────────────────────────────
// Modelo de datos central de "Venezuela te busca".
// Estos tipos son la fuente de verdad: la base de datos (Supabase),
// los formularios y la UI se ajustan a ellos.
// ─────────────────────────────────────────────────────────────

export type Gender = "masculino" | "femenino" | "otro";

/** Estado de localización de una persona. */
export type PersonStatus =
  | "por_localizar" // aún no se sabe de la persona
  | "localizado" // apareció con vida
  | "hospitalizado" // localizado e ingresado en un centro de salud
  | "fallecido"; // confirmado fallecido

export const PERSON_STATUS_LABEL: Record<PersonStatus, string> = {
  por_localizar: "Por localizar",
  localizado: "Localizado",
  hospitalizado: "Hospitalizado",
  fallecido: "Confirmado sin vida",
};

/** Estados de Venezuela más afectados (lista completa del país). */
export const ESTADOS = [
  "Amazonas",
  "Anzoátegui",
  "Apure",
  "Aragua",
  "Barinas",
  "Bolívar",
  "Carabobo",
  "Cojedes",
  "Delta Amacuro",
  "Distrito Capital",
  "Falcón",
  "Guárico",
  "La Guaira",
  "Lara",
  "Mérida",
  "Miranda",
  "Monagas",
  "Nueva Esparta",
  "Portuguesa",
  "Sucre",
  "Táchira",
  "Trujillo",
  "Yaracuy",
  "Zulia",
] as const;

export type Estado = (typeof ESTADOS)[number];

/** Reacciones de la comunidad a la ficha de una persona. */
export type PersonReaction = "fuerza" | "corazon" | "difundir";

export const PERSON_REACTION_EMOJI: Record<PersonReaction, string> = {
  fuerza: "🙏",
  corazon: "❤️",
  difundir: "📢",
};

export const PERSON_REACTION_LABEL: Record<PersonReaction, string> = {
  fuerza: "Fuerza",
  corazon: "Cariño",
  difundir: "Difundo",
};

export interface Person {
  id: string;
  firstName: string;
  lastName: string;
  cedula: string | null;
  age: number | null;
  gender: Gender | null;
  estado: Estado | null;
  /** Texto libre de ubicación: municipio, sector, edificio, referencia. */
  locationText: string;
  /** Ropa que vestía, señas particulares, contexto de la desaparición. */
  description: string;
  photoUrl: string | null;
  status: PersonStatus;
  hospitalName: string | null;
  /** Caso sin identificar: se busca por foto/rasgos, no por nombre. */
  isUnidentified: boolean;
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  /**
   * Sello opcional de "visto bueno" de un moderador. Su ausencia NO oculta el
   * registro: todo aparece de inmediato. Solo añade una insignia de confianza.
   */
  verified: boolean;
  reactions: Record<PersonReaction, number>;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

/**
 * Reporte de cambio de estado (p. ej. "lo encontré").
 * NO cambia el estado público automáticamente: queda pendiente de
 * verificación para evitar abuso/trolling.
 */
export interface StatusReport {
  id: string;
  personId: string;
  reportedStatus: PersonStatus;
  reporterName: string;
  reporterPhone: string;
  /** Relación con la persona: familiar, médico, rescatista, testigo... */
  reporterRelationship: string;
  locationFound: string;
  notes: string;
  verified: boolean;
  createdAt: string;
}

export type AidPointType =
  | "comida"
  | "agua"
  | "medicina"
  | "refugio"
  | "alojamiento" // hogares/casas que abren sus puertas para que la gente duerma
  | "ropa"
  | "otro";

export const AID_POINT_TYPE_LABEL: Record<AidPointType, string> = {
  comida: "Comida",
  agua: "Agua",
  medicina: "Medicinas",
  refugio: "Refugio",
  alojamiento: "Alojamiento",
  ropa: "Ropa",
  otro: "Otro",
};

/** Punto físico de ayuda: donatón de comida, refugio, agua, etc. */
export interface AidPoint {
  id: string;
  name: string;
  /** Un mismo punto puede ofrecer varios recursos a la vez. */
  types: AidPointType[];
  estado: Estado | null;
  locationText: string;
  scheduleText: string; // horario de atención
  description: string;
  photoUrl: string | null;
  contactName: string | null;
  contactPhone: string | null;
  verified: boolean;
  /** ¿Sigue disponible? Se actualiza por consenso de la comunidad. */
  available: boolean;
  /** Votos de la comunidad: "sí hay" vs "se acabó". */
  votesAvailable: number;
  votesDepleted: number;
  likes: number;
  updatedAt: string;
  createdAt: string;
}

/** Marcha / caravana / ida coordinada hacia una zona. */
export interface March {
  id: string;
  title: string;
  originText: string;
  destinationText: string;
  departAt: string; // ISO datetime
  organizerName: string;
  organizerPhone: string;
  /** Enlace al grupo de WhatsApp para coordinarse. */
  whatsappUrl: string | null;
  description: string;
  attendeesCount: number;
  likes: number;
  createdAt: string;
}

/**
 * Recursos cuyo autor puede gestionarlos con un enlace privado (token), igual
 * que las personas. Las personas usan su propia tabla `person_owners`; estos
 * recursos comparten una tabla genérica `resource_owners`.
 */
export type ResourceOwnerEntity = "aid_point" | "march" | "post";

// ── Comunidad / Feed ────────────────────────────────────────────────────────
/** Tipo de publicación del muro comunitario. */
export type PostType =
  | "necesito" // pido ayuda: cobijas, agua, vivienda...
  | "ofrezco" // ofrezco ayuda/recursos
  | "rescate" // rescate urgente (escombros, desaparecidos bajo estructuras)
  | "medico" // disponibilidad/insumos en hospitales, brigadas médicas
  | "caravana" // "voy saliendo", convoco o me uno a una caravana
  | "identificar" // ayuda a identificar personas/fallecidos
  | "info"; // información general

export const POST_TYPE_LABEL: Record<PostType, string> = {
  necesito: "Necesito ayuda",
  ofrezco: "Ofrezco ayuda",
  rescate: "Rescate urgente",
  medico: "Médico / hospital",
  caravana: "Caravana",
  identificar: "Ayuda a identificar",
  info: "Información",
};

export const POST_TYPE_EMOJI: Record<PostType, string> = {
  necesito: "🆘",
  ofrezco: "🤲",
  rescate: "🚨",
  medico: "🏥",
  caravana: "🚐",
  identificar: "🕊️",
  info: "📣",
};

export type ReactionKind = "apoyo" | "corazon" | "hecho";

export const REACTION_EMOJI: Record<ReactionKind, string> = {
  apoyo: "🙏",
  corazon: "❤️",
  hecho: "✅",
};

export interface Post {
  id: string;
  type: PostType;
  body: string;
  estado: Estado | null;
  locationText: string;
  photoUrl: string | null;
  linkUrl: string | null; // enlace externo (video, red social)
  authorName: string;
  contactPhone: string | null;
  /** Fijado arriba del muro (destacado por el equipo: avisos importantes). */
  pinned: boolean;
  reactions: Record<ReactionKind, number>;
  createdAt: string;
}

// ── Hospitales ──────────────────────────────────────────────────────────────
/** Estado de capacidad de un hospital. */
export type HospitalStatus = "operativo" | "saturado" | "lleno" | "cerrado";

export const HOSPITAL_STATUS_LABEL: Record<HospitalStatus, string> = {
  operativo: "Operativo",
  saturado: "Saturado",
  lleno: "Lleno (sin cupo)",
  cerrado: "Cerrado",
};

export interface Hospital {
  id: string;
  name: string;
  estado: Estado | null;
  locationText: string;
  status: HospitalStatus;
  /** Especialidades que puede atender (trauma, cirugía, pediatría...). */
  specialties: string[];
  /** Insumos o apoyo que necesitan ahora mismo. */
  needsText: string;
  contactName: string | null;
  contactPhone: string | null;
  /**
   * Sello de "visto bueno" del moderador, igual que en personas y puntos de
   * ayuda. Su ausencia NO oculta el hospital: aparece de inmediato, solo añade
   * una insignia de confianza una vez revisada la evidencia.
   */
  verified: boolean;
  /** Consenso de la comunidad sobre si tiene insumos/abasto. */
  votesSupplies: number;
  votesNoSupplies: number;
  likes: number;
  updatedAt: string;
  createdAt: string;
}

/**
 * Recursos a los que el admin puede asignar un GESTOR delegado: una cuenta
 * concreta que administra ese recurso (estado, disponibilidad, insumos, edición)
 * sin ser el admin global ni el publicador original. Ver [[verificacion-gestores]].
 */
export type ManagedEntity = "aid_point" | "hospital";

export const MANAGED_ENTITY_LABEL: Record<ManagedEntity, string> = {
  aid_point: "Punto de ayuda",
  hospital: "Hospital",
};

/** Gestor delegado de un recurso (asignado por el admin). */
export interface ResourceManager {
  entityType: ManagedEntity;
  entityId: string;
  userId: string;
  /** Nombre de usuario (desnormalizado para mostrarlo en el panel). */
  username: string;
  createdAt: string;
}

export type PatientStatus = "estable" | "critico" | "observacion" | "alta";

export const PATIENT_STATUS_LABEL: Record<PatientStatus, string> = {
  estable: "Estable",
  critico: "Crítico",
  observacion: "En observación",
  alta: "De alta",
};

/** Persona que está siendo atendida en un hospital (para que la familia la ubique). */
export interface HospitalPatient {
  id: string;
  hospitalId: string;
  fullName: string;
  cedula: string | null;
  condition: string;
  status: PatientStatus;
  note: string;
  createdAt: string;
}

export type CommentEntity = "person" | "aid_point" | "march" | "post" | "hospital" | "complaint";

// ── Denuncias de irregularidades ────────────────────────────────────────────
/** Categoría de una denuncia ciudadana de irregularidad. */
export type ComplaintCategory =
  | "riesgo_ninos" // riesgo o desprotección de menores
  | "desvio_ayuda" // desvío o robo de ayuda/donaciones
  | "fraude" // estafa o fraude
  | "abuso_autoridad" // abuso de autoridad
  | "persona_desaparecida" // persona desaparecida (también ver sección Personas)
  | "otra"; // otra irregularidad

export const COMPLAINT_CATEGORY_LABEL: Record<ComplaintCategory, string> = {
  riesgo_ninos: "Riesgo a la niñez",
  desvio_ayuda: "Desvío o robo de ayuda",
  fraude: "Fraude o estafa",
  abuso_autoridad: "Abuso de autoridad",
  persona_desaparecida: "Persona desaparecida",
  otra: "Otra irregularidad",
};

export const COMPLAINT_CATEGORY_EMOJI: Record<ComplaintCategory, string> = {
  riesgo_ninos: "🧒",
  desvio_ayuda: "📦",
  fraude: "💸",
  abuso_autoridad: "🛑",
  persona_desaparecida: "🔍",
  otra: "⚠️",
};

/**
 * Denuncia ciudadana de una irregularidad (desvío de ayuda, riesgo a menores,
 * fraude, abuso...). Requiere SESIÓN para publicar (responsabilidad: no anónimo
 * frente al sistema). La comunidad puede "Apoyar" y comentar.
 */
export interface Complaint {
  id: string;
  category: ComplaintCategory;
  body: string;
  estado: Estado | null;
  locationText: string;
  photoUrl: string | null;
  /** Nombre mostrado (el de la cuenta con sesión que publicó). */
  authorName: string;
  /** Apoyos de la comunidad ("Apoyar"), uno por dispositivo. */
  supports: number;
  createdAt: string;
}

/** Comentario de la comunidad (foro) sobre cualquier publicación. */
export interface Comment {
  id: string;
  entityType: CommentEntity;
  entityId: string;
  /** Si es respuesta a otro comentario, el id de su raíz; null si es de primer nivel. */
  parentId: string | null;
  authorName: string;
  body: string;
  /** Foto opcional adjunta al comentario (evidencia). */
  photoUrl: string | null;
  /** "Me gusta" de la comunidad al comentario (uno por dispositivo). */
  likes: number;
  createdAt: string;
}

export interface Stats {
  registered: number;
  toLocate: number;
  located: number;
  lastUpdated: string;
}
