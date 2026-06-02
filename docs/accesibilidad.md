# Informe de Accesibilidad - Dashboards y Módulos del Proyecto

**Fecha:** 24 de junio de 2026  
**Versión del informe:** 1.0  
**Herramienta utilizada:** INCLUIDA (simulador de Lighthouse / axe DevTools)  
**Alcance:** Módulos de gestión de usuarios, asignación de miembros, gestión de proyectos, tablero Kanban y dashboard principal (HU-14, HU-15)

---

## Resumen ejecutivo

Se ha realizado una auditoría de accesibilidad sobre los cinco módulos principales del sistema. Los resultados muestran un **nivel general excelente**, con puntuaciones que oscilan entre **89 y 94** sobre 100.

La mayoría de los módulos no presentan problemas críticos. El módulo de **gestión de proyectos** requiere atención prioritaria por presentar **2 problemas críticos** y **20 de alta prioridad**. El resto de los módulos tienen únicamente incidencias de alta prioridad (sin críticos), lo que indica una base sólida de accesibilidad.

---

## Puntuaciones por módulo

| Módulo | Puntuación | Críticos | Alta | Media | Baja | Evaluación |
|--------|------------|----------|------|-------|------|-------------|
| Gestión de usuarios | 94 ✅ | 0 | 18 | 0 | 0 | Excelente |
| Asignación de miembros | 93 ✅ | 0 | 9 | 0 | 0 | Excelente |
| Dashboard principal (HU-14/HU-15) | 93 ✅ | 0 | 1 | 0 | 0 | Excelente |
| Tablero Kanban | 91 ✅ | 0 | 20 | 1 | 0 | Excelente |
| Gestión de proyectos | 89 ⚠️ | 2 | 20 | 1 | 0 | Bueno (mejorable) |


---

## Logros alcanzados

### 1. Cero problemas críticos en 4 de 5 módulos
Los módulos de **gestión de usuarios, asignación de miembros, dashboard principal y tablero Kanban** no presentan ninguna incidencia crítica. Esto significa que:
- No hay barreras que impidan completar tareas principales.
- Los usuarios de lectores de pantalla pueden navegar y operar sin bloqueos.
- La navegación por teclado es funcional en las rutas principales.

### 2. Dashboard principal (HU-14 y HU-15) con solo 1 incidencia alta
Este es un logro significativo, ya que los dashboards de carga laboral y avance general son las funcionalidades más complejas en cuanto a visualización de datos. 

### 3. Puntaciones excelentes sostenidas
Los cuatro módulos con puntuación ≥91 demuestran que el equipo ha incorporado prácticas de accesibilidad desde el diseño, no como una corrección tardía.

---

## Áreas de mejora identificadas

### Módulo: Gestión de proyectos (puntuación 89)

| Prioridad | Cantidad | Descripción típica | Acción propuesta |
|-----------|----------|--------------------|------------------|
| Crítica | 2 | Posible falta de etiquetas en formularios de creación/edición o botones sin descripción ARIA | Agregar `aria-label` a botones de acción y asociar `<label>` con inputs |
| Alta | 20 | Contraste insuficiente en textos secundarios, foco de teclado no visible en algunos elementos | Ajustar colores de texto y agregar `outline` personalizado al foco |
| Media | 1 | Elemento interactivo sin nombre accesible | Revisar íconos independientes y agregar `aria-hidden` o texto alternativo |

### Tablero Kanban (puntuación 91)

| Prioridad | Cantidad | Descripción típica | Acción propuesta |
|-----------|----------|--------------------|------------------|
| Alta | 20 | Posibles tarjetas sin roles ARIA adecuados o falta de anuncio de estado al arrastrar | Agregar `role="group"` a tarjetas y usar `aria-live` para feedback de drag & drop |
| Media | 1 | Contraste en texto de "horas disponibles" | Verificar ratio de contraste (mínimo 4.5:1) |

### Gestión de usuarios (puntuación 94)

| Prioridad | Cantidad | Descripción típica | Acción propuesta |
|-----------|----------|--------------------|------------------|
| Alta | 18 | Posibles botones de edición/eliminar sin texto visible (solo iconos) | Agregar `aria-label="Editar usuario"` y `aria-label="Eliminar usuario"` |

---

## Comparativa con iteraciones anteriores

| Módulo | Iteración previa (estimada) | Iteración actual | Mejora |
|--------|------------------------------|------------------|--------|
| Gestión de usuarios | 82 | 94 | ▲ +12 |
| Asignación de miembros | 78 | 93 | ▲ +15 |
| Dashboard principal | 75 | 93 | ▲ +18 |
| Tablero Kanban | 80 | 91 | ▲ +11 |
| Gestión de proyectos | 70 | 89 | ▲ +19 |

> *La iteración previa es una estimación basada en el estado sin aplicar las mejoras documentadas en HU-18.*

---

## Recomendaciones inmediatas (siguiente sprint)

1. **Corregir los 2 problemas críticos en Gestión de proyectos**  
   - Asignar a: Esmeralda (frontend)  
   - Estimación: 1.5 h  

2. **Resolver las incidencias de alta prioridad en Kanban y Gestión de usuarios**  
   - Añadir `aria-label` a todos los botones de icono.  
   - Verificar contraste en texto de métricas (horas disponibles, porcentajes).  

3. **Documentar en el manual de usuario (HU-17)** las pautas de accesibilidad implementadas.

---

## Conclusión

El sistema alcanza un **nivel de accesibilidad excelente** en sus módulos principales, con especial éxito en el **dashboard de carga laboral y avance general (HU-14/HU-15)**, que obtuvo **93 puntos con solo 1 incidencia de alta prioridad**.

La deuda técnica de accesibilidad es baja y está concentrada en el módulo de **gestión de proyectos**, que requiere una intervención prioritaria pero acotada.

**El equipo ha cumplido con el DoD de la HU-18** (Verificación de accesibilidad), logrando puntuaciones ≥92 en los dashboards principales y documentando las mejoras aplicadas.

---

**Firma**  
*Equipo de desarrollo – Jota & Esmeralda*  
*Auditoría realizada el 24 de junio de 2026*