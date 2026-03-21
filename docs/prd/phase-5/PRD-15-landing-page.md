# PRD-15: Landing Page

**Phase:** 5 | **Status:** Draft | **Esfuerzo:** S (Small)
**Fecha:** 2026-03-21

---

## Problema

El proyecto Bouchard no tiene interfaz visual. Todo se observa via prints en la consola de Webots y logs CSV (`logger.py` escribe 26 columnas por step). Un visitante del proyecto — colaborador, presentador, o evaluador — no tiene forma de entender que esta pasando sin leer el codigo fuente o mirar la terminal de Webots.

`terrain_robot.py` imprime estado al `stdout` del proceso Webots (lineas 42-54 al inicio, linea 106-112 al final), pero esta salida es efimera, no navegable, y no accesible fuera de la ventana de Webots. PRD-14 propuso un `scripts/dashboard.py` con matplotlib, pero eso requiere instalacion local y no es real-time.

Se necesita un shell web que sirva como punto de entrada visual del proyecto: que es Bouchard, que estado tiene el robot, y enlaces a las funcionalidades de monitoreo (PRD-16) y control (PRD-17). Esta landing page es el contenedor SPA que las otras dos funcionalidades extienden con rutas y componentes adicionales.

## User Stories

- Como visitante del proyecto, quiero abrir una URL en mi navegador y ver una descripcion de Bouchard con el estado actual de conexion al robot para entender que hace el sistema sin leer codigo.
- Como desarrollador, quiero un scaffold de aplicacion React + TypeScript que pueda extender con componentes de dashboard y control remoto sin reescribir la estructura base.
- Como presentador, quiero una interfaz visual profesional para mostrar durante demos del robot en Webots.

## Requisitos

### Must Have

- [ ] **FR-1**: Crear proyecto Vite + React + TypeScript en `web/` con estructura estandar (`src/`, `public/`, `package.json`, `tsconfig.json`, `vite.config.ts`)
- [ ] **FR-2**: Pagina principal con: nombre del proyecto ("Bouchard"), descripcion breve (navegacion autonoma con IA), diagrama o ilustracion de la arquitectura (reflejos + estrategia + mapa)
- [ ] **FR-3**: Indicador de estado de conexion al backend: circulo verde/rojo que muestra si el WebSocket al servidor esta activo, con texto descriptivo ("Conectado" / "Desconectado - robot no activo")
- [ ] **FR-4**: Layout con navegacion (sidebar o tabs) con links a: Home, Status (PRD-16), Control (PRD-17), con rutas preparadas usando React Router
- [ ] **FR-5**: Componente `ConnectionProvider` (React Context) que maneja la conexion WebSocket y la comparte con toda la app. El WebSocket apunta a `ws://localhost:8765/ws` por default, configurable via variable de entorno `VITE_WS_URL`
- [ ] **FR-6**: README en `web/` con instrucciones de instalacion (`npm install`, `npm run dev`) y requisitos (Node 18+)

### Nice to Have

- [ ] **FR-7**: Dark mode por default (apropiado para dashboards de monitoreo), con toggle para light mode
- [ ] **FR-8**: Seccion "Arquitectura" con diagrama interactivo mostrando el flujo sensores -> reflejos -> estrategia -> motores
- [ ] **FR-9**: Footer con link al repositorio y creditos del proyecto

## Criterios de Aceptacion

- [ ] **AC-1**: `npm run dev` levanta la app en `http://localhost:5173` sin errores
- [ ] **AC-2**: La pagina muestra contenido descriptivo del proyecto sin necesitar backend activo
- [ ] **AC-3**: El indicador de conexion muestra "Desconectado" cuando el servidor no esta corriendo, y cambia a "Conectado" dentro de 2 segundos cuando el servidor arranca
- [ ] **AC-4**: La navegacion entre rutas (Home, Status, Control) funciona sin recarga de pagina
- [ ] **AC-5**: Build de produccion (`npm run build`) genera assets estaticos en `web/dist/` de menos de 500KB gzipped

## Dependencias

- **Requiere:** Nada (leaf node — la landing page es contenido estatico + un intento de WebSocket que falla gracefully)
- **Habilita:** PRD-16 (status dashboard se monta como ruta/componente dentro del shell), PRD-17 (control remoto se monta como ruta/componente dentro del shell)

## Archivos Afectados

| Archivo | Cambio |
|---------|--------|
| `web/package.json` | **Nuevo**: proyecto Vite + React + TypeScript |
| `web/vite.config.ts` | **Nuevo**: config de Vite con proxy para dev |
| `web/tsconfig.json` | **Nuevo**: config TypeScript |
| `web/src/main.tsx` | **Nuevo**: entry point React |
| `web/src/App.tsx` | **Nuevo**: layout con router y navegacion |
| `web/src/pages/HomePage.tsx` | **Nuevo**: landing page con info del proyecto |
| `web/src/pages/StatusPage.tsx` | **Nuevo**: placeholder para PRD-16 |
| `web/src/pages/ControlPage.tsx` | **Nuevo**: placeholder para PRD-17 |
| `web/src/contexts/ConnectionContext.tsx` | **Nuevo**: WebSocket connection provider |
| `web/src/components/ConnectionIndicator.tsx` | **Nuevo**: indicador visual de estado |
| `web/README.md` | **Nuevo**: instrucciones de uso |
| `.gitignore` | Agregar `web/node_modules/`, `web/dist/` |

## Metricas de Exito

| Metrica | Target |
|---------|--------|
| Tiempo de setup (clone + npm install + npm run dev) | < 2 minutos |
| Tamano del bundle de produccion (gzipped) | < 500KB |
| Lighthouse performance score | > 90 |
| Tiempo hasta indicador de conexion se actualiza | < 2 segundos |

## Riesgos

| Riesgo | Prob | Impacto | Mitigacion |
|--------|------|---------|------------|
| Dependencia de Node.js en un proyecto primariamente Python | Baja | Bajo | Node solo para la interfaz web; robot funciona sin ella. Documentar como opcional |
| WebSocket reconnect logic agrega complejidad al provider | Baja | Bajo | Usar libreria como `reconnecting-websocket` o implementar retry con backoff exponencial simple |
| Scope creep en el diseno visual de la landing | Media | Bajo | Mantener minimalista: Tailwind CSS utility-first, sin design system custom |

## Estructura del Proyecto Web

```
web/
  package.json
  vite.config.ts
  tsconfig.json
  index.html
  public/
  src/
    main.tsx
    App.tsx
    pages/
      HomePage.tsx
      StatusPage.tsx        # Placeholder -> PRD-16
      ControlPage.tsx       # Placeholder -> PRD-17
    contexts/
      ConnectionContext.tsx  # WebSocket provider
    components/
      ConnectionIndicator.tsx
    types/
      robot.ts              # Tipos compartidos
```

## Estimacion

**S (Small)** — Scaffolding de proyecto Vite + pagina estatica + WebSocket context basico. Sin logica de negocio compleja. ~3-4 horas.
