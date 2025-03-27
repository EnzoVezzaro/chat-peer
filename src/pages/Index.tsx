import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Bot, MessageCircle, Shield, Sparkles, Users } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

 function Index() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 pt-16 text-white">
    {/* Header */}
    <header className="fixed top-0 w-full bg-gray-900/50 backdrop-blur-lg border-b border-gray-700 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold text-white">ChatPeer</span>
        </div>
        <Link to="/chat">
          <Button size="lg" className="gap-2 text-black bg-white hover:bg-gray-100">
            Get Started <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </header>

    {/* Hero Section */}
    <section className="pt-32 pb-20">
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
          Connect, Chat, and Create
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
          Experience the future of messaging with peer-to-peer encryption and AI-powered conversations. Your privacy, your control.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/chat">
            <Button size="lg" className="gap-2 text-black bg-white hover:bg-gray-100">
              Get Started <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>

    {/* Features Grid */}
    <section className="py-20 bg-gray-800">
      <div className="max-w-5xl mx-auto bg-gray-900 shadow-lg rounded-2xl p-8">
        <h2 className="text-3xl font-bold text-center mb-12">Why Choose ChatPeer?</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="bg-gray-900 shadow-lg">
            <CardContent className="pt-6 flex flex-col items-center text-center">
              <Shield className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">End-to-End Encryption</h3>
              <p className="text-gray-400">Your conversations are secure and private, visible only to you and your peers.</p>
            </CardContent>
          </Card>
          <Card className="bg-gray-900 shadow-lg">
            <CardContent className="pt-6 flex flex-col items-center text-center">
              <Bot className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">AI Integration</h3>
              <p className="text-gray-400">Enhance your chats with AI assistants that help you communicate better.</p>
            </CardContent>
          </Card>
          <Card className="bg-gray-900 shadow-lg">
            <CardContent className="pt-6 flex flex-col items-center text-center">
              <Users className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Group Collaboration</h3>
              <p className="text-gray-400">Create private or public chat rooms for seamless team collaboration.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>

    {/* CTA Section */}
    <section className="py-20">
      <div className="container mx-auto px-4 text-center">
        <div className="bg-gray-900 shadow-lg rounded-2xl p-8 md:p-12 max-w-4xl mx-auto">
          <Sparkles className="h-12 w-12 text-primary mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Conversations?</h2>
          <p className="text-xl text-gray-400 mb-8">
            Join thousands of users who have already discovered a better way to connect.
          </p>
          <Link to="/chat">
            <Button size="lg" className="gap-2 text-black bg-white hover:bg-gray-100">
              Start Chatting Now <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>

    {/* Footer */}
    <footer className="bg-gray-800 py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            <span className="font-semibold text-white">ChatPeer</span>
          </div>
          <div className="text-sm text-gray-400">
            © 2025 ChatPeer. Made with 💚☕️ by <a href="https://enzovezzaro.com" target="_blank" rel="noopener noreferrer">Enzo Vezzaro</a> 💻
          </div>
        </div>
      </div>
    </footer>
  </div>
  );
 }
 

 export default Index;
