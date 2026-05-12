import { BookingFlow } from "@/components/booking/booking-flow";

export default function Home() {
  return (
    <main className="min-h-screen relative overflow-hidden bg-background">
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/20 blur-[120px] pointer-events-none" />
      
      <div className="container mx-auto px-4 py-12 sm:py-20 relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground tracking-tight mb-6">
            Book Your Court in <span className="text-gradient">Seconds</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted max-w-2xl mx-auto">
            Experience the easiest way to reserve premium football and padel courts. 
            Choose your time, invite your friends, and enjoy the game.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <BookingFlow />
        </div>
      </div>
    </main>
  );
}
