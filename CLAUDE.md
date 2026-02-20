# FUMBOWL LEAGUE — Contexto del Proyecto

## ¿Qué es?

Plataforma web para gestionar **Fumbowl League**, una competición online de **Blood Bowl** que combina 3 formatos de juego dentro de la misma temporada.

Blood Bowl es un juego de mesa/videojuego de estrategia por turnos ambientado en un universo de fantasía, donde entrenadores dirigen equipos de diferentes razas en partidos de fútbol americano violento. Los equipos evolucionan entre temporadas (jugadores ganan experiencia, se lesionan, mueren).

---

## Estructura de una temporada

### 1. Pretemporada
- **Formato:** Swiss sin resurrección
- **Partidos:** 4 por entrenador
- Los resultados de la pretemporada determinan el orden de draft

### 2. Fase Regular
- **Formato:** Round Robin por divisiones
- **Partidos:** 13 por entrenador
- Las franquicias se organizan en **divisiones** (mínimo 7: División 1 a División 7)
- Los resultados finales determinan ascensos/descensos y clasificación para playoffs

### 3. Playoffs
- **Formato:** Knockout (eliminación directa)
- **Clasificados:** Los mejores **32** equipos de la fase regular:
  - 6 de División 1
  - 5 de División 2
  - 5 de División 3
  - 4 de División 4
  - 4 de División 5
  - 4 de División 6
  - 4 de División 7
- El ganador del playoff es el **Campeón de la Temporada**

---

## Reglas clave

### Ascensos y descensos
- Las **4 primeras** posiciones de cada división ascienden
- Las **4 últimas** posiciones de cada división descienden
- Afecta a todas las divisiones excepto la 1ª (solo desciende) y la última (solo asciende)

### Restricción de razas por división
- **No pueden repetirse razas** dentro de la misma división
- Si un entrenador sube o baja, puede producirse un conflicto de raza que se resuelve mediante el draft

### Sistema de Draft
- Se celebra antes de cada temporada para asignar razas
- Orden de selección: **inverso a la clasificación final de la fase regular**
- Primero escoge el peor clasificado; último el mejor
- Ejemplo: si suben 4 entrenadores de 2ª a 1ª, el que quedó 4º de 2ª escoge antes que el que quedó 3º, y así sucesivamente hasta el 1º de 1ª

### Equipos persistentes
- Los equipos **no se resetean** entre temporadas
- Los jugadores conservan experiencia, lesiones y habilidades ganadas
- Esto añade una dimensión estratégica de largo plazo (gestión de plantilla)

---

## Conceptos de dominio

| Término | Descripción |
|---|---|
| **Entrenador** | Usuario/jugador de la liga |
| **Franquicia** | El equipo de Blood Bowl de un entrenador (persiste entre temporadas) |
| **Raza** | El tipo de equipo en Blood Bowl (Humanos, Orcos, Elfos, No-Muertos, etc.) |
| **División** | Grupo de entrenadores que compiten entre sí en fase regular |
| **Swiss** | Formato donde los rivales se emparejan por puntuación similar (sin eliminar) |
| **Round Robin** | Todos contra todos dentro de la división |
| **Knockout** | Eliminación directa |
| **Draft** | Proceso de selección de razas para la nueva temporada |
| **Ascenso/Descenso** | Cambio de división al final de temporada |

---

## Stack técnico

| Capa | Tecnología |
|---|---|
| Framework | Next.js 15 (App Router) |
| Lenguaje | TypeScript |
| Estilos | Tailwind CSS |
| Deploy | Vercel |
| Repositorio | GitHub (`jvilap/fumbowl-league`) |
| Datos externos | FUMBBL API (`https://fumbbl.com/api`) |

---

## Fuente de datos: FUMBBL API

La web consume la API pública de **FUMBBL** (plataforma donde se juegan las partidas).
- **Base URL:** `https://fumbbl.com/api`
- **Docs:** https://fumbbl.com/apidoc/#/
- Los endpoints de lectura son públicos (sin OAuth). OAuth solo requerido para escritura.
- Las llamadas se hacen desde **Next.js Route Handlers** (`app/api/`) para evitar CORS y ocultar la lógica de proxy.

### Endpoints utilizados

| Entidad | Endpoint | Descripción |
|---|---|---|
| **Entrenador** | `GET /coach/get/{coachId}` | Info del entrenador |
| | `GET /coach/search/{term}` | Buscar entrenadores por nombre |
| | `GET /coach/teams/{coach}` | Equipos de un entrenador |
| **Equipo** | `GET /team/get/{teamId}` | Info y plantilla del equipo |
| | `GET /team/matches/{teamId}/{latestMatch}` | Historial de partidas del equipo |
| **Jugador** | `GET /player/get/{playerId}` | Info y stats del jugador |
| **Partida** | `GET /match/get/{matchId}` | Detalle de una partida |
| **Roster** | `GET /roster/get/{rosterId}` | Info de la raza/roster |
| **Posición** | `GET /position/get/{positionId}` | Info de una posición del equipo |
| **Habilidades** | `GET /skill/list` | Listado de habilidades disponibles |
| **Torneo** | `GET /tournament/get/{tournamentId}` | Info de un torneo |
| | `GET /tournament/schedule/{tournamentId}` | Calendario de un torneo |
| **Grupo** | `GET /group/tournaments/{groupId}` | Torneos de un grupo (=liga) |

### Estructura de proxy en Next.js

```
app/api/fumbbl/
  coach/[id]/route.ts         → GET /coach/get/{id}
  coach/[id]/teams/route.ts   → GET /coach/teams/{id}
  coach/search/route.ts       → GET /coach/search/{term}
  team/[id]/route.ts          → GET /team/get/{id}
  team/[id]/matches/route.ts  → GET /team/matches/{id}/{latestMatch}
  player/[id]/route.ts        → GET /player/get/{id}
  match/[id]/route.ts         → GET /match/get/{id}
```

---

## Funcionalidades previstas (backlog inicial)

### Estadísticas (MVP — datos de FUMBBL)
- [ ] Página de perfil de entrenador con sus equipos e historial
- [ ] Página de equipo con plantilla, stats y últimas partidas
- [ ] Página de jugador con stats individuales (TDs, bajas, SPPs, habilidades)
- [ ] Buscador global de entrenadores y equipos
- [ ] Historial de partidas con detalle por equipo

### Liga (fase 2)
- [ ] Clasificaciones por división (fase regular)
- [ ] Bracket de playoffs
- [ ] Gestión del draft de razas
- [ ] Ascensos y descensos automáticos al cierre de temporada
- [ ] Panel de administración para el comisionado

---

## Estructura de carpetas objetivo

```
app/
  (stats)/                    # Grupo de rutas de estadísticas
    entrenador/[id]/page.tsx
    equipo/[id]/page.tsx
    jugador/[id]/page.tsx
  api/
    fumbbl/                   # Proxy hacia FUMBBL API
      coach/[id]/route.ts
      team/[id]/route.ts
      player/[id]/route.ts
components/
  stats/                      # Componentes de estadísticas
  ui/                         # Componentes genéricos (botones, cards, etc.)
lib/
  fumbbl.ts                   # Cliente tipado de la FUMBBL API
  types.ts                    # Tipos TypeScript del dominio
```

---

## Convenciones de desarrollo

- Componentes en `components/` con PascalCase
- Rutas en `app/` siguiendo App Router de Next.js
- Un componente por archivo
- Llamadas a FUMBBL siempre a través de `lib/fumbbl.ts`, nunca directas desde componentes
- Commits en inglés, formato: `tipo: descripción corta`
