import { CalendarDays, CreditCard, Users, TrendingUp } from "lucide-react";

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Dashboard Overview</h1>
        <p className="text-muted">Welcome back. Here is what is happening today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Today's Bookings" value="12" icon={CalendarDays} trend="+2 from yesterday" />
        <StatCard title="Revenue (Today)" value="EGP 4,200" icon={CreditCard} trend="+15% from yesterday" />
        <StatCard title="Active Courts" value="8" icon={Users} trend="All operational" />
        <StatCard title="Pending Payments" value="3" icon={TrendingUp} trend="Action required" isAlert />
      </div>

      <div className="glass rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Recent Bookings</h2>
        <div className="text-center py-8 text-muted">
          <p>The booking list will be integrated with Supabase here.</p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, trend, isAlert = false }: any) {
  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted">{title}</h3>
        <div className={`p-2 rounded-lg ${isAlert ? 'bg-danger/20 text-danger' : 'bg-primary/20 text-primary'}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-3xl font-bold text-white">{value}</p>
        <p className={`text-sm ${isAlert ? 'text-danger' : 'text-success'}`}>{trend}</p>
      </div>
    </div>
  );
}
