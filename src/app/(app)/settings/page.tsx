export default function SettingsPage() {
  return <Placeholder title="設定" />;
}

function Placeholder({ title }: { title: string }) {
  return (
    <div className="grid min-h-[28rem] place-items-center rounded-card border border-dashed border-border bg-card/40">
      <div className="text-center">
        <p className="text-heading text-foreground">{title}</p>
        <p className="mt-2 text-subheading text-muted-foreground">敬請期待</p>
      </div>
    </div>
  );
}
