import { AlertTriangle } from "lucide-react";

export function Card({ children, className = "" }) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function Toggle({ checked, onChange, disabled = false, label }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition focus:outline-none focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-60 ${
        checked ? "bg-emerald-600" : "bg-slate-300"
      }`}
    >
      <span
        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${checked ? "left-6" : "left-1"}`}
      />
    </button>
  );
}

export function NumberField({ label, value, onChange, unit, min = 0, step = 1, hint, dense = false }) {
  return (
    <label className="block">
      <div className={`${dense ? "mb-1" : "mb-1.5"} flex items-center justify-between gap-3`}>
        <span className={`${dense ? "text-xs" : "text-sm"} font-semibold text-slate-700`}>{label}</span>
        {hint && <span className="text-xs text-slate-400">{hint}</span>}
      </div>
      <div className={`flex items-center rounded-2xl border border-slate-200 bg-white ${dense ? "px-3 py-2" : "px-4 py-3"} shadow-sm focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-100`}>
        <input
          type="number"
          min={min}
          step={step}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`w-full min-w-0 bg-transparent ${dense ? "text-sm" : "text-lg"} font-bold text-slate-900 outline-none`}
        />
        {unit && <span className="ml-2 whitespace-nowrap text-sm font-semibold text-slate-400">{unit}</span>}
      </div>
    </label>
  );
}

export function TextField({ label, value, onChange, placeholder, type = "text", dense = false }) {
  return (
    <label className="block">
      <span className={`${dense ? "mb-1 text-xs" : "mb-1.5 text-sm"} block font-semibold text-slate-700`}>{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={`w-full rounded-2xl border border-slate-200 bg-white ${dense ? "px-3 py-2" : "px-4 py-3"} text-sm font-bold text-slate-900 shadow-sm outline-none transition placeholder:text-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100`}
      />
    </label>
  );
}

export function TextArea({ label, value, onChange, placeholder, rows = 4, dense = false }) {
  return (
    <label className="block">
      <span className={`${dense ? "mb-1 text-xs" : "mb-1.5 text-sm"} block font-semibold text-slate-700`}>{label}</span>
      <textarea
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={`w-full resize-none rounded-2xl border border-slate-200 bg-white ${dense ? "px-3 py-2" : "px-4 py-3"} text-sm font-medium text-slate-900 shadow-sm outline-none transition placeholder:text-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100`}
      />
    </label>
  );
}

export function SelectField({ label, value, onChange, children, dense = false }) {
  return (
    <label className="block">
      <span className={`${dense ? "mb-1 text-xs" : "mb-1.5 text-sm"} block font-semibold text-slate-700`}>{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`w-full rounded-2xl border border-slate-200 bg-white ${dense ? "px-3 py-2" : "px-4 py-3"} text-sm font-bold text-slate-700 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100`}
      >
        {children}
      </select>
    </label>
  );
}

export function StatCard({ icon: Icon, label, value, detail, tone = "emerald", compact = false }) {
  const toneClasses = {
    emerald: {
      card: "border-emerald-800 bg-emerald-900 text-white shadow-emerald-950/20",
      icon: "bg-white text-emerald-900",
      label: "text-emerald-200",
      detail: "text-emerald-100",
    },
    slate: {
      card: "border-slate-800 bg-slate-950 text-white shadow-slate-950/20",
      icon: "bg-white text-slate-950",
      label: "text-slate-300",
      detail: "text-slate-300",
    },
    amber: {
      card: "border-amber-300 bg-amber-100 text-amber-950 shadow-amber-950/10",
      icon: "bg-amber-500 text-white",
      label: "text-amber-700",
      detail: "text-amber-800",
    },
    red: {
      card: "border-red-300 bg-red-100 text-red-950 shadow-red-950/10",
      icon: "bg-red-600 text-white",
      label: "text-red-700",
      detail: "text-red-800",
    },
  };
  const current = toneClasses[tone] || toneClasses.emerald;

  return (
    <Card className={`${compact ? "rounded-2xl p-3" : "p-4"} border-2 shadow-lg ${current.card}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className={`text-xs font-black uppercase tracking-[0.18em] ${current.label}`}>{label}</p>
          <p className={`${compact ? "mt-1 text-xl" : "mt-2 text-2xl"} break-words font-black tabular-nums`}>{value}</p>
          {detail && <p className={`mt-1 text-xs font-bold ${current.detail}`}>{detail}</p>}
        </div>
        <div className={`rounded-2xl ${compact ? "p-2" : "p-3"} ${current.icon}`}>
          <Icon size={compact ? 17 : 20} />
        </div>
      </div>
    </Card>
  );
}

export function InlineWarning({ children, tone = "amber" }) {
  const classes =
    tone === "red"
      ? "border-red-200 bg-red-50 text-red-700"
      : "border-amber-200 bg-amber-50 text-amber-700";
  return (
    <div className={`rounded-2xl border p-3 text-sm font-bold ${classes}`}>
      <div className="flex gap-2">
        <AlertTriangle className="mt-0.5 shrink-0" size={17} />
        <span>{children}</span>
      </div>
    </div>
  );
}
