import { Clock, Wallet, Leaf, Users, Route, Shield, ArrowUpRight } from "lucide-react";

const features = [
  {
    icon: Clock,
    title: "Same Day, Often Faster",
    description: "Your item travels with someone already going there. No warehouse delays, no distant fulfillment centers.",
    highlight: true,
  },
  {
    icon: Wallet,
    title: "You Set the Budget",
    description: "Tell your partner your max spend. They buy within your budget—no surprises, no markups.",
  },
  {
    icon: Leaf,
    title: "Zero Extra Trips",
    description: "Partners are already traveling. Your request adds zero carbon to their journey.",
  },
  {
    icon: Users,
    title: "Real People, Real Trust",
    description: "Every partner has a trust score built from verified deliveries and ratings.",
  },
  {
    icon: Route,
    title: "Flexible Requests",
    description: "Don't know which shop? No problem. Partners buy from wherever's convenient on their route.",
    highlight: true,
  },
  {
    icon: Shield,
    title: "OTP-Secured Handoffs",
    description: "Payment held in escrow. Released only when you confirm with OTP at delivery.",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-16 relative">
      {/* Background pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-muted/50 to-transparent blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-[500px] h-[500px] rounded-full bg-gradient-to-tl from-muted/50 to-transparent blur-3xl" />
      </div>

      <div className="container relative z-10">
        {/* Section header */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-12">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-4">
              Why Zipzy Works
            </p>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold">
              Buying,{" "}
              <span className="italic">Simplified</span>
            </h2>
          </div>
          <p className="text-lg text-muted-foreground max-w-md leading-relaxed">
            Request what you need, how you need it. Your partner handles the rest.
          </p>
        </div>

        {/* Features grid - Bento style */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className={`group relative rounded-3xl p-8 border transition-all duration-500 hover-lift ${
                feature.highlight 
                  ? "bg-foreground text-background border-foreground row-span-1 md:row-span-1" 
                  : "bg-card border-border/50 hover:border-foreground/20"
              }`}
            >
              {/* Icon */}
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300 ${
                feature.highlight 
                  ? "bg-background/10" 
                  : "bg-muted group-hover:bg-foreground group-hover:text-background"
              }`}>
                <feature.icon className="w-7 h-7" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-display font-bold mb-3">{feature.title}</h3>
              <p className={`leading-relaxed ${feature.highlight ? "text-background/70" : "text-muted-foreground"}`}>
                {feature.description}
              </p>

              {/* Arrow icon */}
              <div className={`absolute top-8 right-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                feature.highlight ? "text-background/50" : "text-muted-foreground"
              }`}>
                <ArrowUpRight className="w-5 h-5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;