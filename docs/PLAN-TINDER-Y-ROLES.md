# Revisión del "Tinder" (¿La reconoces?) + plan de trabajo grande

Documento de análisis y plan — **no se tocó código en esta pasada**, es
revisión + propuesta para decidir qué mandar a hacer y en qué orden. Cubre:
(1) qué tan avanzada está la baraja tipo Tinder que ya construyó el equipo,
comparada con lo que pediste; (2) el resto de pedidos grandes (roles de
admin, denuncias, campanita/perfil/config, idea a futuro multi-país).

Fecha: 2026-07-01. Último commit revisado: `1c46b64` ("La reconoces: baraja
tipo tarjetas") + `022810b` (fix de seguridad de un compañero, ver §0).

---

## 0) Antes de entrar al Tinder: quién hizo qué

Confirmado con el historial de git: **Manuel** hizo la baraja tipo Tinder
(`1c46b64`). **Yer Díaz** hizo los otros dos commits — es decir, sí, "dos
commits" tal como dijiste, pero uno es de seguridad y el otro es de
despliegue (no dos arreglos de seguridad):

- `022810b` **"Corrige SSRF por foto sin validar y voto de consenso sin
  límite"** — Yer Díaz encontró y corrigió dos huecos de seguridad reales
  por su cuenta (que una `photoUrl` pudiera venir de cualquier lado en vez de
  solo del bucket de Storage, y que un voto de consenso no tuviera límite).
  Buena señal: el equipo también está revisando seguridad por su lado, no
  solo tú y yo. Vale la pena pedirles que sigan reportando así.
- `802048e` **"Corrige binario de sharp para ARM64"** — un fix de
  despliegue (la librería que convierte fotos a JPEG para compartir no
  corría bien en el VPS), nada que revisar de tu parte.

---

## 1) La baraja tipo Tinder (`RecognizeDeck.tsx`) — qué tan avanzada está

### Lo que YA está bien hecho (buen trabajo del equipo)
- **La mecánica de deslizar** está completa y bien implementada: arrastrar
  con el dedo/mouse, umbral de distancia para decidir, rotación y
  desvanecido de la tarjeta mientras se arrastra, sellos "LA RECONOZCO" /
  "OTRA" que aparecen según hacia dónde arrastras, animación de resorte al
  soltar. Técnicamente es un componente sólido.
- **Deslizar derecha = reconozco, izquierda = otra/siguiente** — así quedó
  construido hoy.
- **Funciona con teclado** (flechas ← →), lo cual es accesibilidad gratis.
- **Botones alternativos** además de deslizar (❌ / ℹ️ / ✅) para quien no
  quiera arrastrar.
- **Estado vacío y estado "revisaste a todas"** con botón de reiniciar la
  baraja — buen detalle de UX.
- **Los filtros que ya existían (edad, género, estado/región) SÍ aplican a
  la baraja** — pediste esto explícitamente y ya funciona, porque la baraja
  usa el mismo resultado filtrado que el listado normal.
- Dijiste "se ve bien chévere" al probarla — la mecánica en sí ya te
  convenció visualmente, lo que falta es lo de abajo.

### ✅ Confirmado: dirección del deslizar
Confirmaste: izquierda = "no lo conoces", derecha = "sí lo conoces" — es
exactamente lo que Manuel ya construyó. Sin cambios acá.

### 🔴 Lo más importante: la baraja está mostrando el conjunto de datos EQUIVOCADO
Este es el hallazgo más serio de esta revisión. En `src/app/page.tsx`, la
consulta base tiene `excludeUnidentified: true` **fijo, sin importar si
estás en "Se busca" o en "¿La reconoces?"**. El propio código lo admite en
un comentario:

> "Mientras no haya avistamientos 'sin identificar' en la base, ambas vistas
> usan ese conjunto."

Es decir: ahora mismo la pestaña **"¿La reconoces?" muestra personas que YA
tienen nombre, cédula y datos** (las de "Se busca") — **no** muestra
avistamientos sin identificar (una foto de alguien encontrado, sin saber
quién es). Funciona hoy porque en los datos de ejemplo no hay ningún
registro marcado como "sin identificar" para probar con datos reales, así
que nadie lo notó "roto" — pero en cuanto alguien publique un avistamiento
real (con "Vi/encontré a una persona" al registrar), **ese avistamiento NO
va a aparecer en la baraja tipo Tinder**, porque la consulta lo excluye a
propósito.

**Por qué es grave**: es exactamente el caso de uso que describiste ("una
foto de un fallecido", alguien sin datos) — el que más necesita el formato
Tinder, porque ahí es donde de verdad hace falta que mucha gente vea la cara
rápido para reconocerla. Tal como está, ese caso de uso queda sin cubrir el
día que haya datos reales.

**Qué hay que cambiar** (para que lo haga el equipo, no una descripción de
código exacta, sino el concepto): la consulta debe alternar según la
pestaña — `excludeUnidentified` en "Se busca", `unidentifiedOnly` en "¿La
reconoces?" (ese segundo modo ya existe y se usa correctamente en otra parte
del sitio, las secciones destacadas por edad, así que no es una función
nueva que inventar, es usar la que ya existe en el lugar correcto).

### 🟡 Otros huecos frente a lo que pediste

1. **"Quitemos los widgets esos de los datos arriba"** (lo dijiste dos
   veces) — los números grandes de arriba (total de personas, localizados,
   etc.) **siguen apareciendo también en "¿La reconoces?"**, no se ocultaron
   para esa vista. Pediste explícitamente que solo aparezcan en "Se busca".
2. **El buscador arriba de la baraja no cambia su texto/comportamiento**
   según la pestaña — el placeholder debería decir "Buscar por rasgos, ropa
   o lugar" en "¿La reconoces?" (ya existe ese texto en el código, pero
   también quedó con el valor fijo de "Se busca" por el mismo motivo del
   punto 🔴 de arriba).
3. **Tocar la foto no abre una ventana con la publicación y sus
   comentarios** — dijiste "si presiona la foto debería salir una ventana
   con datos de su publicación, comentarios de la publicación, como si
   estuviera dentro de la publicación que hay en se busca". Hoy, tocar la
   foto solo dispara el gesto de arrastrar; hay un botoncito aparte (ℹ️)
   que sí lleva a la ficha completa, pero como **navegación a otra página**,
   no como una ventana/modal encima de la baraja con comentarios incluidos.
4. **No se puede "deshacer" y ver la tarjeta anterior** — pediste
   explícitamente poder volver atrás para re-ver a alguien que ya pasaste.
   Hoy el índice solo avanza, no hay forma de retroceder (ni con gesto ni
   con botón).
5. **No se puede comentar/publicar información directamente desde la
   tarjeta** — solo se puede al entrar a la ficha completa (vía el botón ℹ️
   o al reconocer a alguien). Pediste poder comentar sin salir del flujo
   tipo Tinder.
6. **La misma baraja no está disponible en "Se busca"** — pediste
   explícitamente que la función también se pueda usar ahí (para personas
   que ya tienen datos), como una forma alternativa de recorrerlas. Hoy
   `RecognizeDeck` solo se muestra cuando `isReconoces` es `true`.
7. **Transición poco fluida al cambiar de filtro estando en la baraja** —
   lo mencionaste directamente. Cada cambio de filtro recarga la página
   completa (recarga de servidor, no una transición suave dentro del mismo
   componente), así que la baraja "salta" en vez de deslizar hacia el nuevo
   conjunto.
8. **"Se busca" no aclara la diferencia entre quién tiene información y
   quién no** — lo agregaste en la ronda de confirmación. Revisado a fondo:
   el formulario de publicar (`RegisterPersonButton.tsx`) **ya está muy bien
   hecho en esto** — cambia cada etiqueta, texto de ayuda y campo obligatorio
   según elijas "Busco a una persona" o "Vi/encontré a una persona" (nombre
   opcional, ubicación obligatoria, estado de la persona, foto recomendada,
   todo distinto entre los dos casos). Un solo detalle menor: el campo
   "Cédula de identidad" se muestra igual en ambos casos, y en el caso de
   un avistamiento (no sabes quién es) no tiene mucho sentido pedirlo — se
   podría ocultar o marcar como "si la encontraste en algún documento" para
   ese caso. Lo que sí falta, como dijiste, es que la **aclaración se vea
   más** en la propia pestaña "Se busca" (hoy es un párrafo de texto
   pequeño debajo del título), no en el formulario.

### 🐛 Bug reportado por ti: "le di en el del medio y salió 'algo salió mal'"
El botón del medio es el ℹ️ (ver ficha completa) — enlaza a `/persona/[id]`.
**Con el conjunto de datos ya corregido (ver §1.5 más abajo), lo probé en
vivo en local y no se reprodujo** — navegó bien a la ficha. Es probable que
fuera un síntoma del mismo problema de fondo (mostraba a alguien de "Se
busca" cuando debía mostrar un avistamiento) más que un bug aparte. Si
vuelve a pasar ya con el dato corregido en producción, avísame con el caso
exacto (qué persona, con o sin sesión) para investigar más a fondo.

---

## 2) Ya corregido en esta sesión (2026-07-01)

| # | Qué | Estado |
|---|---|---|
| 1 | **Arreglar qué conjunto de personas muestra cada pestaña** (🔴) | ✅ Hecho y probado en vivo — "¿La reconoces?" ya muestra avistamientos sin identificar reales, no gente de "Se busca". |
| 2 | **Bug del botón ℹ️** ("algo salió mal") | ✅ No se reprodujo tras el arreglo #1 — ver nota arriba. |
| 3 | **Ocultar los widgets de cifras en "¿La reconoces?"** | ✅ Hecho y probado en vivo. |
| — | Buscador con placeholder de "¿La reconoces?" ("rasgos, ropa o lugar") | ✅ De regalo: se corrigió al mismo tiempo, tenía el mismo problema de fondo que el punto 1. |
| — | Admin puede eliminar denuncias falsas | ✅ Hecho (nueva sección "Denuncias" en `/admin`, botón Eliminar). |

## 3) Sigue pendiente (más grande, necesita diseño — no se tocó)

| # | Qué | Por qué en ese orden |
|---|---|---|
| 4 | **Ventana/modal al tocar la foto** (info + comentarios sin salir de la baraja) | El cambio de experiencia más pedido; conviene definir el diseño antes de construir "comentar desde la tarjeta" (punto 6), porque probablemente compartan el mismo modal. |
| 5 | **Botón/gesto de "deshacer" (volver a la tarjeta anterior)** | Función nueva, autocontenida, no depende de las demás. |
| 6 | **Comentar/publicar sin salir de la tarjeta** | Depende del modal del punto 4. |
| 7 | **Extender la baraja tipo Tinder a "Se busca"** | Una vez esté sólida en "¿La reconoces?", reutilizar el mismo componente para la otra pestaña es relativamente directo. |
| 8 | **Mejorar la transición al cambiar de filtro** | Pulido final, tiene más sentido una vez el resto esté estable (si no, se pule dos veces). |

---

## 4) El resto de lo que pediste (fuera del Tinder)

### 4.1 Denuncias: que el admin pueda borrar denuncias falsas — ✅ Hecho
Confirmaste que sí querías esto, y ya está construido: nueva sección
"Denuncias" en `/admin` con botón "Eliminar" por denuncia (igual al que ya
existe para héroes falsos). La denuncia sigue sin poder editarse ni
borrarse por su autor — solo el admin puede eliminarla, y solo debería
hacerlo cuando sea comprobadamente falsa o inapropiada.

### 4.2 Sistema de roles más flexible — ✅ Construido (2026-07-01)
Confirmaste "arquitectura completa desde ya" y que el `ADMIN_TOKEN` se
mantiene como llave maestra de respaldo (no se reemplaza). Se construyó:

- Nueva tabla `app_roles` (`supabase/schema.sql`): roles GLOBALES por cuenta,
  no atados a un recurso — `admin`, `hospital_moderator`,
  `aid_point_moderator`. Sin lectura pública, igual que `resource_managers`.
- `isAdmin()` ahora reconoce DOS caminos: el `ADMIN_TOKEN` de siempre, O una
  cuenta con el rol `admin` asignado. Cualquiera de los dos basta.
- Nueva sección **"Colaboradores"** en `/admin` (arriba del todo): asigna o
  quita cualquiera de los 3 roles a una cuenta por su nombre de usuario.
- `canManageHospital` / `canManageAidPoint` (y por lo tanto
  `updateHospitalStatusAction`, `ownerSetAidAvailabilityAction`, el enlace
  "Gestionar" en la ficha) ahora también aceptan al moderador de la
  categoría completa, no solo al gestor de ESE recurso específico.
- **Cerrado el hueco de seguridad que ya habíamos marcado**: agregar un
  paciente a un hospital (`addHospitalPatientAction`) ahora EXIGE ser admin,
  autor, gestor de ese hospital, o moderador de hospitales — antes estaba
  abierto a cualquier visitante sin sesión. El botón "Agregar persona" en la
  ficha del hospital solo aparece si tienes el permiso.

**Tu rol sigue siendo el de mayor alcance**: el `ADMIN_TOKEN` no se tocó, así
que tu acceso actual no cambia en nada — sigue siendo superset de cualquier
rol que le des a alguien más.

⚠️ **Pendiente de tu parte**: correr de nuevo `supabase/schema.sql` completo
en el SQL Editor de Supabase (es idempotente) para que se cree la tabla
`app_roles` en producción — sin eso, la sección "Colaboradores" no podrá
asignar roles reales todavía.

**Lo que sigue, si quieres continuar con esto más adelante**:
- Extender el mismo patrón a "agregar pacientes" ya cerrado arriba; quedaría
  ver si otras acciones deberían exigir un rol específico en vez de solo
  cuenta+admin (ej. verificar puntos de ayuda/hospitales — hoy solo admin).
- Página dedicada de "gestión de colaboradores" si la lista crece mucho (hoy
  vive en una sola sección compacta del panel, suficiente para pocos roles).

### 4.3 Campanita, perfil y configuración — ✅ Construido (2026-07-01)
- **Campanita**: se agregó el enlace **"Ver todas (N)"** al final del
  desplegable, que lleva a `/notificaciones` (página completa, sin límite de
  alto). Se extrajo la lógica compartida a `src/lib/useNotifications.ts` para
  no duplicarla entre la campanita y la página nueva.
- **Perfil**: tocar tu nombre de usuario ahora abre un **menú desplegable**
  (`ProfileMenu.tsx`): Mi perfil, Configuración, Cerrar sesión. Nueva página
  `/perfil` con foto de perfil (subir/cambiar/quitar, opcional — bucket de
  Storage, igual que las demás fotos del sitio), y las listas de "Mis
  publicaciones" y "Guardados" (antes solo vivían dentro de la campanita).
- **Configuración**: nueva página `/configuracion` con las 4 que elegiste
  más 2 ideas que agregué:
  - Cambiar contraseña (pide la actual primero, no solo la nueva).
  - Cambiar/agregar correo de recuperación.
  - Avisos por correo (interruptor, desactivado hasta que haya un correo
    registrado) — la parte de ENVIAR esos correos de verdad (cuando alguien
    comenta) queda para una siguiente ronda; hoy solo se guarda la
    preferencia.
  - Eliminar cuenta — con la fricción que pediste: hay que escribir la
    contraseña Y el nombre de usuario exacto para confirmar, dentro de una
    ventana aparte. Las publicaciones NO se borran, solo se desvinculan de
    la cuenta (ya funcionaba así a nivel de base de datos).
  - *(Ideas nuevas, no las pediste pero encajan)*: por ahora no se
    construyeron, quedan anotadas por si las quieres más adelante —
    "cerrar sesión en todos los dispositivos" y "descargar mis datos".

⚠️ **Pendiente de tu parte**: correr de nuevo `supabase/schema.sql` en
Supabase (agrega `avatar_url` y `email_notifications` a `profiles`).

**No se pudo probar en vivo con una cuenta real** en este entorno (la
sandbox no tiene acceso a Supabase real) — probé que las páginas nuevas no
truenan y redirigen bien sin sesión, pero avatar/contraseña/eliminar cuenta
hay que probarlos tú con una cuenta real después de desplegar.
- **Idioma**: de acuerdo contigo, el navegador ya maneja esto razonablemente
  bien por defecto — lo dejamos fuera del plan salvo que más adelante
  quieras traducir la plataforma a otro idioma de verdad (relacionado con
  la idea de multi-país de abajo).

### 4.4 Idea a futuro: banderas de países / multi-país (NO construir todavía)
Registrado tal cual la describiste, como visión de largo plazo:

> Un widget vistoso en la portada con banderas de países. Al elegir un país
> (ej. Irán), se entra a una instancia con la misma interfaz de "El Mundo Te
> Busca" pero con los datos, comunidad y tragedia de ese país — cada país
> con su propio espacio, la misma plataforma sirviendo a cualquier lugar del
> mundo que atraviese una crisis.

Esto es un cambio de arquitectura fundamental (la app pasaría de ser
"para Venezuela" a **multi-tenant**: una instancia por país/evento, con sus
propios datos y quizás su propio dominio o subcarpeta). No es algo para
empezar ahora — lo dejo en este documento como semilla para cuando llegue
el momento. Cuando se retome, lo primero será decidir el modelo (¿un solo
código con "espacios" por país usando la misma base de datos con una
columna `country`/`event`, o instancias separadas por país?) antes de tocar
una sola línea.

---

### 4.5 Hallazgo suelto, ya corregido: bug de hidratación en "Compartir por WhatsApp"
Revisando el panel en vivo apareció un warning de React en el botón
"Compartir por WhatsApp" del pie de página (aparece en TODAS las páginas):
la URL se calculaba distinto en el servidor que en el navegador, así que el
enlace que se generaba al cargar la página no coincidía con el que quedaba
tras hidratar. No rompía nada visible, pero es un bug real (React lo marca
en consola). Ya corregido en `src/components/ShareWhatsApp.tsx`: arranca
igual en ambos lados y solo cambia a la URL real del navegador después de
montar.

## 5) Resumen para decidir

**✅ Ya hecho** (probado en vivo donde aplicaba):
1. Arreglo del conjunto de datos en el Tinder (🔴, bloqueante).
2. Bug del botón ℹ️ (no se reprodujo tras el arreglo #1).
3. Ocultar widgets en "¿La reconoces?".
4. Admin puede borrar denuncias falsas.
5. Sistema de roles con alcance — admin por cuenta, moderador de hospitales,
   moderador de puntos de ayuda, y "agregar paciente" ya exige permiso.
   **Pendiente de tu parte**: correr `supabase/schema.sql` en producción.
6. (De paso) bug de hidratación en "Compartir por WhatsApp" del pie de página.
7. **"Se busca" unificado**: ahora muestra a TODOS (con y sin información),
   cada tarjeta con la etiqueta "👁️ Sin identificar" cuando corresponde
   (`PersonCard.tsx`). "¿La reconoces?" muestra a todos EXCEPTO los ya
   localizados/confirmados sin vida (nuevo filtro `unresolvedOnly` en
   `data.ts`) — probado en vivo: la baraja pasó de 7 a 46 personas (ahora
   incluye gente con nombre, además de los avistamientos), y los chips de
   estado ahí ya no ofrecen "Localizado"/"Confirmado sin vida" (no
   aplican, esos casos no aparecen en esa pestaña).

   **Alcance de lo que NO se tocó en esta pasada**: los carruseles
   "Secciones destacadas" (por edad) y "Localizados recientemente" en la
   portada de "Se busca" siguen mostrando SOLO gente con información — no
   se mezclaron con avistamientos sin identificar. Como esos carruseles son
   lo que se ve por defecto (sin ningún filtro activo), alguien sin
   identificar solo aparece en "Se busca" en cuanto se aplica algún filtro
   (edad, orden, etc.) o se busca algo — la lista completa "Todos los
   registros" ya lo trae, pero la portada limpia todavía no. Si quieres que
   también se unifiquen los carruseles, dímelo y lo hago aparte (toca
   `FeaturedSections.tsx`/`RecentlyLocated.tsx`, decisiones de diseño
   propias: ¿tiene sentido un carrusel "por edad" para alguien de quien no
   se sabe la edad?).

**Para planear como proyecto propio** (más grande, necesita diseño):
- Modal de foto con comentarios + comentar desde la tarjeta (elegiste: modal
  completo con comentarios).
- Deshacer/volver en la baraja (elegiste: botón fijo ↺).
- Perfil con foto + página de configuración (falta que definas el alcance
  de "configuración" — te propuse una lista de opciones para que elijas).

**A futuro, sin tocar todavía**:
- Multi-país.

---

## 6) Un principio que dijiste y vale la pena repetirle al equipo
"Hay que hacer[lo], pero hay que hacerlo bien." Ninguno de estos puntos es
urgente por vidas en juego (a diferencia de, por ejemplo, los teléfonos de
emergencia) — mejor que se tomen el tiempo de hacerlo con buen diseño,
transición y pulido (como ya lo hicieron con la mecánica de deslizar) que
apurarlo.
