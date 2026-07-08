interface PageHeaderProps {
  title?: string;
  description?: string;
}

export function PageHeader({ title, description }: PageHeaderProps) {
  if (!title && !description) return null;

  return (
    <div className="mb-6">
      {title && (
        <h2 className="text-lg sm:text-xl font-semibold text-text-primary">{title}</h2>
      )}
      {description && (
        <p className="mt-1 text-sm sm:text-base text-text-tertiary">{description}</p>
      )}
    </div>
  );
}
