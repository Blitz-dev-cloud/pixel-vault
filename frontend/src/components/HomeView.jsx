import React from "react";
import {
  Palette,
  Monitor,
  Smartphone,
  Users,
  Eye,
  RotateCcw,
  Camera,
  Plus,
} from "lucide-react";

const HomeView = ({
  isConnected,
  isLoading,
  account,
  connectWallet,
  setCurrentView,
}) => {
  const features = [
    {
      icon: Palette,
      title: "Mint NFTs",
      desc: "Create and mint your digital masterpieces",
      color: "purple",
    },
    {
      icon: Monitor,
      title: "3D Gallery",
      desc: "Explore art in immersive 3D spaces with orbit controls",
      color: "blue",
    },
    {
      icon: Smartphone,
      title: "AR Experience",
      desc: "Project NFTs onto real walls with advanced AR",
      color: "green",
    },
    {
      icon: Users,
      title: "Community",
      desc: "Connect with artists and collectors worldwide",
      color: "pink",
    },
  ];

  const actions = [
    {
      icon: Eye,
      text: "Browse Gallery",
      view: "gallery",
      color: "from-blue-600 to-cyan-600",
    },
    {
      icon: RotateCcw,
      text: "3D Experience",
      view: "3d",
      color: "from-purple-600 to-pink-600",
    },
    {
      icon: Camera,
      text: "AR Mode",
      view: "ar",
      color: "from-green-600 to-teal-600",
    },
    {
      icon: Plus,
      text: "Mint Artwork",
      view: "mint",
      color: "from-orange-600 to-red-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white overflow-hidden relative">
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-32 h-32 bg-purple-500/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-pink-500/20 rounded-full blur-xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-32 left-1/4 w-40 h-40 bg-blue-500/20 rounded-full blur-xl animate-pulse delay-2000"></div>
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        <header className="text-center mb-12">
          <h1 className="text-7xl font-bold mb-6 bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent animate-pulse">
            Pixel Vault
          </h1>
          <p className="text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Experience the future of digital art with immersive 3D galleries and
            cutting-edge augmented reality
          </p>

          {!isConnected ? (
            <button
              onClick={connectWallet}
              disabled={isLoading}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-10 py-4 rounded-full font-semibold text-lg transition-all transform hover:scale-105 disabled:opacity-50 shadow-2xl"
            >
              {isLoading ? "Connecting..." : "Connect Wallet"}
            </button>
          ) : (
            <div className="bg-black/30 backdrop-blur-md rounded-xl p-6 inline-block border border-white/10">
              <p className="text-green-400 text-lg">✓ Connected: {account}</p>
            </div>
          )}
        </header>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {features.map(({ icon: Icon, title, desc, color }, index) => (
            <div
              key={index}
              className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-white/10 hover:border-white/20 transition-all transform hover:scale-105 hover:bg-black/30"
            >
              <div className="flex items-center mb-6">
                <Icon className={`w-10 h-10 text-${color}-400 mr-4`} />
                <h3 className="text-xl font-bold">{title}</h3>
              </div>
              <p className="text-gray-300">{desc}</p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <h2 className="text-4xl font-bold mb-10">Start Your Journey</h2>
          <div className="flex flex-wrap justify-center gap-6">
            {actions.map(({ icon: Icon, text, view, color }, index) => (
              <button
                key={index}
                onClick={() => setCurrentView(view)}
                className={`bg-gradient-to-r ${color} hover:shadow-xl px-8 py-4 rounded-xl transition-all transform hover:scale-105 flex items-center space-x-3 font-semibold`}
              >
                <Icon className="w-6 h-6" />
                <span>{text}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeView;
