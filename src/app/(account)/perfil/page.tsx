import { requireAuth } from "@/server/auth/session";
import { ProfileForm } from "@/components/account/profile-form";

export const metadata = { title: "Mi perfil" };

export default async function PerfilPage() {
  const session = await requireAuth("/login?next=/perfil");

  return (
    <ProfileForm
      initial={{
        fullName: session.fullName,
        email: session.email,
        phone: session.phone,
        avatarUrl: session.avatarUrl,
        role: session.role,
      }}
    />
  );
}
