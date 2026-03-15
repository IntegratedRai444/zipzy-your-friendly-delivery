import { Button } from "@/components/ui/button";
import { ShoppingBag, ArrowRight } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import heroIllustration from "@/assets/hero-illustration.png";

const HeroSection = () => {
  const { user } = useAuth();
  return (
    <section className="relative min-h-[75vh] gradient-hero overflow-hidden noise-overlay">
      {/* Abstract background shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-foreground/[0.03] to-transparent blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-foreground/[0.02] to-transparent blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-gradient-to-t from-foreground/[0.02] to-transparent blur-3xl" />
      </div>

      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      <div className="container relative z-10 pt-16 pb-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left content */}
          <div className="space-y-6">
            {/* Badge */}
            <div 
              className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full border border-border bg-background/50 backdrop-blur-sm opacity-0 animate-fade-in"
            >
              <span className="flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-foreground opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-foreground" />
              </span>
              <span className="text-sm font-medium tracking-wide">Crowd-Powered Purchasing</span>
            </div>

            {/* Main heading */}
            <div className="space-y-2">
              <h1 
                className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-display font-bold leading-[0.95] opacity-0 animate-fade-in stagger-1"
              >
                Want it <span className="italic">there</span>,
              </h1>
              <h1 
                className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-display font-bold leading-[0.95] opacity-0 animate-fade-in stagger-2"
              >
                but <span className="italic">can&apos;t</span> go?
              </h1>
            </div>

            {/* Description */}
            <p 
              className="text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed opacity-0 animate-fade-in stagger-3"
            >
              Someone else is already heading there. They can buy it and bring it for you. 
              Save time, support locals, earn while you travel.
            </p>

            <div 
              className="flex flex-wrap gap-4 opacity-0 animate-fade-in stagger-4"
            >
              {user ? (
                <Button variant="hero" size="xl" className="group" asChild>
                  <Link to="/request">
                    <ShoppingBag className="w-5 h-5" />
                    Request Something
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              ) : (
                <Button variant="hero" size="xl" className="group" asChild>
                  <Link to="/auth">
                    <ShoppingBag className="w-5 h-5" />
                    Request Something
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              )}
            </div>
          </div>

          {/* Right illustration */}
          <div 
            className="relative lg:h-[650px] opacity-0 animate-fade-in stagger-3"
          >
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Main image container */}
              <div className="relative animate-float">
                <div className="relative">
                  <img
                    src={heroIllustration}
                    alt="Zipzy - Someone buys, you receive"
                    className="w-full max-w-lg rounded-3xl shadow-xl"
                  />
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-background/20 to-transparent" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
