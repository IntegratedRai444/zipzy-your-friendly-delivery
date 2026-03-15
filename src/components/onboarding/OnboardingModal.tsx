import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Package, Truck, Shield, Wallet, ArrowRight, ArrowLeft, X } from 'lucide-react';

interface OnboardingModalProps {
  open: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

const steps = [
  {
    icon: Package,
    title: 'Request Anything',
    description: 'Need something picked up or delivered? Create a request with your item details, pickup and drop locations.',
    highlight: 'From groceries to documents, we handle it all.',
  },
  {
    icon: Truck,
    title: 'Partners Deliver',
    description: 'Local partners traveling your route accept requests and deliver items safely. Real-time tracking keeps you informed.',
    highlight: 'Community-powered deliveries.',
  },
  {
    icon: Shield,
    title: 'Safe & Secure',
    description: 'OTP verification at pickup and delivery, plus escrow protection ensures your items and payments are safe.',
    highlight: 'Your trust is our priority.',
  },
  {
    icon: Wallet,
    title: 'Earn as a Partner',
    description: 'Already traveling? Accept delivery requests along your route and earn extra income with every trip.',
    highlight: 'Turn your commute into income.',
  },
];

export const OnboardingModal = ({ open, onComplete, onSkip }: OnboardingModalProps) => {
  const [currentStep, setCurrentStep] = useState(0);

  const isLastStep = currentStep === steps.length - 1;
  const step = steps[currentStep];
  const Icon = step.icon;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden border-0 bg-background">
        {/* Skip button */}
        <button
          onClick={onSkip}
          className="absolute top-4 right-4 z-10 p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Content */}
        <div className="px-8 pt-12 pb-8">
          {/* Progress dots */}
          <div className="flex justify-center gap-2 mb-8">
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentStep 
                    ? 'w-8 bg-foreground' 
                    : index < currentStep 
                      ? 'bg-foreground/50' 
                      : 'bg-muted-foreground/30'
                }`}
              />
            ))}
          </div>

          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-foreground to-foreground/80 flex items-center justify-center shadow-lg">
              <Icon className="h-10 w-10 text-background" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-center mb-4">
            {step.title}
          </h2>

          {/* Description */}
          <p className="text-muted-foreground text-center mb-4 leading-relaxed">
            {step.description}
          </p>

          {/* Highlight */}
          <p className="text-sm text-center font-medium text-foreground/80 bg-muted px-4 py-2 rounded-full inline-block w-full">
            {step.highlight}
          </p>
        </div>

        {/* Footer */}
        <div className="px-8 pb-8 flex gap-3">
          {currentStep > 0 && (
            <Button
              variant="outline"
              onClick={handlePrev}
              className="flex-1"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          <Button
            onClick={handleNext}
            className="flex-1"
          >
            {isLastStep ? "Get Started" : "Next"}
            {!isLastStep && <ArrowRight className="h-4 w-4 ml-2" />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
