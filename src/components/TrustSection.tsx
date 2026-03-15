import { Shield, UserCheck, Lock, MapPin, MessageCircle, CreditCard } from "lucide-react";

const trustFeatures = [
  {
    icon: UserCheck,
    title: "Phone Verified",
    description: "Every user signs in with OTP. Real phone numbers, real accountability.",
  },
  {
    icon: Lock,
    title: "OTP at Delivery",
    description: "The buyer shares an OTP only when satisfied. No OTP, no payment release.",
  },
  {
    icon: MapPin,
    title: "Live Tracking",
    description: "See where your partner is in real-time once they pick up your item.",
  },
  {
    icon: MessageCircle,
    title: "In-App Chat",
    description: "Coordinate directly with your partner. No need to share personal numbers.",
  },
  {
    icon: CreditCard,
    title: "Escrow Payments",
    description: "Your money is held safely until delivery is confirmed. Partners always get paid.",
  },
  {
    icon: Shield,
    title: "Trust Scores",
    description: "Ratings after every delivery. Higher scores unlock higher-value requests.",
  },
];

const TrustSection = () => {
  return (
    <section id="trust" className="py-16 bg-foreground text-background relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-background/[0.02] rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-background/[0.02] rounded-full blur-3xl" />
      </div>

      {/* Grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--background)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--background)) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      <div className="container relative z-10">
        {/* Section header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-background/20 mb-6">
            <Shield className="w-4 h-4" />
            <span className="text-sm font-medium">Built on Trust</span>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6">
            Safety at{" "}
            <span className="italic">Every Step</span>
          </h2>
          <p className="text-lg text-background/60 leading-relaxed">
            Simple safeguards that keep both buyers and partners protected.
          </p>
        </div>

        {/* Trust features grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trustFeatures.map((feature) => (
            <div
              key={feature.title}
              className="group bg-background/5 backdrop-blur-sm rounded-2xl p-8 border border-background/10 hover:bg-background/10 hover:border-background/20 transition-all duration-300"
            >
              <div className="flex items-start gap-5">
                <div className="w-12 h-12 rounded-xl bg-background flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-6 h-6 text-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-display font-bold mb-2">{feature.title}</h3>
                  <p className="text-sm text-background/50 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustSection;