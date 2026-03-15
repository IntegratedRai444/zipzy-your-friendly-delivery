import { Button } from "@/components/ui/button";
import { ShoppingBag, ArrowRight, Play, Star } from "lucide-react";
import { Link } from "react-router-dom";
import heroIllustration from "@/assets/hero-illustration.png";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen gradient-hero overflow-hidden noise-overlay">
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

      <div className="container relative z-10 pt-32 pb-24">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left content */}
          <div className="space-y-10">
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

            {/* CTA Buttons */}
            <div 
              className="flex flex-wrap gap-4 opacity-0 animate-fade-in stagger-4"
            >
              <Button variant="hero" size="xl" className="group" asChild>
                <Link to="/auth">
                  <ShoppingBag className="w-5 h-5" />
                  Request Something
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>

            </div>

            {/* Social proof */}
            <div 
              className="flex items-center gap-6 pt-6 opacity-0 animate-fade-in stagger-5"
            >
              {/* Avatar stack */}
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs font-medium"
                  >
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
                <div className="w-10 h-10 rounded-full border-2 border-background bg-foreground text-primary-foreground flex items-center justify-center text-xs font-semibold">
                  +5K
                </div>
              </div>
              <div className="border-l border-border pl-6">
                <div className="flex items-center gap-1 mb-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="w-4 h-4 fill-foreground text-foreground" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">4.9/5</span> from 2,400+ requests
                </p>
              </div>
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
                
                {/* Floating card - Fast delivery */}
                <div 
                  className="absolute -left-12 top-16 glass rounded-2xl p-5 shadow-lg border border-border/50 animate-float-delayed"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-foreground flex items-center justify-center">
                      <svg className="w-6 h-6 text-background" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-display font-semibold text-lg">Same Day</p>
                      <p className="text-sm text-muted-foreground">Most requests</p>
                    </div>
                  </div>
                </div>

                {/* Floating card - Savings */}
                <div 
                  className="absolute -right-8 bottom-24 glass rounded-2xl p-5 shadow-lg border border-border/50"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                      <span className="text-background font-display font-bold text-lg">₹</span>
                    </div>
                    <div>
                      <p className="font-display font-semibold text-lg">Earn Extra</p>
                      <p className="text-sm text-muted-foreground">As a Partner</p>
                    </div>
                  </div>
                </div>

                {/* Stats pill */}
                <div 
                  className="absolute -bottom-4 left-1/2 -translate-x-1/2 glass-dark rounded-full px-6 py-3 shadow-lg"
                >
                  <div className="flex items-center gap-6 text-white">
                    <div className="text-center">
                      <p className="font-display font-bold">50K+</p>
                      <p className="text-xs text-white/60">Requests</p>
                    </div>
                    <div className="w-px h-8 bg-white/20" />
                    <div className="text-center">
                      <p className="font-display font-bold">10K+</p>
                      <p className="text-xs text-white/60">Partners</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 opacity-0 animate-fade-in" style={{ animationDelay: '1s' }}>
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <span className="text-xs uppercase tracking-widest">Scroll</span>
          <div className="w-px h-12 bg-gradient-to-b from-muted-foreground to-transparent" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
