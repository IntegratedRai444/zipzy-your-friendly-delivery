import { ShoppingBag, MapPin, Gift, ArrowRight } from "lucide-react";

const steps = [
  {
    icon: ShoppingBag,
    step: "01",
    title: "Tell Us What You Want",
    description: "Describe what you need — a charger, groceries, medicine, anything. Add optional preferences like brand or budget.",
  },
  {
    icon: MapPin,
    step: "02",
    title: "A Partner Picks It Up",
    description: "Someone already heading near that area accepts your request. They buy it and bring it your way.",
  },
  {
    icon: Gift,
    step: "03",
    title: "Receive & Confirm",
    description: "Your partner delivers to your location. Confirm with OTP, release payment. Simple and safe.",
  },
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-16 bg-muted/30 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      
      <div className="container">
        {/* Section header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-4">
            How It Works
          </p>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6">
            As Easy as Asking a Friend
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Post a simple favor request — with money, trust, and safety built in.
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8 lg:gap-6 relative">
          {/* Connector lines */}
          <div className="hidden md:block absolute top-24 left-1/3 right-1/3 h-px">
            <div className="w-full h-full border-t-2 border-dashed border-border" />
          </div>

          {steps.map((step, index) => (
            <div
              key={step.step}
              className="relative group"
            >
              <div className="relative bg-card rounded-3xl p-10 border border-border/50 hover:border-foreground/20 shadow-sm hover:shadow-lg transition-all duration-500 hover-lift">
                {/* Step number */}
                <div className="absolute -top-5 left-10 px-4 py-2 rounded-full bg-foreground text-background text-sm font-bold">
                  Step {step.step}
                </div>

                {/* Icon */}
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-8 group-hover:bg-foreground group-hover:text-background transition-all duration-300">
                  <step.icon className="w-8 h-8" />
                </div>

                {/* Content */}
                <h3 className="text-2xl font-display font-bold mb-4">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{step.description}</p>

                {/* Arrow for desktop */}
                {index < steps.length - 1 && (
                  <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-background border border-border items-center justify-center z-10">
                    <ArrowRight className="w-3 h-3 text-muted-foreground" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom stat */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-4 px-8 py-4 rounded-full border border-border bg-card">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
            <span className="font-medium">Flexible requests get fulfilled <span className="font-bold">faster</span></span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
