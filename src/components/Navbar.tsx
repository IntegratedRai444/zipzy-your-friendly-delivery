import { Button } from "@/components/ui/button";
import { Menu, X, Package, LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationBell } from "./notifications/NotificationBell";
import { Avatar, AvatarFallback } from "./ui/avatar";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const navLinks = [
    { href: "#how-it-works", label: "How it Works" },
    { href: "#features", label: "Features" },
    { href: "#trust", label: "Trust" },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled
          ? "py-3 glass border-b border-border/50"
          : "py-5 bg-transparent"
      }`}
    >
      <div className="container flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-foreground flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
            <Package className="w-5 h-5 text-background" />
          </div>
          <span className="text-xl font-display font-bold tracking-tight">Zipzy</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/50"
            >
              {link.label}
            </a>
          ))}
        </div>
        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <div className="flex items-center gap-2">
              <NotificationBell />

              <Button variant="ghost" size="sm" asChild>
                <Link to="/wallet">Wallet</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/settings">Settings</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild className="rounded-full px-2">
                <Link to="/profile">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-foreground text-background text-xs">
                      {user?.email?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" className="font-medium" asChild>
                <Link to="/auth">Log In</Link>
              </Button>
              <Button variant="default" size="sm" asChild>
                <Link to="/auth">Get Started</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-2 hover:bg-muted rounded-lg transition-colors"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 glass border-b border-border/50 animate-fade-in">
          <div className="container py-6 flex flex-col gap-2">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="py-3 px-4 text-lg font-medium hover:bg-muted/50 rounded-lg transition-colors"
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <div className="flex flex-col gap-3 pt-4 mt-2 border-t border-border/50">
              {user ? (
                <>
                  <div className="flex items-center justify-between px-4 pb-2">
                    <span className="text-sm font-medium">Notifications</span>
                    <NotificationBell />
                  </div>

                  <Button variant="ghost" size="lg" className="w-full text-left justify-start" asChild>
                    <Link to="/wallet" onClick={() => setIsOpen(false)}>Wallet</Link>
                  </Button>
                  <Button variant="ghost" size="lg" className="w-full text-left justify-start" asChild>
                    <Link to="/settings" onClick={() => setIsOpen(false)}>Settings</Link>
                  </Button>
                  <Button variant="ghost" size="lg" className="w-full text-left justify-start" asChild>
                    <Link to="/profile" onClick={() => setIsOpen(false)}>Profile</Link>
                  </Button>
                  <Button variant="outline" size="lg" className="w-full text-left justify-start text-destructive" onClick={handleSignOut}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" size="lg" className="w-full" asChild>
                    <Link to="/auth" onClick={() => setIsOpen(false)}>Log In</Link>
                  </Button>
                  <Button variant="default" size="lg" className="w-full" asChild>
                    <Link to="/auth" onClick={() => setIsOpen(false)}>Get Started</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
