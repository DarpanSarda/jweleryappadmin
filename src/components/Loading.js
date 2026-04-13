export default function Loading({ message = 'Loading...', size = 'md' }) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16'
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-8">
      <div className="relative flex items-center justify-center">
        <svg
          className={`${sizeClasses[size] || sizeClasses.md} animate-spin`}
          viewBox="0 0 50 50"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Subtle background track */}
          <circle
            className="text-indigo-400 opacity-20"
            cx="25"
            cy="25"
            r="20"
            stroke="currentColor"
            strokeWidth="4"
          />
          {/* Dynamic rotating gradient dash */}
          <circle
            className="opacity-90 drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]"
            cx="25"
            cy="25"
            r="20"
            stroke="url(#purpleGradient)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="70 55"
          />
          <defs>
            <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="50%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
          </defs>
        </svg>
        {/* Inner pulsing dot */}
        <div className="absolute inset-0 m-auto w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse blur-[1px]"></div>
      </div>
      {message && (
        <span className="text-indigo-900/60 font-medium text-sm animate-pulse tracking-wide">{message}</span>
      )}
    </div>
  )
}

export function TableLoading({ colSpan = 6, message = 'Loading data...' }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-6 py-16 text-center">
        <Loading message={message} size="md" />
      </td>
    </tr>
  )
}

export function PageLoading() {
  return (
    <div className="fixed inset-0 bg-slate-50/80 backdrop-blur-sm flex items-center justify-center z-50 transition-all duration-300">
      <div className="bg-white/80 p-8 rounded-2xl shadow-xl shadow-indigo-900/10 border border-white flex flex-col items-center gap-6">
        <Loading message="Loading Vezura Admin..." size="lg" />
      </div>
    </div>
  )
}

export function CardLoading({ count = 1 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 animate-pulse relative overflow-hidden">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-linear-to-r from-transparent via-white/40 to-transparent z-10"></div>
          <div className="w-12 h-12 bg-indigo-50/50 rounded-xl mb-4 flex items-center justify-center">
            <div className="w-6 h-6 bg-indigo-100/50 rounded-full" />
          </div>
          <div className="h-4 bg-slate-100 rounded-md w-24 mb-3" />
          <div className="h-8 bg-slate-100 rounded-lg w-16" />
        </div>
      ))}
    </>
  )
}
