/** a titled card grouping related fields on the settings forms */
export function FormSection({
  icon,
  title,
  description,
  children,
}: {
  /** a lucide icon, shown in a badge beside the title */
  icon?: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-5 rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
      <div className="flex items-start gap-3">
        {icon && (
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-navy-mid/10 text-brand-navy-mid">
            {icon}
          </span>
        )}
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-bold text-foreground">{title}</h2>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      {children}
    </section>
  );
}
