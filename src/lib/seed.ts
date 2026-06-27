import type {
  AidPoint,
  Comment,
  Hospital,
  HospitalPatient,
  March,
  Person,
  PersonStatus,
  Post,
  StatusReport,
} from "./types";

// ─────────────────────────────────────────────────────────────────────────
// Datos de EJEMPLO (no son reales). Se usan únicamente cuando Supabase no
// está configurado, para poder ver y probar la plataforma de inmediato.
// Cuando conectes Supabase, estos datos se ignoran.
// ─────────────────────────────────────────────────────────────────────────

const FIRST_NAMES = [
  "José", "María", "Carlos", "Ana", "Luis", "Carmen", "Pedro", "Yusmary",
  "Gabriel", "Daniela", "Rafael", "Andreina", "Miguel", "Yelitza", "Jesús",
  "Rosa", "Manuel", "Génesis", "Antonio", "Yuleidy", "Francisco", "Keiber",
  "Eduardo", "Naile", "Williams", "Oriana", "Héctor", "Yamilet", "Ramón",
  "Deyanira",
];
const LAST_NAMES = [
  "González", "Rodríguez", "Pérez", "Martínez", "García", "Hernández",
  "Marcano", "Bello", "Tagliafico", "Sarmiento", "Pereira", "Rivero",
  "Salazar", "Contreras", "Rubin", "Carrasquero", "Liven", "Escobar",
  "Pacheco", "Restrepo",
];
const SECTORES = [
  "Macuto", "Catia la Mar", "Playa Grande", "Caraballeda", "Naiguatá",
  "Camurí Grande", "La Guaira centro", "Maiquetía", "Caribe", "Los Corales",
  "Tanaguarena", "Anare", "El Cojo", "Punta de Mulatos",
];

// Generador determinista simple para que el seed sea estable entre recargas.
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260625);
const pick = <T>(arr: readonly T[]) => arr[Math.floor(rand() * arr.length)];

function buildPersons(): Person[] {
  const out: Person[] = [];
  const baseTime = new Date("2026-06-25T21:43:00-04:00").getTime();
  for (let i = 0; i < 64; i++) {
    const gender = rand() > 0.5 ? "masculino" : "femenino";
    const hasAge = rand() > 0.12;
    const r = rand();
    const unidentified = rand() > 0.9; // ~10% casos sin identificar

    // A quien alguien vio/encontró ya está ubicado: nunca "por localizar".
    // El resto (se busca) sigue la distribución con mayoría por localizar.
    let status: PersonStatus;
    if (unidentified) {
      status = r > 0.9 ? "fallecido" : r > 0.7 ? "hospitalizado" : "localizado";
    } else {
      status = "por_localizar";
      if (r > 0.82) status = "localizado";
      else if (r > 0.76) status = "hospitalizado";
      else if (r > 0.72) status = "fallecido";
    }
    const createdAt = new Date(baseTime - i * 60_000).toISOString();

    out.push({
      id: `seed-person-${i}`,
      firstName: unidentified ? "Sin identificar" : pick(FIRST_NAMES),
      lastName: unidentified ? "" : pick(LAST_NAMES),
      cedula: rand() > 0.55 ? `V-${10_000_000 + Math.floor(rand() * 19_000_000)}` : null,
      age: hasAge ? 3 + Math.floor(rand() * 80) : null,
      gender,
      estado: "La Guaira",
      locationText: pick(SECTORES),
      description: unidentified
        ? "Hombre de contextura delgada, camisa blanca, hallado cerca del malecón. Se busca identificar."
        : "Vestía ropa clara. Última vez visto el día del sismo cerca de su vivienda.",
      photoUrl: null,
      status,
      hospitalName: status === "hospitalizado" ? "Hospital José María Vargas" : null,
      isUnidentified: unidentified,
      contactName: unidentified ? null : "Familiar",
      contactPhone: unidentified ? null : "+58 412 0000000",
      contactEmail: null,
      verified: rand() > 0.7, // ~30% con visto bueno (sello de confianza)
      reactions: {
        fuerza: Math.floor(rand() * 40),
        corazon: Math.floor(rand() * 25),
        difundir: Math.floor(rand() * 60),
      },
      createdAt,
      updatedAt: createdAt,
    });
  }
  return out;
}

export const seedPersons: Person[] = buildPersons();

// Nota: los teléfonos de estos puntos quedan vacíos a propósito (no se inventan).
// El usuario debe confirmarlos con cada organización antes de difundirlos.
const aidBase = (n: number) => new Date(Date.parse("2026-06-25T20:00:00-04:00") - n * 37 * 60_000).toISOString();

export const seedAidPoints: AidPoint[] = [
  {
    id: "seed-aid-1",
    name: "Refugio temporal — Escuela de Caraballeda",
    types: ["refugio", "agua", "medicina"],
    estado: "La Guaira",
    locationText: "U. E. Caraballeda, segundo piso habilitado",
    scheduleText: "24 horas",
    description:
      "Espacio para familias damnificadas. Hay colchonetas; se necesitan cobijas, agua y medicinas básicas.",
    photoUrl: null,
    contactName: "Protección Civil La Guaira",
    contactPhone: null,
    verified: true,
    available: true,
    votesAvailable: 14,
    votesDepleted: 1,
    likes: 31,
    updatedAt: aidBase(0),
    createdAt: aidBase(0),
  },
  {
    id: "seed-aid-2",
    name: "Donatón de comida — Plaza de Macuto",
    types: ["comida", "agua"],
    estado: "La Guaira",
    locationText: "Plaza de Macuto, frente a la iglesia",
    scheduleText: "Lun a Dom, 8:00 a. m. – 6:00 p. m.",
    description:
      "Entrega de comida caliente y mercados secos. Se reciben donaciones de arroz, pasta, enlatados y agua.",
    photoUrl: null,
    contactName: "Comité vecinal de Macuto",
    contactPhone: null,
    verified: true,
    available: true,
    votesAvailable: 9,
    votesDepleted: 2,
    likes: 27,
    updatedAt: aidBase(1),
    createdAt: aidBase(1),
  },
  {
    id: "seed-aid-3",
    name: "Acopio de ayuda — Cruz Roja seccional La Guaira",
    types: ["comida", "ropa", "medicina"],
    estado: "La Guaira",
    locationText: "Sede de Cruz Roja, Maiquetía",
    scheduleText: "Lun a Dom, 7:00 a. m. – 7:00 p. m.",
    description:
      "Centro de acopio y clasificación de donaciones: alimentos no perecederos, ropa, cobijas e insumos médicos. Reciben y despachan a refugios.",
    photoUrl: null,
    contactName: "Cruz Roja Venezolana",
    contactPhone: null,
    verified: true,
    available: true,
    votesAvailable: 18,
    votesDepleted: 0,
    likes: 44,
    updatedAt: aidBase(2),
    createdAt: aidBase(2),
  },
  {
    id: "seed-aid-4",
    name: "Punto de agua potable — Catia La Mar",
    types: ["agua"],
    estado: "La Guaira",
    locationText: "Cancha deportiva de Catia La Mar",
    scheduleText: "Mientras haya cisterna",
    description: "Camión cisterna y filtros. Trae envases limpios. La disponibilidad varía durante el día.",
    photoUrl: null,
    contactName: "Bomberos de La Guaira",
    contactPhone: null,
    verified: false,
    available: false, // ejemplo de punto AGOTADO (consenso)
    votesAvailable: 3,
    votesDepleted: 12,
    likes: 10,
    updatedAt: aidBase(3),
    createdAt: aidBase(3),
  },
  {
    id: "seed-aid-5",
    name: "Refugio — Polideportivo de Maiquetía",
    types: ["refugio", "comida"],
    estado: "La Guaira",
    locationText: "Polideportivo de Maiquetía",
    scheduleText: "24 horas",
    description:
      "Albergue habilitado para familias que perdieron su vivienda. Necesitan colchonetas, agua y alimentos.",
    photoUrl: null,
    contactName: "Alcaldía / Protección Civil",
    contactPhone: null,
    verified: false,
    available: true,
    votesAvailable: 7,
    votesDepleted: 1,
    likes: 16,
    updatedAt: aidBase(4),
    createdAt: aidBase(4),
  },
  {
    id: "seed-aid-6",
    name: "Comedor solidario — Parroquia de Naiguatá",
    types: ["comida"],
    estado: "La Guaira",
    locationText: "Iglesia de Naiguatá",
    scheduleText: "Almuerzo y cena",
    description: "Ollas comunitarias de la parroquia. Reciben víveres y manos voluntarias para cocinar.",
    photoUrl: null,
    contactName: "Cáritas / parroquia",
    contactPhone: null,
    verified: false,
    available: true,
    votesAvailable: 6,
    votesDepleted: 0,
    likes: 12,
    updatedAt: aidBase(5),
    createdAt: aidBase(5),
  },
  {
    id: "seed-aid-7",
    name: "Jornada médica — Caraballeda",
    types: ["medicina"],
    estado: "La Guaira",
    locationText: "Plaza de Caraballeda",
    scheduleText: "Mientras dure la jornada",
    description:
      "Brigada médica voluntaria: curas, control de tensión y entrega de medicinas según disponibilidad.",
    photoUrl: null,
    contactName: "Brigada médica voluntaria",
    contactPhone: null,
    verified: false,
    available: true,
    votesAvailable: 5,
    votesDepleted: 1,
    likes: 9,
    updatedAt: aidBase(6),
    createdAt: aidBase(6),
  },
  {
    id: "seed-aid-8",
    name: "Recolección de ropa y cobijas — Maiquetía",
    types: ["ropa"],
    estado: "La Guaira",
    locationText: "Galpón comunitario, Maiquetía",
    scheduleText: "9:00 a. m. – 5:00 p. m.",
    description: "Punto de recolección de ropa seca, cobijas y calzado para damnificados. Clasifican por tallas.",
    photoUrl: null,
    contactName: "Voluntarios de Maiquetía",
    contactPhone: null,
    verified: false,
    available: true,
    votesAvailable: 4,
    votesDepleted: 0,
    likes: 7,
    updatedAt: aidBase(7),
    createdAt: aidBase(7),
  },
  {
    id: "seed-aid-9",
    name: "Punto de acopio en Caracas — Plaza Venezuela",
    types: ["comida", "agua", "ropa"],
    estado: "Distrito Capital",
    locationText: "Plaza Venezuela, punto de partida de caravanas",
    scheduleText: "8:00 a. m. – 6:00 p. m.",
    description:
      "Acopio en Caracas para subir donaciones a La Guaira en caravana. Reciben agua, alimentos no perecederos, ropa e insumos.",
    photoUrl: null,
    contactName: "Voluntarios Unidos",
    contactPhone: null,
    verified: false,
    available: true,
    votesAvailable: 11,
    votesDepleted: 1,
    likes: 23,
    updatedAt: aidBase(8),
    createdAt: aidBase(8),
  },
];

export const seedMarches: March[] = [
  {
    id: "seed-march-1",
    title: "Caravana de ayuda desde Caracas a La Guaira",
    originText: "Plaza Venezuela, Caracas",
    destinationText: "La Guaira (Macuto y Caraballeda)",
    departAt: new Date("2026-06-27T07:00:00-04:00").toISOString(),
    organizerName: "Voluntarios Unidos",
    organizerPhone: "+58 414 1234567",
    whatsappUrl: "https://chat.whatsapp.com/ejemplo-caravana",
    description:
      "Salida en convoy con insumos. Llevar agua, alimentos no perecederos y herramientas. Punto de encuentro 6:30 a. m.",
    attendeesCount: 48,
    likes: 73,
    createdAt: new Date("2026-06-25T20:00:00-04:00").toISOString(),
  },
  {
    id: "seed-march-2",
    title: "Brigada médica voluntaria — Naiguatá",
    originText: "Hospital Vargas, Caracas",
    destinationText: "Naiguatá, La Guaira",
    departAt: new Date("2026-06-26T06:00:00-04:00").toISOString(),
    organizerName: "Médicos por Venezuela",
    organizerPhone: "+58 426 9876543",
    whatsappUrl: null,
    description: "Se necesitan enfermeros y paramédicos. Llevar insumos de primeros auxilios.",
    attendeesCount: 22,
    likes: 41,
    createdAt: new Date("2026-06-25T19:15:00-04:00").toISOString(),
  },
];

const commentBase = (n: number) =>
  new Date(Date.parse("2026-06-25T21:00:00-04:00") - n * 17 * 60_000).toISOString();

export const seedComments: Comment[] = [
  {
    id: "seed-comment-1",
    entityType: "person",
    entityId: "seed-person-3",
    parentId: null,
    authorName: "Vecino de Macuto",
    body: "Creo haberlo visto en el refugio de Caraballeda el día de ayer. Voy a confirmar y aviso.",
    photoUrl: null,
    likes: 0,
    createdAt: new Date("2026-06-25T20:30:00-04:00").toISOString(),
  },
  // Conversación en el aviso fijado de seguridad (seed-post-6)
  {
    id: "seed-comment-2",
    entityType: "post",
    entityId: "seed-post-6",
    parentId: null,
    authorName: "María en Catia La Mar",
    body: "Gracias por el aviso. A nosotros nos pasó que nos pidieron dejar las bolsas en un punto y mejor las llevamos directo al refugio. Entréguenlo en mano.",
    photoUrl: null,
    likes: 12,
    createdAt: commentBase(1),
  },
  {
    id: "seed-comment-3",
    entityType: "post",
    entityId: "seed-post-6",
    parentId: null,
    authorName: "Coordinador de caravana",
    body: "Importante: vayan siempre acompañados y con la donación identificada. Coordinemos por el grupo para no duplicar esfuerzos.",
    photoUrl: null,
    likes: 8,
    createdAt: commentBase(2),
  },
  // Rescate (seed-post-0)
  {
    id: "seed-comment-4",
    entityType: "post",
    entityId: "seed-post-0",
    parentId: null,
    authorName: "Bombero voluntario",
    body: "Vamos en camino con un equipo. Que nadie mueva escombros sin apoyo para no causar derrumbes. Despejen la vía para la maquinaria.",
    photoUrl: null,
    likes: 21,
    createdAt: commentBase(3),
  },
  // Necesito cobijas (seed-post-1)
  {
    id: "seed-comment-5",
    entityType: "post",
    entityId: "seed-post-1",
    parentId: null,
    authorName: "Familia en Caracas",
    body: "Tenemos cobijas y ropa de abrigo para donar. ¿A qué punto de acopio las llevamos para que lleguen a Caraballeda?",
    photoUrl: null,
    likes: 5,
    createdAt: commentBase(4),
  },
  // Donación de sangre (seed-post-9)
  {
    id: "seed-comment-6",
    entityType: "post",
    entityId: "seed-post-9",
    parentId: null,
    authorName: "Donante O-",
    body: "Voy mañana temprano a donar. Si alguien más es O- que se sume, hace mucha falta.",
    photoUrl: null,
    likes: 14,
    createdAt: commentBase(5),
  },
];

function post(
  i: number,
  type: Post["type"],
  body: string,
  locationText: string,
  authorName: string,
  reactions: Partial<Record<"apoyo" | "corazon" | "hecho", number>> = {},
  opts: { pinned?: boolean; estado?: Post["estado"]; linkUrl?: string | null; contactPhone?: string | null } = {},
): Post {
  return {
    id: `seed-post-${i}`,
    type,
    body,
    estado: opts.estado ?? "La Guaira",
    locationText,
    photoUrl: null,
    linkUrl: opts.linkUrl ?? null,
    authorName,
    contactPhone: opts.contactPhone === undefined ? "+58 412 0000000" : opts.contactPhone,
    pinned: opts.pinned ?? false,
    reactions: { apoyo: 0, corazon: 0, hecho: 0, ...reactions },
    createdAt: new Date(Date.parse("2026-06-25T21:30:00-04:00") - i * 9 * 60_000).toISOString(),
  };
}

export const seedPosts: Post[] = [
  post(
    0,
    "rescate",
    "🚨 URGENTE en El Junquito, km 11: vecinos dicen escuchar personas gritando bajo los escombros. Necesitamos equipo de rescate y perros entrenados cuanto antes.",
    "El Junquito, km 11",
    "Vecino de la zona",
    { apoyo: 134, corazon: 22 },
  ),
  post(
    1,
    "necesito",
    "Hay muchas familias durmiendo en la calle. Pedimos cobijas, colchonetas que no usen, agua y alimento. Por más pequeño que sea el aporte, es consuelo para una mamá con su bebé. 🙏",
    "Caraballeda, cerca de la plaza",
    "Brigada vecinal",
    { apoyo: 287, corazon: 64, hecho: 12 },
  ),
  post(
    2,
    "medico",
    "En el periférico hay disponibilidad para atender pacientes de trauma, medicina interna y cirugía. Pueden remitir. También necesitamos insumos.",
    "Hospital periférico",
    "Dra. en guardia",
    { apoyo: 96, hecho: 8 },
  ),
  post(
    3,
    "caravana",
    "Desde Cartagena estamos reuniendo para salir hacia Venezuela. Aporten con su granito de arena. Repórtense y subimos juntos.",
    "Cartagena, Colombia",
    "Colectivo solidario",
    { apoyo: 152, corazon: 40 },
  ),
  post(
    4,
    "ofrezco",
    "Tengo espacio en mi casa en Maiquetía para dos familias esta noche. Presto baño, hay agua. Escríbanme.",
    "Maiquetía",
    "Familia González",
    { corazon: 73, hecho: 5 },
  ),
  post(
    5,
    "identificar",
    "Paz en sus almas. Por si reconocen a alguna de estas personas, por favor compartan para dar con sus familias. 🕊️",
    "Morgue de La Guaira",
    "Voluntario",
    { corazon: 58 },
  ),
  post(
    6,
    "info",
    "📌 CÓMO ENTREGAR TU AYUDA DE FORMA SEGURA:\n\n• Entrégala EN MANO directamente a las familias, o en puntos de acopio oficiales y verificados.\n• Desconfía si alguien te pide dejar la ayuda con un tercero \"para entregarla luego\": acompaña tu donación hasta el destino.\n• Si te detienen en la vía y te exigen dejar la carga, pide identificación y, si puedes, graba o anota los datos.\n• Coordina por grupos confiables y comparte el punto exacto de entrega.\n\nQue cada donación llegue COMPLETA a quien la necesita. 🤝",
    "La Guaira y vías de acceso",
    "Equipo Venezuela te busca",
    { apoyo: 210, corazon: 64, hecho: 18 },
    { pinned: true, contactPhone: null },
  ),
  post(
    7,
    "info",
    "Vialidad: la carretera vieja Caracas–La Guaira opera con paso restringido y la autopista con canales habilitados de forma intermitente por revisión de taludes. Si vas en caravana, sal temprano y verifica el estado del tramo antes de partir. Reporten aquí lo que vean en la vía.",
    "Carretera Caracas–La Guaira",
    "Reporte ciudadano",
    { apoyo: 88, hecho: 9 },
    { contactPhone: null },
  ),
  post(
    8,
    "ofrezco",
    "Tengo camioneta y ofrezco viajes GRATIS subiendo insumos de Caracas a Maiquetía y Macuto. Salgo en las mañanas desde Plaza Venezuela. Si tienes donaciones que mover, escríbeme y coordinamos.",
    "Plaza Venezuela, Caracas",
    "Conductor voluntario",
    { corazon: 96, hecho: 14 },
    { estado: "Distrito Capital" },
  ),
  post(
    9,
    "medico",
    "URGENTE donantes de sangre: el banco del Hospital Universitario de Caracas necesita donantes de todos los tipos, especialmente O-. Si estás sano y puedes donar, acércate. Cada bolsa salva vidas de los heridos del sismo. 🩸",
    "HUC, Los Chaguaramos, Caracas",
    "Voluntariado HUC",
    { apoyo: 174, corazon: 51, hecho: 22 },
    { estado: "Distrito Capital", contactPhone: null },
  ),
  post(
    10,
    "necesito",
    "En el refugio del Polideportivo de Maiquetía hacen falta pañales (todas las tallas), fórmula infantil, agua potable y medicinas para la tensión. Hay muchos adultos mayores y bebés. Cualquier aporte ayuda. 🙏",
    "Polideportivo de Maiquetía",
    "Coordinación del refugio",
    { apoyo: 142, corazon: 38, hecho: 7 },
    { contactPhone: null },
  ),
  post(
    11,
    "info",
    "Estado de servicios (reporte vecinal, puede variar): en varios sectores de La Guaira sigue intermitente la luz y el agua llega por cisternas. Carga tus dispositivos cuando haya electricidad y guarda agua. Comparte cómo está tu sector para mantener el mapa al día.",
    "La Guaira (varios sectores)",
    "Vecinos de La Guaira",
    { apoyo: 73, hecho: 11 },
    { contactPhone: null },
  ),
];

// Hospitales REALES de la zona afectada y de la red que recibe heridos.
// Direcciones y teléfonos tomados de fuentes públicas (jun. 2026); donde no se
// halló un número confiable se deja en null para que el usuario lo confirme.
// El estado de capacidad (operativo/saturado/lleno) es ILUSTRATIVO del escenario.
const hospBase = (n: number) =>
  new Date(Date.parse("2026-06-25T21:00:00-04:00") - n * 23 * 60_000).toISOString();

export const seedHospitals: Hospital[] = [
  {
    id: "seed-hosp-1",
    name: "Hospital Dr. José María Vargas (La Guaira)",
    estado: "La Guaira",
    locationText: "Av. Soublette, sector Guanapel, La Guaira",
    status: "saturado",
    specialties: ["Emergencias", "Trauma", "Cirugía"],
    needsText:
      "Recibiendo heridos del sismo. Necesitan gasas, suturas, analgésicos, guantes y donantes de sangre O-.",
    contactName: "Emergencias",
    contactPhone: "+58 212 3316555",
    verified: true,
    votesSupplies: 4,
    votesNoSupplies: 11,
    likes: 22,
    updatedAt: hospBase(0),
    createdAt: hospBase(0),
  },
  {
    id: "seed-hosp-2",
    name: "Hospital Dr. Rafael Medina Jiménez (Periférico de Pariata)",
    estado: "La Guaira",
    locationText: "Av. Miramar, Pariata, Maiquetía",
    status: "lleno",
    specialties: ["Emergencias", "Trauma", "Pediatría"],
    needsText:
      "Sin cupo por momentos. Confirmar antes de remitir. Requieren pediatra, suero e insumos quirúrgicos.",
    contactName: "Coordinación médica",
    contactPhone: null, // confirmar número
    verified: true,
    votesSupplies: 2,
    votesNoSupplies: 9,
    likes: 14,
    updatedAt: hospBase(1),
    createdAt: hospBase(1),
  },
  {
    id: "seed-hosp-3",
    name: "Hospital Naval Dr. Raúl Perdomo Hurtado",
    estado: "La Guaira",
    locationText: "Catia La Mar",
    status: "operativo",
    specialties: ["Trauma", "Cirugía"],
    needsText: "Apoyando la emergencia. Pueden recibir politraumatismos. Verificar disponibilidad por turno.",
    contactName: "Sanidad Naval",
    contactPhone: null, // confirmar número
    verified: false,
    votesSupplies: 6,
    votesNoSupplies: 3,
    likes: 9,
    updatedAt: hospBase(2),
    createdAt: hospBase(2),
  },
  {
    id: "seed-hosp-4",
    name: "Hospital Materno Infantil de Macuto",
    estado: "La Guaira",
    locationText: "Calle San Bartolomé, al lado del Hotel Riviera, Macuto",
    status: "saturado",
    specialties: ["Maternidad", "Pediatría", "Neonatología"],
    needsText: "Atienden embarazadas y recién nacidos. Necesitan fórmula, pañales e insumos neonatales.",
    contactName: "Maternidad",
    contactPhone: null, // confirmar número
    verified: false,
    votesSupplies: 3,
    votesNoSupplies: 5,
    likes: 11,
    updatedAt: hospBase(3),
    createdAt: hospBase(3),
  },
  {
    id: "seed-hosp-5",
    name: "Hospital de Emergencias de Naiguatá",
    estado: "La Guaira",
    locationText: "Av. Principal Los Mangos, Naiguatá (al lado de bomberos)",
    status: "operativo",
    specialties: ["Primeros auxilios", "Emergencias"],
    needsText: "Estabilización y primeros auxilios. Refieren casos graves a La Guaira y Caracas.",
    contactName: "Emergencias Naiguatá",
    contactPhone: "+58 212 3372084",
    verified: false,
    votesSupplies: 5,
    votesNoSupplies: 2,
    likes: 6,
    updatedAt: hospBase(4),
    createdAt: hospBase(4),
  },
  {
    id: "seed-hosp-6",
    name: "Hospital Universitario de Caracas (HUC)",
    estado: "Distrito Capital",
    locationText: "Ciudad Universitaria, Los Chaguaramos, Caracas",
    status: "saturado",
    specialties: ["Trauma", "Cirugía", "Medicina interna", "UCI"],
    needsText: "Reciben remisiones de La Guaira. El banco de sangre requiere donantes de todos los tipos.",
    contactName: "Emergencias HUC",
    contactPhone: "+58 212 6065350",
    verified: true,
    votesSupplies: 8,
    votesNoSupplies: 7,
    likes: 19,
    updatedAt: hospBase(5),
    createdAt: hospBase(5),
  },
  {
    id: "seed-hosp-7",
    name: "Hospital Vargas de Caracas",
    estado: "Distrito Capital",
    locationText: "San José, Caracas (Monte Carmelo a Providencia)",
    status: "operativo",
    specialties: ["Emergencias", "Trauma", "Cirugía"],
    needsText: "Disponibilidad para trauma y cirugía. Pueden remitir. Reciben donaciones de insumos.",
    contactName: "Emergencias",
    contactPhone: "+58 212 8629965",
    verified: true,
    votesSupplies: 7,
    votesNoSupplies: 4,
    likes: 13,
    updatedAt: hospBase(6),
    createdAt: hospBase(6),
  },
  {
    id: "seed-hosp-8",
    name: "Hospital General Dr. Miguel Pérez Carreño",
    estado: "Distrito Capital",
    locationText: "La Yaguara, El Paraíso, Caracas",
    status: "saturado",
    specialties: ["Trauma", "Ortopedia", "Cirugía"],
    needsText: "Alta demanda de traumatología. Necesitan material de osteosíntesis y yeso.",
    contactName: "Emergencias",
    contactPhone: "+58 212 4728471",
    verified: true,
    votesSupplies: 5,
    votesNoSupplies: 8,
    likes: 12,
    updatedAt: hospBase(7),
    createdAt: hospBase(7),
  },
  {
    id: "seed-hosp-9",
    name: "Hospital Dr. Domingo Luciani (El Llanito)",
    estado: "Miranda",
    locationText: "Av. Río de Janeiro, El Llanito, Petare",
    status: "operativo",
    specialties: ["Emergencias", "Cirugía", "UCI"],
    needsText: "Reciben remisiones del este de Caracas y La Guaira. Disponibilidad de quirófano.",
    contactName: "Emergencias",
    contactPhone: "+58 212 2056511",
    verified: true,
    votesSupplies: 9,
    votesNoSupplies: 5,
    likes: 15,
    updatedAt: hospBase(8),
    createdAt: hospBase(8),
  },
  {
    id: "seed-hosp-10",
    name: "Hospital Central Dr. Plácido Daniel Rodríguez Rivero (San Felipe)",
    estado: "Yaracuy",
    locationText: "Av. Villarreal, San Felipe",
    status: "saturado",
    specialties: ["Emergencias", "Trauma", "Cirugía"],
    needsText:
      "Cercano al epicentro. Reciben heridos de la zona. Necesitan insumos quirúrgicos y donantes de sangre.",
    contactName: "Emergencias",
    contactPhone: "+58 254 2321148",
    verified: true,
    votesSupplies: 3,
    votesNoSupplies: 10,
    likes: 17,
    updatedAt: hospBase(9),
    createdAt: hospBase(9),
  },
  {
    id: "seed-hosp-11",
    name: "Ciudad Hospitalaria Dr. Enrique Tejera (CHET, Valencia)",
    estado: "Carabobo",
    locationText: "Av. Lisandro Alvarado, Valencia",
    status: "operativo",
    specialties: ["Trauma", "Cirugía", "Pediatría", "UCI"],
    needsText: "Apoyo regional. Pueden recibir remisiones de las zonas afectadas.",
    contactName: "Emergencias CHET",
    contactPhone: "+58 241 8610000",
    verified: true,
    votesSupplies: 10,
    votesNoSupplies: 4,
    likes: 14,
    updatedAt: hospBase(10),
    createdAt: hospBase(10),
  },
  {
    id: "seed-hosp-12",
    name: "Hospital Central de Maracay",
    estado: "Aragua",
    locationText: "Av. Sucre c/ Av. Vargas, La Floresta, Maracay",
    status: "operativo",
    specialties: ["Trauma", "Cirugía", "Medicina interna"],
    needsText: "Disponibilidad para remisiones de las zonas afectadas. Reciben donaciones de insumos.",
    contactName: "Emergencias",
    contactPhone: "+58 243 2191325",
    verified: true,
    votesSupplies: 8,
    votesNoSupplies: 3,
    likes: 10,
    updatedAt: hospBase(11),
    createdAt: hospBase(11),
  },
  {
    id: "seed-hosp-13",
    name: "Hospital Universitario Dr. Alfredo Van Grieken (Coro)",
    estado: "Falcón",
    locationText: "Av. El Tenis c/ Av. Santa Rosa, Coro",
    status: "operativo",
    specialties: ["Emergencias", "Cirugía"],
    needsText: "Apoyo a la red nacional. Pueden remitir y recibir según disponibilidad.",
    contactName: "Emergencias",
    contactPhone: "+58 268 2516433",
    verified: false,
    votesSupplies: 6,
    votesNoSupplies: 2,
    likes: 5,
    updatedAt: hospBase(12),
    createdAt: hospBase(12),
  },
];

export const seedHospitalPatients: HospitalPatient[] = [
  {
    id: "seed-pat-1",
    hospitalId: "seed-hosp-1",
    fullName: "Carlos Marcano",
    cedula: "V-15890222",
    condition: "Fractura en pierna, trauma leve",
    status: "estable",
    note: "Consciente, pregunta por su esposa.",
    createdAt: new Date("2026-06-25T20:30:00-04:00").toISOString(),
  },
  {
    id: "seed-pat-2",
    hospitalId: "seed-hosp-1",
    fullName: "Yelitza Pereira",
    cedula: null,
    condition: "Deshidratación",
    status: "observacion",
    note: "Ingresó sin documentos.",
    createdAt: new Date("2026-06-25T19:50:00-04:00").toISOString(),
  },
  {
    id: "seed-pat-3",
    hospitalId: "seed-hosp-2",
    fullName: "Persona sin identificar (masculino, ~40)",
    cedula: null,
    condition: "Politraumatismo",
    status: "critico",
    note: "Sin identificación. Se busca a su familia.",
    createdAt: new Date("2026-06-25T21:10:00-04:00").toISOString(),
  },
];

export const seedStatusReports: StatusReport[] = [
  {
    id: "seed-report-1",
    personId: "seed-person-5",
    reportedStatus: "localizado",
    reporterName: "Dra. Ana Pérez",
    reporterPhone: "+58 412 5556677",
    reporterRelationship: "Médico del hospital Vargas",
    locationFound: "Hospital José María Vargas, área de emergencias",
    notes: "Ingresó estable. Pregunta por su familia.",
    verified: false,
    createdAt: new Date("2026-06-25T21:10:00-04:00").toISOString(),
  },
  {
    id: "seed-report-2",
    personId: "seed-person-12",
    reportedStatus: "localizado",
    reporterName: "Vecino de Caraballeda",
    reporterPhone: "+58 416 1112233",
    reporterRelationship: "Testigo",
    locationFound: "Refugio de la escuela de Caraballeda",
    notes: "Está en el refugio con su familia.",
    verified: false,
    createdAt: new Date("2026-06-25T20:55:00-04:00").toISOString(),
  },
];
