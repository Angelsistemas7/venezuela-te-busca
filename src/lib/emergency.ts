// Directorio de emergencia y guía rápida para la comunidad.
// Los teléfonos por organismo provienen de listados públicos y PUEDEN cambiar:
// ante una emergencia, la línea única nacional es el 911. Confirma los locales.

export interface PhoneEntry {
  name: string;
  phones: string[];
}

export interface PhoneGroup {
  title: string;
  note?: string;
  entries: PhoneEntry[];
}

/** Línea única nacional. Reemplazó al 171 en todo el país (policía, bomberos,
 *  Protección Civil y ambulancias). Funciona desde cualquier teléfono, 24 h. */
export const NATIONAL_LINE = { number: "911", label: "VEN 9‑1‑1 — Línea única nacional" };

export const PHONE_GROUPS: PhoneGroup[] = [
  {
    title: "Ambulancias (Caracas)",
    note: "Servicios privados de la zona metropolitana. Confirma cobertura y costo.",
    entries: [
      { name: "Aeroambulancias", phones: ["(0212) 993.25.41", "(0212) 992.89.80", "(0212) 991.79.40"] },
      { name: "Rescarven", phones: ["(0212) 993.69.11", "(0212) 993.13.10", "(0212) 993.33.67"] },
      { name: "Servicio de Ambulancia Metropolitano", phones: ["(0212) 545.45.45", "(0212) 577.92.09"] },
    ],
  },
  {
    title: "Bomberos por municipio (Gran Caracas y La Guaira)",
    note: "Listado de referencia; pueden cambiar. Ante emergencia, marca 911.",
    entries: [
      { name: "Bomberos de La Guaira", phones: ["(0212) 332.76.20", "(0212) 331.04.45"] },
      { name: "Bomberos de Catia la Mar", phones: ["(0212) 351.99.66"] },
      { name: "Bomberos Metropolitanos", phones: ["(0212) 545.45.45"] },
      { name: "Bomberos de Chacao", phones: ["(0212) 265.32.61"] },
      { name: "Bomberos de Sucre", phones: ["(0212) 985.36.40"] },
      { name: "Bomberos del Este (Cafetal)", phones: ["(0212) 987.43.34", "(0212) 985.50.60"] },
      { name: "Bomberos de El Paraíso", phones: ["(0212) 481.09.61"] },
      { name: "Bomberos de El Valle", phones: ["(0212) 672.01.75", "(0212) 672.06.36"] },
      { name: "Bomberos de Antímano", phones: ["(0212) 472.20.54"] },
      { name: "Bomberos de La Urbina", phones: ["(0212) 241.66.41"] },
      { name: "Bomberos de La Trinidad", phones: ["(0212) 943.43.61"] },
      { name: "Bomberos de Miranda", phones: ["(0212) 235.69.67"] },
      { name: "Bomberos de Plaza Venezuela", phones: ["(0212) 793.00.39", "(0212) 793.64.57"] },
    ],
  },
];

/** Guía rápida para la comunidad: acciones esenciales en las primeras horas. */
export const COMMUNITY_GUIDE: string[] = [
  "Ponte a salvo: aléjate de estructuras dañadas, vidrios y postes. Pueden venir réplicas.",
  "Revisa si tú y los tuyos están heridos. Da primeros auxilios básicos.",
  "Si hueles gas, cierra la llave y no enciendas nada. Corta la electricidad si ves cables sueltos.",
  "No uses ascensores. Baja por las escaleras con cuidado.",
  "Avisa que estás a salvo con un solo mensaje (no llames: satura la red). Puedes hacerlo aquí mismo.",
  "Ten a mano agua, linterna, medicinas y tus documentos.",
  "Acuerda un punto de encuentro con tu familia por si se separan.",
  "No difundas rumores: verifica antes de compartir.",
  "Ayuda a vecinos vulnerables: adultos mayores, niños y personas con discapacidad.",
];
