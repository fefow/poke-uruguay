# Poke Uruguay: reglas del proyecto

## Historia
`docs/HISTORIA.md` es el documento único y actualizado de la historia. **Todo cambio que toque la historia** (orden de ciudades o gimnasios, líderes, jefes del PP, misiones, eventos, favores, mini historias, objetos o MT de historia, diálogos clave, final) debe actualizar `docs/HISTORIA.md` en el mismo PR, y la línea «Última actualización» con fecha y versión.

## Flujo
- PR a main; no se mergea hasta que el usuario lo pida.
- Subir `VERSION` en `src/version.ts` en cada publicación.
- `npx tsc --noEmit`, `npm test` y `npm run build` antes de empujar.
- Las flags nuevas de historia deben aceptarse en la validación de partidas.
