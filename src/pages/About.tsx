import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Users, Target, Heart, Zap, Globe, Shield } from 'lucide-react';

const values = [
  {
    icon: Heart,
    title: 'Community First',
    description: 'We believe in the power of local communities helping each other.',
  },
  {
    icon: Shield,
    title: 'Trust & Safety',
    description: 'Every transaction is protected with OTP verification and escrow.',
  },
  {
    icon: Zap,
    title: 'Efficiency',
    description: 'Leveraging existing travel patterns to reduce waste and costs.',
  },
  {
    icon: Globe,
    title: 'Sustainability',
    description: 'Fewer dedicated delivery trips means a smaller carbon footprint.',
  },
];

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block px-4 py-1.5 bg-muted rounded-full text-sm font-medium text-muted-foreground mb-6">
            About Zipzy
          </span>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Crowd-Powered Deliveries for Everyone
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            We're building a platform where everyday people help each other get things delivered, 
            turning regular commutes into opportunities to earn and save.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-foreground flex items-center justify-center">
                  <Target className="h-6 w-6 text-background" />
                </div>
                <h2 className="text-3xl font-bold">Our Mission</h2>
              </div>
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                To make local deliveries affordable, sustainable, and accessible by connecting 
                people who need things delivered with those already traveling in that direction.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                No more waiting for expensive courier services. No more unnecessary delivery trips. 
                Just neighbors helping neighbors, earning a little extra along the way.
              </p>
            </div>
            <div className="bg-background rounded-2xl p-8 shadow-lg">
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center p-4">
                  <div className="text-4xl font-bold mb-2">10k+</div>
                  <div className="text-sm text-muted-foreground">Active Partners</div>
                </div>
                <div className="text-center p-4">
                  <div className="text-4xl font-bold mb-2">50k+</div>
                  <div className="text-sm text-muted-foreground">Deliveries Made</div>
                </div>
                <div className="text-center p-4">
                  <div className="text-4xl font-bold mb-2">25+</div>
                  <div className="text-sm text-muted-foreground">Cities Covered</div>
                </div>
                <div className="text-center p-4">
                  <div className="text-4xl font-bold mb-2">4.8★</div>
                  <div className="text-sm text-muted-foreground">Average Rating</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Values</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              The principles that guide everything we do
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <div 
                key={index}
                className="p-6 rounded-2xl bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-foreground/10 flex items-center justify-center mb-4">
                  <value.icon className="h-6 w-6 text-foreground" />
                </div>
                <h3 className="font-semibold mb-2">{value.title}</h3>
                <p className="text-sm text-muted-foreground">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-foreground flex items-center justify-center">
              <Users className="h-6 w-6 text-background" />
            </div>
            <h2 className="text-3xl font-bold">Built by Believers</h2>
          </div>
          <p className="text-lg text-muted-foreground leading-relaxed mb-8">
            We're a small team of engineers, designers, and problem-solvers who believe 
            in the power of community-driven solutions. Based in India, building for the world.
          </p>
          <p className="text-muted-foreground">
            Want to join us? We're always looking for passionate people.{' '}
            <a href="mailto:careers@zipzy.app" className="text-foreground underline">
              Get in touch
            </a>
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;
