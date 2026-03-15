import { Button } from "@/components/ui/button";
import { ShoppingBag, Route, ArrowRight, Check } from "lucide-react";
import { Link } from "react-router-dom";

const userTypes = [
  {
    icon: ShoppingBag,
    title: "For Buyers",
    subtitle: "Get anything, from anywhere",
    description: "Want something from a far-off market or shop? Someone already going there can buy it and bring it to you. No courier fees, no waiting days.",
    features: [
      "Request in under 60 seconds",
      "Set your own budget",
      "OTP-secured handoff",
      "Pay only when delivered",
      "Rate your experience",
    ],
    cta: "Request Something",
    link: "/auth",
    variant: "dark" as const,
  },
  {
    icon: Route,
    title: "For Partners",
    subtitle: "Earn on your way",
    description: "Already traveling somewhere? Pick up a request along your route. Buy the item, deliver it, and earn money doing what you're already doing.",
    features: [
      "No fixed hours",
      "Choose your requests",
      "Get paid instantly",
      "Build your trust score",
      "Help your community",
    ],
    cta: "Start Earning",
    link: "/auth",
    variant: "light" as const,
  },
];

const ForYouSection = () => {
  return (
    <section id="for-you" className="py-32 bg-muted/30 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      
      <div className="container">
        {/* Section header */}
        <div className="text-center max-w-2xl mx-auto mb-20">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-4">
            Made For You
          </p>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6">
            Buy Something{" "}
            <span className="italic">or</span> Earn While Traveling
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Same person, different moments. Request when you need, earn when you travel.
          </p>
        </div>

        {/* User type cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {userTypes.map((type) => (
            <div
              key={type.title}
              className={`group relative rounded-[2rem] p-10 lg:p-12 transition-all duration-500 hover-lift ${
                type.variant === "dark" 
                  ? "bg-foreground text-background" 
                  : "bg-card border border-border/50 hover:border-foreground/20"
              }`}
            >
              {/* Icon */}
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 ${
                type.variant === "dark" 
                  ? "bg-background/10" 
                  : "bg-muted"
              }`}>
                <type.icon className="w-8 h-8" />
              </div>

              {/* Content */}
              <p className={`text-sm font-medium mb-2 ${
                type.variant === "dark" ? "text-background/60" : "text-muted-foreground"
              }`}>
                {type.subtitle}
              </p>
              <h3 className="text-3xl font-display font-bold mb-4">{type.title}</h3>
              <p className={`mb-8 leading-relaxed ${
                type.variant === "dark" ? "text-background/70" : "text-muted-foreground"
              }`}>
                {type.description}
              </p>

              {/* Features list */}
              <ul className="space-y-3 mb-10">
                {type.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                      type.variant === "dark" 
                        ? "bg-background/20" 
                        : "bg-foreground text-background"
                    }`}>
                      <Check className="w-3 h-3" />
                    </div>
                    <span className={type.variant === "dark" ? "text-background/80" : ""}>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Button 
                variant={type.variant === "dark" ? "secondary" : "default"} 
                size="lg" 
                className="w-full group/btn"
                asChild
              >
                <Link to={type.link}>
                  {type.cta}
                  <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                </Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ForYouSection;