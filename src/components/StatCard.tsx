
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  description: string;
  icon: LucideIcon;
  color: string;
}

export default function StatCard({
  title,
  value,
  change,
  description,
  icon: Icon,
  color,
}: StatCardProps) {
  return (
    <article className="stat-card">
      <div className="stat-top">
        <span className="stat-title">{title}</span>
        <div className={`stat-icon ${color}`}>
          <Icon size={20} />
        </div>
      </div>

      <div className="stat-value">{value}</div>

      <div className="stat-footer">
        <span className="stat-change">{change}</span>
        <span className="stat-description">{description}</span>
      </div>
    </article>
  );
}
