import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { HelpCircle } from 'lucide-react';

const faqs = [
  {
    category: 'Getting Started',
    questions: [
      {
        q: 'What is Zipzy?',
        a: 'Zipzy is a crowd-powered delivery platform that connects people who need items delivered with local partners already traveling in that direction. Think of it as ridesharing, but for packages.',
      },
      {
        q: 'How do I create a delivery request?',
        a: 'Simply sign up, click "Request Something", fill in the item details, pickup and drop locations, and submit. Partners traveling your route will see your request and can accept it.',
      },
      {
        q: 'Is Zipzy available in my city?',
        a: 'We\'re currently available in major Indian cities and expanding rapidly. Create an account to see active partners in your area.',
      },
    ],
  },
  {
    category: 'For Senders',
    questions: [
      {
        q: 'How much does it cost?',
        a: 'Pricing depends on the item size, urgency, and distance. You\'ll see an estimated fare before submitting your request. We charge a small platform fee (around 15%) to keep the service running.',
      },
      {
        q: 'What items can I send?',
        a: 'You can send most legal items - documents, groceries, electronics, clothes, etc. Prohibited items include hazardous materials, illegal goods, and perishables that require special handling.',
      },
      {
        q: 'How is my item protected?',
        a: 'We use OTP verification at both pickup and delivery. Your payment is held in escrow until successful delivery. Partners are rated and verified, and disputes are handled by our support team.',
      },
      {
        q: 'Can I track my delivery?',
        a: 'Yes! Once a partner accepts your request, you can track their real-time location through the app and chat with them directly.',
      },
    ],
  },
  {
    category: 'For Partners',
    questions: [
      {
        q: 'How do I become a partner?',
        a: 'Sign up and switch to Partner Mode. You can post your upcoming trips or go online to see nearby delivery requests that match your route.',
      },
      {
        q: 'How much can I earn?',
        a: 'Earnings depend on the deliveries you complete. Partners typically keep 85% of the delivery fare. The more deliveries along your route, the more you earn.',
      },
      {
        q: 'When do I get paid?',
        a: 'Payments are released to your wallet immediately after successful delivery (confirmed via OTP). You can withdraw to your bank account anytime.',
      },
      {
        q: 'What if the sender isn\'t available?',
        a: 'You can chat with the sender through the app. If they\'re unreachable, contact our support team. Cancellations by senders are refunded, and you\'re compensated for your time.',
      },
    ],
  },
  {
    category: 'Safety & Trust',
    questions: [
      {
        q: 'How does OTP verification work?',
        a: 'Each delivery has unique pickup and drop OTPs. The partner must enter the correct OTP to confirm pickup (from sender) and delivery (from receiver). This ensures the right person receives the item.',
      },
      {
        q: 'What is escrow protection?',
        a: 'When you create a request, your payment is held securely by us. It\'s only released to the partner after successful delivery. If something goes wrong, you can raise a dispute for a refund.',
      },
      {
        q: 'How are partners verified?',
        a: 'Partners build trust scores through successful deliveries and ratings. We also offer ID verification for additional trust. Low-rated or flagged partners may be restricted.',
      },
    ],
  },
  {
    category: 'Payments',
    questions: [
      {
        q: 'What payment methods are accepted?',
        a: 'We support UPI, credit/debit cards, and wallet balance. Partners can withdraw earnings via bank transfer.',
      },
      {
        q: 'Can I cancel a request?',
        a: 'Yes, you can cancel pending requests for free. If a partner has already accepted, cancellation may affect your trust score.',
      },
      {
        q: 'How do refunds work?',
        a: 'If a delivery fails due to partner fault or item damage, you can raise a dispute. Our team reviews evidence and processes refunds within 3-5 business days.',
      },
    ],
  },
];

const FAQ = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-16 h-16 rounded-2xl bg-foreground flex items-center justify-center mx-auto mb-6">
            <HelpCircle className="h-8 w-8 text-background" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-muted-foreground">
            Everything you need to know about using Zipzy
          </p>
        </div>
      </section>

      {/* FAQ Sections */}
      <section className="py-12 px-6">
        <div className="max-w-3xl mx-auto">
          {faqs.map((section, sectionIndex) => (
            <div key={sectionIndex} className="mb-12">
              <h2 className="text-2xl font-bold mb-6">{section.category}</h2>
              <Accordion type="single" collapsible className="space-y-4">
                {section.questions.map((faq, index) => (
                  <AccordionItem 
                    key={index} 
                    value={`${sectionIndex}-${index}`}
                    className="border rounded-xl px-6"
                  >
                    <AccordionTrigger className="text-left hover:no-underline">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">Still have questions?</h2>
          <p className="text-muted-foreground mb-6">
            Can't find what you're looking for? Our support team is here to help.
          </p>
          <a 
            href="/support" 
            className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-foreground text-background font-medium hover:bg-foreground/90 transition-colors"
          >
            Contact Support
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default FAQ;
