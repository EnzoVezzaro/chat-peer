import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, MessageCircle, ShieldCheck, Zap, Users } from 'lucide-react';
import { Button } from "@/components/ui/button";

function AnimatedBackground() {
  return (
    <svg 
      className="absolute inset-0 w-full h-full"
      preserveAspectRatio="none" 
      viewBox="0 0 1440 900"
    >
      <defs>
        <linearGradient id="bg-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#313338" />
          <stop offset="100%" stopColor="#1E1F22" />
        </linearGradient>
        
        <filter id="blurFilter">
          <feGaussianBlur stdDeviation="10" />
        </filter>
      </defs>
      
      {/* Background Gradient */}
      <rect width="100%" height="100%" fill="url(#bg-gradient)" />
      
      {/* Floating Geometric Shapes */}
      {[...Array(6)].map((_, i) => (
        <g key={i}>
          <path
            d={[
              "M0,0 L100,50 Q200,100 150,200 T300,250",
              "M50,100 Q150,50 200,150 T350,200",
              "M200,50 Q300,100 250,250 T400,300"
            ][i % 3]}
            fill={`rgba(255, 255, 255, ${0.05 + Math.random() * 0.05})`}
            filter="url(#blurFilter)"
            style={{
              animation: `float${i} 20s ease-in-out infinite`,
              transformOrigin: 'center',
            }}
          />
          <style>{`
            @keyframes float${i} {
              0%, 100% { transform: translate(${Math.random() * 100}px, ${Math.random() * 100}px) scale(${0.5 + Math.random()}); }
              50% { transform: translate(${-Math.random() * 100}px, ${-Math.random() * 100}px) scale(${0.7 + Math.random()}); }
            }
          `}</style>
        </g>
      ))}
      
      {/* Subtle Dot Grid */}
      {[...Array(100)].map((_, i) => (
        <circle
          key={i}
          cx={Math.random() * 1440}
          cy={Math.random() * 900}
          r={Math.random() * 1.5}
          fill="rgba(255, 255, 255, 0.05)"
        />
      ))}
    </svg>
  );
}

function Index() {
  return (
    <div className="min-h-screen bg-[#313338] text-white antialiased relative">
      {/* Animated Background */}
      <AnimatedBackground />
      
      {/* Header */}
      <header className="fixed top-0 w-full bg-[#1E1F22]/90 backdrop-blur-md border-b border-black/20 z-50">
        <div className="container max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-white/70" />
            <span className="text-lg font-semibold tracking-tight">ChatPeer</span>
          </div>
          <nav>
            <Link to="/chat">
              <Button 
                variant="outline" 
                className="bg-white/10 hover:bg-white/20 text-white rounded-full"
              >
                Launch App <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Full Height Hero Section */}
      <main className="container max-w-6xl mx-auto px-4 relative z-10">
        <section className="min-h-screen flex items-center justify-center text-center">
          <div className="max-w-4xl relative">
            <h1 className="text-6xl font-bold tracking-tight mb-6 text-white 
              animate-fade-in-up opacity-0" 
              style={{ animationDelay: '0.2s' }}
            >
              Secure Messaging Reimagined
            </h1>
            <p 
              className="text-xl text-gray-300 max-w-2xl mx-auto mb-10 
              animate-fade-in-up opacity-0" 
              style={{ animationDelay: '0.4s' }}
            >
              Elevate your communication with peer-to-peer messaging, AI-powered insights, and seamless collaboration.
            </p>
            <div 
              className="flex justify-center space-x-4 
              animate-fade-in-up opacity-0" 
              style={{ animationDelay: '0.6s' }}
            >
              <Link to="/chat">
                <Button 
                  size="lg" 
                  className="bg-white/10 hover:bg-white/20 text-white rounded-full"
                >
                  Get Started <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Rest of the existing code remains the same */}
        {/* Features Section */}
        <section className="py-16">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: ShieldCheck,
                title: "Secure & Private Messaging",
                description: "Peer-to-peer messaging with built-in encryption, ensuring your conversations remain private and secure."
              },
              {
                icon: Zap,
                title: "AI-Powered Assistance",
                description: "Intelligent communication tools to enhance your messaging experience."
              },
              {
                icon: Users,
                title: "Collaborative Spaces",
                description: "Create secure group chats and collaborative environments."
              }
            ].map(({ icon: Icon, title, description }, index) => (
              <div 
                key={index} 
                className="text-center p-6 bg-[#2B2D31] rounded-2xl 
                  border border-black/20 hover:bg-[#393C42] 
                  transition-colors duration-300"
              >
                <Icon className="mx-auto h-12 w-12 text-white/70 mb-4" />
                <h3 className="text-xl font-semibold mb-3 text-white">{title}</h3>
                <p className="text-gray-300">{description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Call to Action */}
        <section className="text-center bg-[#2B2D31] rounded-3xl p-16 mt-16 border border-black/20">
          <h2 className="text-4xl font-bold mb-6 text-white">
            Transform Your Communication
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-10">
            Join a new generation of secure, intelligent messaging.
          </p>
          <Link to="/chat">
            <Button 
              size="lg" 
              className="bg-white/10 hover:bg-white/20 text-white rounded-full"
            >
              Join ChatPeer <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#1E1F22] py-8 mt-16 relative z-10">
        <div className="container max-w-6xl mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-white/70" />
            <span className="font-semibold text-white">ChatPeer</span>
          </div>
          <div className="text-sm text-gray-400">
            © 2025 ChatPeer. Crafted by <a 
              href="https://enzovezzaro.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-white/70 hover:underline"
            >
              Enzo Vezzaro
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Index;