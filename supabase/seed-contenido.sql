-- ─────────────────────────────────────────────────────────────────────────
-- Venezuela te busca — Contenido inicial para PRODUCCIÓN (Supabase)
--
-- Para qué sirve: cuando despliegas con Supabase, los datos de ejemplo de
-- `src/lib/seed.ts` NO se usan (esos son solo para el modo demostración local).
-- Este archivo carga en la base real un contenido inicial (hospitales reales de
-- la zona, puntos de ayuda y publicaciones de comunidad) para que el sitio no
-- salga vacío en el lanzamiento.
--
-- Cómo usarlo:
--   1. Ejecuta PRIMERO `supabase/schema.sql` (crea las tablas y columnas).
--   2. Luego pega y ejecuta ESTE archivo en el SQL Editor de Supabase.
--   3. Ejecútalo UNA sola vez (usa IDs fijos; re-ejecutarlo dará error de clave
--      duplicada, lo cual evita cargar el contenido dos veces).
--
-- ⚠️ TELÉFONOS: los números de hospitales son de fuentes públicas (jun. 2026) y
-- DEBES CONFIRMARLOS antes de promocionarlos. Donde no se halló un número
-- confiable se dejó NULL (Periférico de Pariata, Hospital Naval, Materno de
-- Macuto). Los puntos de ayuda no llevan teléfono: confírmalo con cada
-- organización y edítalo desde el sitio.
--
-- El estado de capacidad de los hospitales (operativo/saturado/lleno) y los
-- votos/reacciones son ILUSTRATIVOS del escenario; la comunidad los irá ajustando.
-- ─────────────────────────────────────────────────────────────────────────

begin;

-- ── Hospitales (reales) ─────────────────────────────────────────────────────
insert into hospitals
  (id, name, estado, location_text, status, specialties, needs_text, contact_name, contact_phone, verified, votes_supplies, votes_no_supplies, likes, created_at, updated_at)
values
  ('b0000000-0000-4000-8000-000000000001', 'Hospital Dr. José María Vargas (La Guaira)', 'La Guaira', 'Av. Soublette, sector Guanapel, La Guaira', 'saturado', ARRAY['Emergencias','Trauma','Cirugía'], 'Recibiendo heridos del sismo. Necesitan gasas, suturas, analgésicos, guantes y donantes de sangre O-.', 'Emergencias', '+58 212 3316555', true, 4, 11, 22, now() - interval '40 minutes', now() - interval '40 minutes'),
  ('b0000000-0000-4000-8000-000000000002', 'Hospital Dr. Rafael Medina Jiménez (Periférico de Pariata)', 'La Guaira', 'Av. Miramar, Pariata, Maiquetía', 'lleno', ARRAY['Emergencias','Trauma','Pediatría'], 'Sin cupo por momentos. Confirmar antes de remitir. Requieren pediatra, suero e insumos quirúrgicos.', 'Coordinación médica', null, true, 2, 9, 14, now() - interval '63 minutes', now() - interval '63 minutes'),
  ('b0000000-0000-4000-8000-000000000003', 'Hospital Naval Dr. Raúl Perdomo Hurtado', 'La Guaira', 'Catia La Mar', 'operativo', ARRAY['Trauma','Cirugía'], 'Apoyando la emergencia. Pueden recibir politraumatismos. Verificar disponibilidad por turno.', 'Sanidad Naval', null, false, 6, 3, 9, now() - interval '86 minutes', now() - interval '86 minutes'),
  ('b0000000-0000-4000-8000-000000000004', 'Hospital Materno Infantil de Macuto', 'La Guaira', 'Calle San Bartolomé, al lado del Hotel Riviera, Macuto', 'saturado', ARRAY['Maternidad','Pediatría','Neonatología'], 'Atienden embarazadas y recién nacidos. Necesitan fórmula, pañales e insumos neonatales.', 'Maternidad', null, false, 3, 5, 11, now() - interval '109 minutes', now() - interval '109 minutes'),
  ('b0000000-0000-4000-8000-000000000005', 'Hospital de Emergencias de Naiguatá', 'La Guaira', 'Av. Principal Los Mangos, Naiguatá (al lado de bomberos)', 'operativo', ARRAY['Primeros auxilios','Emergencias'], 'Estabilización y primeros auxilios. Refieren casos graves a La Guaira y Caracas.', 'Emergencias Naiguatá', '+58 212 3372084', false, 5, 2, 6, now() - interval '132 minutes', now() - interval '132 minutes'),
  ('b0000000-0000-4000-8000-000000000006', 'Hospital Universitario de Caracas (HUC)', 'Distrito Capital', 'Ciudad Universitaria, Los Chaguaramos, Caracas', 'saturado', ARRAY['Trauma','Cirugía','Medicina interna','UCI'], 'Reciben remisiones de La Guaira. El banco de sangre requiere donantes de todos los tipos.', 'Emergencias HUC', '+58 212 6065350', true, 8, 7, 19, now() - interval '155 minutes', now() - interval '155 minutes'),
  ('b0000000-0000-4000-8000-000000000007', 'Hospital Vargas de Caracas', 'Distrito Capital', 'San José, Caracas (Monte Carmelo a Providencia)', 'operativo', ARRAY['Emergencias','Trauma','Cirugía'], 'Disponibilidad para trauma y cirugía. Pueden remitir. Reciben donaciones de insumos.', 'Emergencias', '+58 212 8629965', true, 7, 4, 13, now() - interval '178 minutes', now() - interval '178 minutes'),
  ('b0000000-0000-4000-8000-000000000008', 'Hospital General Dr. Miguel Pérez Carreño', 'Distrito Capital', 'La Yaguara, El Paraíso, Caracas', 'saturado', ARRAY['Trauma','Ortopedia','Cirugía'], 'Alta demanda de traumatología. Necesitan material de osteosíntesis y yeso.', 'Emergencias', '+58 212 4728471', true, 5, 8, 12, now() - interval '201 minutes', now() - interval '201 minutes'),
  ('b0000000-0000-4000-8000-000000000009', 'Hospital Dr. Domingo Luciani (El Llanito)', 'Miranda', 'Av. Río de Janeiro, El Llanito, Petare', 'operativo', ARRAY['Emergencias','Cirugía','UCI'], 'Reciben remisiones del este de Caracas y La Guaira. Disponibilidad de quirófano.', 'Emergencias', '+58 212 2056511', true, 9, 5, 15, now() - interval '224 minutes', now() - interval '224 minutes'),
  ('b0000000-0000-4000-8000-000000000010', 'Hospital Central Dr. Plácido Daniel Rodríguez Rivero (San Felipe)', 'Yaracuy', 'Av. Villarreal, San Felipe', 'saturado', ARRAY['Emergencias','Trauma','Cirugía'], 'Cercano al epicentro. Reciben heridos de la zona. Necesitan insumos quirúrgicos y donantes de sangre.', 'Emergencias', '+58 254 2321148', true, 3, 10, 17, now() - interval '247 minutes', now() - interval '247 minutes'),
  ('b0000000-0000-4000-8000-000000000011', 'Ciudad Hospitalaria Dr. Enrique Tejera (CHET, Valencia)', 'Carabobo', 'Av. Lisandro Alvarado, Valencia', 'operativo', ARRAY['Trauma','Cirugía','Pediatría','UCI'], 'Apoyo regional. Pueden recibir remisiones de las zonas afectadas.', 'Emergencias CHET', '+58 241 8610000', true, 10, 4, 14, now() - interval '270 minutes', now() - interval '270 minutes'),
  ('b0000000-0000-4000-8000-000000000012', 'Hospital Central de Maracay', 'Aragua', 'Av. Sucre c/ Av. Vargas, La Floresta, Maracay', 'operativo', ARRAY['Trauma','Cirugía','Medicina interna'], 'Disponibilidad para remisiones de las zonas afectadas. Reciben donaciones de insumos.', 'Emergencias', '+58 243 2191325', true, 8, 3, 10, now() - interval '293 minutes', now() - interval '293 minutes'),
  ('b0000000-0000-4000-8000-000000000013', 'Hospital Universitario Dr. Alfredo Van Grieken (Coro)', 'Falcón', 'Av. El Tenis c/ Av. Santa Rosa, Coro', 'operativo', ARRAY['Emergencias','Cirugía'], 'Apoyo a la red nacional. Pueden remitir y recibir según disponibilidad.', 'Emergencias', '+58 268 2516433', false, 6, 2, 5, now() - interval '316 minutes', now() - interval '316 minutes');

-- ── Puntos de ayuda ─────────────────────────────────────────────────────────
-- contact_phone NULL a propósito: confírmalo con cada organización y edítalo en el sitio.
insert into aid_points
  (id, name, types, estado, location_text, schedule_text, description, contact_name, contact_phone, verified, available, votes_available, votes_depleted, likes, created_at, updated_at)
values
  ('c0000000-0000-4000-8000-000000000001', 'Refugio temporal — Escuela de Caraballeda', ARRAY['refugio','agua','medicina']::aid_point_type[], 'La Guaira', 'U. E. Caraballeda, segundo piso habilitado', '24 horas', 'Espacio para familias damnificadas. Hay colchonetas; se necesitan cobijas, agua y medicinas básicas.', 'Protección Civil La Guaira', null, true, true, 14, 1, 31, now() - interval '30 minutes', now() - interval '30 minutes'),
  ('c0000000-0000-4000-8000-000000000002', 'Donatón de comida — Plaza de Macuto', ARRAY['comida','agua']::aid_point_type[], 'La Guaira', 'Plaza de Macuto, frente a la iglesia', 'Lun a Dom, 8:00 a. m. – 6:00 p. m.', 'Entrega de comida caliente y mercados secos. Se reciben donaciones de arroz, pasta, enlatados y agua.', 'Comité vecinal de Macuto', null, true, true, 9, 2, 27, now() - interval '67 minutes', now() - interval '67 minutes'),
  ('c0000000-0000-4000-8000-000000000003', 'Acopio de ayuda — Cruz Roja seccional La Guaira', ARRAY['comida','ropa','medicina']::aid_point_type[], 'La Guaira', 'Sede de Cruz Roja, Maiquetía', 'Lun a Dom, 7:00 a. m. – 7:00 p. m.', 'Centro de acopio y clasificación de donaciones: alimentos no perecederos, ropa, cobijas e insumos médicos. Reciben y despachan a refugios.', 'Cruz Roja Venezolana', null, true, true, 18, 0, 44, now() - interval '104 minutes', now() - interval '104 minutes'),
  ('c0000000-0000-4000-8000-000000000004', 'Punto de agua potable — Catia La Mar', ARRAY['agua']::aid_point_type[], 'La Guaira', 'Cancha deportiva de Catia La Mar', 'Mientras haya cisterna', 'Camión cisterna y filtros. Trae envases limpios. La disponibilidad varía durante el día.', 'Bomberos de La Guaira', null, false, false, 3, 12, 10, now() - interval '141 minutes', now() - interval '141 minutes'),
  ('c0000000-0000-4000-8000-000000000005', 'Refugio — Polideportivo de Maiquetía', ARRAY['refugio','comida']::aid_point_type[], 'La Guaira', 'Polideportivo de Maiquetía', '24 horas', 'Albergue habilitado para familias que perdieron su vivienda. Necesitan colchonetas, agua y alimentos.', 'Alcaldía / Protección Civil', null, false, true, 7, 1, 16, now() - interval '178 minutes', now() - interval '178 minutes'),
  ('c0000000-0000-4000-8000-000000000006', 'Comedor solidario — Parroquia de Naiguatá', ARRAY['comida']::aid_point_type[], 'La Guaira', 'Iglesia de Naiguatá', 'Almuerzo y cena', 'Ollas comunitarias de la parroquia. Reciben víveres y manos voluntarias para cocinar.', 'Cáritas / parroquia', null, false, true, 6, 0, 12, now() - interval '215 minutes', now() - interval '215 minutes'),
  ('c0000000-0000-4000-8000-000000000007', 'Jornada médica — Caraballeda', ARRAY['medicina']::aid_point_type[], 'La Guaira', 'Plaza de Caraballeda', 'Mientras dure la jornada', 'Brigada médica voluntaria: curas, control de tensión y entrega de medicinas según disponibilidad.', 'Brigada médica voluntaria', null, false, true, 5, 1, 9, now() - interval '252 minutes', now() - interval '252 minutes'),
  ('c0000000-0000-4000-8000-000000000008', 'Recolección de ropa y cobijas — Maiquetía', ARRAY['ropa']::aid_point_type[], 'La Guaira', 'Galpón comunitario, Maiquetía', '9:00 a. m. – 5:00 p. m.', 'Punto de recolección de ropa seca, cobijas y calzado para damnificados. Clasifican por tallas.', 'Voluntarios de Maiquetía', null, false, true, 4, 0, 7, now() - interval '289 minutes', now() - interval '289 minutes'),
  ('c0000000-0000-4000-8000-000000000009', 'Punto de acopio en Caracas — Plaza Venezuela', ARRAY['comida','agua','ropa']::aid_point_type[], 'Distrito Capital', 'Plaza Venezuela, punto de partida de caravanas', '8:00 a. m. – 6:00 p. m.', 'Acopio en Caracas para subir donaciones a La Guaira en caravana. Reciben agua, alimentos no perecederos, ropa e insumos.', 'Voluntarios Unidos', null, false, true, 11, 1, 23, now() - interval '326 minutes', now() - interval '326 minutes');

-- ── Comunidad / publicaciones ───────────────────────────────────────────────
insert into posts
  (id, type, body, estado, location_text, author_name, contact_phone, pinned, reactions, created_at)
values
  ('d0000000-0000-4000-8000-000000000001', 'rescate', '🚨 URGENTE en El Junquito, km 11: vecinos dicen escuchar personas gritando bajo los escombros. Necesitamos equipo de rescate y perros entrenados cuanto antes.', 'La Guaira', 'El Junquito, km 11', 'Vecino de la zona', null, false, '{"apoyo":134,"corazon":22,"hecho":0}', now() - interval '25 minutes'),
  ('d0000000-0000-4000-8000-000000000002', 'necesito', 'Hay muchas familias durmiendo en la calle. Pedimos cobijas, colchonetas que no usen, agua y alimento. Por más pequeño que sea el aporte, es consuelo para una mamá con su bebé. 🙏', 'La Guaira', 'Caraballeda, cerca de la plaza', 'Brigada vecinal', null, false, '{"apoyo":287,"corazon":64,"hecho":12}', now() - interval '52 minutes'),
  ('d0000000-0000-4000-8000-000000000003', 'medico', 'En el periférico hay disponibilidad para atender pacientes de trauma, medicina interna y cirugía. Pueden remitir. También necesitamos insumos.', 'La Guaira', 'Hospital periférico', 'Dra. en guardia', null, false, '{"apoyo":96,"corazon":0,"hecho":8}', now() - interval '79 minutes'),
  ('d0000000-0000-4000-8000-000000000004', 'ofrezco', 'Tengo espacio en mi casa en Maiquetía para dos familias esta noche. Presto baño, hay agua. Escríbanme.', 'La Guaira', 'Maiquetía', 'Familia González', null, false, '{"apoyo":0,"corazon":73,"hecho":5}', now() - interval '106 minutes'),
  ('d0000000-0000-4000-8000-000000000005', 'identificar', 'Paz en sus almas. Por si reconocen a alguna de estas personas, por favor compartan para dar con sus familias. 🕊️', 'La Guaira', 'Morgue de La Guaira', 'Voluntario', null, false, '{"apoyo":0,"corazon":58,"hecho":0}', now() - interval '133 minutes'),
  ('d0000000-0000-4000-8000-000000000006', 'info', E'📌 CÓMO ENTREGAR TU AYUDA DE FORMA SEGURA:\n\n• Entrégala EN MANO directamente a las familias, o en puntos de acopio oficiales y verificados.\n• Desconfía si alguien te pide dejar la ayuda con un tercero "para entregarla luego": acompaña tu donación hasta el destino.\n• Si te detienen en la vía y te exigen dejar la carga, pide identificación y, si puedes, graba o anota los datos.\n• Coordina por grupos confiables y comparte el punto exacto de entrega.\n\nQue cada donación llegue COMPLETA a quien la necesita. 🤝', 'La Guaira', 'La Guaira y vías de acceso', 'Equipo Venezuela te busca', null, true, '{"apoyo":210,"corazon":64,"hecho":18}', now() - interval '15 minutes'),
  ('d0000000-0000-4000-8000-000000000007', 'info', 'Vialidad: la carretera vieja Caracas–La Guaira opera con paso restringido y la autopista con canales habilitados de forma intermitente por revisión de taludes. Si vas en caravana, sal temprano y verifica el estado del tramo antes de partir. Reporten aquí lo que vean en la vía.', 'La Guaira', 'Carretera Caracas–La Guaira', 'Reporte ciudadano', null, false, '{"apoyo":88,"corazon":0,"hecho":9}', now() - interval '95 minutes'),
  ('d0000000-0000-4000-8000-000000000008', 'ofrezco', 'Tengo camioneta y ofrezco viajes GRATIS subiendo insumos de Caracas a Maiquetía y Macuto. Salgo en las mañanas desde Plaza Venezuela. Si tienes donaciones que mover, escríbeme y coordinamos.', 'Distrito Capital', 'Plaza Venezuela, Caracas', 'Conductor voluntario', null, false, '{"apoyo":0,"corazon":96,"hecho":14}', now() - interval '122 minutes'),
  ('d0000000-0000-4000-8000-000000000009', 'medico', 'URGENTE donantes de sangre: el banco del Hospital Universitario de Caracas necesita donantes de todos los tipos, especialmente O-. Si estás sano y puedes donar, acércate. Cada bolsa salva vidas de los heridos del sismo. 🩸', 'Distrito Capital', 'HUC, Los Chaguaramos, Caracas', 'Voluntariado HUC', null, false, '{"apoyo":174,"corazon":51,"hecho":22}', now() - interval '149 minutes'),
  ('d0000000-0000-4000-8000-000000000010', 'necesito', 'En el refugio del Polideportivo de Maiquetía hacen falta pañales (todas las tallas), fórmula infantil, agua potable y medicinas para la tensión. Hay muchos adultos mayores y bebés. Cualquier aporte ayuda. 🙏', 'La Guaira', 'Polideportivo de Maiquetía', 'Coordinación del refugio', null, false, '{"apoyo":142,"corazon":38,"hecho":7}', now() - interval '176 minutes'),
  ('d0000000-0000-4000-8000-000000000011', 'info', 'Estado de servicios (reporte vecinal, puede variar): en varios sectores de La Guaira sigue intermitente la luz y el agua llega por cisternas. Carga tus dispositivos cuando haya electricidad y guarda agua. Comparte cómo está tu sector para mantener el mapa al día.', 'La Guaira', 'La Guaira (varios sectores)', 'Vecinos de La Guaira', null, false, '{"apoyo":73,"corazon":0,"hecho":11}', now() - interval '203 minutes');

-- ── Comentarios en publicaciones (ambiente de conversación) ─────────────────
insert into comments
  (entity_type, entity_id, parent_id, author_name, body, likes, created_at)
values
  ('post', 'd0000000-0000-4000-8000-000000000006', null, 'María en Catia La Mar', 'Gracias por el aviso. A nosotros nos pasó que nos pidieron dejar las bolsas en un punto y mejor las llevamos directo al refugio. Entréguenlo en mano.', 12, now() - interval '12 minutes'),
  ('post', 'd0000000-0000-4000-8000-000000000006', null, 'Coordinador de caravana', 'Importante: vayan siempre acompañados y con la donación identificada. Coordinemos por el grupo para no duplicar esfuerzos.', 8, now() - interval '8 minutes'),
  ('post', 'd0000000-0000-4000-8000-000000000001', null, 'Bombero voluntario', 'Vamos en camino con un equipo. Que nadie mueva escombros sin apoyo para no causar derrumbes. Despejen la vía para la maquinaria.', 21, now() - interval '20 minutes'),
  ('post', 'd0000000-0000-4000-8000-000000000002', null, 'Familia en Caracas', '¿A qué punto de acopio llevamos cobijas y ropa de abrigo para que lleguen a Caraballeda?', 5, now() - interval '34 minutes'),
  ('post', 'd0000000-0000-4000-8000-000000000009', null, 'Donante O-', 'Voy mañana temprano a donar. Si alguien más es O- que se sume, hace mucha falta.', 14, now() - interval '40 minutes');

commit;
