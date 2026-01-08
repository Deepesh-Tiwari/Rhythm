import React from 'react';
import { 
    CodeBracketIcon, 
    ServerIcon, 
    MusicalNoteIcon, 
    GlobeAltIcon, 
    UserIcon,
    CpuChipIcon,
    CloudIcon
} from '@heroicons/react/24/outline';

const AboutPage = () => {
    return (
        <div className="min-h-screen bg-base-100">
            
            {/* --- HERO SECTION --- */}
            <div className="hero min-h-[50vh] bg-base-200">
                <div className="hero-content text-center">
                    <div className="max-w-3xl">
                        <div className="mb-6 inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 text-primary shadow-lg">
                            <MusicalNoteIcon className="w-10 h-10" />
                        </div>
                        <h1 className="text-5xl font-extrabold tracking-tight">Rhythm</h1>
                        <p className="py-6 text-xl opacity-75 leading-relaxed">
                            A real-time social music platform where you can listen together, 
                            discover new tracks based on your taste, and connect with people who vibe like you.
                        </p>
                        <div className="flex justify-center gap-4">
                            <a href="https://github.com/Deepesh-Tiwari" target="_blank" rel="noopener noreferrer" className="btn btn-primary gap-2">
                                <CodeBracketIcon className="w-5 h-5" /> GitHub
                            </a>
                            <a href="https://www.linkedin.com/in/deepeshtiwari2911/" target="_blank" rel="noopener noreferrer" className="btn btn-outline gap-2">
                                <UserIcon className="w-5 h-5" /> LinkedIn
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- ARCHITECTURE DIAGRAM SECTION --- */}
            <div className="py-16 px-4 bg-base-100">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-bold mb-2">System Architecture</h2>
                        <p className="text-base-content/60">
                            High-level overview of how Rhythm orchestrates real-time events and AI.
                        </p>
                    </div>
                    
                    {/* Simple Image Display */}
                    <div className="w-full bg-base-200/50 rounded-3xl border border-base-300 p-4 shadow-sm">
                        <img 
                            src="artitecture.svg" 
                            alt="System Architecture Diagram" 
                            className="w-full h-auto object-contain"
                        />
                    </div>
                </div>
            </div>

            {/* --- TECH STACK --- */}
            <div className="py-16 px-4 max-w-7xl mx-auto bg-base-200/50">
                <h2 className="text-3xl font-bold text-center mb-16">Built With Modern Tech</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    
                    {/* Frontend */}
                    <div className="card bg-base-100 shadow-xl border border-base-200 hover:-translate-y-1 transition-transform">
                        <div className="card-body items-center text-center">
                            <div className="p-3 bg-secondary/10 rounded-xl mb-2">
                                <GlobeAltIcon className="w-8 h-8 text-secondary" />
                            </div>
                            <h3 className="card-title text-lg">Frontend</h3>
                            <div className="divider my-1"></div>
                            <ul className="text-sm text-base-content/70 space-y-2 w-full text-left pl-4 list-disc">
                                <li>React.js (Vite)</li>
                                <li>Redux Toolkit & RTK Query</li>
                                <li>TailwindCSS & DaisyUI</li>
                                <li>Socket.io Client</li>
                                <li>React Player</li>
                            </ul>
                        </div>
                    </div>

                    {/* Backend */}
                    <div className="card bg-base-100 shadow-xl border border-base-200 hover:-translate-y-1 transition-transform">
                        <div className="card-body items-center text-center">
                            <div className="p-3 bg-accent/10 rounded-xl mb-2">
                                <ServerIcon className="w-8 h-8 text-accent" />
                            </div>
                            <h3 className="card-title text-lg">Backend</h3>
                            <div className="divider my-1"></div>
                            <ul className="text-sm text-base-content/70 space-y-2 w-full text-left pl-4 list-disc">
                                <li>Node.js & Express</li>
                                <li>MongoDB (Mongoose)</li>
                                <li>Socket.io (Real-time)</li>
                                <li>RabbitMQ (Async Messaging)</li>
                                {/* <li>Nodemailer (SMTP)</li> */}
                            </ul>
                        </div>
                    </div>

                    {/* AI & Data */}
                    <div className="card bg-base-100 shadow-xl border border-base-200 hover:-translate-y-1 transition-transform">
                        <div className="card-body items-center text-center">
                            <div className="p-3 bg-primary/10 rounded-xl mb-2">
                                <CpuChipIcon className="w-8 h-8 text-primary" />
                            </div>
                            <h3 className="card-title text-lg">AI & Data</h3>
                            <div className="divider my-1"></div>
                            <ul className="text-sm text-base-content/70 space-y-2 w-full text-left pl-4 list-disc">
                                <li>Python Recommendation Engine</li>
                                <li>Pinecone (Vector DB)</li>
                                <li>Spotify Web API</li>
                                <li>YouTube Data/Stream API</li>
                            </ul>
                        </div>
                    </div>

                    {/* DevOps */}
                    <div className="card bg-base-100 shadow-xl border border-base-200 hover:-translate-y-1 transition-transform">
                        <div className="card-body items-center text-center">
                            <div className="p-3 bg-info/10 rounded-xl mb-2">
                                <CloudIcon className="w-8 h-8 text-info" />
                            </div>
                            <h3 className="card-title text-lg">DevOps</h3>
                            <div className="divider my-1"></div>
                            <ul className="text-sm text-base-content/70 space-y-2 w-full text-left pl-4 list-disc">
                                <li>Docker & Docker Compose</li>
                                <li>Render (Cloud Hosting)</li>
                                <li>Vercel (Frontend Hosting)</li>
                                <li>CloudAMQP (Message Queue)</li>
                            </ul>
                        </div>
                    </div>

                </div>
            </div>

            {/* --- FOOTER CTA --- */}
            <div className="py-20 text-center bg-base-100">
                <h3 className="text-2xl font-bold mb-4">Interested in my work?</h3>
                <p className="mb-6 opacity-60">Check out the code or connect with me directly.</p>
                <a href="mailto:your.email@example.com" className="btn btn-wide btn-primary">
                    Let's Connect
                </a>
            </div>

        </div>
    );
};

export default AboutPage;