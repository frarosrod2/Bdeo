# AI Log - Claims Management System

Este documento detalla la metodología de trabajo seguida utilizando herramientas de Inteligencia Artificial y la supervisión técnica aplicada para garantizar el cumplimiento de los requisitos del ejercicio.

## 1. Estrategia de Spec-Driven Development (SDD)
Siguiendo las recomendaciones del ejercicio, se utilizó la IA para:
* **Definición del Contrato:** Generación del esquema inicial de OpenAPI (Swagger) basado en las entidades `Claim` y `Damage`.
* **Sincronización:** Se utilizó el contrato como "fuente de verdad" para que la IA generase los tipos de TypeScript tanto en el backend como en el frontend, evitando discrepancias en los modelos de datos.

## 2. Backend & Calidad de Pruebas (Cobertura >95%)
Para alcanzar la cobertura exigida del 95%, se procedió de la siguiente manera:
* **Generación de Tests:** Se empleó Claude para escribir el boilerplate de las pruebas unitarias y de integración.
* **Supervisión y Corrección:**
    * Se revisaron manualmente todos los operadores de aserción (`as`) para evitar falsos positivos y asegurar que los tipos de TypeScript fuesen correctos.
    * Se validó la lógica de los tests de integración para asegurar que el cálculo del `Total Amount` en el servidor sumase correctamente los precios de los daños.
    * Se implementó manualmente el patrón de **Inyección de Dependencias (DI)** para desacoplar los servicios de los controladores, facilitando el uso de *mocks* en los tests.

## 3. Frontend: Angular 20, Zoneless y Reactividad
La IA tendía a generar código basado en versiones antiguas o patrones estándar de Angular. Se aplicó un criterio técnico estricto para modernizar la solución:
* **Arquitectura:** Se corrigió el código generado por la IA para implementar **ChangeDetectionStrategy.OnPush** y configurar la aplicación como **Zoneless**, alineándolo con las características de Angular 20.
* **Angular Material:** Se migraron los componentes de UI a las APIs más recientes de Angular Material.
* **Lógica Reactiva:** Se supervisó la implementación de **Reactive Forms** y la gestión de estado para que el `Total Amount` se actualice en tiempo real en la vista de detalle al añadir, editar o borrar daños.
* **Interfaces de API:** Se crearon manualmente las interfaces del servicio de frontend para asegurar que el mapeo de datos entre el backend y los componentes fuese 100% coherente.

## 4. Implementación de Reglas de Negocio
Se prestó especial atención a la corrección de la IA en reglas complejas:
* **Restricciones de Estado:** Validación manual para que los daños solo sean editables si el estado de la reclamación es `Pending`.
* **Lógica de Cierre:** Implementación de la validación que requiere una descripción de más de 100 caracteres si existe un daño con severidad alta para permitir el estado `Finished`.

## 5. Conclusión
El uso de la IA permitió acelerar la escritura de código repetitivo y la estructura de tests, pero la **arquitectura final, la optimización de Angular y la integridad de las reglas de negocio** fueron supervisadas y corregidas manualmente para cumplir con los estándares de escalabilidad y mantenibilidad requeridos.