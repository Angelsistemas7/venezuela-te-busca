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

### 4.2 Sistema de roles más flexible (esto es grande)
Hoy el sistema de permisos tiene **dos niveles nada más**:
- **Admin único**: una sola contraseña compartida (`ADMIN_TOKEN`) que da
  acceso a TODO el panel — no hay forma de darle a alguien un admin
  "parcial".
- **Gestor por recurso**: se le puede asignar a una cuenta el manejo de UN
  punto de ayuda o UN hospital específico (tabla `resource_managers`), pero
  nada más granular que eso.

Lo que describiste es un salto más grande: **roles con alcance definido por
categoría**, no por recurso individual. Ejemplos que diste:
- Alguien (médico) que pueda declarar el estado de **cualquier** hospital
  (lleno/no lleno), sin ser dueño de un hospital en particular.
- Alguien encargado de un punto de acopio que declare si tiene o no comida
  — esto ya existe (gestor de ESE punto), pero lo mencionas junto a lo
  demás así que lo incluyo para que quede completo.
- Compañeros tuyos con **rol de admin completo** (como tú, pero sin
  compartir tu misma contraseña — cada quien con su propio acceso).
- Un médico con permiso para decir "esta persona está/no está en este
  hospital" (eso es la lista de pacientes — hoy cualquiera puede agregar
  un paciente sin permiso especial, ver `docs/INFORME-SEGURIDAD.md` — es
  un caso más para el sistema de roles: quizás agregar pacientes también
  debería requerir un rol, no estar abierto a cualquiera).

**Esto implica un cambio de arquitectura**, no un ajuste chico:
1. Reemplazar (o complementar) el `ADMIN_TOKEN` compartido por **cuentas de
   admin individuales** — cada colaborador con su propio usuario/contraseña
   (ya existe el sistema de cuentas de Supabase Auth, se puede construir
   sobre eso).
2. Una tabla nueva de **roles con alcance** (ej. `admin_full`,
   `hospital_moderator`, `aid_point_moderator`, etc.), y que cada Server
   Action sensible (cambiar estado de hospital, agregar paciente, verificar
   punto de ayuda...) revise el rol correspondiente en vez de solo
   `isAdmin()`.
3. Una pantalla en `/admin` para que tú asignes esos roles a cuentas
   existentes (buscando por nombre de usuario, como ya se hace hoy para
   gestores de recursos, pero eligiendo el TIPO de rol, no solo el
   recurso).

**Importante, lo dijiste explícitamente**: tu propio rol de admin "tiene
que tener bastante alcance y función" — es decir, cuando se construya este
sistema de roles más granular, **tu cuenta debe seguir siendo la que más
alcance tiene de todas** (superset de cualquier rol parcial que le des a
alguien más), no quedar limitada por accidente al introducir roles más
finos para otros.

Es una pieza de trabajo real (varios días, no horas) — vale la pena que lo
discutan como proyecto aparte, no mezclado con lo del Tinder.

### 4.3 Campanita, perfil y configuración (esquina superior derecha)
- **Campanita de notificaciones**: **ya existe y funciona** (`NotificationBell.tsx`)
  — ícono con contador de avisos nuevos, ventana desplegable con lo que
  publicaste/guardaste y si tiene comentarios/reportes nuevos, botón
  "marcar como leído". Lo que **falta** de lo que pediste: un enlace/botón
  **"Ver todas las notificaciones"** que lleve a una página dedicada (hoy
  todo vive solo en el desplegable de la campanita, no hay una página
  aparte). Vale la pena revisarla en el sitio real primero para que me digas
  si el diseño/animación ya te convence o si específicamente qué cambiarías,
  antes de plantear una página nueva.
- **Ícono de perfil con foto**: **no existe** — hoy solo hay un ícono
  genérico de "usuario" (círculo con silueta), sin foto real ni página de
  perfil propia. Sería una función nueva: subir/cambiar foto de perfil
  (columna nueva en `profiles`), y una página `/perfil` o similar.
- **Ícono de configuración**: **no existe**. Antes de construirlo hace falta
  que me digas qué opciones concretas quieres ahí — "bastantes opciones y
  funciones" es muy abierto para planear; dame una lista (ej. cambiar
  contraseña, cambiar correo de recuperación, notificaciones por
  correo/WhatsApp, privacidad, cerrar sesión en todos los dispositivos,
  etc.) y lo agrego al plan con alcance claro.
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

## 5) Resumen para decidir

**Para mandar a hacer ya** (autocontenido, bajo riesgo, alto impacto):
1. Arreglo del conjunto de datos en el Tinder (🔴, bloqueante).
2. Bug del botón ℹ️.
3. Ocultar widgets en "¿La reconoces?".
4. Admin puede borrar denuncias falsas.

**Para planear como proyecto propio** (más grande, necesita diseño):
5. Modal de foto con comentarios + comentar desde la tarjeta.
6. Deshacer/volver en la baraja.
7. Extender la baraja a "Se busca".
8. Sistema de roles con alcance (arquitectura nueva).
9. Perfil con foto + página de configuración (falta que definas el alcance
   de "configuración").

**A futuro, sin tocar todavía**:
10. Multi-país.

---

## 6) Un principio que dijiste y vale la pena repetirle al equipo
"Hay que hacer[lo], pero hay que hacerlo bien." Ninguno de estos puntos es
urgente por vidas en juego (a diferencia de, por ejemplo, los teléfonos de
emergencia) — mejor que se tomen el tiempo de hacerlo con buen diseño,
transición y pulido (como ya lo hicieron con la mecánica de deslizar) que
apurarlo.
