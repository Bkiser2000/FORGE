import React from "react";

interface HeroSectionProps {
  onCreateClick: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onCreateClick }) => {
  return (
    <section className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4">
      <div className="max-w-4xl text-center fade-in">
        {/* Main Heading */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6">
          <span className="gradient-text">Forge Your Token</span>
        </h1>

        {/* Subheading */}
        <p className="text-xl sm:text-2xl text-gray-400 mb-8 max-w-2xl mx-auto">
          Create custom crypto tokens on Solana and Cronos networks. Simple, secure, and ready to use.
        </p>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12 mt-16">
          <div className="card hover:border-blue-400 transition">
            <div className="text-3xl mb-4">⚡</div>
            <h3 className="text-lg font-semibold mb-2">Lightning Fast</h3>
            <p className="text-gray-400 text-sm">
              Create tokens in seconds with instant confirmation
            </p>
          </div>

          <div className="card hover:border-blue-400 transition">
            <div className="text-3xl mb-4">🔐</div>
            <h3 className="text-lg font-semibold mb-2">Secure</h3>
            <p className="text-gray-400 text-sm">
              Audited smart contracts and secure wallet integration
            </p>
          </div>

          <div className="card hover:border-blue-400 transition">
            <div className="text-3xl mb-4">🌐</div>
            <h3 className="text-lg font-semibold mb-2">Multi-Chain</h3>
            <p className="text-gray-400 text-sm">
              Deploy on Solana and Cronos from a single interface
            </p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button onClick={onCreateClick} className="btn-primary px-8 py-4 text-lg">
            Start Creating →
          </button>
          <button className="btn-secondary px-8 py-4 text-lg">
            View Documentation
          </button>
        </div>

        {/* Stats */}
        <div className="mt-20 grid grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-3xl font-bold gradient-text">1000+</div>
            <p className="text-gray-400">Tokens Created</p>
          </div>
          <div>
            <div className="text-3xl font-bold gradient-text">50k+</div>
            <p className="text-gray-400">Active Users</p>
          </div>
          <div>
            <div className="text-3xl font-bold gradient-text">$500M+</div>
            <p className="text-gray-400">Total Value Minted</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
