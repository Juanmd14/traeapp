import "server-only";
import { createSafeActionClient } from "next-safe-action";
import { getSession } from "@/server/auth/session";

/**
 * Cliente público — para acciones que no requieren auth.
 */
export const action = createSafeActionClient({
  handleServerError(e) {
    console.error("[action error]", e.message);
    return e.message ?? "Algo salió mal";
  },
});

/**
 * Cliente autenticado — inyecta session al ctx.
 * Uso:
 *   export const myAction = authAction
 *     .schema(mySchema)
 *     .action(async ({ parsedInput, ctx }) => {
 *       ctx.session // <-- SessionProfile
 *     })
 */
export const authAction = action.use(async ({ next }) => {
  const session = await getSession();
  if (!session) {
    throw new Error("No autenticado");
  }
  return next({ ctx: { session } });
});

/**
 * Sólo admin.
 */
export const adminAction = authAction.use(async ({ next, ctx }) => {
  if (ctx.session.role !== "admin") {
    throw new Error("No autorizado");
  }
  return next({ ctx });
});
