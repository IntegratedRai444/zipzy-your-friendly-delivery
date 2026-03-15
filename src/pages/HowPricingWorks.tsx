import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Calculator, Package, Zap, MapPin, Shield, Percent } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const pricingFactors = [
  {
    icon: Package,
    title: 'Item Size',
    description: 'Small items cost less. Larger items that take more space increase the fare.',
    examples: ['Small (envelope, phone): Base fare', 'Medium (shoebox): +30%', 'Large (backpack): +60%', 'Extra Large: +100%'],
  },
  {
    icon: Zap,
    title: 'Urgency Level',
    description: 'Need it fast? Express and urgent deliveries cost more.',
    examples: ['Standard (flexible): Base fare', 'Express (same day): +50%', 'Urgent (within hours): +100%'],
  },
  {
    icon: MapPin,
    title: 'Distance',
    description: 'Longer distances mean more travel for Partners.',
    examples: ['₹3 per kilometer', 'Calculated from pickup to drop', 'Includes any detour needed'],
  },
  {
    icon: Shield,
    title: 'Item Value',
    description: 'High-value items include optional insurance coverage.',
    examples: ['Items under ₹500: No insurance', 'Higher values: 1% insurance rate', 'Protects against loss/damage'],
  },
];

const HowPricingWorks = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-16 h-16 rounded-2xl bg-foreground flex items-center justify-center mx-auto mb-6">
            <Calculator className="h-8 w-8 text-background" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Transparent Pricing
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Know exactly what you're paying for. No hidden fees, no surprises.
          </p>
        </div>
      </section>

      {/* Pricing Formula */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <div className="bg-background rounded-2xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-center">How We Calculate Your Fare</h2>
            
            <div className="flex flex-wrap items-center justify-center gap-4 text-lg mb-8">
              <span className="px-4 py-2 bg-muted rounded-lg font-medium">Base Fare (₹30)</span>
              <span className="text-2xl">+</span>
              <span className="px-4 py-2 bg-muted rounded-lg font-medium">Size Multiplier</span>
              <span className="text-2xl">+</span>
              <span className="px-4 py-2 bg-muted rounded-lg font-medium">Urgency Fee</span>
              <span className="text-2xl">+</span>
              <span className="px-4 py-2 bg-muted rounded-lg font-medium">Distance × ₹3/km</span>
              <span className="text-2xl">+</span>
              <span className="px-4 py-2 bg-muted rounded-lg font-medium">Insurance (optional)</span>
            </div>

            <div className="flex items-center justify-center gap-3 p-4 bg-foreground/5 rounded-xl">
              <Percent className="h-5 w-5 text-foreground" />
              <span className="text-muted-foreground">
                <strong className="text-foreground">15% platform fee</strong> is added to support operations
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Factors */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">What Affects Your Price?</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {pricingFactors.map((factor, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-foreground/10 flex items-center justify-center shrink-0">
                      <factor.icon className="h-6 w-6 text-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">{factor.title}</h3>
                      <p className="text-muted-foreground mb-4">{factor.description}</p>
                      <ul className="space-y-1">
                        {factor.examples.map((example, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-foreground/40" />
                            {example}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Example */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Example Calculation</h2>
          
          <div className="bg-background rounded-2xl p-8">
            <p className="text-muted-foreground mb-6 text-center">
              Sending a medium-sized package (₹1000 value) via express delivery, 10km distance
            </p>
            
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Base Fare</span>
                <span className="font-medium">₹30</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Size Fee (Medium +30%)</span>
                <span className="font-medium">₹9</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Urgency Fee (Express +50%)</span>
                <span className="font-medium">₹15</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Distance (10km × ₹3)</span>
                <span className="font-medium">₹30</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Insurance (1% of ₹1000)</span>
                <span className="font-medium">₹10</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">₹94</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Platform Fee (15%)</span>
                <span className="font-medium">₹14</span>
              </div>
              <div className="flex justify-between py-3 text-lg">
                <span className="font-semibold">Total</span>
                <span className="font-bold">₹108</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Partner Earnings */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">What Partners Earn</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Partners keep <strong className="text-foreground">85%</strong> of the delivery fare. 
            In the example above, the Partner would earn ₹94 for completing the delivery.
          </p>
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-muted rounded-full">
            <span className="text-muted-foreground">No signup fees</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground">No minimum deliveries</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground">Instant payouts</span>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HowPricingWorks;
