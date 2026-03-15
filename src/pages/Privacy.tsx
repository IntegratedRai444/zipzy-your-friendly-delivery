import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Shield } from 'lucide-react';

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="pt-32 pb-20 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-foreground flex items-center justify-center">
              <Shield className="h-6 w-6 text-background" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Privacy Policy</h1>
              <p className="text-muted-foreground">Last updated: January 2026</p>
            </div>
          </div>

          <div className="prose prose-neutral max-w-none">
            <h2>1. Introduction</h2>
            <p>
              At Zipzy, we take your privacy seriously. This Privacy Policy explains how we collect, 
              use, disclose, and safeguard your information when you use our platform and services.
            </p>

            <h2>2. Information We Collect</h2>
            
            <h3>Personal Information</h3>
            <p>We collect information you provide directly:</p>
            <ul>
              <li>Name and contact information (email, phone number)</li>
              <li>Account credentials</li>
              <li>Profile information (photo, address)</li>
              <li>Payment information (handled securely by payment processors)</li>
              <li>ID verification documents (for Partners)</li>
            </ul>

            <h3>Usage Information</h3>
            <p>We automatically collect:</p>
            <ul>
              <li>Device information (type, OS, browser)</li>
              <li>Location data (with your permission, for delivery matching)</li>
              <li>Usage patterns and preferences</li>
              <li>Communication logs between users</li>
            </ul>

            <h2>3. How We Use Your Information</h2>
            <ul>
              <li>To provide and improve our services</li>
              <li>To match Senders with Partners</li>
              <li>To process payments and prevent fraud</li>
              <li>To communicate with you about orders and updates</li>
              <li>To ensure safety and trust (OTP verification, ratings)</li>
              <li>To comply with legal obligations</li>
            </ul>

            <h2>4. Information Sharing</h2>
            <p>We share information with:</p>
            <ul>
              <li>
                <strong>Other Users:</strong> Senders see Partner name/rating; Partners see 
                pickup/drop locations and sender contact info
              </li>
              <li>
                <strong>Service Providers:</strong> Payment processors, cloud hosting, analytics
              </li>
              <li>
                <strong>Legal Requirements:</strong> When required by law or to protect rights
              </li>
            </ul>
            <p>
              We do not sell your personal information to third parties.
            </p>

            <h2>5. Location Data</h2>
            <p>
              Location tracking is essential for our delivery matching service. Partners share 
              real-time location during active deliveries. Senders can track delivery progress. 
              You can disable location services, but this may limit functionality.
            </p>

            <h2>6. Data Security</h2>
            <p>
              We implement appropriate security measures including encryption, secure servers, 
              and access controls. However, no method of transmission over the internet is 100% 
              secure. We cannot guarantee absolute security.
            </p>

            <h2>7. Data Retention</h2>
            <p>
              We retain your data as long as your account is active or as needed to provide 
              services. Transaction records are kept for 7 years for legal/tax purposes. 
              You can request account deletion at any time.
            </p>

            <h2>8. Your Rights</h2>
            <p>You have the right to:</p>
            <ul>
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Delete your account and data</li>
              <li>Export your data</li>
              <li>Opt out of marketing communications</li>
              <li>Disable location tracking</li>
            </ul>

            <h2>9. Cookies and Tracking</h2>
            <p>
              We use cookies and similar technologies to improve user experience, remember 
              preferences, and analyze usage. You can control cookie settings in your browser.
            </p>

            <h2>10. Children's Privacy</h2>
            <p>
              Our services are not intended for children under 18. We do not knowingly collect 
              information from children. If we learn we have collected such information, we will 
              delete it promptly.
            </p>

            <h2>11. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of 
              significant changes via email or in-app notification.
            </p>

            <h2>12. Contact Us</h2>
            <p>
              For privacy-related questions or to exercise your rights, contact our Data 
              Protection Officer at{' '}
              <a href="mailto:privacy@zipzy.app" className="text-foreground underline">
                privacy@zipzy.app
              </a>
            </p>

            <div className="bg-muted/50 p-6 rounded-xl mt-8">
              <h3 className="mt-0">Summary</h3>
              <p className="mb-0">
                We collect data necessary to provide our delivery matching service. Your data is 
                protected, never sold, and you have control over your information. Location 
                tracking enables real-time delivery updates. Contact us anytime with questions.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Privacy;
