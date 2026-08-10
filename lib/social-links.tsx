import type { SocialAccount, SocialPlatform } from "@/lib/brand-config";

const platformLabels: Record<SocialPlatform, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  tiktok: "TikTok",
};

const platformAccent: Record<SocialPlatform, string> = {
  facebook: "hover:bg-[#1877F2] hover:text-white hover:border-transparent",
  instagram:
    "hover:bg-gradient-to-br hover:from-[#f09433] hover:via-[#dc2743] hover:to-[#bc1888] hover:text-white hover:border-transparent",
  tiktok: "hover:bg-black hover:text-white hover:border-transparent",
};

export function socialPlatformLabel(platform: SocialPlatform): string {
  return platformLabels[platform];
}

export function socialPlatformAccent(platform: SocialPlatform): string {
  return platformAccent[platform];
}

export function SocialPlatformIcon({
  platform,
  className = "h-5 w-5",
}: {
  platform: SocialPlatform;
  className?: string;
}) {
  if (platform === "facebook") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
        <path d="M9.198 21.5h4v-8.01h3.604l.396-3.98h-4V7.5a1 1 0 0 1 1-1h3v-4h-3a5 5 0 0 0-5 5v2.01h-2l-.396 3.98h2.396v8.01Z" />
      </svg>
    );
  }

  if (platform === "instagram") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
        <path d="M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.254 1.216.598 1.772 1.153a4.908 4.908 0 0 1 1.153 1.772c.247.637.415 1.363.465 2.428.047 1.066.06 1.405.06 4.122 0 2.717-.01 3.056-.06 4.122-.05 1.065-.218 1.79-.465 2.428a4.883 4.883 0 0 1-1.153 1.772 4.915 4.915 0 0 1-1.772 1.153c-.637.247-1.363.415-2.428.465-1.066.047-1.405.06-4.122.06-2.717 0-3.056-.01-4.122-.06-1.065-.05-1.79-.218-2.428-.465a4.89 4.89 0 0 1-1.772-1.153 4.904 4.904 0 0 1-1.153-1.772c-.248-.637-.415-1.363-.465-2.428C2.013 15.056 2 14.717 2 12c0-2.717.01-3.056.06-4.122.05-1.066.217-1.79.465-2.428a4.88 4.88 0 0 1 1.153-1.772A4.897 4.897 0 0 1 5.45 2.525c.638-.248 1.362-.415 2.428-.465C8.944 2.013 9.283 2 12 2Zm0 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm6.5-.25a1.25 1.25 0 1 0-2.5 0 1.25 1.25 0 0 0 2.5 0ZM12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M16.6 5.82s.51.5 0 0A4.28 4.28 0 0 1 15.54 9h.01a4.26 4.26 0 0 1-1.06-3.18ZM19.5 12a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Zm-3.75-1.5h-2.63a5.92 5.92 0 0 0 1.67-2.12 6.08 6.08 0 0 1 2.12 4.35 6 6 0 0 1-1.16 2.23Zm-7.5 0a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm0-2.25a2.25 2.25 0 1 1 0-4.5 2.25 2.25 0 0 1 0 4.5Z" />
    </svg>
  );
}

export function SocialAccountCard({ account }: { account: SocialAccount }) {
  return (
    <a
      href={account.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-4 rounded-2xl border border-brand-green/10 bg-white p-5 shadow-[0_8px_30px_rgba(11,93,59,0.08)] transition hover:-translate-y-0.5 hover:border-brand-gold/40 hover:shadow-[0_16px_40px_rgba(11,93,59,0.12)]"
    >
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-brand-green/10 bg-brand-green/5 text-brand-green transition ${socialPlatformAccent(account.platform)}`}
      >
        <SocialPlatformIcon platform={account.platform} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-brand-gold">
          {socialPlatformLabel(account.platform)}
        </p>
        <p className="mt-1 truncate font-display text-lg font-bold text-brand-green">{account.pageName}</p>
        <p className="truncate text-sm text-brand-green/60">@{account.handle.replace(/^@/, "")}</p>
      </div>
      <span className="shrink-0 text-xs font-bold uppercase tracking-wide text-brand-green/50 transition group-hover:text-brand-green">
        Visit →
      </span>
    </a>
  );
}

export function SocialIconLink({ account }: { account: SocialAccount }) {
  return (
    <a
      href={account.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${socialPlatformLabel(account.platform)} — ${account.pageName}`}
      className={`flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white/75 transition-all duration-200 hover:scale-110 ${socialPlatformAccent(account.platform)}`}
    >
      <SocialPlatformIcon platform={account.platform} className="h-4.5 w-4.5" />
    </a>
  );
}
