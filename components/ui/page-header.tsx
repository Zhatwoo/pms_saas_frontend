interface PageHeaderProps {
  title?: string;
  description?: string;
}

export function PageHeader({ title, description }: PageHeaderProps) {
  if (!title && !description) return null;

  return (
    <div className="mb-6">
      {title && (
        <h2 className="text-xl font-semibold text-zinc-900">{title}</h2>
      )}
      {description && (
        <p className="mt-1 text-base text-zinc-500">{description}</p>
      )}
    </div>
  );
}
