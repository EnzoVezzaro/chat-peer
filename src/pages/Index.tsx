import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, MessageCircle, ShieldCheck, Zap, Users } from 'lucide-react';
import { Button } from "@/components/ui/button";

function Index() {
  return (
    <div className="min-h-screen bg-[#313338] text-white antialiased">
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
      <main className="container max-w-6xl mx-auto px-4">
        <section className="min-h-screen flex items-center justify-center text-center">
          <div className="max-w-4xl">
            <h1 className="text-6xl font-bold tracking-tight mb-6 text-white">
              Secure Messaging Reimagined
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-10">
              Elevate your communication with end-to-end encryption, AI-powered insights, and seamless collaboration.
            </p>
            <div className="flex justify-center space-x-4">
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

        {/* Features */}
        <section className="py-16">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: ShieldCheck,
                title: "End-to-End Encryption",
                description: "Military-grade security ensuring your conversations remain completely private."
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
      <footer className="bg-[#1E1F22] py-8 mt-16">
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