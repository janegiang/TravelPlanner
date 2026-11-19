import { CheckCircle2, Luggage, MapPin, Calendar } from "lucide-react";

type TripStatsProps = {
  total: number;
  upcoming: number;
  ongoing: number;
  completed: number;
};

export default function TripStats({
  total,
  upcoming,
  ongoing,
  completed,
}: TripStatsProps) {
  const stats = [
    {
      label: "Total Trips",
      value: total,
      icon: Luggage,
      color: "text-brand-orange",
      background: "bg-brand-cream",
    },
    {
      label: "Upcoming",
      value: upcoming,
      icon: Calendar,
      color: "text-brand-orange",
      background: "bg-brand-cream",
    },
    {
      label: "Ongoing",
      value: ongoing,
      icon: MapPin,
      color: "text-brand-orange",
      background: "bg-brand-cream",
    },
    {
      label: "Completed",
      value: completed,
      icon: CheckCircle2,
      color: "text-brand-orange",
      background: "bg-brand-cream",
    },
  ];

  return (
    <section
      aria-label="Trip statistics"
      className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-5"
    >
      {stats.map((stat) => {
        const Icon = stat.icon;

        return (
          <div
            key={stat.label}
            className="rounded-2xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5"
          >
            <div className="mb-4 flex items-center justify-between gap-2">
              <div className={`rounded-xl p-2.5 ${stat.background}`}>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </div>

            <p className="text-3xl font-black tracking-tight sm:text-4xl">
              {stat.value}
            </p>

            <p className="mt-1 text-sm font-semibold text-foreground/75">
              {stat.label}
            </p>
          </div>
        );
      })}
    </section>
  );
}
