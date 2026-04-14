from pathlib import Path

path = Path("app/employee/pawn-ticket/_components/new-pawn-ticket-modal.tsx")
text = path.read_text(encoding="utf-8")
text = text.replace(
    'relative z-10 w-full max-w-4xl overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-2xl',
    'relative z-10 w-full max-w-[38rem] overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-2xl',
)
text = text.replace('max-h-[calc(100vh-10rem)] overflow-y-auto p-5', 'max-h-[calc(100vh-12rem)] overflow-y-auto p-4')
text = text.replace('text-2xl font-semibold text-zinc-900', 'text-xl font-semibold text-zinc-900')
text = text.replace('space-y-2 text-sm text-zinc-700', 'space-y-1.5 text-sm text-zinc-700')
old = 'w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100'
new = 'w-full max-w-[34rem] mx-auto rounded-2xl border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100'
text = text.replace(old, new)
old_rounded2xl = 'w-full rounded-2xl border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100'
new_rounded2xl = 'w-full max-w-[30rem] mx-auto rounded-2xl border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100'
text = text.replace(old_rounded2xl, new_rounded2xl)
path.write_text(text, encoding="utf-8")
print('remaining old rounded2xl strings:', text.count(old_rounded2xl))
print('remaining old strings:', text.count(old))
print('done')
