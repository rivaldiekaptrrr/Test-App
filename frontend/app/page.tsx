import Link from 'next/link'
import {
  Shield,
  ArrowRight,
  Globe,
  User,
  Camera,
  Lock,
  Mic,
  Laptop,
  Eye,
  Zap,
  CheckCircle
} from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0B1121] text-slate-100 selection:bg-blue-500/30 font-sans overflow-x-hidden">

      {/* 🔮 Background Atmospherics */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 blur-[120px] rounded-full mix-blend-screen opacity-40 animate-pulse-slow" />
        <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full mix-blend-screen opacity-40" />
        <div className="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full mix-blend-screen opacity-30" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03]" />
      </div>

      {/* 🧭 Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 backdrop-blur-md border-b border-white/5 bg-[#0B1121]/70 supports-[backdrop-filter]:bg-[#0B1121]/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex items-center gap-3 group cursor-pointer">
              <div className="relative w-10 h-10 flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-all duration-300">
                <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                <Shield className="w-5 h-5 text-white relative z-10" />
              </div>
              <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-200 tracking-tight">
                ExamProctor
              </span>
            </div>

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-8">
              {['Features', 'How it Works', 'Pricing'].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
                  className="text-sm font-medium text-slate-400 hover:text-white transition-colors duration-200"
                >
                  {item}
                </a>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
              <Link href="/login">
                <button className="px-5 py-2.5 text-slate-300 hover:text-white font-medium text-sm transition-colors">
                  Log In
                </button>
              </Link>
              <Link href="/signup">
                <button className="px-6 py-2.5 bg-white text-[#0B1121] rounded-full font-semibold text-sm hover:bg-slate-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] hover:scale-[1.02] active:scale-[0.98]">
                  Get Started
                </button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="relative z-10">
        {/* 🌟 Hero Section */}
        <section className="pt-40 pb-20 lg:pt-48 lg:pb-32 px-6 lg:px-8 overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">

              {/* Left Content */}
              <div className="text-center lg:text-left relative z-10">
                <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-8 animate-fade-in-up">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
                  </span>
                  <span className="text-blue-200 text-xs font-semibold tracking-wide uppercase">AI-Powered Proctoring v2.0</span>
                </div>

                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-[1.1] mb-8">
                  Secure exams, <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
                    without limits.
                  </span>
                </h1>

                <p className="text-lg text-slate-400 leading-relaxed mb-10 max-w-xl mx-auto lg:mx-0 font-light">
                  The most advanced examination integrity platform. Real-time monitoring, AI behavioral analysis, and seamless integration for the modern campus.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Link href="/demo-exam">
                    <button className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl font-semibold text-[15px] transition-all shadow-[0_10px_40px_-10px_rgba(37,99,235,0.4)] hover:shadow-[0_20px_60px_-15px_rgba(37,99,235,0.5)] hover:-translate-y-1">
                      <span className="flex items-center justify-center gap-2">
                        Try Demo Exam
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    </button>
                  </Link>
                  <Link href="/signup">
                    <button className="w-full sm:w-auto px-8 py-4 bg-[#1A2333] hover:bg-[#232D3F] border border-white/10 text-white rounded-2xl font-semibold text-[15px] transition-all hover:border-white/20">
                      Create Free Account
                    </button>
                  </Link>
                </div>

                <div className="mt-16 pt-10 border-t border-white/5 flex flex-wrap justify-center lg:justify-start gap-12 items-center opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                  {/* Logos can be added here, currently just text stats for cleanliness */}
                  <div className="text-center lg:text-left">
                    <div className="text-2xl font-bold text-white tracking-tight">500+</div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mt-1">Institutions</div>
                  </div>
                  <div className="text-center lg:text-left">
                    <div className="text-2xl font-bold text-white tracking-tight">2.5M</div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mt-1">Assessments</div>
                  </div>
                  <div className="text-center lg:text-left">
                    <div className="text-2xl font-bold text-white tracking-tight">99.9%</div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mt-1">Uptime</div>
                  </div>
                </div>
              </div>

              {/* Right Visual: floating detailed card */}
              <div className="relative z-10 lg:pl-10">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-[2rem] blur-2xl opacity-30 group-hover:opacity-50 transition duration-1000"></div>
                  <div className="relative bg-[#0F1623] border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden backdrop-blur-3xl ring-1 ring-white/5">
                    {/* Fake Browser Header */}
                    <div className="px-6 py-4 border-b border-white/5 bg-[#1F2937]/30 flex items-center gap-4">
                      <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
                        <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                        <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
                      </div>
                      <div className="flex-1 text-center">
                        <div className="px-4 py-1.5 bg-[#000000]/20 rounded-lg inline-block">
                          <span className="text-[10px] sm:text-xs font-mono text-slate-400 flex items-center gap-2">
                            <Globe className="w-3 h-3" />
                            exam-proctor.app
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-8 sm:p-10 relative">
                      {/* Floating Badges */}
                      <div className="absolute top-8 right-8 z-20 animate-float">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-xs font-semibold backdrop-blur-md">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          Monitoring Active
                        </div>
                      </div>

                      {/* Main Video Area */}
                      <div className="flex gap-6 mb-8">
                        <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 border-2 border-slate-600/50 flex items-center justify-center relative overflow-hidden shadow-xl">
                          <div className="absolute inset-0 bg-black/20" />
                          <User className="w-10 h-10 text-slate-300" />

                          {/* Scanning Effect */}
                          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/20 to-transparent w-full h-[20%] animate-scan" />

                          <div className="absolute top-2 right-2 p-1 bg-black/50 rounded-md">
                            <Camera className="w-3 h-3 text-white" />
                          </div>
                        </div>
                        <div className="flex-1 space-y-3 pt-2">
                          <div className="h-2 w-24 bg-slate-700/50 rounded-full"></div>
                          <div className="h-2 w-32 bg-slate-700/30 rounded-full"></div>
                          <div className="h-16 w-full bg-white/5 rounded-xl border border-white/5 mt-2 flex items-center justify-center">
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="w-1 bg-blue-500/50 rounded-full animate-sound-wave" style={{ height: `${Math.random() * 20 + 10}px`, animationDelay: `${i * 0.1}s` }}></div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Code / Exam Content */}
                      <div className="bg-[#0B1121] rounded-xl p-4 border border-white/5 font-mono text-xs text-slate-400 leading-relaxed shadow-inner">
                        <p><span className="text-purple-400">function</span> <span className="text-blue-400">validateSubmission</span>() {'{'}</p>
                        <p className="pl-4">  <span className="text-purple-400">const</span> integrity = <span className="text-emerald-400">checkEnvironment</span>();</p>
                        <p className="pl-4">  <span className="text-purple-400">if</span> (!integrity.secure) {'{'}</p>
                        <p className="pl-8">    <span className="text-rose-400">flagViolation</span>(<span className="text-amber-400">'suspicious_activity'</span>);</p>
                        <p className="pl-8">    <span className="text-purple-400">return</span> <span className="text-rose-400">false</span>;</p>
                        <p className="pl-4">  {'}'}</p>
                        <p className="pl-4">  <span className="text-purple-400">return</span> <span className="text-emerald-400">true</span>;</p>
                        <p>{'}'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* 🚀 Feature Grid Section (Glassmorphism) */}
        <section id="features" className="py-24 px-6 lg:px-8 relative z-10">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4">Precision Monitoring</h2>
              <p className="text-slate-400 max-w-2xl mx-auto text-lg">Engineered to detect every anomaly without disrupting the student experience.</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: 'Identity Verification', icon: <User className="w-6 h-6 text-white" />, text: 'Biometric scan and ID matching before every session starts.' },
                { title: 'Browser Lockdown', icon: <Lock className="w-6 h-6 text-white" />, text: 'Prevents new tabs, right-clicks, and clipboard functions.' },
                { title: 'Audio Analysis', icon: <Mic className="w-6 h-6 text-white" />, text: 'AI filters background noise to detect unauthorized voices.' },
                { title: 'Device Tracking', icon: <Laptop className="w-6 h-6 text-white" />, text: 'Monitors secondary screens and unauthorized hardware.' },
                { title: 'Eye Tracking AI', icon: <Eye className="w-6 h-6 text-white" />, text: 'Subtle gaze detection to flag constant off-screen looks.' },
                { title: 'Real-time Analytics', icon: <Zap className="w-6 h-6 text-white" />, text: 'Live dashboard for proctors to monitor 100+ students.' },
              ].map((feature, idx) => (
                <div key={idx} className="group p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all duration-300 hover:-translate-y-1 hover:border-white/10 relative overflow-hidden">
                  {/* Hover Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  <div className="w-12 h-12 rounded-2xl bg-[#1A2333] border border-white/10 flex items-center justify-center text-2xl mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300 relative z-10">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3 relative z-10">{feature.title}</h3>
                  <p className="text-slate-400 leading-relaxed text-sm relative z-10">{feature.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ⚙️ How it works (Process) */}
        <section id="how-it-works" className="py-24 border-t border-white/5 bg-white/[0.01]">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-6">Seamless integration for <br /> every classroom.</h2>
                <ul className="space-y-8 mt-10">
                  {[
                    { title: 'Create Assessments', text: 'Import questions or create new ones using our intuitive builder.' },
                    { title: 'Customize Security', text: 'Toggle features like "Force Fullscreen" or "Record Screen" per exam.' },
                    { title: 'Invite Students', text: 'Share a secure link. No complex installations required for students.' },
                  ].map((step, i) => (
                    <li key={i} className="flex gap-6">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-400 font-bold flex items-center justify-center text-sm">
                        0{i + 1}
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-white mb-2">{step.title}</h4>
                        <p className="text-slate-400 text-sm leading-relaxed">{step.text}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-[2.5rem] blur-2xl"></div>
                <div className="bg-[#0F1623] border border-white/10 rounded-[2rem] p-8 relative overflow-hidden">
                  {/* Abstract decorative grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-4 pt-8">
                      <div className="bg-[#1A2333] p-4 rounded-xl border border-white/5">
                        <div className="h-2 w-16 bg-slate-700 rounded-full mb-3"></div>
                        <div className="h-2 w-full bg-slate-800 rounded-full"></div>
                      </div>
                      <div className="bg-[#1A2333] p-4 rounded-xl border border-white/5 opacity-50">
                        <div className="h-2 w-16 bg-slate-700 rounded-full mb-3"></div>
                        <div className="h-2 w-full bg-slate-800 rounded-full"></div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="bg-[#1A2333] p-4 rounded-xl border border-white/5 opacity-50">
                        <div className="h-2 w-16 bg-slate-700 rounded-full mb-3"></div>
                        <div className="h-2 w-full bg-slate-800 rounded-full"></div>
                      </div>
                      <div className="bg-blue-600/10 p-4 rounded-xl border border-blue-500/20">
                        <div className="flex justify-between items-center mb-2">
                          <div className="h-2 w-12 bg-blue-400/50 rounded-full"></div>
                          <div className="h-2 w-2 bg-blue-400 rounded-full"></div>
                        </div>
                        <div className="h-16 bg-blue-500/10 rounded-lg flex items-center justify-center">
                          <CheckCircle className="w-8 h-8 text-blue-500" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 🏁 CTA Footer */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-blue-900/10" />
          <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
            <h2 className="text-4xl sm:text-5xl font-bold text-white tracking-tight mb-8">Ready to modernize <br /> your exams?</h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <button className="w-full sm:w-auto px-10 py-5 bg-white text-[#0B1121] rounded-full font-bold text-lg hover:bg-slate-200 transition-all shadow-2xl hover:scale-[1.02]">
                  Get Started Now
                </button>
              </Link>
            </div>
            <p className="mt-8 text-slate-500 text-sm">No credit card required for trial • Cancel anytime</p>
          </div>
        </section>

        <footer className="border-t border-white/5 bg-[#080C17] py-12 px-6">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-slate-500 text-sm text-center md:text-left">© 2026 ExamProctor. Crafted with precision.</p>
            <div className="flex gap-6 text-slate-500 text-sm">
              <a href="#" className="hover:text-white transition">Privacy</a>
              <a href="#" className="hover:text-white transition">Terms</a>
              <a href="#" className="hover:text-white transition">Twitter</a>
            </div>
          </div>
        </footer>

      </main>
    </div>
  )
}
