import { requireAuthenticatedMember } from "@/auth/app-access";

export default async function AccountSettingsPage() {
  const session = await requireAuthenticatedMember();

  return (
    <section className="grid gap-4">
      <div>
        <h2 className="text-heading text-foreground">帳號資訊</h2>
        <p className="mt-1 text-caption text-muted-foreground">
          顯示目前登入成員的基本資訊；編輯行為後續再定義。
        </p>
      </div>
      <div className="rounded-card border border-border bg-card p-5">
        <p className="text-label text-muted-foreground">顯示名稱</p>
        <p className="mt-2 text-subheading text-foreground">
          {session.profile.displayName}
        </p>
      </div>
    </section>
  );
}
