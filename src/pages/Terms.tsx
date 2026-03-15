import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { FileText } from 'lucide-react';

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="pt-32 pb-20 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-foreground flex items-center justify-center">
              <FileText className="h-6 w-6 text-background" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Terms of Service</h1>
              <p className="text-muted-foreground">Last updated: January 2026</p>
            </div>
          </div>

          <div className="prose prose-neutral max-w-none">
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing or using Zipzy's services, you agree to be bound by these Terms of Service 
              and all applicable laws and regulations. If you do not agree with any of these terms, 
              you are prohibited from using or accessing this service.
            </p>

            <h2>2. Description of Service</h2>
            <p>
              Zipzy provides a platform connecting users who need items delivered ("Senders") with 
              independent contractors who provide delivery services ("Partners"). Zipzy does not 
              itself provide delivery services but facilitates connections between Senders and Partners.
            </p>

            <h2>3. User Accounts</h2>
            <p>
              You must create an account to use our services. You are responsible for maintaining the 
              confidentiality of your account credentials and for all activities that occur under your account.
            </p>
            <ul>
              <li>You must provide accurate and complete information</li>
              <li>You must be at least 18 years old</li>
              <li>One person may not maintain more than one account</li>
              <li>You may not use another person's account without permission</li>
            </ul>

            <h2>4. Sender Responsibilities</h2>
            <p>As a Sender, you agree to:</p>
            <ul>
              <li>Provide accurate item descriptions and values</li>
              <li>Not send prohibited items (hazardous materials, illegal goods, etc.)</li>
              <li>Be available at pickup/drop locations or provide accurate instructions</li>
              <li>Pay for services as agreed upon</li>
              <li>Treat Partners with respect</li>
            </ul>

            <h2>5. Partner Responsibilities</h2>
            <p>As a Partner, you agree to:</p>
            <ul>
              <li>Handle items with care during transport</li>
              <li>Complete deliveries in a timely manner</li>
              <li>Use OTP verification at pickup and delivery</li>
              <li>Maintain appropriate insurance if applicable</li>
              <li>Comply with all local laws and regulations</li>
            </ul>

            <h2>6. Payments and Fees</h2>
            <p>
              Senders pay for deliveries upfront. Payments are held in escrow until successful delivery. 
              Zipzy charges a platform fee (typically 15%) on each transaction. Partners receive their 
              earnings after the platform fee is deducted.
            </p>

            <h2>7. Cancellations and Refunds</h2>
            <ul>
              <li>Pending requests can be cancelled without penalty</li>
              <li>Cancellations after a Partner accepts may affect trust scores</li>
              <li>Refunds for failed deliveries are processed within 3-5 business days</li>
              <li>Disputes are reviewed by our support team</li>
            </ul>

            <h2>8. Prohibited Items</h2>
            <p>The following items are prohibited:</p>
            <ul>
              <li>Illegal drugs or controlled substances</li>
              <li>Weapons and ammunition</li>
              <li>Hazardous materials</li>
              <li>Stolen property</li>
              <li>Counterfeit goods</li>
              <li>Live animals</li>
              <li>Human remains</li>
            </ul>

            <h2>9. Limitation of Liability</h2>
            <p>
              Zipzy acts as a platform connecting Senders and Partners. We are not liable for the 
              actions of Partners or for damage/loss of items during transit, except as covered by 
              our escrow protection for verified claims.
            </p>

            <h2>10. Intellectual Property</h2>
            <p>
              All content, trademarks, and intellectual property on Zipzy are owned by Zipzy or its 
              licensors. You may not use, reproduce, or distribute any content without permission.
            </p>

            <h2>11. Termination</h2>
            <p>
              We may suspend or terminate your account at any time for violations of these terms or 
              for any other reason at our discretion. You may also close your account at any time.
            </p>

            <h2>12. Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. Continued use of the service 
              after changes constitutes acceptance of the new terms.
            </p>

            <h2>13. Contact</h2>
            <p>
              For questions about these Terms of Service, please contact us at{' '}
              <a href="mailto:legal@zipzy.app" className="text-foreground underline">
                legal@zipzy.app
              </a>
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Terms;
