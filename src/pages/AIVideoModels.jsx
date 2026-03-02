import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Canvas } from "@react-three/fiber";
import { ShaderPlane } from "@/components/ui/background-paper-shaders";
import { Button } from '@/components/ui/button';
import { Menu, X, ExternalLink, Star, Zap, Clock, Video, CheckCircle, Sparkles, Play, ChevronDown, Filter, Search } from 'lucide-react';

// AI Video Models Data
const aiVideoModels = [
    {
        id: 1,
        name: "Sora",
        developer: "OpenAI",
        description: "Advanced AI model that can generate realistic and imaginative videos from text descriptions. Creates up to 1 minute of video with remarkable consistency.",
        features: ["Text-to-video", "Image-to-video", "Video extension", "Physics simulation"],
        pricing: "Waitlist",
        rating: 4.9,
        badge: "Best Overall",
        color: "#10b981",
        website: "https://openai.com/sora"
    },
    {
        id: 2,
        name: "Runway Gen-3 Alpha",
        developer: "Runway",
        description: "Next-generation AI video generation model with enhanced motion quality, better consistency, and improved control over generated content.",
        features: ["Text-to-video", "Advanced motion", "Consistency control", "Multi-modal input"],
        pricing: "Free & Paid",
        rating: 4.7,
        badge: "Best for Creators",
        color: "#8b5cf6",
        website: "https://runwayml.com"
    },
    {
        id: 3,
        name: "Kling AI",
        developer: "Kuaishou",
        description: "Powerful text-to-video generator capable of creating 2-minute videos with realistic motion. Strong in cinematic and dynamic scenes.",
        features: ["Long-form video", "Cinematic quality", "Fast generation", "Motion brush"],
        pricing: "Free & Paid",
        rating: 4.6,
        badge: "Best Value",
        color: "#f59e0b",
        website: "https://kling.ai"
    },
    {
        id: 4,
        name: "Pika",
        developer: "Pika Labs",
        description: "User-friendly AI video generator perfect for quick content creation. Supports various styles from realistic to animated.",
        features: ["Quick generation", "Style variety", "Discord integration", "Lip sync"],
        pricing: "Free & Paid",
        rating: 4.5,
        badge: "Easiest to Use",
        color: "#ec4899",
        website: "https://pika.art"
    },
    {
        id: 5,
        name: "Luma Dream Machine",
        developer: "Luma AI",
        description: "High-quality video generation with excellent consistency and realism. Great for product videos and visual storytelling.",
        features: ["Photorealistic", "Consistent characters", "Camera controls", "High resolution"],
        pricing: "Paid",
        rating: 4.6,
        badge: "Best Quality",
        color: "#3b82f6",
        website: "https://lumalabs.ai/dream-machine"
    },
    {
        id: 6,
        name: "HeyGen",
        developer: "HeyGen",
        description: "Specialized in AI avatars and talking head videos. Perfect for marketing, training videos, and localized content.",
        features: ["AI avatars", "Voice cloning", "Multi-language", "Lip sync"],
        pricing: "Paid",
        rating: 4.4,
        badge: "Best for Avatars",
        color: "#06b6d4",
        website: "https://heygen.com"
    },
    {
        id: 7,
        name: "Kaiber",
        developer: "Kaiber",
        description: "Creative AI video tool with strong artistic capabilities. Popular among artists and musicians for music visualization.",
        features: ["Artistic styles", "Music visualization", "Storytelling", "Transform images"],
        pricing: "Free & Paid",
        rating: 4.3,
        badge: "Most Artistic",
        color: "#f43f5e",
        website: "https://kaiber.ai"
    },
    {
        id: 8,
        name: "Stable Video Diffusion",
        developer: "Stability AI",
        description: "Open-source video generation model from Stability AI. Offers both text-to-video and image-to-video capabilities.",
        features: ["Open source", "Text-to-video", "Image-to-video", "Customizable"],
        pricing: "Free",
        rating: 4.2,
        badge: "Best Open Source",
        color: "#ef4444",
        website: "https://stability.ai"
    },
    {
        id: 9,
        name: "Meta Movie Gen",
        developer: "Meta",
        description: "Meta's advanced video generation model capable of creating high-quality videos from text prompts with impressive realism.",
        features: ["High quality", "Text-to-video", "Personalization", "Edit capabilities"],
        pricing: "Research",
        rating: 4.5,
        badge: "Most Promising",
        color: "#6366f1",
        website: "https://ai.meta.com/movie-gen"
    },
    {
        id: 10,
        name: "Veo",
        developer: "Google DeepMind",
        description: "Google's advanced video generation model with strong physics understanding and cinematic capabilities.",
        features: ["Cinematic quality", "Physics understanding", "Longer durations", "Prompt adherence"],
        pricing: "Waitlist",
        rating: 4.7,
        badge: "Best for Cinema",
        color: "#14b8a6",
        website: "https://deepmind.google/technologies/veo"
    }
];

const categories = [
    { id: "all", name: "All Models", count: 10 },
    { id: "text-to-video", name: "Text-to-Video", count: 8 },
    { id: "image-to-video", name: "Image-to-Video", count: 6 },
    { id: "avatars", name: "AI Avatars", count: 3 },
    { id: "open-source", name: "Open Source", count: 2 }
];

const AIVideoModels = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [sortBy, setSortBy] = useState("rating");

    React.useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Filter and sort models
    const filteredModels = aiVideoModels
        .filter(model => {
            const matchesSearch = model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                model.developer.toLowerCase().includes(searchQuery.toLowerCase()) ||
                model.description.toLowerCase().includes(searchQuery.toLowerCase());

            if (selectedCategory === "all") return matchesSearch;
            if (selectedCategory === "text-to-video") return matchesSearch && model.features.includes("Text-to-video");
            if (selectedCategory === "image-to-video") return matchesSearch && (model.features.includes("Image-to-video") || model.features.includes("Transform images"));
            if (selectedCategory === "avatars") return matchesSearch && model.features.includes("AI avatars");
            if (selectedCategory === "open-source") return matchesSearch && model.pricing === "Free";

            return matchesSearch;
        })
        .sort((a, b) => {
            if (sortBy === "rating") return b.rating - a.rating;
            if (sortBy === "name") return a.name.localeCompare(b.name);
            return 0;
        });

    return (
        <div className="relative min-h-screen bg-zinc-950 text-white overflow-hidden font-sans selection:bg-purple-500/30">
            {/* Background Layer */}
            <div className="fixed inset-0 z-0 pointer-events-none w-full h-full">
                <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
                    <color attach="background" args={["#0a0a0f"]} />
                    <ShaderPlane
                        position={[0, 0, 0]}
                        color1="#8b5cf6"
                        color2="#ec4899"
                    />
                    <ambientLight intensity={1.5} />
                </Canvas>
                <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/50 to-black/80 backdrop-blur-[1px]"></div>
            </div>

            {/* Navbar */}
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800 py-3' : 'bg-transparent py-6'}`}>
                <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Link to="/" className="font-serif font-bold text-xl tracking-tight">Zerithum.</Link>
                    </div>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
                        <Link to="/" className="hover:text-white transition-colors">Home</Link>
                        <span className="text-purple-400">AI Video Models</span>
                        <Link to="/Pricing" className="hover:text-white transition-colors">Pricing</Link>
                        <Link to="/Methodology" className="hover:text-white transition-colors">Methodology</Link>
                    </div>

                    <div className="hidden md:flex items-center gap-4">
                        <Link to="/SignIn" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">Sign in</Link>
                        <Link to="/Signup">
                            <Button size="sm" className="bg-purple-600 hover:bg-purple-700 font-medium rounded-full px-5">
                                Get Started
                            </Button>
                        </Link>
                    </div>

                    <button className="md:hidden text-zinc-400" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                        {mobileMenuOpen ? <X /> : <Menu />}
                    </button>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden absolute top-full left-0 right-0 bg-zinc-950 border-b border-zinc-800 p-6 flex flex-col gap-6 shadow-2xl">
                        <Link to="/" className="text-zinc-400 hover:text-white">Home</Link>
                        <span className="text-purple-400">AI Video Models</span>
                        <Link to="/Pricing" className="text-zinc-400 hover:text-white">Pricing</Link>
                        <Link to="/Methodology" className="text-zinc-400 hover:text-white">Methodology</Link>
                        <Link to="/SignIn" className="text-zinc-400 hover:text-white">Sign in</Link>
                        <Link to="/Signup">
                            <Button className="w-full bg-purple-600 rounded-full">Get Started</Button>
                        </Link>
                    </div>
                )}
            </nav>

            {/* Main Content */}
            <main className="relative z-10 pt-32 pb-20">
                {/* Hero Section */}
                <section className="max-w-7xl mx-auto px-6 mb-16">
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-medium mb-6">
                            <Sparkles className="w-4 h-4" />
                            Curated Directory
                        </div>
                        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
                            Best AI Video
                            <br />
                            Generation Models
                        </h1>
                        <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-8">
                            Discover the top AI video generation tools transforming content creation.
                            Compare features, pricing, and capabilities to find your perfect match.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button size="lg" className="bg-purple-600 hover:bg-purple-700 rounded-full px-8">
                                <Video className="w-5 h-5 mr-2" />
                                Explore Models
                            </Button>
                            <Button size="lg" variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 rounded-full px-8">
                                Submit a Model
                            </Button>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16">
                        {[
                            { label: "Models Listed", value: "10+" },
                            { label: "Categories", value: "5" },
                            { label: "Hours Researched", value: "50+" },
                            { label: "Updates Monthly", value: "12" }
                        ].map((stat, i) => (
                            <div key={i} className="text-center p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 backdrop-blur-sm">
                                <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                                <div className="text-sm text-zinc-500">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Filters Section */}
                <section className="max-w-7xl mx-auto px-6 mb-12">
                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-8">
                        {/* Search */}
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                            <input
                                type="text"
                                placeholder="Search models..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition-colors"
                            />
                        </div>

                        {/* Sort */}
                        <div className="flex items-center gap-3">
                            <Filter className="w-5 h-5 text-zinc-500" />
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-purple-500 transition-colors cursor-pointer"
                            >
                                <option value="rating">Top Rated</option>
                                <option value="name">Alphabetical</option>
                            </select>
                        </div>
                    </div>

                    {/* Category Pills */}
                    <div className="flex flex-wrap gap-3">
                        {categories.map((category) => (
                            <button
                                key={category.id}
                                onClick={() => setSelectedCategory(category.id)}
                                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${selectedCategory === category.id
                                        ? "bg-purple-600 text-white"
                                        : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white"
                                    }`}
                            >
                                {category.name}
                                <span className="ml-2 opacity-60">({category.count})</span>
                            </button>
                        ))}
                    </div>
                </section>

                {/* Models Grid */}
                <section className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredModels.map((model) => (
                            <div
                                key={model.id}
                                className="group relative p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/10"
                            >
                                {/* Badge */}
                                <div
                                    className="absolute -top-3 left-6 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
                                    style={{ backgroundColor: model.color + '20', color: model.color }}
                                >
                                    {model.badge}
                                </div>

                                {/* Header */}
                                <div className="flex items-start justify-between mb-4 mt-2">
                                    <div>
                                        <h3 className="text-xl font-bold text-white group-hover:text-purple-400 transition-colors">
                                            {model.name}
                                        </h3>
                                        <p className="text-sm text-zinc-500">{model.developer}</p>
                                    </div>
                                    <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-800">
                                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                        <span className="text-sm font-medium text-white">{model.rating}</span>
                                    </div>
                                </div>

                                {/* Description */}
                                <p className="text-zinc-400 text-sm mb-5 line-clamp-3">
                                    {model.description}
                                </p>

                                {/* Features */}
                                <div className="flex flex-wrap gap-2 mb-5">
                                    {model.features.slice(0, 3).map((feature, i) => (
                                        <span
                                            key={i}
                                            className="px-2 py-1 rounded-md bg-zinc-800/80 text-xs text-zinc-400"
                                        >
                                            {feature}
                                        </span>
                                    ))}
                                    {model.features.length > 3 && (
                                        <span className="px-2 py-1 rounded-md bg-zinc-800/80 text-xs text-zinc-500">
                                            +{model.features.length - 3} more
                                        </span>
                                    )}
                                </div>

                                {/* Footer */}
                                <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                                    <div className="flex items-center gap-2">
                                        {model.pricing.includes("Free") ? (
                                            <span className="flex items-center gap-1 text-sm text-green-400">
                                                <Zap className="w-4 h-4" />
                                                {model.pricing}
                                            </span>
                                        ) : model.pricing === "Waitlist" ? (
                                            <span className="flex items-center gap-1 text-sm text-yellow-400">
                                                <Clock className="w-4 h-4" />
                                                {model.pricing}
                                            </span>
                                        ) : (
                                            <span className="text-sm text-zinc-500">{model.pricing}</span>
                                        )}
                                    </div>
                                    <a
                                        href={model.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium transition-colors group/link"
                                    >
                                        Visit
                                        <ExternalLink className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                                    </a>
                                </div>

                                {/* Color accent line */}
                                <div
                                    className="absolute bottom-0 left-0 right-0 h-1 rounded-b-2xl opacity-0 group-hover:opacity-100 transition-opacity"
                                    style={{ backgroundColor: model.color }}
                                />
                            </div>
                        ))}
                    </div>

                    {filteredModels.length === 0 && (
                        <div className="text-center py-20">
                            <Video className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
                            <h3 className="text-xl font-medium text-zinc-400 mb-2">No models found</h3>
                            <p className="text-zinc-500">Try adjusting your search or filter criteria</p>
                        </div>
                    )}
                </section>

                {/* CTA Section */}
                <section className="max-w-7xl mx-auto px-6 mt-24">
                    <div className="relative p-12 rounded-3xl bg-gradient-to-br from-purple-900/40 to-pink-900/40 border border-purple-500/20 overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10"></div>
                        <div className="relative z-10 text-center">
                            <h2 className="text-3xl md:text-4xl font-bold mb-4">Want to feature your AI Video Model?</h2>
                            <p className="text-zinc-400 mb-8 max-w-xl mx-auto">
                                Submit your AI video generation tool to be featured in our directory.
                                We review all submissions and update our list monthly.
                            </p>
                            <Button size="lg" className="bg-white text-zinc-950 hover:bg-zinc-200 rounded-full px-8">
                                <Play className="w-5 h-5 mr-2" />
                                Submit Your Model
                            </Button>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="relative z-10 border-t border-zinc-800 py-12">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-2">
                            <span className="font-serif font-bold text-xl">Zerithum.</span>
                            <span className="text-zinc-500 text-sm">© 2024</span>
                        </div>
                        <div className="flex items-center gap-8 text-sm text-zinc-500">
                            <Link to="/Privacy" className="hover:text-white transition-colors">Privacy</Link>
                            <Link to="/TermsOfService" className="hover:text-white transition-colors">Terms</Link>
                            <Link to="/Security" className="hover:text-white transition-colors">Security</Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default AIVideoModels;
