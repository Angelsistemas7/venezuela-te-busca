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
    // Distribución de estados: mayoría por localizar.
    let status: PersonStatus = "por_localizar";
    if (r > 0.82) status = "localizado";
    else if (r > 0.76) status = "hospitalizado";
    else if (r > 0.72) status = "fallecido";

    const unidentified = rand() > 0.9; // ~10% casos sin identificar
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

export const seedAidPoints: AidPoint[] = [
  {
    id: "seed-aid-1",
    name: "Donatón de comida — Plaza Macuto",
    types: ["comida", "agua"],
    estado: "La Guaira",
    locationText: "Plaza de Macuto, frente a la iglesia",
    scheduleText: "Lun a Dom, 8:00 a. m. – 6:00 p. m.",
    description:
      "Entrega de comida caliente y mercados secos. Se reciben donaciones de arroz, pasta, enlatados y agua.",
    photoUrl: null,
    contactName: "Comité vecinal Macuto",
    contactPhone: "+58 424 1112233",
    verified: true,
    available: true,
    votesAvailable: 9,
    votesDepleted: 1,
    likes: 34,
    updatedAt: new Date("2026-06-25T20:00:00-04:00").toISOString(),
    createdAt: new Date("2026-06-25T18:00:00-04:00").toISOString(),
  },
  {
    id: "seed-aid-2",
    name: "Punto de agua potable — Catia la Mar",
    types: ["agua"],
    estado: "La Guaira",
    locationText: "Cancha deportiva de Catia la Mar",
    scheduleText: "Todo el día",
    description: "Camión cisterna y filtros. Trae envases limpios.",
    photoUrl: null,
    contactName: "Bomberos voluntarios",
    contactPhone: "+58 416 4445566",
    verified: false,
    available: false, // ejemplo de punto AGOTADO (consenso)
    votesAvailable: 2,
    votesDepleted: 11,
    likes: 12,
    updatedAt: new Date("2026-06-25T19:30:00-04:00").toISOString(),
    createdAt: new Date("2026-06-25T16:30:00-04:00").toISOString(),
  },
  {
    id: "seed-aid-3",
    name: "Refugio temporal — Escuela de Caraballeda",
    types: ["refugio", "agua", "medicina"],
    estado: "La Guaira",
    locationText: "U. E. Caraballeda, segundo piso habilitado",
    scheduleText: "24 horas",
    description:
      "Espacio para familias damnificadas. Hay colchonetas; se necesitan cobijas y medicinas.",
    photoUrl: null,
    contactName: "Cruz Roja seccional",
    contactPhone: "+58 412 7778899",
    verified: true,
    available: true,
    votesAvailable: 5,
    votesDepleted: 0,
    likes: 21,
    updatedAt: new Date("2026-06-25T18:00:00-04:00").toISOString(),
    createdAt: new Date("2026-06-25T14:00:00-04:00").toISOString(),
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

export const seedComments: Comment[] = [
  {
    id: "seed-comment-1",
    entityType: "person",
    entityId: "seed-person-3",
    authorName: "Vecino de Macuto",
    body: "Creo haberlo visto en el refugio de Caraballeda el día de ayer. Voy a confirmar y aviso.",
    photoUrl: null,
    createdAt: new Date("2026-06-25T20:30:00-04:00").toISOString(),
  },
];

function post(
  i: number,
  type: Post["type"],
  body: string,
  locationText: string,
  authorName: string,
  reactions: Partial<Record<"apoyo" | "corazon" | "hecho", number>> = {},
): Post {
  return {
    id: `seed-post-${i}`,
    type,
    body,
    estado: "La Guaira",
    locationText,
    photoUrl: null,
    linkUrl: null,
    authorName,
    contactPhone: "+58 412 0000000",
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
];

export const seedHospitals: Hospital[] = [
  {
    id: "seed-hosp-1",
    name: "Hospital Periférico de La Guaira",
    estado: "La Guaira",
    locationText: "Catia la Mar",
    status: "operativo",
    specialties: ["Trauma", "Medicina interna", "Cirugía"],
    needsText: "Necesitan insumos: gasas, suturas, analgésicos y guantes. Pueden remitir pacientes.",
    contactName: "Coordinación médica",
    contactPhone: "+58 212 3334455",
    votesSupplies: 3,
    votesNoSupplies: 9,
    likes: 18,
    updatedAt: new Date("2026-06-25T21:00:00-04:00").toISOString(),
    createdAt: new Date("2026-06-25T15:00:00-04:00").toISOString(),
  },
  {
    id: "seed-hosp-2",
    name: "Hospital José María Vargas",
    estado: "La Guaira",
    locationText: "La Guaira centro",
    status: "lleno",
    specialties: ["Emergencias", "Trauma"],
    needsText: "Sin cupo en este momento. No remitir. Se requieren donantes de sangre O-.",
    contactName: "Emergencias",
    contactPhone: "+58 212 1112233",
    votesSupplies: 1,
    votesNoSupplies: 6,
    likes: 7,
    updatedAt: new Date("2026-06-25T21:20:00-04:00").toISOString(),
    createdAt: new Date("2026-06-25T14:00:00-04:00").toISOString(),
  },
  {
    id: "seed-hosp-3",
    name: "Clínica Móvil — Caraballeda",
    estado: "La Guaira",
    locationText: "Plaza de Caraballeda",
    status: "saturado",
    specialties: ["Primeros auxilios", "Pediatría"],
    needsText: "Alta demanda. Necesitan pediatra y suero.",
    contactName: "Brigada médica",
    contactPhone: "+58 414 9998877",
    votesSupplies: 4,
    votesNoSupplies: 3,
    likes: 5,
    updatedAt: new Date("2026-06-25T20:40:00-04:00").toISOString(),
    createdAt: new Date("2026-06-25T16:00:00-04:00").toISOString(),
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
