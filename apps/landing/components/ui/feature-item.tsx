export function FeatureItem({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-4 p-6 rounded-xl border border-border/30 hover:border-primary/50 transition-colors bg-card/50 backdrop-blur-sm">
      <div className="bg-primary/10 p-2.5 rounded-lg flex-shrink-0">{icon}</div>
      <div>
        <h3 className="font-semibold text-lg">{title}</h3>
        <p className="text-muted-foreground mt-1">{description}</p>
      </div>
    </div>
  );
}
