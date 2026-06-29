// Directorio de plataformas e iniciativas externas verificables de la respuesta
// al terremoto. Somos un PUENTE, no intermediarios: enlazamos a cada recurso y
// el usuario verifica antes de actuar/donar. Contenido curado por el equipo.

export interface Recurso {
  name: string;
  description: string;
  url?: string;
  /** Dato extra a confirmar (tel., cuenta…). Se muestra como nota, no como enlace. */
  note?: string;
}

export interface RecursoGrupo {
  categoria: string;
  emoji: string;
  items: Recurso[];
}

export const RECURSOS: RecursoGrupo[] = [
  {
    categoria: "Búsqueda de personas",
    emoji: "🔎",
    items: [
      {
        name: "Desaparecidos Terremoto Venezuela",
        description: "Buscar por nombre o cédula, reportar y marcar como encontrado. Sin registro.",
        url: "https://desaparecidosterremotovenezuela.com",
      },
      {
        name: "Encuéntrame VZLA",
        description: "Busca personas encontradas y llevadas a hospitales.",
        url: "https://encuentramevzla.com",
      },
      {
        name: "CIVIS Venezuela",
        description: "Búsqueda de personas, reportes de daños, mapa de riesgos, puntos de abastecimiento y emergencias.",
        url: "https://civisvenezuela.com",
      },
      {
        name: "Localizados VE",
        description: "Base abierta de personas localizadas en hospitales y centros de acopio, con API pública.",
        url: "https://localizadosvenezuela.com",
      },
    ],
  },
  {
    categoria: "Coordinación y ayuda",
    emoji: "🤝",
    items: [
      {
        name: "Ayuda en Camino",
        description: "Centros de acopio, refugios y ONGs publican sus necesidades en tiempo real para que tu donación llegue a quien la necesita.",
      },
      {
        name: "Red Venezuela Activa",
        description: "Conecta a quien necesita ayuda con quien puede darla: voluntarios, casos urgentes, albergues y mapa en vivo.",
        url: "https://ayudavenezuela2026.com",
      },
      {
        name: "ResponseGrid",
        description: "Coordinación logística para la distribución de suministros en zonas afectadas.",
        url: "https://responsegrid.app",
      },
      {
        name: "Yummy SOS",
        description: "Reporte de daños con foto y GPS; movilizan repartidores para llevar agua, alimentos y medicinas a refugios.",
        url: "https://sos.yummyrides.com",
      },
    ],
  },
  {
    categoria: "Donaciones",
    emoji: "💛",
    items: [
      {
        name: "Cruz Roja Española",
        description: "Canal oficial, en coordinación con Cruz Roja Venezolana.",
        url: "https://www2.cruzroja.es",
      },
      {
        name: "UNICEF — Emergencia Venezuela",
        description: "Protección infantil, refugio, alimentos e insumos para la niñez afectada.",
        url: "https://unicef.es",
      },
      {
        name: "Save the Children",
        description: "Fondo 'Terremoto en Venezuela', orientado a menores.",
        url: "https://savethechildren.es",
      },
      {
        name: "We Love Foundation (GoFundMe)",
        description: "Con Global Empowerment Mission: alimentos, agua, atención médica y kits de higiene.",
        url: "https://gofundme.com",
      },
    ],
  },
  {
    categoria: "Apoyo psicosocial",
    emoji: "🧠",
    items: [
      {
        name: "PsicoLínea Venezuela (UCAB)",
        description: "Atención psicológica gratuita. Solo dentro de Venezuela.",
        note: "Tel.: 0414-121 78 82 / 0424-172 39 81 (confirma antes de llamar).",
      },
      {
        name: "Grupo Venemergencia",
        description: "Plataforma médica venezolana; atiende afectados físicos y psicológicos.",
      },
    ],
  },
  {
    categoria: "Mapas y reportes",
    emoji: "🗺️",
    items: [
      {
        name: "TerremotoVenezuela.com",
        description: "Mapa de calor en tiempo real, centros de acopio verificados y directorio de hospitales.",
        url: "https://terremotovenezuela.com",
      },
    ],
  },
  {
    categoria: "Organismos oficiales",
    emoji: "🏛️",
    items: [
      {
        name: "PAHO / OMS — Venezuela Response",
        description: "Respuesta sanitaria oficial y coordinación internacional.",
        url: "https://www.paho.org",
      },
      {
        name: "ReliefWeb — Venezuela",
        description: "Informe de OCHA (ONU). Fuente humanitaria de referencia.",
        url: "https://reliefweb.int",
      },
    ],
  },
];
