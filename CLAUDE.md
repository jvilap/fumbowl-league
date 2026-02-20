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

---

## Funcionalidades previstas (backlog inicial)

- [ ] Gestión de entrenadores (registro, perfil, historial)
- [ ] Gestión de franquicias y plantillas
- [ ] Clasificaciones por división (fase regular)
- [ ] Gestión del draft de razas
- [ ] Bracket de playoffs
- [ ] Registro de resultados de partidos
- [ ] Ascensos y descensos automáticos al cierre de temporada
- [ ] Historial de temporadas
- [ ] Panel de administración para el comisionado

---

## Convenciones de desarrollo

- Componentes en `components/` con PascalCase
- Rutas en `app/` siguiendo App Router de Next.js
- Un componente por archivo
- Commits en inglés, formato: `tipo: descripción corta`
