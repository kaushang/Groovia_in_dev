import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";

export default function Navigation() {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/room/demo", label: "Room" },
    { href: "/profile", label: "Profile" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-panel-nav ">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent">
              Groovia
            </span>
          </Link>
          
          <div className="hidden md:flex space-x-6">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <button className={`nav-link ${location === item.href ? 'active' : ''}`} data-testid={`nav-${item.label.toLowerCase()}`}>
                  {item.label}
                </button>
              </Link>
            ))}
          </div>
          
          <div className="flex items-center space-x-4">
            <Link href="/auth">
              <Button size="sm" className="bg-gradient-to-r from-purple-500 to-blue-500" data-testid="nav-signup">
                Register
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
