import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const CTASection = () => {
  const { user, isPartner } = useAuth();
  return (
    <section className="py-32 relative overflow-hidden">
      <div className="container">
        <div className="relative rounded-[2.5rem] p-12 md:p-20 overflow-hidden">
          {/* Background with gradient */}
          <div className="absolute inset-0 bg-muted/50" />
          
          {/* Decorative circles */}
          <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full border border-border/50" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full border border-border/50" />
          
          {/* Grid pattern */}
          <div 
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)`,
              backgroundSize: '24px 24px',
            }}
          />

          <div className="relative z-10 text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-background mb-8">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">Join Zipzy</span>
            </div>

            <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6">
              Your Request,{" "}
              <span className="italic">Their Route</span>
            </h2>

            <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              Stop waiting for traditional delivery. Post a request, find a partner heading your way, 
              and get what you need — today.
            </p>

            <div className="flex flex-wrap justify-center gap-4 mb-16">
              {user ? (
                <>
                  <Button variant="hero" size="xl" className="group" asChild>
                    <Link to="/dashboard">
                      My Requests
                      <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                  <Button variant="heroOutline" size="xl" asChild>
                    <Link to="/partner">
                      {isPartner ? "Partner Dashboard" : "Become a Partner"}
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="hero" size="xl" className="group" asChild>
                    <Link to="/auth">
                      Request Something
                      <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                  <Button variant="heroOutline" size="xl" asChild>
                    <Link to="/auth">
                      Become a Partner
                    </Link>
                  </Button>
                </>
              )}
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap justify-center gap-12">
              <div className="text-center">
                <p className="text-3xl font-display font-bold">Free</p>
                <p className="text-sm text-muted-foreground">To get started</p>
              </div>
              <div className="w-px h-12 bg-border hidden sm:block" />
              <div className="text-center">
                <p className="text-3xl font-display font-bold">No commission</p>
                <p className="text-sm text-muted-foreground">Until delivery</p>
              </div>
              <div className="w-px h-12 bg-border hidden sm:block" />
              <div className="text-center">
                <p className="text-3xl font-display font-bold">Same day</p>
                <p className="text-sm text-muted-foreground">Most requests</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;