export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 bg-background px-4 py-8 text-foreground">
      <header>
        <p className="text-label text-muted-foreground">家庭共用金管理</p>
        <h1 className="mt-2 text-display text-foreground">家庭資金總覽</h1>
      </header>
      <section className="rounded-card border border-border bg-card p-4 text-card-foreground">
        <h2 className="text-subheading">MVP 基線</h2>
        <p className="mt-2 text-caption text-muted-foreground">
          第一個實作切片已建立應用程式骨架與授權規則。後續會依照已驗證的
          stories 補上收支、週期入帳、月報與退款流程。
        </p>
        <dl className="mt-4 grid gap-3 text-label sm:grid-cols-2">
          <div className="rounded-card border border-border bg-secondary p-3">
            <dt className="text-muted-foreground">收入主色</dt>
            <dd className="mt-1 text-income">--income</dd>
          </div>
          <div className="rounded-card border border-border bg-secondary p-3">
            <dt className="text-muted-foreground">支出主色</dt>
            <dd className="mt-1 text-expense">--expense</dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
