export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-4 py-8">
      <header>
        <p className="text-sm font-medium text-neutral-600">Home Family Fund</p>
        <h1 className="mt-2 text-3xl font-semibold text-neutral-950">
          Household fund dashboard
        </h1>
      </header>
      <section className="rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="text-lg font-medium text-neutral-900">MVP baseline</h2>
        <p className="mt-2 text-sm text-neutral-700">
          The first implementation slice establishes the app shell and
          authorization domain rules. Financial workflows will be added through
          verified stories.
        </p>
      </section>
    </main>
  );
}
