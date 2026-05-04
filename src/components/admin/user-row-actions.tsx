"use client";

import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { updateUserRoleAction, toggleUserActiveAction } from "@/server/actions/admin";

const ROLES = [
  { value: "customer", label: "Cliente" },
  { value: "delivery_driver", label: "Repartidor" },
  { value: "store_owner", label: "Dueño de comercio" },
  { value: "store_staff", label: "Staff de comercio" },
  { value: "admin", label: "Administrador" },
] as const;

type Role = (typeof ROLES)[number]["value"];

export function UserRoleSelect({
  userId,
  currentRole,
}: {
  userId: string;
  currentRole: string;
}) {
  const { execute, isPending } = useAction(updateUserRoleAction, {
    onSuccess: () => toast.success("Rol actualizado"),
    onError: ({ error }) => toast.error(error.serverError ?? "Error"),
  });

  return (
    <select
      defaultValue={currentRole}
      disabled={isPending}
      onChange={(e) => execute({ userId, role: e.target.value as Role })}
      className="text-body-xs border border-neutral-200 rounded-md px-2 py-1 bg-white text-neutral-700 disabled:opacity-50 cursor-pointer"
    >
      {ROLES.map((r) => (
        <option key={r.value} value={r.value}>
          {r.label}
        </option>
      ))}
    </select>
  );
}

export function ToggleActiveButton({
  userId,
  isActive,
}: {
  userId: string;
  isActive: boolean;
}) {
  const { execute, isPending } = useAction(toggleUserActiveAction, {
    onSuccess: () => toast.success(isActive ? "Cuenta desactivada" : "Cuenta activada"),
    onError: ({ error }) => toast.error(error.serverError ?? "Error"),
  });

  return (
    <button
      disabled={isPending}
      onClick={() => execute({ userId, isActive: !isActive })}
      className={`text-body-xs font-medium px-2.5 py-1 rounded-full transition disabled:opacity-50 ${
        isActive
          ? "bg-red-50 text-red-700 hover:bg-red-100"
          : "bg-accent-50 text-accent-700 hover:bg-accent-100"
      }`}
    >
      {isPending ? "..." : isActive ? "Desactivar" : "Activar"}
    </button>
  );
}
