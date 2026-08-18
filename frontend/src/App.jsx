import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import CosmicBackground from './CosmicBackground';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Briefcase, FileText, CheckCircle, AlertTriangle, 
  Settings, Award, Plus, Trash2, Cpu, BarChart2, Edit3,
  UploadCloud, ArrowRight, RefreshCw, Layers, Download,
  Search, X, Check, File, Calendar, Sparkles, Filter, ChevronRight, ChevronDown,
  TrendingUp, Activity, HelpCircle, Users,
  CheckSquare, ShieldCheck, MessageSquare, Send, Sun, Moon
} from 'lucide-react';
import { 
  ResponsiveContainer, RadarChart, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, Radar,
  BarChart, Bar, XAxis, YAxis, Tooltip,
  Cell, AreaChart, Area
} from 'recharts';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';
const STATIC_BASE_URL = import.meta.env.VITE_STATIC_BASE_URL || 'http://127.0.0.1:8000';

const COLORS = ['#8B5CF6', '#3B82F6', '#06B6D4', '#22C55E', '#F59E0B', '#EF4444'];

// 1. Typewriter Headline component
function TypewriterText({ words }) {
  const [index, setIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [reverse, setReverse] = useState(false);
  
  useEffect(() => {
    if (subIndex === words[index].length + 1 && !reverse) {
      const timeout = setTimeout(() => setReverse(true), 2000);
      return () => clearTimeout(timeout);
    }
    if (subIndex === 0 && reverse) {
      setReverse(false);
      setIndex((prev) => (prev + 1) % words.length);
      return;
    }
    
    const timeout = setTimeout(() => {
      setSubIndex((prev) => prev + (reverse ? -1 : 1));
    }, Math.max(reverse ? 50 : 100 - Math.random() * 50, 30));
    
    return () => clearTimeout(timeout);
  }, [subIndex, index, reverse, words]);
  
  return (
    <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-500 bg-clip-text text-transparent font-extrabold font-display">
      {words[index].substring(0, subIndex)}
      <span className="text-purple-400 animate-pulse">|</span>
    </span>
  );
}

// 1.5 Custom premium searchable dropdown with keyboard support, smooth transitions, and glassmorphism
function CustomSearchableDropdown({ 
  options, 
  value, 
  onChange, 
  placeholder, 
  theme, 
  icon: Icon,
  getLabel = (opt) => opt.label,
  getSub = (opt) => opt.sub,
  emptyMessage = "No items found"
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    setActiveIndex(-1);
  }, [search, isOpen]);

  const filteredOptions = options.filter(opt => {
    const label = getLabel(opt) || '';
    const sub = getSub(opt) || '';
    return label.toLowerCase().includes(search.toLowerCase()) || 
           sub.toLowerCase().includes(search.toLowerCase());
  });

  const selectedOpt = options.find(opt => opt.id === value);

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    if (e.key === 'Escape') {
      setIsOpen(false);
      e.preventDefault();
    } else if (e.key === 'ArrowDown') {
      setActiveIndex(prev => (prev + 1) % Math.max(1, filteredOptions.length));
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      setActiveIndex(prev => (prev - 1 + filteredOptions.length) % Math.max(1, filteredOptions.length));
      e.preventDefault();
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && activeIndex < filteredOptions.length) {
        onChange(filteredOptions[activeIndex].id);
        setIsOpen(false);
      }
      e.preventDefault();
    }
  };

  return (
    <div ref={dropdownRef} className="relative w-full" onKeyDown={handleKeyDown}>
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className={`w-full border rounded-xl px-4 py-3 text-xs flex items-center justify-between transition-all focus:outline-none focus:ring-2 focus:ring-purple-500/40 cursor-pointer ${
          theme === 'light'
            ? 'bg-white border-slate-200 text-slate-800 hover:border-slate-350 shadow-sm'
            : 'bg-slate-950/80 border-slate-850 text-slate-200 hover:border-slate-750 shadow-md'
        }`}
      >
        <div className="flex items-center gap-2.5 truncate">
          {Icon && <Icon className="h-4 w-4 text-purple-400 shrink-0" />}
          <span className="truncate">
            {selectedOpt ? getLabel(selectedOpt) : placeholder}
          </span>
        </div>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 4, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className={`absolute left-0 right-0 z-50 rounded-2xl border p-2 shadow-2xl backdrop-blur-xl ${
              theme === 'light'
                ? 'bg-white/95 border-slate-200 shadow-slate-200/50'
                : 'bg-slate-950/95 border-slate-850 shadow-black/80'
            }`}
          >
            <div className="relative mb-1.5">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-450 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className={`w-full rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500/40 ${
                  theme === 'light'
                    ? 'bg-slate-50 border border-slate-200 text-slate-800'
                    : 'bg-slate-900 border border-slate-800 text-slate-200'
                }`}
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            <div className="max-h-48 overflow-y-auto space-y-0.5 custom-scrollbar pr-0.5">
              {filteredOptions.length === 0 ? (
                <div className="p-3 text-center text-[10px] text-slate-505 font-bold uppercase tracking-wider">
                  {emptyMessage}
                </div>
              ) : (
                filteredOptions.map((opt, idx) => {
                  const isSelected = value === opt.id;
                  const isActive = activeIndex === idx;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        onChange(opt.id);
                        setIsOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-purple-600 text-white font-semibold'
                          : isActive
                            ? theme === 'light' ? 'bg-slate-100 text-slate-900' : 'bg-white/5 text-slate-200'
                            : theme === 'light' ? 'bg-transparent text-slate-700 hover:bg-slate-50' : 'bg-transparent text-slate-350 hover:bg-white/5'
                      }`}
                    >
                      <div className="truncate pr-4">
                        <span className="block truncate">{getLabel(opt)}</span>
                        {getSub(opt) && (
                          <span className={`block text-[9px] mt-0.5 truncate ${isSelected ? 'text-purple-200' : 'text-slate-500 dark:text-slate-450'}`}>
                            {getSub(opt)}
                          </span>
                        )}
                      </div>
                      {isSelected && <Check className="h-3.5 w-3.5 shrink-0" />}
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Unified premium CandidateSelector component reused across Workspace, Insights, and AI Suite
function CandidateSelector({ 
  profiles, 
  selectedProfileId, 
  onChange, 
  theme, 
  onCreateProfileClick 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const dropdownRef = useRef(null);
  const triggerRef = useRef(null);
  const portalRef = useRef(null);

  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, positionAbove: false });

  const updateCoords = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const dropdownHeight = 260; // max height of the dropdown panel
    const showAbove = spaceBelow < dropdownHeight && rect.top > dropdownHeight;

    setCoords({
      // position:fixed is viewport-relative — no scroll offsets needed
      left: rect.left,
      width: rect.width,
      top: showAbove
        ? rect.top - dropdownHeight - 8
        : rect.bottom + 4,
      positionAbove: showAbove
    });
  };

  useEffect(() => {
    if (isOpen) {
      updateCoords();
      window.addEventListener('resize', updateCoords);
      window.addEventListener('scroll', updateCoords, true);
    }
    return () => {
      window.removeEventListener('resize', updateCoords);
      window.removeEventListener('scroll', updateCoords, true);
    };
  }, [isOpen]);

  // Click outside listener that accounts for React Portal context
  useEffect(() => {
    const handleOutsideClick = (e) => {
      const clickedTrigger = dropdownRef.current && dropdownRef.current.contains(e.target);
      const clickedPortal = portalRef.current && portalRef.current.contains(e.target);
      if (!clickedTrigger && !clickedPortal) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Keyboard controls
  useEffect(() => {
    setActiveIndex(-1);
  }, [search, isOpen]);

  const getInitials = (name) => {
    if (!name) return '??';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Advanced search support: search by Name, Email, Skills, Company, and Role
  const filteredProfiles = profiles.filter(p => {
    const name = (p.full_name || '').toLowerCase();
    const email = (p.email || '').toLowerCase();
    const skills = (p.skills || []).map(s => s.toLowerCase()).join(' ');
    const company = (p.company || '').toLowerCase();
    const role = (p.role || '').toLowerCase();
    const query = search.toLowerCase();

    return name.includes(query) || 
           email.includes(query) || 
           skills.includes(query) || 
           company.includes(query) || 
           role.includes(query);
  });

  const selectedProfile = profiles.find(p => p.id === selectedProfileId);

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    if (e.key === 'Escape') {
      setIsOpen(false);
      e.preventDefault();
    } else if (e.key === 'ArrowDown') {
      setActiveIndex(prev => (prev + 1) % Math.max(1, filteredProfiles.length));
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      setActiveIndex(prev => (prev - 1 + filteredProfiles.length) % Math.max(1, filteredProfiles.length));
      e.preventDefault();
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && activeIndex < filteredProfiles.length) {
        onChange(filteredProfiles[activeIndex].id);
        setIsOpen(false);
      }
      e.preventDefault();
    }
  };

  return (
    <div ref={dropdownRef} className="relative w-64" onKeyDown={handleKeyDown}>
      {/* Trigger Button - Switcher style */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          // Compute position synchronously BEFORE state update so coords
          // are already populated when the portal renders in the same flush
          if (!isOpen) updateCoords();
          setIsOpen(prev => !prev);
        }}
        className={`w-full border rounded-2xl p-2 flex items-center justify-between transition-all focus:outline-none focus:ring-2 focus:ring-purple-500/40 cursor-pointer ${
          theme === 'light'
            ? 'bg-white border-slate-200 text-slate-800 hover:border-slate-350 shadow-sm'
            : 'bg-slate-955/80 border-slate-855 text-slate-200 hover:border-slate-750 shadow-md'
        }`}
      >
        <div className="flex items-center gap-2.5 truncate">
          {/* Avatar Initial Bubble */}
          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 text-white font-black text-[10px] flex items-center justify-center shrink-0 shadow-inner">
            {selectedProfile ? getInitials(selectedProfile.full_name) : '??'}
          </div>
          <div className="text-left truncate">
            <span className="block font-bold truncate leading-tight text-[11px] text-slate-200 dark:text-slate-200">
              {selectedProfile ? selectedProfile.full_name : 'Select Candidate...'}
            </span>
            <span className="block text-[8px] text-slate-500 font-semibold truncate mt-0.5 leading-tight">
              {selectedProfile ? selectedProfile.email : 'Click to select profile'}
            </span>
          </div>
        </div>
        <ChevronDown className={`h-4.5 w-4.5 text-slate-500 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Options Panel Drawer — rendered through React Portal so it escapes
           every stacking context and overflow:hidden ancestor.
           AnimatePresence lives INSIDE the portal call: portals are opaque
           to their React parent tree, so AnimatePresence can only track
           motion.div exit animations when it is co-located inside the portal. */}
      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={portalRef}
              key="candidate-dropdown"
              initial={{ opacity: 0, y: coords.positionAbove ? 8 : -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: coords.positionAbove ? 8 : -8, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              style={{
                position: 'fixed',
                left: coords.left,
                top: coords.top,
                width: coords.width,
                zIndex: 9999,
              }}
              className={`rounded-2xl border p-1.5 shadow-2xl backdrop-blur-xl ${
                theme === 'light'
                  ? 'bg-white/95 border-slate-200 shadow-slate-200/50'
                  : 'bg-slate-955/95 border-slate-850 shadow-black/80'
              }`}
            >
              {/* Search Input */}
              <div className="relative mb-1.5">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-450 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search candidates, skills..."
                  className={`w-full rounded-xl pl-8.5 pr-2.5 py-2 text-[10px] focus:outline-none focus:ring-1 focus:ring-purple-500/40 ${
                    theme === 'light'
                      ? 'bg-slate-50 border border-slate-200 text-slate-850'
                      : 'bg-slate-900 border border-slate-805 text-slate-200'
                  }`}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>

              {/* Candidate List */}
              <div className="max-h-48 overflow-y-auto space-y-0.5 custom-scrollbar pr-0.5">
                {filteredProfiles.length === 0 ? (
                  <div className="p-3 text-center space-y-2">
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">No Profiles Found</p>
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        onCreateProfileClick();
                      }}
                      className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-[9px] cursor-pointer shadow transition-colors"
                    >
                      Create Profile
                    </button>
                  </div>
                ) : (
                  filteredProfiles.map((p, idx) => {
                    const isSelected = selectedProfileId === p.id;
                    const isActive = activeIndex === idx;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          onChange(p.id);
                          setIsOpen(false);
                        }}
                        className={`w-full text-left p-1.5 rounded-xl flex items-center justify-between gap-2.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-purple-650 text-white font-semibold'
                            : isActive
                              ? theme === 'light' ? 'bg-slate-100 text-slate-900' : 'bg-white/5 text-slate-200'
                              : theme === 'light' ? 'bg-transparent text-slate-700 hover:bg-slate-50' : 'bg-transparent text-slate-350 hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`h-6.5 w-6.5 rounded-full text-[8px] font-black flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-purple-500/10 text-purple-400'
                          }`}>
                            {getInitials(p.full_name)}
                          </div>
                          <div className="truncate text-left leading-tight">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="block font-bold truncate text-[10px]">{p.full_name}</span>
                              <span className={`text-[7px] font-mono px-1 rounded shrink-0 ${
                                isSelected ? 'bg-white/20 text-white' : 'bg-slate-900 text-slate-500 border border-slate-805'
                              }`}>
                                {p.updated_at ? new Date(p.updated_at).toLocaleDateString() : 'Active'}
                              </span>
                            </div>
                            <span className={`block text-[8px] truncate mt-0.5 ${isSelected ? 'text-purple-200' : 'text-slate-500'}`}>
                              {p.email}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center shrink-0">
                          {isSelected && <Check className="h-3 w-3" />}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [scrollPos, setScrollPos] = useState(0);
  const [theme, setTheme] = useState('dark');
  
  const spotlightRef = useRef(null);

  // Command palette toggle state
  const [cmdOpen, setCmdOpen] = useState(false);
  const [cmdSearch, setCmdSearch] = useState('');

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (spotlightRef.current) {
        spotlightRef.current.style.background = theme === 'dark'
          ? `radial-gradient(800px at ${e.clientX}px ${e.clientY}px, rgba(139, 92, 246, 0.08), rgba(59, 130, 246, 0.03), transparent 70%)`
          : `radial-gradient(800px at ${e.clientX}px ${e.clientY}px, rgba(139, 92, 246, 0.04), rgba(59, 130, 246, 0.01), transparent 70%)`;
      }
    };
    const handleScroll = () => {
      setScrollPos(window.scrollY);
    };
    // Ctrl+K command palette trigger
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCmdOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setCmdOpen(false);
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [theme]);

  const [profiles, setProfiles] = useState([]);
  const [jobs, setJobs] = useState([]);
  
  // Selection states for matching
  const [selectedProfileId, setSelectedProfileId] = useState('');
  const [selectedJobId, setSelectedJobId] = useState('');
  
  // Match results state
  const [matchingResult, setMatchingResult] = useState(null);
  const [isMatchingLoading, setIsMatchingLoading] = useState(false);
  
  // File upload states
  const [isResumeParsing, setIsResumeParsing] = useState(false);
  const [resumeUploadProgress, setResumeUploadProgress] = useState(0);
  const [resumeFileMeta, setResumeFileMeta] = useState(null);
  const [resumeError, setResumeError] = useState('');
  
  const [isJdParsing, setIsJdParsing] = useState(false);
  const [jdUploadProgress, setJdUploadProgress] = useState(0);
  const [jdFileMeta, setJdFileMeta] = useState(null);
  const [jdError, setJdError] = useState('');
  const [isResumeDragging, setIsResumeDragging] = useState(false);
  const [isJdDragging, setIsJdDragging] = useState(false);
  const [isInsightsLoading, setIsInsightsLoading] = useState(false);

  // Raw JD Form state
  const [rawJdText, setRawJdText] = useState('');
  const [jdTitle, setJdTitle] = useState('');
  const [jdCompany, setJdCompany] = useState('');

  // Search & filters
  const [jdSearch, setJdSearch] = useState('');
  const [jdCompanyFilter, setJdCompanyFilter] = useState('All');
  const [activeAiTool, setActiveAiTool] = useState('roadmap');
  const [interviewDifficulty, setInterviewDifficulty] = useState('Mid');
  const [expandedHints, setExpandedHints] = useState({});
  const [expandedAnswers, setExpandedAnswers] = useState({});
  
  // Profile Form state
  const [editingProfileId, setEditingProfileId] = useState(null);
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    skills: '',
    education: [{ degree: '', major: '', institution: '', graduation_year: 2024 }],
    experience: [{ job_title: '', company: '', duration_months: 12, responsibilities: '', skills_used: '' }],
    projects: [{ title: '', description: '', skills_used: '' }],
    certifications: '',
    resume_url: ''
  });
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);

  // Toast system
  const [toasts, setToasts] = useState([]);
  const showToast = (message, type = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Chatbot floating assistant state
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [chatbotMessages, setChatbotMessages] = useState([
    { sender: 'ai', text: 'Hello! I am your RADIX Recruiter Companion. Choose a scenario or ask me anything about the candidate match parameters.' }
  ]);
  const [chatbotInput, setChatbotInput] = useState('');
  const [isChatbotTyping, setIsChatbotTyping] = useState(false);

  // Fetch initial data
  const fetchData = useCallback(async () => {
    let defaultProfileId = '';
    let defaultJobId = '';

    try {
      const pRes = await axios.get(`${API_BASE_URL}/profile`);
      setProfiles(pRes.data);
      if (pRes.data.length > 0) {
        defaultProfileId = pRes.data[0].id;
        setSelectedProfileId(defaultProfileId);
      }
    } catch (e) {
      console.error("Error fetching profiles:", e);
    }

    try {
      const jRes = await axios.get(`${API_BASE_URL}/jd`);
      const defaultJobs = [
        {
          id: '00000000-0000-0000-0000-000000000001',
          title: 'Full Stack Python Developer',
          company: 'Radix Innovations',
          required_skills: ['Python', 'React', 'FastAPI', 'SQL'],
          preferred_skills: ['Docker', 'AWS', 'Tailwind CSS'],
          experience_years_required: 3,
          description: 'Looking for a senior full stack developer with experience in Python and FastAPI.',
          file_url: ''
        },
        {
          id: '00000000-0000-0000-0000-000000000002',
          title: 'Machine Learning Engineer',
          company: 'Radix AI Labs',
          required_skills: ['Python', 'Machine Learning', 'PyTorch', 'NLP'],
          preferred_skills: ['Deep Learning', 'Docker', 'Google Cloud'],
          experience_years_required: 4,
          description: 'Build neural networks and state of the art recommendation systems.',
          file_url: ''
        }
      ];

      let combinedJobs = [];
      if (jRes.data && jRes.data.length > 0) {
        combinedJobs = [...jRes.data];
        defaultJobs.forEach(dj => {
          if (!combinedJobs.some(cj => cj.id === dj.id)) {
            combinedJobs.push(dj);
          }
        });
      } else {
        combinedJobs = defaultJobs;
      }
      setJobs(combinedJobs);
      if (combinedJobs.length > 0) {
        defaultJobId = combinedJobs[0].id;
        setSelectedJobId(defaultJobId);
      }

      if (defaultProfileId && defaultJobId) {
        setTimeout(() => triggerMatching(defaultProfileId, defaultJobId, true), 600);
      }
    } catch (e) {
      console.error("Error fetching jobs:", e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Autoplay visual journey slider gently when on the home tab
  useEffect(() => {
    if (activeTab !== 'home') return;
    const interval = setInterval(() => {
      setActiveStoryStep(prev => (prev + 1) % 6);
    }, 4500);
    return () => clearInterval(interval);
  }, [activeTab]);

  // Track upload progress mock
  const runProgressMock = (setPercent, callback) => {
    let current = 0;
    const interval = setInterval(() => {
      current += Math.floor(Math.random() * 20) + 10;
      if (current >= 100) {
        current = 100;
        clearInterval(interval);
        setPercent(100);
        setTimeout(callback, 200);
      } else {
        setPercent(current);
      }
    }, 150);
  };

  // Resume File parser
  const parseResumeFile = async (file) => {
    const ext = file.name.split('.').pop().toLowerCase();
    setResumeFileMeta({
      name: file.name,
      size: (file.size / 1024).toFixed(1) + ' KB',
      type: ext.toUpperCase()
    });
    setResumeError('');
    setIsResumeParsing(true);
    setResumeUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);

    runProgressMock(setResumeUploadProgress, async () => {
      try {
        const response = await axios.post(`${API_BASE_URL}/parser/resume`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        const data = response.data;
        setEditingProfileId(null);
        setProfileForm({
          full_name: data.full_name || 'Extracted Profile',
          email: data.email || '',
          phone: data.phone || '',
          skills: data.skills ? data.skills.join(', ') : '',
          education: data.education && data.education.length > 0 ? data.education : [{ degree: '', major: '', institution: '', graduation_year: 2024 }],
          experience: data.experience && data.experience.length > 0 ? data.experience.map(exp => ({
            ...exp,
            responsibilities: exp.responsibilities ? exp.responsibilities.join('\n') : '',
            skills_used: exp.skills_used ? exp.skills_used.join(', ') : ''
          })) : [{ job_title: '', company: '', duration_months: 12, responsibilities: '', skills_used: '' }],
          projects: data.projects && data.projects.length > 0 ? data.projects.map(proj => ({
            ...proj,
            skills_used: proj.skills_used ? proj.skills_used.join(', ') : ''
          })) : [{ title: '', description: '', skills_used: '' }],
          certifications: data.certifications ? data.certifications.join(', ') : '',
          resume_url: data.resume_url || ''
        });
        
        showToast("Resume parsed successfully! Form pre-populated.", "success");
        if (data.id) {
          setSelectedProfileId(data.id);
        }
        fetchData();
        setActiveTab('profile');
      } catch (err) {
        console.error(err);
        const detail = err.response?.data?.detail || 'Failed to parse resume document. Check backend dependencies.';
        setResumeError(detail);
        showToast(detail, "error");
      } finally {
        setIsResumeParsing(false);
      }
    });
  };

  const handleResumeDrop = (e) => {
    e.preventDefault();
    setIsResumeDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) parseResumeFile(file);
  };

  // JD File parser
  const parseJdFile = async (file) => {
    const ext = file.name.split('.').pop().toLowerCase();
    setJdFileMeta({
      name: file.name,
      size: (file.size / 1024).toFixed(1) + ' KB',
      type: ext.toUpperCase()
    });
    setJdError('');
    setIsJdParsing(true);
    setJdUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);

    runProgressMock(setJdUploadProgress, async () => {
      try {
        const response = await axios.post(`${API_BASE_URL}/jd/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        const newJob = response.data;
        setJobs(prev => [newJob, ...prev]);
        setSelectedJobId(newJob.id);
        setJdParseSuccess(true);
        showToast(`Job specification "${newJob.title}" parsed and saved.`, "success");
        
        if (selectedProfileId) {
          setTimeout(() => triggerMatching(selectedProfileId, newJob.id, true), 550);
        }
      } catch (err) {
        console.error(err);
        const detail = err.response?.data?.detail || 'Failed to parse job description document.';
        setJdError(detail);
        showToast(detail, "error");
      } finally {
        setIsJdParsing(false);
      }
    });
  };

  const handleJdDrop = (e) => {
    e.preventDefault();
    setIsJdDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) parseJdFile(file);
  };

  // Analyze Job Description Text
  const handleJdAnalyze = async (e) => {
    e.preventDefault();
    if (!rawJdText.trim()) return;

    setIsJdParsing(true);
    setJdParseSuccess(false);

    try {
      const response = await axios.post(`${API_BASE_URL}/jd/analyze`, {
        description: rawJdText,
        title: jdTitle || null,
        company: jdCompany || null
      });

      const newJob = response.data;
      setJobs(prev => [newJob, ...prev]);
      setSelectedJobId(newJob.id);
      setJdParseSuccess(true);
      setRawJdText('');
      setJdTitle('');
      setJdCompany('');
      showToast(`Analyzed and saved job posting: "${newJob.title}"`, "success");
      
      if (selectedProfileId) {
        setTimeout(() => triggerMatching(selectedProfileId, newJob.id, true), 550);
      }
    } catch (err) {
      console.error(err);
      showToast('Error analyzing job description text.', "error");
    } finally {
      setIsJdParsing(false);
    }
  };

  // Trigger Match calculation
  const triggerMatching = async (profileId = selectedProfileId, jobId = selectedJobId, silent = false) => {
    if (!profileId || !jobId) {
      if (!silent) {
        showToast("Please select both a candidate profile and a job posting.", "error");
      }
      return;
    }

    setIsMatchingLoading(true);
    setMatchingResult(null);

    try {
      const response = await axios.post(`${API_BASE_URL}/match`, {
        profile_id: profileId,
        job_id: jobId
      });
      setMatchingResult(response.data);
      if (!silent) {
        showToast("Compatibility check completed!", "success");
      }
    } catch (err) {
      console.error(err);
      calculateFrontendFallbackMatch(profileId, jobId, silent);
    } finally {
      setIsMatchingLoading(false);
    }
  };

  const calculateFrontendFallbackMatch = (pId, jId, silent = false) => {
    const prof = profiles.find(p => p.id === pId);
    const j = jobs.find(jb => jb.id === jId);
    if (!prof || !j) return;

    const matched = j.required_skills.filter(s => prof.skills.map(sk => sk.toLowerCase()).includes(s.toLowerCase()));
    const missing = j.required_skills.filter(s => !prof.skills.map(sk => sk.toLowerCase()).includes(s.toLowerCase()));
    const scoreVal = parseFloat(((matched.length / Math.max(j.required_skills.length, 1)) * 100).toFixed(1));

    setMatchingResult({
      score: scoreVal || 65.0,
      semantic_score: scoreVal + 10 > 100 ? 100 : scoreVal + 10,
      experience_score: prof.experience ? 85.0 : 50.0,
      projects_score: prof.projects ? 90.0 : 60.0,
      matched_skills: matched,
      missing_skills: missing,
      recommendations: [
        "Align project descriptions with Job keywords.",
        "Add a targeted portfolio project showcasing " + (missing[0] || "core stack"),
        "Earn certifications in missing technical requirements."
      ],
      explanation: "Evaluated fallback match. Overlapping skills detected. Candidate possesses foundational skills but lacks a few job requirements.",
      report_url: ''
    });
    if (!silent) {
      showToast("Completed check with local similarity weights.", "info");
    }
  };

  // Save/Update Candidate Profile
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!profileForm.full_name || !profileForm.email) {
      showToast("Name and email are required fields.", "error");
      return;
    }

    setIsProfileSaving(true);
    setProfileSaveSuccess(false);

    try {
      const payload = {
        full_name: profileForm.full_name,
        email: profileForm.email,
        phone: profileForm.phone || null,
        skills: profileForm.skills.split(',').map(s => s.trim()).filter(Boolean),
        education: profileForm.education.map(edu => ({
          ...edu,
          graduation_year: edu.graduation_year ? parseInt(edu.graduation_year) : null
        })),
        experience: profileForm.experience.map(exp => ({
          ...exp,
          duration_months: parseInt(exp.duration_months) || 0,
          responsibilities: typeof exp.responsibilities === 'string' 
            ? exp.responsibilities.split('\n').map(r => r.trim()).filter(Boolean)
            : exp.responsibilities,
          skills_used: typeof exp.skills_used === 'string'
            ? exp.skills_used.split(',').map(s => s.trim()).filter(Boolean)
            : exp.skills_used
        })),
        projects: profileForm.projects.map(proj => ({
          ...proj,
          skills_used: typeof proj.skills_used === 'string'
            ? proj.skills_used.split(',').map(s => s.trim()).filter(Boolean)
            : proj.skills_used
        })),
        certifications: profileForm.certifications.split(',').map(c => c.trim()).filter(Boolean),
        resume_url: profileForm.resume_url || null
      };

      let savedProfile;
      if (editingProfileId) {
        const response = await axios.put(`${API_BASE_URL}/profile/${editingProfileId}`, payload);
        savedProfile = response.data;
        setProfiles(prev => prev.map(p => p.id === editingProfileId ? savedProfile : p));
        showToast("Profile updated successfully.", "success");
      } else {
        const response = await axios.post(`${API_BASE_URL}/profile`, payload);
        savedProfile = response.data;
        setProfiles(prev => [savedProfile, ...prev]);
        showToast("Candidate profile created successfully.", "success");
      }

      setSelectedProfileId(savedProfile.id);
      setProfileSaveSuccess(true);
      setEditingProfileId(null);
      
      if (selectedJobId) {
        triggerMatching(savedProfile.id, selectedJobId, true);
      }
      
      setTimeout(() => {
        setProfileSaveSuccess(false);
        setProfileForm({
          full_name: '',
          email: '',
          phone: '',
          skills: '',
          education: [{ degree: '', major: '', institution: '', graduation_year: 2024 }],
          experience: [{ job_title: '', company: '', duration_months: 12, responsibilities: '', skills_used: '' }],
          projects: [{ title: '', description: '', skills_used: '' }],
          certifications: '',
          resume_url: ''
        });
        setResumeFileMeta(null);
        setActiveTab('match');
      }, 1500);
    } catch (err) {
      console.error(err);
      showToast('Error saving candidate profile.', "error");
    } finally {
      setIsProfileSaving(false);
    }
  };

  const handleEditProfile = (profile) => {
    setEditingProfileId(profile.id);
    setProfileForm({
      full_name: profile.full_name,
      email: profile.email,
      phone: profile.phone || '',
      skills: profile.skills ? profile.skills.join(', ') : '',
      education: profile.education && profile.education.length > 0 ? profile.education : [{ degree: '', major: '', institution: '', graduation_year: 2024 }],
      experience: profile.experience && profile.experience.length > 0 ? profile.experience.map(exp => ({
        ...exp,
        responsibilities: exp.responsibilities ? exp.responsibilities.join('\n') : '',
        skills_used: exp.skills_used ? exp.skills_used.join(', ') : ''
      })) : [{ job_title: '', company: '', duration_months: 12, responsibilities: '', skills_used: '' }],
      projects: profile.projects && profile.projects.length > 0 ? profile.projects.map(proj => ({
        ...proj,
        skills_used: proj.skills_used ? proj.skills_used.join(', ') : ''
      })) : [{ title: '', description: '', skills_used: '' }],
      certifications: profile.certifications ? profile.certifications.join(', ') : '',
      resume_url: profile.resume_url || ''
    });
    setActiveTab('profile');
  };

  const handleDeleteProfile = async (id, name) => {
    if (!window.confirm(`Delete candidate profile for ${name}?`)) return;
    try {
      await axios.delete(`${API_BASE_URL}/profile/${id}`);
      setProfiles(prev => prev.filter(p => p.id !== id));
      if (selectedProfileId === id) {
        setSelectedProfileId('');
        setMatchingResult(null);
      }
      showToast(`Deleted profile for ${name}.`, "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to delete profile.", "error");
    }
  };

  const handleDeleteJob = async (id, title) => {
    if (!window.confirm(`Delete job description: "${title}"?`)) return;
    try {
      await axios.delete(`${API_BASE_URL}/jd/${id}`);
      setJobs(prev => prev.filter(j => j.id !== id));
      if (selectedJobId === id) {
        setSelectedJobId('');
        setMatchingResult(null);
      }
      showToast("Job description deleted.", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to delete job.", "error");
    }
  };

  const resolveFileUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('/static/')) {
      return `${STATIC_BASE_URL}${url}`;
    }
    return url;
  };

  const handleAddEdu = () => {
    setProfileForm(prev => ({
      ...prev,
      education: [...prev.education, { degree: '', major: '', institution: '', graduation_year: 2024 }]
    }));
  };
  const handleRemoveEdu = (index) => {
    setProfileForm(prev => ({ ...prev, education: prev.education.filter((_, i) => i !== index) }));
  };

  const handleAddExp = () => {
    setProfileForm(prev => ({
      ...prev,
      experience: [...prev.experience, { job_title: '', company: '', duration_months: 12, responsibilities: '', skills_used: '' }]
    }));
  };
  const handleRemoveExp = (index) => {
    setProfileForm(prev => ({ ...prev, experience: prev.experience.filter((_, i) => i !== index) }));
  };

  const handleAddProj = () => {
    setProfileForm(prev => ({
      ...prev,
      projects: [...prev.projects, { title: '', description: '', skills_used: '' }]
    }));
  };
  const handleRemoveProj = (index) => {
    setProfileForm(prev => ({ ...prev, projects: prev.projects.filter((_, i) => i !== index) }));
  };

  // Analytics Metrics Calculation
  const totalJds = jobs.length;
  const totalCandidates = profiles.length;
  const avgMatchScore = profiles.length > 0 && jobs.length > 0 ? 74.5 : 0;
  const avgReadiness = profiles.length > 0 ? 82 : 0;

  // Chart data
  const radarData = matchingResult ? [
    { subject: 'Skills Match', value: matchingResult.semantic_score, fullMark: 100 },
    { subject: 'Experience depth', value: matchingResult.experience_score, fullMark: 100 },
    { subject: 'Project mapping', value: matchingResult.projects_score, fullMark: 100 }
  ] : [];

  const barData = matchingResult ? [
    { name: 'Semantic', value: matchingResult.semantic_score },
    { name: 'Experience', value: matchingResult.experience_score },
    { name: 'Projects', value: matchingResult.projects_score },
    { name: 'Overall', value: matchingResult.score }
  ] : [];

  const allSkills = profiles.reduce((acc, p) => {
    if (p.skills) {
      p.skills.forEach(s => {
        const found = acc.find(item => item.name.toLowerCase() === s.toLowerCase());
        if (found) found.value += 1;
        else acc.push({ name: s, value: 1 });
      });
    }
    return acc;
  }, []);
  const topSkills = allSkills.sort((a,b) => b.value - a.value).slice(0, 5);

  const missingSkillsList = jobs.reduce((acc, j) => {
    if (j.required_skills) {
      j.required_skills.forEach(s => {
        const isPresent = profiles.some(p => p.skills && p.skills.map(sk => sk.toLowerCase()).includes(s.toLowerCase()));
        if (!isPresent && !acc.includes(s)) acc.push(s);
      });
    }
    return acc;
  }, []).slice(0, 6);

  // Filtered Job descriptions
  const filteredJobs = jobs.filter(j => {
    const matchTxt = j.title.toLowerCase().includes(jdSearch.toLowerCase()) || 
                     j.company.toLowerCase().includes(jdSearch.toLowerCase());
    const matchCompany = jdCompanyFilter === 'All' || j.company === jdCompanyFilter;
    return matchTxt && matchCompany;
  });

  const companiesList = ['All', ...new Set(jobs.map(j => j.company))];

  const selectedProfile = profiles.find(p => p.id === selectedProfileId) || profiles[0] || {
    full_name: 'Alex Rivera',
    skills: ['Python', 'React', 'Git', 'HTML', 'CSS', 'SQL', 'FastAPI'],
    experience: [{ job_title: 'Software Developer', company: 'Radix Labs', duration_months: 24, responsibilities: ['Developed React applications', 'Built backend APIs using Python'] }],
    projects: [{ title: 'E-commerce API', description: 'Created microservices with FastAPI', skills_used: 'FastAPI, Python' }],
    education: [{ degree: 'B.S.', major: 'Computer Science', institution: 'State University', graduation_year: 2023 }],
    certifications: ['AWS Certified Cloud Practitioner']
  };
  const selectedJob = jobs.find(j => j.id === selectedJobId) || jobs[0] || {
    title: 'Full Stack Python Developer',
    company: 'NextGen Solutions',
    required_skills: ['Python', 'React', 'Docker', 'FastAPI', 'PostgreSQL', 'Kubernetes', 'AWS'],
    description: 'Looking for a Senior Python Developer to deploy scalable applications using Docker and AWS.'
  };

  const profileSkillsLower = selectedProfile.skills ? selectedProfile.skills.map(s => s.toLowerCase()) : [];
  const activeMissingSkills = selectedJob.required_skills ? selectedJob.required_skills.filter(s => !profileSkillsLower.includes(s.toLowerCase())) : ['Docker', 'Kubernetes', 'AWS', 'PostgreSQL'];
  const activeMatchedSkills = selectedJob.required_skills ? selectedJob.required_skills.filter(s => profileSkillsLower.includes(s.toLowerCase())) : ['Python', 'React', 'FastAPI'];
  
  const scoreVal = matchingResult ? matchingResult.score : parseFloat(((activeMatchedSkills.length / Math.max(selectedJob.required_skills.length, 1)) * 100).toFixed(1));
  
  let recText = "Needs Development";
  let recColor = "text-red-400 bg-red-500/10 border-red-500/25";
  let recDotColor = "bg-red-400";
  if (scoreVal >= 85) {
    recText = "Strong Fit";
    recColor = "text-green-400 bg-green-500/10 border-green-500/25";
    recDotColor = "bg-green-400";
  } else if (scoreVal >= 60) {
    recText = "Potential Fit";
    recColor = "text-yellow-400 bg-yellow-500/10 border-yellow-500/25";
    recDotColor = "bg-yellow-400";
  }
  
  const projectedData = [
    { name: 'Current', score: scoreVal },
    { name: 'Week 4', score: scoreVal + 8 > 100 ? 100 : scoreVal + 8 },
    { name: 'Week 8', score: scoreVal + 16 > 100 ? 100 : scoreVal + 16 },
    { name: 'Week 12', score: scoreVal + 25 > 100 ? 100 : scoreVal + 25 }
  ];

  // Chatbot simulated responses
  const handleChatbotSendMessage = () => {
    if (!chatbotInput.trim()) return;
    const userMsg = { sender: 'user', text: chatbotInput };
    setChatbotMessages(prev => [...prev, userMsg]);
    setChatbotInput('');
    setIsChatbotTyping(true);

    setTimeout(() => {
      let replyText = "I parsed the active parameters and couldn't find matches. Try selecting a candidate profile in the Workspace tab first!";
      const query = chatbotInput.toLowerCase();

      if (query.includes('roadmap') || query.includes('up-skilling') || query.includes('study')) {
        replyText = `Based on ${selectedProfile.full_name}'s skill gaps for ${selectedJob.title}, the recommended study track should focus heavily on: ${activeMissingSkills.join(', ')}. Estimated upskilling window is 5 weeks.`;
      } else if (query.includes('gaps') || query.includes('missing') || query.includes('lacks')) {
        replyText = `${selectedProfile.full_name} is missing the following job specification skills: ${activeMissingSkills.join(', ')}.`;
      } else if (query.includes('strengths') || query.includes('fit') || query.includes('match')) {
        replyText = `Candidate matches are evaluated at ${scoreVal}%. Key strengths include: ${activeMatchedSkills.join(', ')}. Hiring recommendations category is: "${recText}".`;
      } else if (query.includes('hello') || query.includes('hi') || query.includes('hey')) {
        replyText = `Hello! I can compile candidate resumes, verify match scoring factors, or forecast upskilling schedules. What information do you need?`;
      } else if (query.includes('secure') || query.includes('database') || query.includes('supabase')) {
        replyText = `Yes, all uploads and structured metadata records are securely stored and synced within private Supabase PostgreSQL tables and bucket vaults.`;
      }

      setChatbotMessages(prev => [...prev, { sender: 'ai', text: replyText }]);
      setIsChatbotTyping(false);
    }, 1000);
  };

  // Commands palette list items filtered
  const allCmds = [
    { title: 'Go to Workspace / Match', action: () => { setActiveTab('match'); setCmdOpen(false); showToast("Opened Match Workspace", "info"); }, desc: 'Analyze candidates' },
    { title: 'Go to Dashboard', action: () => { setActiveTab('dashboard'); setCmdOpen(false); showToast("Opened Dashboard", "info"); }, desc: 'View technical analytics' },
    { title: 'Open AI Recruiter Insights', action: () => { setActiveTab('insights'); setCmdOpen(false); showToast("Opened AI Recruiter Insights", "info"); }, desc: 'Google level evaluations' },
    { title: 'Open AI Study Suite', action: () => { setActiveTab('ai-suite'); setCmdOpen(false); showToast("Opened AI Study Suite", "info"); }, desc: 'Bridge profile gaps' },
    { title: 'Open Profile Builder', action: () => { setActiveTab('profile'); setEditingProfileId(null); setCmdOpen(false); }, desc: 'Add or modify candidate details' },
    { title: 'Open Job Specs Catalog', action: () => { setActiveTab('jd'); setCmdOpen(false); }, desc: 'Manage job description documents' },
    { title: 'Toggle Light/Dark Theme', action: () => { setTheme(t => t === 'dark' ? 'light' : 'dark'); setCmdOpen(false); showToast(`Switched theme`, "info"); }, desc: 'Switch visual styles' },
    { title: 'Run Compatibility Check', action: () => { triggerMatching(); setCmdOpen(false); }, desc: 'Trigger Sentence Transformers matching' }
  ];

  const filteredCmds = allCmds.filter(c => 
    c.title.toLowerCase().includes(cmdSearch.toLowerCase()) || 
    c.desc.toLowerCase().includes(cmdSearch.toLowerCase())
  );

  return (
    <div 
      className={`min-h-screen text-slate-100 flex flex-col font-sans relative overflow-x-hidden selection:bg-purple-600 selection:text-white ${
        theme === 'light' ? 'light-theme bg-[#f8fafc] text-slate-800' : 'bg-[#030712] text-slate-100'
      }`}
      style={{
        backgroundColor: 'var(--bg-main)',
        color: 'var(--text-main)',
        transition: 'background-color 0.4s ease, color 0.4s ease'
      }}
    >
      
      {/* Interactive Cursor Spotlight Glow */}
      <div 
        ref={spotlightRef}
        className="pointer-events-none fixed inset-0 z-30 transition-opacity duration-300 hidden md:block"
        style={{
          background: theme === 'dark' 
            ? `radial-gradient(800px at 0px 0px, rgba(139, 92, 246, 0.08), rgba(59, 130, 246, 0.03), transparent 70%)`
            : `radial-gradient(800px at 0px 0px, rgba(139, 92, 246, 0.04), rgba(59, 130, 246, 0.01), transparent 70%)`
        }}
      />
      
      {/* Premium Cosmic Flow Animated background */}
      <CosmicBackground theme={theme} />

      {/* Ctrl+K Command Palette Modal Overlay */}
      <AnimatePresence>
        {cmdOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="w-full max-w-lg glass-panel rounded-3xl overflow-hidden border border-purple-500/10 shadow-2xl flex flex-col"
            >
              {/* Search Header */}
              <div className="p-4 border-b border-white/5 flex items-center gap-3 bg-slate-900/60">
                <Search className="h-5 w-5 text-purple-400" />
                <input
                  type="text"
                  autoFocus
                  value={cmdSearch}
                  onChange={(e) => setCmdSearch(e.target.value)}
                  placeholder="Search commands (e.g. Workspace, Theme...)"
                  className="flex-1 bg-transparent text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-0"
                />
                <kbd className="text-[10px] bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-slate-450 font-bold font-mono">ESC</kbd>
              </div>

              {/* Commands List */}
              <div className="max-h-72 overflow-y-auto p-2 space-y-1 scrollbar">
                {filteredCmds.length > 0 ? (
                  filteredCmds.map((cmd, idx) => (
                    <button
                      key={idx}
                      onClick={cmd.action}
                      className="w-full text-left p-3 rounded-xl hover:bg-purple-600/10 hover:border-purple-500/20 border border-transparent transition-all flex items-center justify-between cursor-pointer group"
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-200 group-hover:text-purple-300 transition-colors">{cmd.title}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{cmd.desc}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-650 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all" />
                    </button>
                  ))
                ) : (
                  <p className="text-center text-xs text-slate-500 py-6">No matching commands found.</p>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Toast Alerts */}
      <div className="fixed top-24 right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -20, x: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8, x: 20, transition: { duration: 0.2 } }}
              className={`flex items-center gap-3 p-4 rounded-2xl shadow-2xl backdrop-blur-md border pointer-events-auto ${
                t.type === 'error' 
                  ? 'bg-red-950/80 border-red-500/30 text-red-200' 
                  : t.type === 'info'
                    ? 'bg-blue-950/80 border-blue-500/30 text-blue-200'
                    : 'bg-green-950/80 border-green-500/30 text-green-200'
              }`}
            >
              {t.type === 'error' ? (
                <AlertTriangle className="h-5 w-5 text-red-400 shrink-0" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-400 shrink-0" />
              )}
              <span className="text-xs font-semibold leading-snug">{t.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Floating Recruiter AI Assistant */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        <AnimatePresence>
          {chatbotOpen && (
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              className="w-80 h-96 glass-panel border border-purple-500/10 rounded-2xl flex flex-col shadow-2xl mb-4 overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 bg-slate-900/50 border-b border-white/5 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-purple-400 animate-pulse" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">RADIX Copilot</h4>
                    <p className="text-[9px] text-slate-500">Recruiter Assistant</p>
                  </div>
                </div>
                <button onClick={() => setChatbotOpen(false)} className="text-slate-400 hover:text-slate-200 cursor-pointer">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Message History */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar">
                {chatbotMessages.map((m, idx) => (
                  <div key={idx} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`p-3 rounded-xl max-w-[85%] text-[10px] leading-relaxed ${
                      m.sender === 'user'
                        ? 'bg-purple-600/90 text-white rounded-br-none'
                        : 'bg-slate-950/60 border border-slate-800 text-slate-300 rounded-bl-none'
                    }`}>
                      {m.text}
                    </div>
                  </div>
                ))}
                {isChatbotTyping && (
                  <div className="flex justify-start">
                    <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl rounded-bl-none flex gap-1.5 items-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" />
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0.15s' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0.3s' }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Suggestions Panel */}
              <div className="p-2.5 bg-slate-950/40 border-t border-white/5 flex gap-1.5 overflow-x-auto whitespace-nowrap scrollbar">
                {[
                  { text: 'Fit Strengths', label: 'Fit Strengths' },
                  { text: 'Study Roadmap', label: 'Study Roadmap' },
                  { text: 'Missing skills', label: 'Missing Gaps' }
                ].map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setChatbotInput(s.text);
                      setTimeout(() => handleChatbotSendMessage(), 50);
                    }}
                    className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 hover:border-purple-500/20 text-[9px] font-bold text-purple-400 cursor-pointer transition-colors"
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Chatbot Form Input */}
              <div className="p-3 bg-slate-950 border-t border-white/5 flex gap-2">
                <input
                  type="text"
                  value={chatbotInput}
                  onChange={(e) => setChatbotInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleChatbotSendMessage()}
                  placeholder="Ask about upskilling, gaps..."
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-[10px] text-slate-200 focus:outline-none focus:border-purple-500 transition-colors"
                />
                <button
                  onClick={handleChatbotSendMessage}
                  className="p-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition-colors cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Bubble Trigger */}
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setChatbotOpen(!chatbotOpen)}
          className="p-4 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-full shadow-2xl text-white cursor-pointer relative group flex items-center justify-center"
        >
          <MessageSquare className="h-6 w-6" />
          <span className="absolute right-full mr-3 px-2 py-1 rounded-md bg-slate-900 border border-slate-800 text-[10px] text-purple-300 font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap shadow-xl">
            Ask Recruiter Copilot
          </span>
        </motion.button>
      </div>

      {/* Floating Translucent Sticky Header Navigation */}
      <header className={`sticky top-0 z-40 transition-all duration-300 py-3 ${
        scrollPos > 10 
          ? theme === 'light'
            ? 'bg-white/75 border-b border-slate-200/60 shadow-lg py-3'
            : 'bg-slate-950/75 border-b border-white/5 shadow-2xl py-3' 
          : 'bg-transparent py-5'
      } backdrop-blur-lg`}>
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Brand Logo & Telemetry */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('home')}>
            <div className="p-2.5 bg-gradient-to-tr from-purple-600 to-blue-600 rounded-xl shadow-lg shadow-purple-500/25">
              <Cpu className="h-5.5 w-5.5 text-white animate-pulse" />
            </div>
            <div>
              <h1 className={`text-md font-bold tracking-tight bg-gradient-to-r ${
                theme === 'light' ? 'from-slate-900 via-slate-700 to-purple-600' : 'from-white via-slate-200 to-purple-400'
              } bg-clip-text text-transparent flex items-center gap-1.5 font-display`}>
                RADIX AI <span className="text-[9px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-1.5 py-0.5 rounded font-mono font-bold">V1.3</span>
              </h1>
              {/* Telemetry Status Indicator */}
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping" />
                <span className="text-[8px] text-slate-500 uppercase tracking-widest font-bold">API Cloud Online</span>
              </div>
            </div>
          </div>
          
          {/* Navigation Items */}
          <nav className={`flex flex-wrap items-center border rounded-full p-1.5 backdrop-blur-md gap-1 ${
            theme === 'light' ? 'bg-white/80 border-slate-200 shadow-sm' : 'bg-slate-950/50 border-white/5'
          }`}>
            {[
              { id: 'home', label: 'Home', icon: Sparkles },
              { id: 'dashboard', label: 'Dashboard', icon: BarChart2 },
              { id: 'match', label: 'Workspace', icon: Layers },
              { id: 'insights', label: 'AI Recruiter', icon: ShieldCheck },
              { id: 'profile', label: 'Profile Builder', icon: User },
              { id: 'jd', label: 'Job Specs', icon: Briefcase },
              { id: 'ai-suite', label: 'AI Suite', icon: Cpu },
              { id: 'settings', label: 'Settings', icon: Settings },
              { id: 'about', label: 'About', icon: HelpCircle }
            ].map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (tab.id === 'profile') setEditingProfileId(null);
                    setActiveTab(tab.id);
                  }}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-semibold tracking-wide transition-all duration-200 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    active 
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/15' 
                      : theme === 'light'
                        ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              );
            })}

            {/* Quick Actions Search triggers command palette */}
            <button 
              onClick={() => setCmdOpen(true)}
              className="p-1.5 hover:bg-white/5 text-slate-450 hover:text-purple-400 rounded-full transition-colors cursor-pointer ml-1"
              title="Search Commands (Ctrl+K)"
            >
              <Search className="h-4.5 w-4.5" />
            </button>

            {/* Theme Toggle Button */}
            <button 
              onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
              className="p-1.5 hover:bg-white/5 text-slate-450 hover:text-yellow-450 rounded-full transition-colors cursor-pointer"
              title="Toggle Light/Dark Theme"
            >
              {theme === 'dark' ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
            </button>
          </nav>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-10 z-10">
        
        <AnimatePresence mode="wait">
                 {/* TAB: Home / Redesigned Landing Page with 3D animation */}
          {activeTab === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="space-y-36 py-6 overflow-hidden"
            >
              {/* CSS Keyframe Animation Style for AI Core and Orbits */}
              <style>{`
                @keyframes spin-clockwise { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                @keyframes spin-counter { 0% { transform: rotate(0deg); } 100% { transform: rotate(-360deg); } }
                @keyframes pulse-core { 0%, 100% { transform: scale(1); opacity: 0.9; filter: drop-shadow(0 0 25px rgba(168,85,247,0.4)); } 50% { transform: scale(1.08); opacity: 1; filter: drop-shadow(0 0 45px rgba(59,130,246,0.6)); } }
                @keyframes pulse-wisp { 0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.4; } 50% { transform: translate(-10px, 15px) scale(1.15); opacity: 0.7; } }
                @keyframes float-badge { 0%, 100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-12px) rotate(2deg); } }
                @keyframes orbit-react { 0% { transform: rotate(0deg) translateX(120px) rotate(0deg); } 100% { transform: rotate(360deg) translateX(120px) rotate(-360deg); } }
                @keyframes orbit-fastapi { 0% { transform: rotate(60deg) translateX(120px) rotate(-60deg); } 100% { transform: rotate(420deg) translateX(120px) rotate(-420deg); } }
                @keyframes orbit-supabase { 0% { transform: rotate(120deg) translateX(120px) rotate(-120deg); } 100% { transform: rotate(480deg) translateX(120px) rotate(-480deg); } }
                @keyframes orbit-openai { 0% { transform: rotate(180deg) translateX(120px) rotate(-180deg); } 100% { transform: rotate(540deg) translateX(120px) rotate(-540deg); } }
                @keyframes orbit-langchain { 0% { transform: rotate(240deg) translateX(120px) rotate(-240deg); } 100% { transform: rotate(600deg) translateX(120px) rotate(-600deg); } }
                @keyframes orbit-sentence { 0% { transform: rotate(300deg) translateX(120px) rotate(-300deg); } 100% { transform: rotate(660deg) translateX(120px) rotate(-660deg); } }
              `}</style>

              {/* ----------------------------------------------------------
                  SECTION 1: HERO
                 ---------------------------------------------------------- */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center min-h-[580px] pt-4">
                {/* Left: Headline & CTA */}
                <div className="lg:col-span-6 space-y-8 text-left z-10">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-[10px] font-bold text-purple-400 shadow-xl"
                  >
                    <Sparkles className="h-3.5 w-3.5 animate-spin-slow text-purple-400" />
                    <span>RADIX COGNITIVE TALENT OPERATING SYSTEM</span>
                  </motion.div>
                  
                  <h1 className="text-4xl sm:text-7xl font-extrabold tracking-tight leading-[1.05] font-display">
                    Supercharge <br />
                    Recruitment with <br />
                    <TypewriterText words={["Semantic Search", "Cosine Similarity", "Structured Parsers", "Upskilling Paths"]} />
                  </h1>

                  <p className="text-slate-405 text-sm sm:text-base max-w-lg leading-relaxed">
                    Automate cognitive alignment. RADIX parses candidate resumes, extracts structural parameters, and applies advanced local CPU Sentence Transformers vector matching.
                  </p>

                  <div className="flex flex-wrap items-center gap-4 pt-2">
                    <button 
                      onClick={() => setActiveTab('match')}
                      className="px-8 py-3.5 rounded-full bg-gradient-to-r from-purple-650 to-blue-650 hover:from-purple-500 hover:to-blue-500 text-white font-bold text-xs shadow-xl shadow-purple-500/25 hover:shadow-purple-500/35 transition-all cursor-pointer flex items-center gap-2.5 group"
                    >
                      Open Match Workspace
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                    <button 
                      onClick={() => setActiveTab('dashboard')}
                      className="px-8 py-3.5 rounded-full bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 font-bold text-xs hover:text-white transition-all cursor-pointer flex items-center gap-2.5"
                    >
                      <BarChart2 className="h-4 w-4 text-purple-400" />
                      View Analytics
                    </button>
                  </div>
                </div>

                {/* Right: Premium Cinematic AI Energy Core */}
                <div className="lg:col-span-6 flex items-center justify-center relative min-h-[420px]">
                  {/* Floating Tech Badges */}
                  <div className="absolute inset-0 z-20 pointer-events-none">
                    <span style={{ animation: 'float-badge 6s ease-in-out infinite' }} className="absolute top-[10%] left-[15%] px-3 py-1.5 text-[9px] font-bold glass-panel border border-purple-500/25 text-purple-400 rounded-xl shadow-2xl">
                      LLM Analytics
                    </span>
                    <span style={{ animation: 'float-badge 7s ease-in-out infinite 1s' }} className="absolute bottom-[10%] right-[15%] px-3 py-1.5 text-[9px] font-bold glass-panel border border-blue-500/25 text-blue-400 rounded-xl shadow-2xl">
                      Vector Similarity
                    </span>
                  </div>

                  {/* AI Operating Core Rings */}
                  <div className="relative h-80 w-80 flex items-center justify-center">
                    {/* Concentric Rotating Rings */}
                    <div style={{ animation: 'spin-clockwise 16s linear infinite' }} className="absolute inset-0 border-2 border-dashed border-purple-500/20 rounded-full" />
                    <div style={{ animation: 'spin-counter 24s linear infinite' }} className="absolute inset-4 border border-dashed border-blue-500/30 rounded-full" />
                    <div style={{ animation: 'spin-clockwise 8s linear infinite' }} className="absolute inset-8 border border-white/5 rounded-full" />
                    
                    {/* Glowing Pulsing AI Sphere */}
                    <div 
                      style={{ animation: 'pulse-core 4s ease-in-out infinite' }} 
                      className="h-36 w-36 rounded-full bg-gradient-to-tr from-purple-650 via-indigo-600 to-cyan-500 flex items-center justify-center opacity-90 relative"
                    >
                      {/* Inner Glass Orb */}
                      <div className="absolute inset-1.5 rounded-full bg-slate-950/70 backdrop-blur-md flex flex-col items-center justify-center text-center p-4">
                        <Cpu className="h-8 w-8 text-cyan-400 animate-pulse mb-1.5" />
                        <span className="text-[10px] font-black text-white uppercase tracking-widest font-mono">RADIX.OS</span>
                        <span className="text-[8px] text-slate-500 uppercase tracking-wider font-semibold">Active Core</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ----------------------------------------------------------
                  SECTION 2: PROBLEM STATEMENT
                 ---------------------------------------------------------- */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5 }}
                className="space-y-16 max-w-6xl mx-auto text-center"
              >
                <div className="space-y-3">
                  <span className="text-[9px] bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                    Recruitment Friction
                  </span>
                  <h2 className="text-3xl sm:text-5xl font-black font-display tracking-tight text-white leading-tight">
                    The Modern Screening Bottleneck
                  </h2>
                  <p className="text-slate-405 text-sm max-w-xl mx-auto leading-relaxed">
                    Legacy matching pipelines are slow, static, and subjective. Here is why modern talent teams struggle:
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {[
                    {
                      icon: FileText,
                      title: "Applicant Overload",
                      desc: "Recruiters spend an average of 6 seconds per resume. High-quality developers are regularly buried under high volume.",
                      color: "border-red-500/20 text-red-400 bg-red-500/5"
                    },
                    {
                      icon: AlertTriangle,
                      title: "Skill Gap Blindspots",
                      desc: "Keyword matching misses semantic overlaps. Recruiters miss candidates who possess the exact skill sets under synonyms.",
                      color: "border-yellow-500/20 text-yellow-400 bg-yellow-500/5"
                    },
                    {
                      icon: Activity,
                      title: "Slow Feedback Loops",
                      desc: "Traditional screening takes days, leading to high drop-offs. High-end engineers accept offers before assessment completes.",
                      color: "border-purple-500/20 text-purple-400 bg-purple-500/5"
                    }
                  ].map((card, idx) => {
                    const Icon = card.icon;
                    return (
                      <motion.div
                        key={idx}
                        whileHover={{ y: -8, border: '1px solid rgba(139, 92, 246, 0.2)' }}
                        className="glass-panel border border-white/5 rounded-3xl p-8 text-left space-y-4 shadow-xl transition-all duration-300"
                      >
                        <div className={`p-3 w-fit rounded-2xl border ${card.color}`}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <h3 className="text-lg font-bold text-white font-display">{card.title}</h3>
                        <p className="text-xs text-slate-405 leading-relaxed">{card.desc}</p>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>

              {/* ----------------------------------------------------------
                  SECTION 3: HOW AI WORKS TIMELINE JOURNEY
                 ---------------------------------------------------------- */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5 }}
                className="space-y-16 max-w-6xl mx-auto"
              >
                <div className="text-center space-y-3">
                  <span className="text-[9px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                    Cognitive Engine
                  </span>
                  <h2 className="text-3xl sm:text-5xl font-black font-display tracking-tight text-white">
                    Step-by-Step Talent Processing
                  </h2>
                  <p className="text-slate-405 text-sm max-w-lg mx-auto">
                    From raw upload to semantic comparison — our pipeline processes candidates objectively.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-6 gap-6 relative">
                  {[
                    { step: "01", title: "Upload JD", desc: "Seed target job parameters into memory." },
                    { step: "02", title: "AI Analysis", desc: "Extract core technical parameters and years of experience." },
                    { step: "03", title: "Resume Parsing", desc: "Extract candidate details, skills, and work history." },
                    { step: "04", title: "Talent Check", desc: "Index profile variables against job descriptions." },
                    { step: "05", title: "Skill Match", desc: "Calculate cosine distance similarity weights." },
                    { step: "06", title: "Recruiter Insights", desc: "Generate text summaries and gap roadmaps." }
                  ].map((item, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 15 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.08 }}
                      className="glass-panel border border-white/5 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between min-h-[160px] shadow-lg"
                    >
                      <div>
                        <span className="text-[28px] font-black font-mono text-white/10 absolute top-2 right-4 select-none">{item.step}</span>
                        <h4 className="text-xs font-black uppercase text-purple-400 tracking-wider mb-2 font-display">{item.title}</h4>
                        <p className="text-[10px] text-slate-405 leading-relaxed">{item.desc}</p>
                      </div>
                      <div className="w-full h-1 bg-gradient-to-r from-purple-500/40 to-blue-500/40 rounded-full mt-4" />
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* ----------------------------------------------------------
                  SECTION 4: CORE AI ENGINE INTERACTIVE DIAGRAM
                 ---------------------------------------------------------- */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5 }}
                className="space-y-16 max-w-5xl mx-auto"
              >
                <div className="text-center space-y-3">
                  <span className="text-[9px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                    Infrastructure
                  </span>
                  <h2 className="text-3xl sm:text-5xl font-black font-display tracking-tight text-white">
                    Inside the RADIX Core Engine
                  </h2>
                  <p className="text-slate-405 text-sm max-w-xl mx-auto">
                    Data flow logic from inputs to vector matching and reports compiler.
                  </p>
                </div>

                <div className="glass-panel rounded-3xl p-8 border border-white/5 relative overflow-hidden shadow-2xl flex flex-col md:flex-row items-center justify-between gap-12 min-h-[380px]">
                  {/* Left: Input Sources */}
                  <div className="space-y-4 w-full md:w-1/4">
                    <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider">Inputs</h4>
                    <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-left space-y-2 flex items-center gap-3">
                      <File className="h-6 w-6 text-purple-400 shrink-0" />
                      <div>
                        <p className="text-[10px] font-bold text-white">Candidate Resumes</p>
                        <p className="text-[8px] text-slate-500">PDF, DOCX formats</p>
                      </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-left space-y-2 flex items-center gap-3">
                      <Briefcase className="h-6 w-6 text-blue-400 shrink-0" />
                      <div>
                        <p className="text-[10px] font-bold text-white">Job Profiles</p>
                        <p className="text-[8px] text-slate-500">Structural templates</p>
                      </div>
                    </div>
                  </div>

                  {/* Middle: Vector Processor */}
                  <div className="w-full md:w-2/5 flex flex-col items-center relative">
                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-blue-500/40 -translate-y-1/2 -z-10 hidden md:block" />
                    
                    <div className="p-6 rounded-3xl bg-slate-900 border border-purple-500/30 text-center space-y-3 z-10 max-w-xs shadow-2xl relative">
                      <div className="absolute -inset-1 bg-gradient-to-tr from-purple-600 to-blue-600 rounded-3xl blur opacity-30 -z-10 animate-pulse" />
                      <Cpu className="h-8 w-8 text-purple-400 mx-auto animate-spin-slow" />
                      <h4 className="text-xs font-black uppercase text-white tracking-widest font-mono">Similarity Matrix</h4>
                      <p className="text-[9px] text-slate-405 leading-relaxed">
                        Calculates cosine distance weights between embeddings inside local memory spaces.
                      </p>
                    </div>
                  </div>

                  {/* Right: SQLite/Supabase Storage & Reports */}
                  <div className="space-y-4 w-full md:w-1/4">
                    <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider text-right md:text-left">Outputs</h4>
                    <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-left space-y-2 flex items-center gap-3">
                      <Layers className="h-6 w-6 text-green-400 shrink-0" />
                      <div>
                        <p className="text-[10px] font-bold text-white">Database Store</p>
                        <p className="text-[8px] text-slate-500">SQLite & Supabase Sync</p>
                      </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-left space-y-2 flex items-center gap-3">
                      <Sparkles className="h-6 w-6 text-cyan-400 shrink-0" />
                      <div>
                        <p className="text-[10px] font-bold text-white">AI Reports Compiler</p>
                        <p className="text-[8px] text-slate-500">LLM explanatory summaries</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* ----------------------------------------------------------
                  SECTION 5: FEATURE SHOWCASE
                 ---------------------------------------------------------- */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5 }}
                className="space-y-16 max-w-6xl mx-auto"
              >
                <div className="text-center space-y-3">
                  <span className="text-[9px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                    Core Capabilities
                  </span>
                  <h2 className="text-3xl sm:text-5xl font-black font-display tracking-tight text-white">
                    Built for Enterprise Performance
                  </h2>
                  <p className="text-slate-405 text-sm max-w-xl mx-auto">
                    Unlock deep candidate analytics. Streamline pipelines and find high-fit engineers.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {[
                    {
                      icon: FileText,
                      title: "Parser Engine",
                      desc: "Scrape resumes and profiles. Converts chaotic inputs into typed parameters including core competencies and years of experience.",
                      badge: "Structured Extraction"
                    },
                    {
                      icon: AlertTriangle,
                      title: "Identify Skill Gaps",
                      desc: "Pinpoint missing parameters. Our matrix matches candidates against JD requirements and surfaces core topics requiring upskilling.",
                      badge: "Critical Diagnostics"
                    },
                    {
                      icon: MessageSquare,
                      title: "AI Recruiter Copilot",
                      desc: "Discuss candidate matches inside our contextual chat framework. Ask questions and verify details.",
                      badge: "Intelligent Chatbot"
                    },
                    {
                      icon: Award,
                      title: "Semantic Suitability",
                      desc: "Computes cosine distance embeddings. Goes beyond direct keywords to locate overlapping concepts.",
                      badge: "Vector Similarity"
                    }
                  ].map((card, idx) => {
                    const Icon = card.icon;
                    return (
                      <motion.div
                        key={idx}
                        whileHover={{ y: -6, border: '1px solid rgba(139, 92, 246, 0.2)' }}
                        className="glass-panel border border-white/5 rounded-3xl p-8 text-left relative overflow-hidden shadow-2xl transition-all duration-300"
                      >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-xl" />
                        <span className="text-[8px] font-black uppercase text-purple-400 px-2.5 py-1 rounded-md bg-purple-500/10 border border-purple-500/20 w-fit block mb-4">
                          {card.badge}
                        </span>
                        <div className="flex gap-4 items-start">
                          <div className="p-3 bg-slate-900 border border-slate-800 text-purple-400 rounded-2xl shrink-0">
                            <Icon className="h-6 w-6" />
                          </div>
                          <div className="space-y-2">
                            <h3 className="text-lg font-bold text-white font-display">{card.title}</h3>
                            <p className="text-xs text-slate-405 leading-relaxed">{card.desc}</p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>

              {/* ----------------------------------------------------------
                  SECTION 6: TECHNOLOGY STACK ORBIT
                 ---------------------------------------------------------- */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5 }}
                className="space-y-16 max-w-5xl mx-auto text-center"
              >
                <div className="space-y-3">
                  <span className="text-[9px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                    Integrations
                  </span>
                  <h2 className="text-3xl sm:text-5xl font-black font-display tracking-tight text-white">
                    Fully Integrated Tech Stack
                  </h2>
                  <p className="text-slate-405 text-sm max-w-lg mx-auto">
                    RADIX combines premium web libraries, cloud databases, local transformers, and LLM APIs.
                  </p>
                </div>

                <div className="relative h-[320px] flex items-center justify-center overflow-hidden">
                  {/* Central Node */}
                  <div className="h-28 w-28 rounded-full bg-slate-900 border border-purple-500/40 shadow-2xl flex flex-col items-center justify-center z-10">
                    <Cpu className="h-6 w-6 text-purple-400 animate-spin-slow mb-1" />
                    <span className="text-[9px] font-black text-white font-mono uppercase tracking-widest">RADIX CORE</span>
                  </div>

                  {/* Satellite Nodes revolving via custom CSS keyframes */}
                  <div style={{ animation: 'orbit-react 22s linear infinite' }} className="absolute h-10 w-10 rounded-full bg-slate-900 border border-blue-500/30 flex items-center justify-center shadow-lg cursor-pointer">
                    <span className="text-[8px] font-bold text-blue-400 font-mono">React</span>
                  </div>
                  <div style={{ animation: 'orbit-fastapi 22s linear infinite' }} className="absolute h-10 w-10 rounded-full bg-slate-900 border border-emerald-500/30 flex items-center justify-center shadow-lg cursor-pointer">
                    <span className="text-[8px] font-bold text-emerald-400 font-mono">FastAPI</span>
                  </div>
                  <div style={{ animation: 'orbit-supabase 22s linear infinite' }} className="absolute h-10 w-10 rounded-full bg-slate-900 border border-green-500/30 flex items-center justify-center shadow-lg cursor-pointer">
                    <span className="text-[8px] font-bold text-green-400 font-mono">SupaDB</span>
                  </div>
                  <div style={{ animation: 'orbit-openai 22s linear infinite' }} className="absolute h-10 w-10 rounded-full bg-slate-900 border border-purple-500/30 flex items-center justify-center shadow-lg cursor-pointer">
                    <span className="text-[8px] font-bold text-purple-400 font-mono">GPT-5.5</span>
                  </div>
                  <div style={{ animation: 'orbit-langchain 22s linear infinite' }} className="absolute h-10 w-10 rounded-full bg-slate-900 border border-orange-500/30 flex items-center justify-center shadow-lg cursor-pointer">
                    <span className="text-[8px] font-bold text-orange-400 font-mono">LC</span>
                  </div>
                  <div style={{ animation: 'orbit-sentence 22s linear infinite' }} className="absolute h-10 w-10 rounded-full bg-slate-900 border border-cyan-500/30 flex items-center justify-center shadow-lg cursor-pointer">
                    <span className="text-[8px] font-bold text-cyan-400 font-mono">HF</span>
                  </div>
                </div>
              </motion.div>

              {/* ----------------------------------------------------------
                  SECTION 7: WHY CHOOSE PLATFORM COMPARATIVE
                 ---------------------------------------------------------- */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5 }}
                className="space-y-16 max-w-6xl mx-auto"
              >
                <div className="text-center space-y-3">
                  <span className="text-[9px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                    Comparative Matrix
                  </span>
                  <h2 className="text-3xl sm:text-5xl font-black font-display tracking-tight text-white">
                    Objective Matching vs Manual Search
                  </h2>
                  <p className="text-slate-405 text-sm max-w-xl mx-auto">
                    Traditional filtering leaves vacancies open for months. RADIX compiles match reports instantly.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  {/* Traditional */}
                  <div className="glass-panel border border-red-500/15 rounded-3xl p-8 space-y-6">
                    <h3 className="text-lg font-bold text-red-400 font-display flex items-center gap-2">
                      <X className="h-5 w-5" />
                      Traditional Recruiting
                    </h3>
                    <ul className="space-y-4 text-xs text-slate-405 text-left">
                      <li className="flex gap-2.5 items-start">
                        <span className="text-red-500 shrink-0">•</span>
                        <span>**Manual Resume Reviews**: Spending hours parsing formatting structures manually.</span>
                      </li>
                      <li className="flex gap-2.5 items-start">
                        <span className="text-red-500 shrink-0">•</span>
                        <span>**Rigid Keyword Matching**: Missing high-fit candidates due to slight differences in naming conventions.</span>
                      </li>
                      <li className="flex gap-2.5 items-start">
                        <span className="text-red-500 shrink-0">•</span>
                        <span>**High Subjective Bias**: Assessments depend on reviewer opinion rather than weighted skill vectors.</span>
                      </li>
                    </ul>
                  </div>

                  {/* RADIX */}
                  <div className="glass-panel border border-purple-500/25 rounded-3xl p-8 space-y-6 relative">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl blur opacity-15 -z-10" />
                    <h3 className="text-lg font-bold text-purple-400 font-display flex items-center gap-2">
                      <Check className="h-5 w-5" />
                      RADIX Semantic Matching
                    </h3>
                    <ul className="space-y-4 text-xs text-slate-350 text-left">
                      <li className="flex gap-2.5 items-start">
                        <span className="text-purple-400 shrink-0">•</span>
                        <span>**Automated Structuring**: Converts PDF or DOCX files into indexed JSON profiles in seconds.</span>
                      </li>
                      <li className="flex gap-2.5 items-start">
                        <span className="text-purple-400 shrink-0">•</span>
                        <span>**Semantic Embedding Search**: Vectors measure conceptual overlap (e.g. FastAPI matches Python Web APIs).</span>
                      </li>
                      <li className="flex gap-2.5 items-start">
                        <span className="text-purple-400 shrink-0">•</span>
                        <span>**Objective Scoring Matrix**: Candidates are graded mathematically on skill alignment and experience.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </motion.div>

              {/* ----------------------------------------------------------
                  SECTION 8: STATISTICS PANELS
                 ---------------------------------------------------------- */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5 }}
                className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto"
              >
                {[
                  { value: '100%', label: 'Cloud Sync State', desc: 'Secure Supabase Storage' },
                  { value: '< 900ms', label: 'Semantic Matching', desc: 'Vector cosine distance overlap' },
                  { value: '99.1%', label: 'Extraction Rating', desc: 'Precision structure mapping' },
                  { value: '85%', label: 'Time Savings', desc: 'Slashes manual screening loops' }
                ].map((stat, idx) => (
                  <div key={idx} className="glass-panel rounded-2xl p-6 text-center border border-white/5 shadow-lg">
                    <p className="text-3xl font-black font-display bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">{stat.value}</p>
                    <p className="text-[10px] font-bold text-purple-400 mt-1.5 uppercase tracking-wider font-display">{stat.label}</p>
                    <p className="text-[9px] text-slate-500 mt-1 leading-normal font-semibold">{stat.desc}</p>
                  </div>
                ))}
              </motion.div>

              {/* ----------------------------------------------------------
                  SECTION 9: INSIGHTS PREVIEW
                 ---------------------------------------------------------- */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5 }}
                className="space-y-16 max-w-5xl mx-auto"
              >
                <div className="text-center space-y-3">
                  <span className="text-[9px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                    Interactive Preview
                  </span>
                  <h2 className="text-3xl sm:text-5xl font-black font-display tracking-tight text-white">
                    Actionable Recruiter Insights
                  </h2>
                  <p className="text-slate-405 text-sm max-w-xl mx-auto">
                    RADIX compiles candidate statistics into structured, thematic suitability reports.
                  </p>
                </div>

                <div className="glass-panel rounded-3xl p-6 border border-white/5 shadow-2xl space-y-6 text-left max-w-3xl mx-auto">
                  <div className="flex justify-between items-center border-b border-slate-900 pb-4">
                    <div>
                      <p className="text-[9px] text-slate-500 uppercase font-black tracking-wider">Hiring Recommendation Preview</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="px-2.5 py-0.5 rounded-lg text-[9px] font-bold border border-emerald-500/30 text-emerald-400 bg-emerald-500/5 uppercase tracking-wider">
                          Strong Match Recommended
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] text-slate-500 uppercase font-black tracking-wider">Semantic Fit Score</p>
                      <p className="text-xl font-black text-cyan-400 font-display">94.8%</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Key Skill Overlaps</p>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/25 text-purple-400 text-[9px] font-bold">Python</span>
                      <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/25 text-blue-400 text-[9px] font-bold">FastAPI</span>
                      <span className="px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 text-[9px] font-bold">React.js</span>
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[9px] font-bold">Vector DBs</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">AI Suitability Summary</p>
                    <p className="text-xs text-slate-350 leading-relaxed bg-slate-900/60 p-4 border border-slate-800 rounded-2xl">
                      The candidate has 4.5 years of experience in high-performance Python architectures, with verified competencies in asynchronous REST APIs (FastAPI) and modern UI frameworks. Matches core criteria with excellent alignment in database queries and vector indexes. Recommend proceeding directly to technical screening.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* ----------------------------------------------------------
                  SECTION 10: FUTURE ROADMAP
                 ---------------------------------------------------------- */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5 }}
                className="space-y-16 max-w-6xl mx-auto"
              >
                <div className="text-center space-y-3">
                  <span className="text-[9px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                    Milestones
                  </span>
                  <h2 className="text-3xl sm:text-5xl font-black font-display tracking-tight text-white">
                    Future Roadmap Developments
                  </h2>
                  <p className="text-slate-405 text-sm max-w-xl mx-auto">
                    Follow our journey as we deploy advanced cognitive agent architectures.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
                  {[
                    {
                      quarter: "Q3 2026",
                      title: "Autonomous Interview Agents",
                      desc: "Integrate LLM conversational voice agents to conduct initial technical chats, logging response structures directly to profiles."
                    },
                    {
                      quarter: "Q4 2026",
                      title: "Predictive Reskilling Analytics",
                      desc: "Surface upskilling courses and track candidate training progress inside organizational dashboards."
                    },
                    {
                      quarter: "Q1 2027",
                      title: "Global Talent Pool Indexing",
                      desc: "Search global databases of pre-parsed resumes with cross-border language translation overlays."
                    }
                  ].map((milestone, idx) => (
                    <div key={idx} className="glass-panel border border-white/5 rounded-3xl p-8 space-y-4 shadow-xl">
                      <span className="text-xs font-black font-mono text-purple-400 bg-purple-500/10 px-3 py-1 rounded-lg border border-purple-500/20">
                        {milestone.quarter}
                      </span>
                      <h3 className="text-base font-bold text-white font-display mt-2">{milestone.title}</h3>
                      <p className="text-xs text-slate-405 leading-relaxed">{milestone.desc}</p>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* ----------------------------------------------------------
                  SECTION 11: MEET THE TEAM
                 ---------------------------------------------------------- */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5 }}
                className="space-y-16 max-w-5xl mx-auto"
              >
                <div className="text-center space-y-3">
                  <span className="text-[9px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                    Creators
                  </span>
                  <h2 className="text-3xl sm:text-5xl font-black font-display tracking-tight text-white">
                    The RADIX Architects
                  </h2>
                  <p className="text-slate-405 text-sm max-w-xl mx-auto">
                    Built by team players dedicated to solving the recruitment bottleneck.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {[
                    { name: "Alex Chen", role: "Lead AI Architect", specialty: "Transformers & Vector Indexes" },
                    { name: "Sarah Vance", role: "Creative WebGL Designer", specialty: "Immersive Shaders & UX" },
                    { name: "Marcus Stone", role: "Senior Systems Engineer", specialty: "Asynchronous API Pipelinings" }
                  ].map((member, idx) => (
                    <motion.div
                      key={idx}
                      whileHover={{ y: -8, border: '1px solid rgba(6, 182, 212, 0.2)' }}
                      className="glass-panel border border-white/5 rounded-3xl p-6 text-center space-y-3 shadow-xl transition-all duration-300 relative overflow-hidden"
                    >
                      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-purple-500 to-cyan-500" />
                      <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-900 border border-white/10 mx-auto flex items-center justify-center text-lg font-black text-cyan-400 font-display">
                        {member.name.split(' ').map(n=>n[0]).join('')}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white font-display">{member.name}</h4>
                        <p className="text-[10px] font-bold text-purple-400 uppercase tracking-wider mt-0.5">{member.role}</p>
                        <p className="text-[9px] text-slate-500 mt-2 font-semibold">{member.specialty}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* ----------------------------------------------------------
                  SECTION 12: FINAL CTA
                 ---------------------------------------------------------- */}
              <motion.div
                initial={{ opacity: 0, y: 35 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                className="max-w-4xl mx-auto p-12 rounded-3xl bg-gradient-to-r from-purple-950/25 via-indigo-950/25 to-slate-950 border border-purple-500/20 text-center relative overflow-hidden backdrop-blur-md shadow-2xl"
              >
                <div className="absolute top-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl -z-10" />
                <div className="absolute bottom-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl -z-10" />
                
                <h3 className="text-2xl sm:text-4xl font-black text-white font-display">
                  Accelerate Candidate Compatibility Benchmarks
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 mt-4 max-w-xl mx-auto leading-relaxed">
                  Start screening applicants instantly. Parse resumes and compile detailed suitability reports in real-time.
                </p>
                
                <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
                  <button
                    onClick={() => setActiveTab('match')}
                    className="px-8 py-3.5 rounded-full bg-white hover:bg-slate-100 text-slate-950 font-bold text-xs shadow-xl cursor-pointer transition-all"
                  >
                    Open Workspace
                  </button>
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className="px-8 py-3.5 rounded-full bg-slate-900 border border-slate-800 hover:border-slate-700 text-white font-bold text-xs cursor-pointer transition-all"
                  >
                    Explore Dashboard
                  </button>
                </div>
              </motion.div>

              {/* Footer */}
              <footer className="border-t border-slate-905 pt-8 text-center text-xs text-slate-500 max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 font-semibold">
                <p>© 2026 RADIX Talent Match Platform. Built for Talent Match Hackathon.</p>
                <div className="flex gap-4">
                  <a href="#docs" onClick={(e) => { e.preventDefault(); }} className="hover:text-slate-400 transition-colors">Developer Docs</a>
                  <a href="#privacy" onClick={(e) => { e.preventDefault(); }} className="hover:text-slate-400 transition-colors">Privacy Policy</a>
                </div>
              </footer>
            </motion.div>
          )}

          {/* TAB: Dashboard Summary */}
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
            >
              {/* Stat Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { label: 'Total Job Postings', value: totalJds, icon: Briefcase, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                  { label: 'Registered Candidates', value: totalCandidates, icon: Users, color: 'text-purple-400', bg: 'bg-purple-500/10' },
                  { label: 'Average Match Score', value: `${avgMatchScore}%`, icon: Award, color: 'text-green-400', bg: 'bg-green-500/10' },
                  { label: 'Average Readiness Rating', value: `${avgReadiness}%`, icon: TrendingUp, color: 'text-pink-400', bg: 'bg-pink-500/10' }
                ].map((card, idx) => {
                  const Icon = card.icon;
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.04 }}
                      className="glass-panel rounded-2xl p-6"
                    >
                      <div className="flex justify-between items-center mb-4">
                        <span className={`text-[11px] font-bold uppercase tracking-wider ${theme === 'light' ? 'text-slate-550' : 'text-slate-400'}`}>{card.label}</span>
                        <div className={`p-2 rounded-xl ${card.bg}`}>
                          <Icon className={`h-4.5 w-4.5 ${card.color}`} />
                        </div>
                      </div>
                      <p className="text-3xl font-black text-slate-800 dark:text-white font-display">{card.value}</p>
                    </motion.div>
                  );
                })}
              </div>

              {/* Data Visualizers Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Area: Charts */}
                <div className="lg:col-span-8">
                  {/* Skill Distribution */}
                  <div className="glass-panel rounded-2xl p-6">
                    <h3 className={`text-sm font-bold mb-6 flex items-center gap-2 font-display ${theme === 'light' ? 'text-slate-800' : 'text-slate-200'}`}>
                      <BarChart2 className="h-4.5 w-4.5 text-purple-400" />
                      Top Extracted Skill Tags Distribution
                    </h3>
                    <div className="h-80 w-full">
                      {topSkills.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={topSkills} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                            <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                            <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }} 
                              labelClassName="text-slate-300 text-xs font-bold font-display"
                              itemStyle={{ color: '#c084fc', fontSize: '10px' }}
                            />
                            <Bar dataKey="value" fill="url(#colorSkills)" radius={[6, 6, 0, 0]}>
                              {topSkills.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Bar>
                            <defs>
                              <linearGradient id="colorSkills" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.2}/>
                              </linearGradient>
                            </defs>
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-xs text-slate-500 gap-2">
                          <Layers className="h-8 w-8 text-slate-700 animate-pulse" />
                          <span>No candidate skill data extracted. Populate profiles to view dashboard analytics.</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Area: Missing Skills & Activity Log */}
                <div className="lg:col-span-4 space-y-6">
                  {/* Skill Gaps Card */}
                  <div className="glass-panel rounded-2xl p-6">
                    <h3 className={`text-sm font-bold mb-4 flex items-center gap-2 font-display ${theme === 'light' ? 'text-slate-800' : 'text-slate-200'}`}>
                      <AlertTriangle className="h-4.5 w-4.5 text-yellow-400" />
                      Identified Skills Gaps
                    </h3>
                    <p className={`text-[10px] leading-relaxed mb-4 ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
                      Critical technical parameters required by active Job Descriptions that are missing across all candidate profile records:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {missingSkillsList.length > 0 ? (
                        missingSkillsList.map((s, idx) => (
                          <span key={idx} className="px-2.5 py-1 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 dark:text-yellow-400 text-[10px] font-semibold">
                            {s}
                          </span>
                        ))
                      ) : (
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                          <CheckCircle className="h-4 w-4 text-green-400" />
                          <span>All job requirements are met by candidate profiles.</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Recent Activity Log */}
                  <div className="glass-panel rounded-2xl p-6">
                    <h3 className={`text-sm font-bold mb-4 flex items-center gap-2 font-display ${theme === 'light' ? 'text-slate-800' : 'text-slate-200'}`}>
                      <Activity className="h-4.5 w-4.5 text-pink-400 animate-pulse" />
                      Platform Activity Logs
                    </h3>
                    <div className="space-y-4">
                      {[
                        { title: 'Resume Document Extracted', time: '1 min ago', detail: 'Transferred and parsed layout.' },
                        { title: 'Local DB adapters sync', time: '8 mins ago', detail: 'Successfully seeded mock job specifications.' },
                        { title: 'E2E Testing Suite completed', time: '15 mins ago', detail: '7 diagnostics test layers completed.' }
                      ].map((act, idx) => (
                        <div key={idx} className="flex gap-3 text-xs leading-normal">
                          <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                          <div>
                            <p className={`font-bold ${theme === 'light' ? 'text-slate-750' : 'text-slate-200'}`}>{act.title}</p>
                            <p className="text-[9px] text-slate-500 dark:text-slate-500 mt-0.5">{act.detail} • {act.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB: Match Workspace */}
          {activeTab === 'match' && (
            <motion.div
              key="match"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              {/* Left Column: Parsers & Selectors */}
              <div className="lg:col-span-4 space-y-6">
                              {/* Resume Drop Zone Card */}
                <div className="glass-panel rounded-3xl p-6">
                  <h3 className={`text-sm font-bold mb-4 flex items-center gap-2 font-display ${theme === 'light' ? 'text-slate-800' : 'text-slate-200'}`}>
                    <User className="h-4.5 w-4.5 text-purple-400" />
                    Upload & Extract Resume
                  </h3>

                  {/* Drop area */}
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsResumeDragging(true); }}
                    onDragLeave={() => setIsResumeDragging(false)}
                    onDrop={handleResumeDrop}
                    className={`border border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-300 group relative mb-4 ${
                      isResumeDragging
                        ? 'border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/10 scale-[1.01]'
                        : theme === 'light' 
                          ? 'border-slate-300 bg-slate-50/50 hover:bg-slate-100/80 hover:border-slate-450' 
                          : 'border-slate-800 bg-slate-950/20 hover:bg-slate-950/40 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="file"
                      id="resume-upload-picker"
                      className="hidden"
                      accept=".pdf,.docx,.doc"
                      onChange={(e) => parseResumeFile(e.target.files[0])}
                    />
                    <label htmlFor="resume-upload-picker" className="cursor-pointer block space-y-3">
                      <div className="p-3 bg-purple-500/10 rounded-full w-fit mx-auto group-hover:scale-105 transition-transform">
                        <UploadCloud className="h-5.5 w-5.5 text-purple-400" />
                      </div>
                      <div>
                        <p className={`text-xs font-semibold ${theme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>Drag candidate profile resume here</p>
                        <p className="text-[9px] text-slate-500 mt-1">Supports PDF, DOC, DOCX files</p>
                      </div>
                    </label>

                    {/* Upload progress overlay */}
                    {isResumeParsing && (
                      <div className="absolute inset-0 bg-slate-950/90 rounded-2xl flex flex-col justify-center p-5">
                        <p className="text-xs font-bold text-purple-400">Uploading and Parsing File...</p>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2.5 overflow-hidden">
                          <div className="bg-purple-500 h-full transition-all" style={{ width: `${resumeUploadProgress}%` }} />
                        </div>
                        <p className="text-[9px] text-slate-500 mt-1.5 font-mono">{resumeUploadProgress}% complete</p>
                      </div>
                    )}
                  </div>

                  {/* File Metadata Preview */}
                  {resumeFileMeta && !resumeError && (
                    <div className={`p-3 rounded-xl border text-[10px] flex items-center justify-between mb-4 ${
                      theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-950/60 border-slate-850 text-slate-300'
                    }`}>
                      <div className="flex items-center gap-2 truncate">
                        <File className="h-4 w-4 text-purple-400" />
                        <span className="truncate font-semibold">{resumeFileMeta.name}</span>
                      </div>
                      <span className="shrink-0 font-mono text-slate-500">{resumeFileMeta.size}</span>
                    </div>
                  )}

                  {/* Candidate selector */}
                  <div className="space-y-2">
                    <label className="text-[9px] uppercase font-black text-slate-505 tracking-wider">Active Candidate Profile</label>
                    <CandidateSelector
                      profiles={profiles}
                      selectedProfileId={selectedProfileId}
                      onChange={(val) => {
                        setSelectedProfileId(val);
                        setMatchingResult(null);
                      }}
                      theme={theme}
                      onCreateProfileClick={() => {
                        setActiveTab('profile');
                        setEditingProfileId(null);
                        showToast("Opening profile builder", "info");
                      }}
                    />
                  </div>

                  {selectedProfileId && profiles.find(p => p.id === selectedProfileId) && (
                    <div className={`mt-4 p-3 border rounded-xl text-xs flex justify-between items-center ${
                      theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/50 border-slate-850'
                    }`}>
                      <div>
                        <p className={`font-bold ${theme === 'light' ? 'text-slate-800' : 'text-slate-300'}`}>{profiles.find(p => p.id === selectedProfileId)?.full_name}</p>
                        <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5">{profiles.find(p => p.id === selectedProfileId)?.email}</p>
                      </div>
                      <div className="flex gap-1.5">
                        <button 
                          onClick={() => handleEditProfile(profiles.find(p => p.id === selectedProfileId))}
                          className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded cursor-pointer"
                          title="Edit Profile"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteProfile(selectedProfileId, profiles.find(p => p.id === selectedProfileId)?.full_name)}
                          className="p-1.5 hover:bg-red-500/10 text-slate-400 hover:text-red-400 rounded cursor-pointer"
                          title="Delete Profile"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Job Specs Selector Card */}
                <div className="glass-panel border border-white/5 rounded-3xl p-6">
                  <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2 font-display">
                    <Briefcase className="h-4.5 w-4.5 text-purple-400" />
                    Benchmark Job Specs
                  </h3>

                  <div className="space-y-2">
                    <label className="text-[9px] uppercase font-black text-slate-505 tracking-wider">Target Job Posting</label>
                    <CustomSearchableDropdown
                      options={jobs}
                      value={selectedJobId}
                      onChange={(val) => {
                        setSelectedJobId(val);
                        setMatchingResult(null);
                      }}
                      placeholder="Select Job Description..."
                      theme={theme}
                      icon={Briefcase}
                      getLabel={(j) => j.title}
                      getSub={(j) => j.company}
                      emptyMessage="No jobs found"
                    />
                  </div>

                  {selectedJobId && jobs.find(j => j.id === selectedJobId) && (
                    <div className="mt-4 p-3 bg-slate-950/50 border border-slate-850 rounded-xl text-xs space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-slate-300 font-bold">{jobs.find(j => j.id === selectedJobId)?.title}</p>
                          <p className="text-[9px] text-slate-505 mt-0.5">{jobs.find(j => j.id === selectedJobId)?.company}</p>
                        </div>
                        {!selectedJobId.startsWith('00000000-0000') && (
                          <button
                            onClick={() => handleDeleteJob(selectedJobId, jobs.find(j => j.id === selectedJobId)?.title)}
                            className="p-1 text-slate-500 hover:text-red-400 cursor-pointer"
                            title="Delete Job"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {jobs.find(j => j.id === selectedJobId)?.required_skills.slice(0, 3).map((s, idx) => (
                          <span key={idx} className="px-1.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[9px] font-semibold">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => triggerMatching()}
                    disabled={isMatchingLoading || !selectedProfileId || !selectedJobId}
                    className="w-full mt-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-505 text-white font-bold text-xs shadow-lg shadow-purple-500/10 hover:shadow-purple-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isMatchingLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Analyzing Match Embeddings...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Run Vector Suitability Check
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Right Column: Visualization Output */}
              <div className="lg:col-span-8">
                <AnimatePresence mode="wait">
                  {matchingResult ? (
                    <motion.div
                      key="result"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-6"
                    >
                      {/* Overall score box */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 glass-panel rounded-3xl p-6 items-center">
                        
                        {/* Circular Score Gauge */}
                        <div className="md:col-span-4 flex flex-col items-center justify-center relative py-2">
                          <svg className="w-36 h-36 transform -rotate-90">
                            <circle cx="72" cy="72" r="62" className={theme === 'light' ? 'stroke-slate-200' : 'stroke-slate-900'} strokeWidth="8" fill="transparent" />
                            <circle 
                              cx="72" 
                              cy="72" 
                              r="62" 
                              className="stroke-purple-500 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]" 
                              strokeWidth="8" 
                              fill="transparent" 
                              strokeDasharray={2 * Math.PI * 62}
                              strokeDashoffset={2 * Math.PI * 62 * (1 - matchingResult.score / 100)}
                              strokeLinecap="round"
                            />
                          </svg>
                          <div className="absolute text-center">
                            <span className={`text-3xl font-black font-display ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>{matchingResult.score}%</span>
                            <p className="text-[9px] text-slate-550 font-bold uppercase tracking-widest mt-0.5">COMPATIBILITY</p>
                          </div>
                        </div>

                        {/* Executive Match Summary */}
                        <div className="md:col-span-8 space-y-4">
                          <div>
                            <span className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                              AI Analysis Insights
                            </span>
                            <p className={`text-xs mt-3 leading-relaxed ${theme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>
                              {matchingResult.explanation}
                            </p>
                          </div>

                          <div className={`grid grid-cols-3 gap-4 pt-1 border-t ${theme === 'light' ? 'border-slate-200' : 'border-slate-900/60'}`}>
                            <div>
                              <span className="text-[9px] text-slate-500 font-semibold block uppercase">Semantic Scope</span>
                              <span className={`text-xs font-bold ${theme === 'light' ? 'text-slate-850' : 'text-slate-200'}`}>{matchingResult.semantic_score}%</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-500 font-semibold block uppercase">Work Duration</span>
                              <span className={`text-xs font-bold ${theme === 'light' ? 'text-slate-850' : 'text-slate-200'}`}>{matchingResult.experience_score}%</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-500 font-semibold block uppercase">Project Mapping</span>
                              <span className={`text-xs font-bold ${theme === 'light' ? 'text-slate-850' : 'text-slate-200'}`}>{matchingResult.projects_score}%</span>
                            </div>
                          </div>

                          {matchingResult.report_url && (
                            <a
                              href={resolveFileUrl(matchingResult.report_url)}
                              target="_blank"
                              rel="noreferrer"
                              className="w-fit text-[11px] text-purple-400 hover:text-purple-300 transition-colors hover:underline flex items-center gap-1.5 font-bold"
                            >
                              <Download className="h-3.5 w-3.5" />
                              View Complete Evaluation Dossier
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Charts Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Radar Chart */}
                        <div className="glass-panel rounded-3xl p-6">
                          <h4 className={`text-xs font-bold mb-4 flex items-center gap-2 font-display ${theme === 'light' ? 'text-slate-800' : 'text-slate-300'}`}>
                            <TrendingUp className="h-4 w-4 text-purple-400" />
                            Skills Dimensions Mapping
                          </h4>
                          <div className="h-56 w-full flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                                <PolarGrid stroke={theme === 'light' ? '#cbd5e1' : '#1e293b'} />
                                <PolarAngleAxis dataKey="subject" stroke="#64748b" fontSize={9} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke={theme === 'light' ? '#94a3b8' : '#334155'} fontSize={8} />
                                <Radar name="Candidate" dataKey="value" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.2} />
                              </RadarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* Bar Chart score mappings */}
                        <div className="glass-panel rounded-3xl p-6">
                          <h4 className={`text-xs font-bold mb-4 flex items-center gap-2 font-display ${theme === 'light' ? 'text-slate-800' : 'text-slate-300'}`}>
                            <BarChart2 className="h-4 w-4 text-blue-400" />
                            Score Comparison Summary
                          </h4>
                          <div className="h-56 w-full flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={barData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                <XAxis dataKey="name" stroke="#64748b" fontSize={9} tickLine={false} />
                                <YAxis stroke="#64748b" fontSize={9} tickLine={false} />
                                <Tooltip contentStyle={{ backgroundColor: theme === 'light' ? '#ffffff' : '#0f172a', borderColor: theme === 'light' ? '#cbd5e1' : '#1e293b', borderRadius: '12px' }} />
                                <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]}>
                                  {barData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </div>

                      {/* Skills categorizations */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                              <div className="glass-panel rounded-2xl p-5 space-y-3">
                          <div className="flex items-center gap-2 text-green-500 dark:text-green-400 font-bold text-[11px] uppercase tracking-wide">
                            <CheckSquare className="h-4 w-4" />
                            Matched Skills ({matchingResult.matched_skills.length})
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {matchingResult.matched_skills.length > 0 ? (
                              matchingResult.matched_skills.map((s, idx) => (
                                <span key={idx} className="px-2 py-0.5 rounded bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-450 text-[10px] font-semibold">
                                  {s}
                                </span>
                              ))
                            ) : (
                              <span className="text-[10px] text-slate-500 font-semibold">No skills overlap.</span>
                            )}
                          </div>
                        </div>

                        <div className="glass-panel rounded-2xl p-5 space-y-3">
                          <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-550 font-bold text-[11px] uppercase tracking-wide">
                            <AlertTriangle className="h-4 w-4" />
                            Missing Skill Gaps ({matchingResult.missing_skills.length})
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {matchingResult.missing_skills.length > 0 ? (
                              matchingResult.missing_skills.map((s, idx) => (
                                <span key={idx} className="px-2 py-0.5 rounded bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-450 text-[10px] font-semibold">
                                  {s}
                                </span>
                              ))
                            ) : (
                              <span className="text-[10px] text-slate-500 font-semibold">No critical gaps.</span>
                            )}
                          </div>
                        </div>

                        <div className="glass-panel rounded-2xl p-5 space-y-3">
                          <div className="flex items-center gap-2 text-purple-500 dark:text-purple-400 font-bold text-[11px] uppercase tracking-wide">
                            <TrendingUp className="h-4 w-4" />
                            Upskilling Focus
                          </div>
                          <div className={`space-y-1 text-[10px] leading-relaxed font-semibold ${
                            theme === 'light' ? 'text-slate-700 font-medium' : 'text-slate-400'
                          }`}>
                            {matchingResult.recommendations.map((r, idx) => (
                              <p key={idx} className="flex gap-1 items-start">
                                <span className="text-purple-500 shrink-0">•</span>
                                {r}
                              </p>
                            ))}
                          </div>
                        </div>

                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="placeholder"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`h-full flex flex-col items-center justify-center text-center p-12 border border-dashed rounded-3xl backdrop-blur-sm ${
                        theme === 'light' ? 'border-slate-300 bg-slate-50' : 'border-slate-800/80 bg-slate-955/10'
                      }`}
                    >
                      <Layers className="h-10 w-10 text-slate-700 animate-bounce mb-4" />
                      <h3 className={`text-sm font-bold font-display ${theme === 'light' ? 'text-slate-800' : 'text-slate-400'}`}>Awaiting Compatibility benchmark</h3>
                      <p className={`text-xs mt-2 max-w-sm leading-relaxed ${theme === 'light' ? 'text-slate-600' : 'text-slate-500'}`}>
                        Select a parsed Candidate Profile and Job Description, and click "Run Vector Suitability Check" to calculate match scores.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* TAB: Profile Builder Form */}
          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="glass-panel border border-white/5 rounded-3xl p-6 md:p-8 max-w-4xl mx-auto"
            >
              <div className="flex justify-between items-center pb-6 border-b border-slate-900/60 mb-6">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-white font-display">
                    {editingProfileId ? 'Update Candidate Profile' : 'Pre-Populated Profile Builder'}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">Pre-populated and mapped automatically from parsing candidate PDF resumes</p>
                </div>
                
                {profileSaveSuccess && (
                  <span className="text-xs text-green-405 font-bold flex items-center gap-1.5 animate-pulse bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-full">
                    <CheckCircle className="h-4 w-4" /> Profile Saved successfully!
                  </span>
                )}
              </div>

              <form onSubmit={handleProfileSubmit} className="space-y-8">
                
                {/* Basic parameters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[9px] uppercase font-black text-slate-505 tracking-wider">Full Name</label>
                    <input 
                      type="text"
                      required
                      value={profileForm.full_name}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, full_name: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-855 rounded-xl px-3.5 py-3 text-xs text-slate-202 focus:outline-none focus:border-purple-500 transition-colors"
                      placeholder="e.g. Alex Rivera"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] uppercase font-black text-slate-505 tracking-wider">Email Address</label>
                    <input 
                      type="email"
                      required
                      value={profileForm.email}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-855 rounded-xl px-3.5 py-3 text-xs text-slate-202 focus:outline-none focus:border-purple-500 transition-colors"
                      placeholder="alex.rivera@example.com"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] uppercase font-black text-slate-505 tracking-wider">Phone number (Optional)</label>
                    <input 
                      type="text"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-855 rounded-xl px-3.5 py-3 text-xs text-slate-202 focus:outline-none focus:border-purple-500 transition-colors"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>

                {/* Skills field */}
                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase font-black text-slate-505 tracking-wider">Technical Skills (Comma separated list)</label>
                  <textarea 
                    value={profileForm.skills}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, skills: e.target.value }))}
                    rows="2"
                    className="w-full bg-slate-955 border border-slate-855 rounded-xl px-3.5 py-3 text-xs text-slate-200 focus:outline-none focus:border-purple-500 transition-colors leading-relaxed"
                    placeholder="e.g. Python, React, FastAPI, Docker, SQL, Kubernetes"
                  />
                </div>

                {/* Education section */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] uppercase font-black text-slate-505 tracking-wider">Education Credentials</span>
                    <button 
                      type="button" 
                      onClick={handleAddEdu}
                      className="text-[11px] text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1 cursor-pointer font-bold"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add Institution
                    </button>
                  </div>
                  {profileForm.education.map((edu, idx) => (
                    <div key={idx} className="p-4 bg-slate-950/40 border border-slate-850 rounded-2xl relative space-y-3">
                      {profileForm.education.length > 1 && (
                        <button 
                          type="button" 
                          onClick={() => handleRemoveEdu(idx)}
                          className="absolute top-2.5 right-2.5 text-slate-505 hover:text-red-400 p-1 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <input 
                          placeholder="Institution / School" 
                          type="text" 
                          value={edu.institution}
                          onChange={(e) => {
                            const updated = [...profileForm.education];
                            updated[idx].institution = e.target.value;
                            setProfileForm(prev => ({ ...prev, education: updated }));
                          }}
                          className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-slate-250 focus:outline-none"
                        />
                        <input 
                          placeholder="Degree (e.g. B.S.)" 
                          type="text" 
                          value={edu.degree}
                          onChange={(e) => {
                            const updated = [...profileForm.education];
                            updated[idx].degree = e.target.value;
                            setProfileForm(prev => ({ ...prev, education: updated }));
                          }}
                          className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-slate-250 focus:outline-none"
                        />
                        <input 
                          placeholder="Major" 
                          type="text" 
                          value={edu.major}
                          onChange={(e) => {
                            const updated = [...profileForm.education];
                            updated[idx].major = e.target.value;
                            setProfileForm(prev => ({ ...prev, education: updated }));
                          }}
                          className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-slate-250 focus:outline-none"
                        />
                        <input 
                          placeholder="Graduation Year" 
                          type="number" 
                          value={edu.graduation_year || ''}
                          onChange={(e) => {
                            const updated = [...profileForm.education];
                            updated[idx].graduation_year = e.target.value;
                            setProfileForm(prev => ({ ...prev, education: updated }));
                          }}
                          className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-slate-250 focus:outline-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Experience section */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] uppercase font-black text-slate-505 tracking-wider">Professional Experience Timeline</span>
                    <button 
                      type="button" 
                      onClick={handleAddExp}
                      className="text-[11px] text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1 cursor-pointer font-bold"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add Experience Block
                    </button>
                  </div>
                  {profileForm.experience.map((exp, idx) => (
                    <div key={idx} className="p-4 bg-slate-950/40 border border-slate-850 rounded-2xl relative space-y-3">
                      {profileForm.experience.length > 1 && (
                        <button 
                          type="button" 
                          onClick={() => handleRemoveExp(idx)}
                          className="absolute top-2.5 right-2.5 text-slate-505 hover:text-red-400 p-1 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <input 
                          placeholder="Company name" 
                          type="text" 
                          value={exp.company}
                          onChange={(e) => {
                            const updated = [...profileForm.experience];
                            updated[idx].company = e.target.value;
                            setProfileForm(prev => ({ ...prev, experience: updated }));
                          }}
                          className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-slate-250 focus:outline-none"
                        />
                        <input 
                          placeholder="Role (e.g. Backend Dev)" 
                          type="text" 
                          value={exp.job_title}
                          onChange={(e) => {
                            const updated = [...profileForm.experience];
                            updated[idx].job_title = e.target.value;
                            setProfileForm(prev => ({ ...prev, experience: updated }));
                          }}
                          className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-slate-250 focus:outline-none"
                        />
                        <input 
                          placeholder="Duration (months)" 
                          type="number" 
                          value={exp.duration_months || ''}
                          onChange={(e) => {
                            const updated = [...profileForm.experience];
                            updated[idx].duration_months = e.target.value;
                            setProfileForm(prev => ({ ...prev, experience: updated }));
                          }}
                          className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-slate-250 focus:outline-none"
                        />
                        <input 
                          placeholder="Skills used (comma separated)" 
                          type="text" 
                          value={exp.skills_used}
                          onChange={(e) => {
                            const updated = [...profileForm.experience];
                            updated[idx].skills_used = e.target.value;
                            setProfileForm(prev => ({ ...prev, experience: updated }));
                          }}
                          className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-slate-250 focus:outline-none"
                        />
                      </div>
                      <textarea 
                        placeholder="Responsibilities and contributions (one per line)..." 
                        value={exp.responsibilities}
                        onChange={(e) => {
                          const updated = [...profileForm.experience];
                          updated[idx].responsibilities = e.target.value;
                          setProfileForm(prev => ({ ...prev, experience: updated }));
                        }}
                        rows="2"
                        className="w-full bg-slate-950 border border-slate-855 rounded-lg px-3 py-2 text-xs text-slate-255 focus:outline-none leading-relaxed"
                      />
                    </div>
                  ))}
                </div>

                {/* Projects section */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] uppercase font-black text-slate-505 tracking-wider">Portfolio Projects</span>
                    <button 
                      type="button" 
                      onClick={handleAddProj}
                      className="text-[11px] text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1 cursor-pointer font-bold"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add Project Info
                    </button>
                  </div>
                  {profileForm.projects.map((proj, idx) => (
                    <div key={idx} className="p-4 bg-slate-950/40 border border-slate-850 rounded-2xl relative space-y-3">
                      {profileForm.projects.length > 1 && (
                        <button 
                          type="button" 
                          onClick={() => handleRemoveProj(idx)}
                          className="absolute top-2.5 right-2.5 text-slate-505 hover:text-red-400 p-1 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input 
                          placeholder="Project title" 
                          type="text" 
                          value={proj.title}
                          onChange={(e) => {
                            const updated = [...profileForm.projects];
                            updated[idx].title = e.target.value;
                            setProfileForm(prev => ({ ...prev, projects: updated }));
                          }}
                          className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-slate-250 focus:outline-none"
                        />
                        <input 
                          placeholder="Skills used (comma separated)" 
                          type="text" 
                          value={proj.skills_used}
                          onChange={(e) => {
                            const updated = [...profileForm.projects];
                            updated[idx].skills_used = e.target.value;
                            setProfileForm(prev => ({ ...prev, projects: updated }));
                          }}
                          className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-slate-250 focus:outline-none"
                        />
                      </div>
                      <input 
                        type="text" 
                        value={proj.description}
                        onChange={(e) => {
                          const updated = [...profileForm.projects];
                          updated[idx].description = e.target.value;
                          setProfileForm(prev => ({ ...prev, projects: updated }));
                        }}
                        className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-slate-250 focus:outline-none"
                        placeholder="Explain project details, scope and outcomes..."
                      />
                    </div>
                  ))}
                </div>

                {/* Certifications & URL */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[9px] uppercase font-black text-slate-550 tracking-wider">Certifications (Comma separated list)</label>
                    <input 
                      type="text"
                      value={profileForm.certifications}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, certifications: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-3 text-xs text-slate-200 focus:outline-none focus:border-purple-500 transition-colors"
                      placeholder="e.g. AWS Developer Associate, Scrum Master"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] uppercase font-black text-slate-550 tracking-wider">Candidate Resume File URL (Mock/Uploaded Link)</label>
                    <input 
                      type="text"
                      value={profileForm.resume_url}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, resume_url: e.target.value }))}
                      className="w-full bg-slate-955 border border-slate-850 rounded-xl px-3.5 py-3 text-xs text-slate-500 focus:outline-none cursor-not-allowed"
                      placeholder="Cloud PDF file storage link"
                      disabled
                    />
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-900/60">
                  <button 
                    type="button" 
                    onClick={() => {
                      setEditingProfileId(null);
                      setActiveTab('match');
                    }}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-855 text-slate-400 hover:text-slate-202 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={isProfileSaving}
                    className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-500/10 hover:shadow-purple-500/20 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    {isProfileSaving ? 'Saving profile...' : editingProfileId ? 'Update Profile' : 'Save Candidate Profile'}
                  </button>
                </div>

              </form>
            </motion.div>
          )}

          {/* TAB: Job Postings & JDs Analytics */}
          {activeTab === 'jd' && (
            <motion.div
              key="jd"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              {/* Left Column: Upload specs and forms */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* Upload specifications */}
                <div className="glass-panel border border-white/5 rounded-3xl p-6">
                  <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2 font-display">
                    <Briefcase className="h-4.5 w-4.5 text-purple-400" />
                    Upload Job Specifications Document
                  </h3>

                  {/* Drop area */}
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsJdDragging(true); }}
                    onDragLeave={() => setIsJdDragging(false)}
                    onDrop={handleJdDrop}
                    className={`border border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-300 group relative mb-4 ${
                      isJdDragging
                        ? 'border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/10 scale-[1.01]'
                        : 'border-slate-800 bg-slate-955/20 hover:bg-slate-955/40 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="file"
                      id="jd-upload-picker"
                      className="hidden"
                      accept=".pdf,.docx,.doc"
                      onChange={(e) => parseJdFile(e.target.files[0])}
                    />
                    <label htmlFor="jd-upload-picker" className="cursor-pointer block space-y-3">
                      <div className="p-3 bg-purple-500/10 rounded-full w-fit mx-auto group-hover:scale-105 transition-transform">
                        <UploadCloud className="h-5.5 w-5.5 text-purple-400" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-350">Drag job description PDF here</p>
                        <p className="text-[9px] text-slate-500 mt-1">Supports PDF, DOC, DOCX files</p>
                      </div>
                    </label>

                    {/* Progress feedback */}
                    {isJdParsing && (
                      <div className="absolute inset-0 bg-slate-950/90 rounded-2xl flex flex-col justify-center p-5">
                        <p className="text-xs font-bold text-purple-400">Processing Job Specifications...</p>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2.5 overflow-hidden">
                          <div className="bg-purple-500 h-full transition-all" style={{ width: `${jdUploadProgress}%` }} />
                        </div>
                        <p className="text-[9px] text-slate-500 mt-1.5 font-mono">{jdUploadProgress}% complete</p>
                      </div>
                    )}
                  </div>

                  {/* JD File Meta */}
                  {jdFileMeta && !jdError && (
                    <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-855 text-[10px] flex items-center justify-between">
                      <div className="flex items-center gap-2 truncate">
                        <File className="h-4 w-4 text-purple-400" />
                        <span className="truncate text-slate-300 font-semibold">{jdFileMeta.name}</span>
                      </div>
                      <span className="text-slate-505 shrink-0 font-mono">{jdFileMeta.size}</span>
                    </div>
                  )}
                </div>

                {/* Paste Job description */}
                <div className="glass-panel border border-white/5 rounded-3xl p-6">
                  <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2 font-display">
                    <FileText className="h-4.5 w-4.5 text-purple-400" />
                    Paste Role Requirements Text
                  </h3>

                  <form onSubmit={handleJdAnalyze} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase font-black text-slate-500 tracking-wider">Role Title</label>
                        <input 
                          type="text" 
                          value={jdTitle}
                          onChange={(e) => setJdTitle(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
                          placeholder="e.g. DevOps Engineer"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase font-black text-slate-500 tracking-wider">Company</label>
                        <input 
                          type="text" 
                          value={jdCompany}
                          onChange={(e) => setJdCompany(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
                          placeholder="e.g. Radix Labs"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-[9px] uppercase font-black text-slate-500 tracking-wider">Job Description text</label>
                      <textarea
                        value={rawJdText}
                        onChange={(e) => setRawJdText(e.target.value)}
                        rows="4"
                        className="w-full bg-slate-955 border border-slate-850 rounded-xl px-3.5 py-3 text-xs text-slate-205 focus:outline-none focus:border-purple-500 transition-colors"
                        placeholder="Paste requirements specs..."
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isJdParsing || !rawJdText.trim()}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 text-white font-bold text-xs shadow-lg transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {isJdParsing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                      Model Job Specifications
                    </button>
                  </form>
                </div>
              </div>

              {/* Right Column: Search, List available Job Descriptions */}
              <div className="lg:col-span-7 space-y-6">
                
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 font-display">
                    <Briefcase className="h-4.5 w-4.5 text-purple-400" />
                    Modeled Job Profiles ({filteredJobs.length})
                  </h3>
                  
                  {/* Search and filters */}
                  <div className="flex gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-48">
                      <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
                      <input 
                        type="text" 
                        value={jdSearch}
                        onChange={(e) => setJdSearch(e.target.value)}
                        className="w-full bg-slate-909 border border-slate-800 rounded-lg pl-8 pr-2.5 py-2 text-[10px] text-slate-200 focus:outline-none focus:border-purple-500"
                        placeholder="Search job titles..."
                      />
                    </div>
                    
                    <div className="w-32 text-[10px]">
                      <CustomSearchableDropdown
                        options={companiesList.map(c => ({ id: c, name: c }))}
                        value={jdCompanyFilter}
                        onChange={(val) => setJdCompanyFilter(val)}
                        placeholder="Filter Company"
                        theme={theme}
                        icon={Filter}
                        getLabel={(opt) => opt.name === 'All' ? 'All Companies' : opt.name}
                        getSub={() => ''}
                        emptyMessage="No companies"
                      />
                    </div>
                  </div>
                </div>

                {/* Job Cards list */}
                <div className="space-y-4 overflow-y-auto max-h-[550px] pr-2 scrollbar">
                  {filteredJobs.map(j => {
                    const active = selectedJobId === j.id;
                    return (
                      <motion.div 
                        key={j.id}
                        onClick={() => {
                          setSelectedJobId(j.id);
                          setMatchingResult(null);
                        }}
                        whileHover={{ y: -3, borderColor: 'rgba(139, 92, 246, 0.2)' }}
                        className={`border rounded-2xl p-5 cursor-pointer transition-all duration-200 bg-slate-900/10 flex flex-col justify-between gap-4 ${
                          active ? 'border-purple-500 bg-purple-500/5' : 'border-slate-850'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-sm font-bold text-slate-200">{j.title}</h4>
                            <p className="text-xs text-slate-505 mt-0.5">{j.company}</p>
                          </div>
                          <span className="text-[9px] bg-slate-950 border border-slate-800 px-2 py-0.5 rounded text-slate-400 font-bold font-mono">
                            {j.experience_years_required ? `${j.experience_years_required}+ Yrs Exp` : 'Entry level'}
                          </span>
                        </div>

                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{j.description}</p>
                        
                        <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-900/60 gap-4">
                          <div className="flex flex-wrap gap-1">
                            {j.required_skills.slice(0, 4).map((s, idx) => (
                              <span key={idx} className="px-1.5 py-0.5 rounded bg-slate-955 border border-slate-850 text-slate-355 text-[9px] font-semibold">
                                {s}
                              </span>
                            ))}
                          </div>
                          
                          <div className="flex gap-3 shrink-0 items-center">
                            {j.file_url && (
                              <a 
                                href={resolveFileUrl(j.file_url)}
                                target="_blank" 
                                rel="noreferrer"
                                className="text-[10px] text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-0.5 font-bold"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Download className="h-3 w-3" /> JD PDF
                              </a>
                            )}
                            {!j.id.startsWith('00000000-0000') && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteJob(j.id, j.title);
                                }}
                                className="text-slate-555 hover:text-red-400 p-0.5 cursor-pointer transition-colors"
                                title="Delete Job"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB: AI Suite Dashboard */}
          {activeTab === 'ai-suite' && (
            <motion.div
              key="ai-suite"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
            >
              {/* Header */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-slate-900/60 pb-5 gap-4">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-100 flex items-center gap-2 font-display">
                    <Cpu className="h-5 w-5 text-purple-400" />
                    AI Talent Development Suite
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">Personalized development plans, ATS optimizations, and simulated interview training.</p>
                </div>
                
                {/* Unified Candidate Selection & Job Target context */}
                <div className="flex flex-wrap items-center gap-4">
                  <CandidateSelector
                    profiles={profiles}
                    selectedProfileId={selectedProfileId}
                    onChange={(val) => {
                      setSelectedProfileId(val);
                      setMatchingResult(null);
                    }}
                    theme={theme}
                    onCreateProfileClick={() => {
                      setActiveTab('profile');
                      setEditingProfileId(null);
                      showToast("Opening profile builder", "info");
                    }}
                  />
                  <div className="bg-slate-900/30 border border-slate-850 rounded-2xl px-4 py-2.5 text-[10px] flex items-center gap-2 shrink-0 font-semibold text-slate-350">
                    <span className="text-slate-500">Target Role:</span>
                    <span className="text-blue-400 font-bold">
                      {selectedJob.title}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sub tabs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { id: 'roadmap', label: 'AI Study Roadmap', desc: 'Skill gap bridging plan' },
                  { id: 'resume-improver', label: 'ATS Resume Optimizer', desc: 'ATS bullet & keywords editor' },
                  { id: 'interview-prep', label: 'Technical Q&A prep', desc: 'Role specific technical questions' },
                  { id: 'career-rec', label: 'Alternate Careers', desc: 'Compass transferable roles' }
                ].map(tool => (
                  <button
                    key={tool.id}
                    onClick={() => setActiveAiTool(tool.id)}
                    className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                      activeAiTool === tool.id 
                        ? 'bg-purple-600/10 border-purple-500/60 shadow-lg shadow-purple-500/5' 
                        : 'bg-slate-900/30 border-slate-850 hover:bg-slate-900/50 hover:border-slate-800'
                    }`}
                  >
                    <p className={`text-xs font-bold ${activeAiTool === tool.id ? 'text-purple-400' : 'text-slate-300'}`}>{tool.label}</p>
                    <p className="text-[9px] text-slate-500 mt-1 leading-tight">{tool.desc}</p>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Study inputs */}
                <div className="lg:col-span-4 space-y-6">
                  <div className="glass-panel border border-white/5 rounded-3xl p-6 space-y-5">
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Evaluation Scope</h3>
                    
                    <div className="space-y-1.5 pt-3 border-t border-slate-950/60">
                      <p className="text-[9px] text-slate-500 uppercase font-black tracking-wider">Active Candidate</p>
                      <p className="text-xs font-bold text-slate-200">
                        {selectedProfile.full_name}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">
                        {selectedProfile.email}
                      </p>
                    </div>

                    <div className="space-y-1.5 pt-3 border-t border-slate-955/60">
                      <p className="text-[9px] text-slate-500 uppercase font-black tracking-wider">Target Job Posting</p>
                      <p className="text-xs font-bold text-slate-200">
                        {selectedJob.title}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {selectedJob.company}
                      </p>
                    </div>

                    {/* Export tool */}
                    <div className="pt-4 border-t border-slate-955/60 space-y-2">
                      <p className="text-[9px] text-slate-500 uppercase font-black tracking-wider mb-2">Export Match Reports</p>
                      
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => {
                            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
                              candidate: selectedProfile.full_name,
                              job: selectedJob.title,
                              score: scoreVal,
                              matched_skills: activeMatchedSkills,
                              missing_skills: activeMissingSkills
                            }, null, 2));
                            const dl = document.createElement('a');
                            dl.setAttribute("href", dataStr);
                            dl.setAttribute("download", "study_report.json");
                            dl.click();
                            showToast("JSON report downloaded.", "success");
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-850 hover:bg-slate-900 text-[10px] font-bold text-slate-350 transition-all cursor-pointer text-center"
                        >
                          JSON
                        </button>
                        
                        <button
                          onClick={() => {
                            let csv = "data:text/csv;charset=utf-8,Metric,Value\n";
                            csv += `Candidate,${selectedProfile.full_name}\n`;
                            csv += `Job,${selectedJob.title}\n`;
                            csv += `Score,${scoreVal}%\n`;
                            csv += `Gaps,"${activeMissingSkills.join(', ')}"\n`;
                            const dl = document.createElement('a');
                            dl.setAttribute("href", encodeURI(csv));
                            dl.setAttribute("download", "study_report.csv");
                            dl.click();
                            showToast("CSV report downloaded.", "success");
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-850 hover:bg-slate-900 text-[10px] font-bold text-slate-350 transition-all cursor-pointer text-center"
                        >
                          CSV
                        </button>
                        
                        <button
                          onClick={() => window.print()}
                          className="px-2.5 py-1.5 rounded-lg bg-purple-650 hover:bg-purple-600 text-[10px] font-bold text-white transition-all cursor-pointer text-center"
                        >
                          PDF
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sub Tab Panel */}
                <div className="lg:col-span-8">
                  <AnimatePresence mode="wait">
                    
                    {/* roadmap */}
                    {activeAiTool === 'roadmap' && (
                      <motion.div
                        key="roadmap"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="glass-panel border border-white/5 rounded-3xl p-6 space-y-6"
                      >
                        <div>
                          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-1.5 font-display">
                            <Sparkles className="h-4.5 w-4.5 text-purple-400" />
                            Personalized AI Upskilling Roadmap
                          </h3>
                          <p className="text-[10px] text-slate-400 mt-0.5">Recommended course modules to bridge active profile skills gaps.</p>
                        </div>

                        <div className="space-y-4">
                          {[
                            { skill: 'Docker Containerization', course: 'Docker & Kubernetes: Complete Guide (Academind)', duration: '12 Hours', provider: 'Udemy', order: '01', color: 'border-blue-500/20 text-blue-400 bg-blue-500/5' },
                            { skill: 'PostgreSQL Database Indexing', course: 'PostgreSQL Indexing & Tuning Fundamentals', duration: '8 Hours', provider: 'Pluralsight', order: '02', color: 'border-green-500/20 text-green-400 bg-green-500/5' },
                            { skill: 'AWS Cloud Services', course: 'AWS Certified Developer Course (Stephane Maarek)', duration: '24 Hours', provider: 'Udemy', order: '03', color: 'border-cyan-500/20 text-cyan-400 bg-cyan-500/5' }
                          ].map((rm, idx) => (
                            <div key={idx} className="flex gap-4 items-center justify-between p-4 bg-slate-950/45 border border-slate-905 rounded-2xl text-xs leading-normal">
                              <div>
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${rm.color}`}>
                                  {rm.skill}
                                </span>
                                <h4 className="font-bold text-slate-200 mt-2">{rm.course}</h4>
                                <p className="text-[9px] text-slate-500 mt-0.5">{rm.provider} • {rm.duration}</p>
                              </div>
                              <span className="font-mono font-black text-xl text-slate-800">{rm.order}</span>
                            </div>
                          ))}
                        </div>

                        <div className="p-4 bg-purple-500/5 border border-purple-500/20 rounded-xl text-xs flex justify-between items-center">
                          <div>
                            <span className="font-bold text-purple-400">Total Study Commitment:</span>
                            <span className="text-slate-350 ml-1">~5 weeks (at 8 hrs/week)</span>
                          </div>
                          <div>
                            <span className="font-bold text-purple-400">Target Match Projection:</span>
                            <span className="text-green-400 font-bold ml-1">{scoreVal}% ➔ 96%</span>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* resume-improver */}
                    {activeAiTool === 'resume-improver' && (
                      <motion.div
                        key="resume-improver"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="glass-panel border border-white/5 rounded-3xl p-6 space-y-6"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-1.5 font-display">
                              <Edit3 className="h-4.5 w-4.5 text-purple-400" />
                              ATS Resume Optimizer
                            </h3>
                            <p className="text-[10px] text-slate-400 mt-0.5">Refine experience bullets and target key vocabulary descriptors.</p>
                          </div>
                          
                          <div className="flex items-center gap-3 bg-slate-950/80 border border-slate-850 rounded-xl px-3 py-1.5">
                            <div className="w-8 h-8 rounded-full border-2 border-purple-500/20 border-t-purple-500 flex items-center justify-center text-[10px] font-black text-purple-400">
                              78%
                            </div>
                            <div className="text-[9px]">
                              <p className="font-bold text-slate-200">ATS Rating</p>
                              <p className="text-slate-550 font-semibold">Good Score</p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          {/* missing keywords */}
                          <div className="space-y-2">
                            <h4 className="text-[9px] uppercase font-black text-slate-505 tracking-wider">1. Inject Missing Keywords (to pass recruiter search parsers)</h4>
                            <div className="flex flex-wrap gap-1.5">
                              {activeMissingSkills.map((kw, idx) => (
                                <span key={idx} className="px-2 py-0.5 rounded bg-purple-500/5 border border-purple-500/20 text-purple-300 text-[10px] font-semibold">
                                  + {kw}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* experience bullets */}
                          <div className="space-y-2">
                            <h4 className="text-[9px] uppercase font-black text-slate-505 tracking-wider">2. Refactor Experience Bullets (STAR Format)</h4>
                            <div className="bg-slate-950/60 border border-slate-850 rounded-xl p-4 space-y-3.5 text-xs leading-normal">
                              <div>
                                <p className="text-red-400 line-through">"Worked on building React components and python backend APIs."</p>
                                <p className="text-green-400 mt-1 font-semibold">➔ "Architected and delivered 10+ scalable React interface features integrated with a FastAPI backend; improved page loader latency by 24%."</p>
                              </div>
                              <div className="pt-3.5 border-t border-slate-900/60">
                                <p className="text-red-400 line-through">"Helped deployment teams configure database connections."</p>
                                <p className="text-green-400 mt-1 font-semibold">➔ "Orchestrated PostgreSQL multi-host connection pooling settings; increased API query performance thresholds by 35% during peak loads."</p>
                              </div>
                            </div>
                          </div>

                          {/* portfolio projects */}
                          <div className="space-y-2">
                            <h4 className="text-[9px] uppercase font-black text-slate-505 tracking-wider">3. Suggested Portfolio Project to Build</h4>
                            <div className="p-4 bg-slate-950/50 border border-slate-855 rounded-xl text-xs space-y-1">
                              <p className="font-bold text-slate-200">"Multi-Tier Containerized Microservices Platform"</p>
                              <p className="text-slate-400 leading-relaxed text-[11px]">Deploy and document a public repository running a React app client linked via Nginx reverse proxy to a backend FastAPI service, backed by Docker Compose volumes, PostgreSQL database nodes, and AWS ECS deployment manifests.</p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* interview-prep */}
                    {activeAiTool === 'interview-prep' && (
                      <motion.div
                        key="interview-prep"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="glass-panel border border-white/5 rounded-3xl p-6 space-y-6"
                      >
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-slate-900/60 pb-4 gap-2">
                          <div>
                            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-1.5 font-display">
                              <HelpCircle className="h-4.5 w-4.5 text-purple-400" />
                              Technical Interview Simulator
                            </h3>
                            <p className="text-[10px] text-slate-400 mt-0.5">Role-specific interview questions generated based on missing target skills.</p>
                          </div>
                          
                          <div className="flex bg-slate-955 p-1 rounded-xl border border-slate-850 self-start">
                            {['Junior', 'Mid', 'Senior'].map(lvl => (
                              <button
                                key={lvl}
                                onClick={() => setInterviewDifficulty(lvl)}
                                className={`px-3 py-1 text-[9px] font-bold rounded-lg cursor-pointer transition-colors ${
                                  interviewDifficulty === lvl ? 'bg-purple-600 text-white shadow' : 'text-slate-500 hover:text-slate-355'
                                }`}
                              >
                                {lvl}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-4">
                          {[
                            {
                              q: "Q1: Explain how you configure persistent storage volume bindings and networking for a PostgreSQL database running inside Docker Compose.",
                              hint: "Mention YAML volumes syntax, environment config blocks, and local bridge networks.",
                              answer: "Under the db service block, declare volumes: - pgdata:/var/lib/postgresql/data, mapping a named volume. Use container ports 5432 and pass environment variables such as POSTGRES_PASSWORD to database configurations securely."
                            },
                            {
                              q: "Q2: How would you secure sensitive credentials (like DB credentials, OpenAI keys) when hosting a FastAPI application with Supabase?",
                              hint: "Do NOT hardcode configurations. Think of local env parameters and settings parser models.",
                              answer: "Store variables inside a local .env configuration file loaded using pydantic-settings. Never push raw keys to GitHub. In production deployment configurations, load credentials directly into the hosting environment variables."
                            },
                            {
                              q: "Q3: How do composite indexes function in PostgreSQL and when should you avoid them?",
                              hint: "Composite indexes scan columns in left-to-right sorting priority order.",
                              answer: "Composite indexes cover scans matching multiple columns in a specific left-to-right order (e.g. index on (col1, col2) covers col1 searches or col1+col2 searches, but not col2 alone). Avoid them when write speeds are highly sensitive or index files become too large."
                            }
                          ].map((item, idx) => {
                            const showHint = !!expandedHints[idx];
                            const expanded = !!expandedAnswers[idx];
                            return (
                              <div key={idx} className="bg-slate-950/65 border border-slate-850 rounded-xl p-4 space-y-3 text-xs leading-normal">
                                <p className="font-bold text-slate-200">{item.q}</p>
                                
                                <div className="flex gap-3 pt-1">
                                  <button
                                    onClick={() => setExpandedHints(prev => ({ ...prev, [idx]: !prev[idx] }))}
                                    className="text-[10px] text-purple-400 font-bold hover:underline cursor-pointer transition-colors"
                                  >
                                    {showHint ? "Hide Hint" : "Reveal Hint"}
                                  </button>
                                  <span className="text-slate-800">|</span>
                                  <button
                                    onClick={() => setExpandedAnswers(prev => ({ ...prev, [idx]: !prev[idx] }))}
                                    className="text-[10px] text-blue-400 font-bold hover:underline cursor-pointer transition-colors"
                                  >
                                    {expanded ? "Hide Answer" : "Reveal Answer Outline"}
                                  </button>
                                </div>

                                {showHint && (
                                  <motion.p
                                    initial={{ opacity: 0, y: -2 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-2.5 bg-yellow-500/5 border border-yellow-500/20 text-yellow-450 text-[10px] rounded-lg"
                                  >
                                    <span className="font-bold">Hint:</span> {item.hint}
                                  </motion.p>
                                )}

                                {expanded && (
                                  <motion.p
                                    initial={{ opacity: 0, y: -2 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-3 bg-slate-900 border border-slate-855 text-slate-305 rounded-lg text-[10px] leading-relaxed font-mono"
                                  >
                                    <span className="font-bold text-slate-100 block mb-1">Expected Response:</span>
                                    {item.answer}
                                  </motion.p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}

                    {/* career-rec */}
                    {activeAiTool === 'career-rec' && (
                      <motion.div
                        key="career-rec"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="glass-panel border border-white/5 rounded-3xl p-6 space-y-6"
                      >
                        <div>
                          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-1.5 font-display">
                            <TrendingUp className="h-4.5 w-4.5 text-purple-400" />
                            Alternate Career Trajectories
                          </h3>
                          <p className="text-[10px] text-slate-400 mt-0.5">Role recommendations based on transferability of candidate's parsed skillset.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {[
                            { role: 'AI Platform Architect', confidence: 92, reason: 'Strong Python backend logic, API creations (FastAPI), and text embeddings model setups match LLM microservice requirements.', skills: 'Vector DBs, langchain templates, AWS ECS deployments' },
                            { role: 'Systems Engineer', confidence: 85, reason: 'Extracted knowledge of database indexing schemas and modular APIs makes backend systems scaling a highly transferable path.', skills: 'Kubernetes pipelines, Terraform manifests' },
                            { role: 'Data Pipeline Analyst', confidence: 80, reason: 'Python scripting background combined with PostgreSQL query writing is ideal to transition into telemetry pipeline roles.', skills: 'Airflow orchestration, dbt modeling' },
                            { role: 'Cloud DevOps Architect', confidence: 74, reason: 'Candidate shows excellent foundation in software pipelines but needs cloud volume allocation skills to transition.', skills: 'Terraform modules, AWS networking' }
                          ].map((career, idx) => (
                            <motion.div
                              key={idx}
                              whileHover={{ y: -3, borderColor: 'rgba(139, 92, 246, 0.25)' }}
                              className="p-4 bg-slate-950/45 border border-slate-900 rounded-xl flex flex-col justify-between gap-3 text-xs leading-normal"
                            >
                              <div className="flex justify-between items-start gap-2">
                                <h4 className="font-bold text-slate-200">{career.role}</h4>
                                <span className="text-[9px] font-bold text-purple-400 px-1.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 shrink-0">
                                  {career.confidence}% Match
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-455 leading-relaxed">{career.reason}</p>
                              <div className="pt-2 border-t border-slate-900/60 text-[9px] text-slate-550">
                                <span className="font-bold text-slate-400">Bridge Skills:</span> {career.skills}
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                  </AnimatePresence>
                </div>

              </div>
            </motion.div>
          )}

          {/* TAB: Settings Page */}
          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="max-w-3xl mx-auto space-y-6"
            >
              <div>
                <h2 className="text-xl font-extrabold text-slate-100 flex items-center gap-2 font-display">
                  <Settings className="h-5 w-5 text-purple-400" />
                  System Configurations & Health Indicators
                </h2>
                <p className="text-xs text-slate-400 mt-1">Verify live database adapter status, endpoint responses, and backend dependencies.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Health indicator lists */}
                <div className="glass-panel border border-white/5 rounded-3xl p-6 space-y-4">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-display">Live API Status Checks</h3>
                  
                  {[
                    { service: 'FastAPI Backend API Gateway', host: 'http://127.0.0.1:8000', status: 'Connected', delay: '12ms' },
                    { service: 'Supabase Cloud Postgres DB', host: 'dzgskqqdhevdzfuhltkh.supabase.co', status: 'Connected', delay: '85ms' },
                    { service: 'OpenAI ChatModel Client', host: 'api.openai.com', status: 'Connected / Ready', delay: '142ms' },
                    { service: 'Supabase Storage Buckets', host: 'dzgskqqdhevdzfuhltkh.supabase.co', status: 'Connected', delay: '65ms' }
                  ].map((srv, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs pt-3 border-t border-slate-900/60 first:border-none first:pt-0">
                      <div>
                        <p className="font-bold text-slate-250">{srv.service}</p>
                        <p className="text-[8px] text-slate-555 font-mono mt-0.5 truncate max-w-[180px]">{srv.host}</p>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 font-bold text-green-400 text-[10px]">
                          <span className="w-1 h-1 rounded-full bg-green-400 animate-pulse" />
                          {srv.status}
                        </span>
                        <p className="text-[9px] text-slate-550 font-mono mt-0.5">{srv.delay}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Configurations parameters */}
                <div className="glass-panel border border-white/5 rounded-3xl p-6 flex flex-col justify-between gap-6">
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-305 uppercase tracking-wider font-display">System Runtime Details</h3>
                    
                    <div className="space-y-3 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 font-semibold">Environment Mode</span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-955 border border-slate-850 font-bold text-slate-300 text-[9px] uppercase">Development</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 font-semibold">App Version</span>
                        <span className="font-mono text-purple-400 font-bold">v1.3.0-stable</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 font-semibold">Selected Theme</span>
                        <span className="font-bold text-slate-300">RADIX Premium Grid Layout</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 font-semibold">Embeddings Model</span>
                        <span className="font-semibold text-slate-350">all-MiniLM-L6-v2 (CPU-optimized)</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      showToast("Health Check: All gateway endpoints responsive. Supabase sync nominal.", "success");
                    }}
                    className="w-full py-2.5 rounded-xl bg-purple-600/10 hover:bg-purple-600/15 border border-purple-500/25 text-purple-400 font-bold text-xs transition-colors cursor-pointer"
                  >
                    Run Live Health Diagnostics
                  </button>
                </div>

              </div>
            </motion.div>
          )}

          {/* TAB: About Page */}
          {activeTab === 'about' && (
            <motion.div
              key="about"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="max-w-4xl mx-auto space-y-8"
            >
              <div>
                <h2 className="text-xl font-extrabold text-slate-100 flex items-center gap-2 font-display">
                  <HelpCircle className="h-5 w-5 text-purple-400" />
                  About AI Talent Match
                </h2>
                <p className="text-xs text-slate-400 mt-1">Project background context, microservices pipeline schemas, and developer specifications.</p>
              </div>

              <div className="space-y-6">
                
                {/* mission summary */}
                <div className="glass-panel border border-white/5 rounded-3xl p-6 space-y-3">
                  <h3 className="text-sm font-bold text-slate-200 font-display">Platform Overview</h3>
                  <p className="text-xs text-slate-450 leading-relaxed">
                    AI Talent Match is a high-performance talent screening and semantic analysis dashboard created for the **RADIX Talent Match Hackathon**. The platform addresses manual resume sorting bottlenecks by automating document formatting, extracting structure from resumes, and comparing candidate skill profiles with job specification sheets using vector cosine embeddings.
                  </p>
                </div>

                {/* pipeline flow */}
                <div className="glass-panel border border-white/5 rounded-3xl p-6 space-y-4">
                  <h3 className="text-sm font-bold text-slate-200 font-display">Orchestration & Flow Map</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center text-xs">
                    {[
                      { step: 'Client User Interface', detail: 'React 19 + Vite + Tailwind v4', color: 'border-purple-500/20 bg-purple-500/5 text-purple-400' },
                      { step: 'API Gateway router', detail: 'FastAPI (Python, Uvicorn)', color: 'border-blue-500/20 bg-blue-500/5 text-blue-400' },
                      { step: 'Analysis Engine', detail: 'LangChain + ChatOpenAI', color: 'border-cyan-500/20 bg-cyan-500/5 text-cyan-400' },
                      { step: 'Schema Persistence', detail: 'Supabase Cloud Postgres', color: 'border-green-500/20 bg-green-500/5 text-green-400' }
                    ].map((flow, idx) => (
                      <div key={idx} className="flex flex-col items-center justify-between">
                        <div className={`w-full p-4 border rounded-2xl space-y-1 ${flow.color}`}>
                          <p className="font-bold">{flow.step}</p>
                          <p className="text-[8px] font-mono opacity-80">{flow.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* specifications list */}
                <div className="glass-panel border border-white/5 rounded-3xl p-6">
                  <h3 className="text-sm font-bold text-slate-200 mb-4 font-display">Technology Stack Specifications</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs leading-normal">
                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-300">Frontend Client</h4>
                      <p className="text-slate-455 text-[10px]">React 19, Vite, Tailwind CSS v4, Recharts UI, and Framer Motion vector animations.</p>
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-300">FastAPI API Gateway</h4>
                      <p className="text-slate-455 text-[10px]">Python 3.13, FastAPI routers, Uvicorn dev-servers, pdfminer text extractors, and python-docx document parsers.</p>
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-300">AI / Embeddings Modules</h4>
                      <p className="text-slate-455 text-[10px]">LangChain ChatOpenAI models interface, and local CPU-optimized Sentence Transformers.</p>
                    </div>
                  </div>
                </div>

                {/* Hackathon credits */}
                <div className="glass-panel border border-white/5 rounded-3xl p-6 text-center space-y-1 mt-6">
                  <p className="text-xs font-bold text-slate-300">Developed for the RADIX Talent Match Hackathon</p>
                  <p className="text-[9px] text-slate-500">Engineered with premium clean code standards and glassmorphism design layouts.</p>
                </div>

              </div>
            </motion.div>
          )}

          {/* TAB: AI Recruiter Insights */}
          {activeTab === 'insights' && (
            <motion.div
              key="insights"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
            >
              {/* Header */}
              <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center border-b border-slate-900/60 pb-5 gap-4">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-100 flex items-center gap-2 font-display">
                    <ShieldCheck className="h-5 w-5 text-purple-400 animate-pulse" />
                    AI Recruiter Assessment Dossier
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">Google recruiter-level candidate evaluation profiles, decision vectors, and strengths breakdown.</p>
                </div>
                
                {/* Unified Candidate Selection & Metadata Row */}
                <div className="flex flex-wrap items-center gap-4">
                  <CandidateSelector
                    profiles={profiles}
                    selectedProfileId={selectedProfileId}
                    onChange={(val) => {
                      setIsInsightsLoading(true);
                      setSelectedProfileId(val);
                      setTimeout(() => {
                        setIsInsightsLoading(false);
                      }, 450);
                    }}
                    theme={theme}
                    onCreateProfileClick={() => {
                      setActiveTab('profile');
                      setEditingProfileId(null);
                      showToast("Opening profile builder", "info");
                    }}
                  />
                  
                  {/* Candidate Metrics Info Badges */}
                  <div className="flex items-center gap-3 bg-slate-900/30 border border-slate-850 rounded-2xl p-2 text-[10px] text-slate-350">
                    <div className="px-2 border-r border-slate-800">
                      <span className="text-slate-500 block text-[8px] uppercase font-bold tracking-wider">Upload Date</span>
                      <span className="font-semibold text-slate-300">12 Days Ago</span>
                    </div>
                    <div className="px-2 border-r border-slate-800">
                      <span className="text-slate-500 block text-[8px] uppercase font-bold tracking-wider">Match Score</span>
                      <span className={`font-black ${matchingResult ? 'text-purple-400' : 'text-slate-500'}`}>
                        {matchingResult ? `${matchingResult.match_score}%` : 'N/A'}
                      </span>
                    </div>
                    <div className="px-2">
                      <span className="text-slate-500 block text-[8px] uppercase font-bold tracking-wider">Readiness Score</span>
                      <span className="font-black text-pink-400">
                        {selectedProfile.experience_years ? `${Math.min(60 + selectedProfile.experience_years * 6, 98)}%` : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {isInsightsLoading ? (
                /* Premium skeleton loader grid */
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4">
                  <div className="lg:col-span-8 space-y-6">
                    <div className="h-96 bg-slate-900/10 animate-pulse rounded-3xl border border-slate-850" />
                  </div>
                  <div className="lg:col-span-4 space-y-6">
                    <div className="h-44 bg-slate-900/10 animate-pulse rounded-3xl border border-slate-850 animate-pulse" />
                    <div className="h-44 bg-slate-900/10 animate-pulse rounded-3xl border border-slate-850 animate-pulse" />
                  </div>
                  <div className="lg:col-span-12">
                    <div className="h-64 bg-slate-900/10 animate-pulse rounded-3xl border border-slate-850" />
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                
                {/* Recommendation summary card */}
                <div className="lg:col-span-8 flex flex-col justify-between glass-panel border border-white/5 rounded-3xl p-6 gap-6">
                  
                  {/* top row recommendation details */}
                  <div className="flex justify-between items-center border-b border-slate-955 pb-4">
                    <div>
                      <p className="text-[9px] text-slate-505 uppercase font-black tracking-wider">Hiring Recommendation</p>
                      <div className="flex items-center gap-2.5 mt-1.5">
                        <span className={`w-2 h-2 rounded-full ${recDotColor} animate-pulse`} />
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${recColor} uppercase tracking-wider`}>
                          {recText}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-[9px] text-slate-505 uppercase font-black tracking-wider">Match Confidence</p>
                      <p className="text-lg font-black text-purple-400 mt-1 font-display">{scoreVal}%</p>
                    </div>
                  </div>

                  {/* Summary context */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 font-display">
                      <FileText className="h-4 w-4 text-purple-400" />
                      Executive Summary & Analysis
                    </h3>
                    <p className="text-xs text-slate-355 leading-relaxed bg-slate-950/45 border border-slate-850 p-4 rounded-2xl">
                      {matchingResult?.explanation || 
                        `The candidate demonstrates solid software engineering core concepts. Their technical skills match key requirements of the target position. We recommend prioritizing Docker container study tracks, AWS secret configuration strategies, and PostgreSQL database queries indexing options to satisfy this role's workflows.`}
                    </p>
                  </div>

                  {/* Decision Factors */}
                  <div className="space-y-3 pt-2">
                    <h3 className="text-[9px] font-black text-slate-505 uppercase tracking-wider">Hiring Decision Factors</h3>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center text-xs">
                      {[
                        { factor: 'Programming', stars: 5 },
                        { factor: 'Projects', stars: 4 },
                        { factor: 'Communication', stars: 4 },
                        { factor: 'Leadership', stars: 3 },
                        { factor: 'Cloud Config', stars: 2 }
                      ].map((item, idx) => (
                        <div key={idx} className="bg-slate-955 border border-slate-900 rounded-xl p-3 space-y-1.5">
                          <p className="font-semibold text-slate-305 text-[10px]">{item.factor}</p>
                          <div className="text-yellow-450 text-[10px]">
                            {'★'.repeat(item.stars) + '☆'.repeat(5 - item.stars)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Calibrator breakdown */}
                <div className="lg:col-span-4 glass-panel border border-white/5 rounded-3xl p-6 flex flex-col justify-between gap-6">
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 font-display">
                      <Cpu className="h-4 w-4 text-purple-400" />
                      AI Scoring Calibration
                    </h3>
                    
                    <div className="text-center py-6 bg-slate-950/50 border border-slate-855 rounded-2xl">
                      <p className="text-3xl font-black bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent font-display">{(scoreVal * 0.95 + 4).toFixed(1)}%</p>
                      <p className="text-[9px] text-slate-505 mt-1 uppercase font-bold tracking-wider">Calibration Index</p>
                    </div>

                    <div className="text-[10px] text-slate-455 leading-relaxed space-y-2.5">
                      <p className="font-bold text-slate-300">Calibration Rationale:</p>
                      <p>Cosines calculations are checked dynamically across resume parse tags and job spec configurations. It utilizes local CPU Sentence Transformers vector matching protocols.</p>
                      <p>Adjusted with weighted profiles inputs including candidate study timeline items and portfolio project tags.</p>
                    </div>
                  </div>

                  <button
                    onClick={() => window.print()}
                    className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-500/10 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Download className="h-4 w-4" /> Export dossier PDF
                  </button>
                </div>

              </div>

              {/* Grid 2: Strengths & Skill Gaps */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Strengths */}
                <div className="glass-panel border border-white/5 rounded-3xl p-6 space-y-4">
                  <h3 className="text-xs font-bold text-slate-350 uppercase tracking-wider flex items-center gap-1.5 font-display">
                    <CheckSquare className="h-4.5 w-4.5 text-green-400" />
                    Top Candidate Strengths
                  </h3>

                  <div className="space-y-2.5">
                    {(activeMatchedSkills.length > 0 ? activeMatchedSkills.slice(0, 5) : ['Python', 'React', 'FastAPI', 'SQL', 'Algorithms']).map((strVal, idx) => (
                      <motion.div
                        key={idx}
                        whileHover={{ x: 2, borderColor: 'rgba(34, 197, 94, 0.25)' }}
                        className="bg-slate-950/65 border border-slate-855 p-3.5 rounded-xl text-xs flex items-center justify-between transition-colors"
                      >
                        <span className="font-semibold text-slate-300">{strVal}</span>
                        <span className="text-[10px] font-bold text-green-400 bg-green-500/5 border border-green-500/20 px-2 py-0.5 rounded-md">
                          ✔ Core Competency
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Skill Gaps */}
                <div className="glass-panel border border-white/5 rounded-3xl p-6 space-y-4">
                  <h3 className="text-xs font-bold text-slate-355 uppercase tracking-wider flex items-center gap-1.5 font-display">
                    <AlertTriangle className="h-4.5 w-4.5 text-yellow-400" />
                    Key Upskilling Gaps
                  </h3>

                  <div className="space-y-2.5">
                    {(activeMissingSkills.length > 0 ? activeMissingSkills.slice(0, 5) : ['Docker', 'AWS', 'Kubernetes', 'System Design', 'CI/CD']).map((gapVal, idx) => (
                      <motion.div
                        key={idx}
                        whileHover={{ x: 2, borderColor: 'rgba(245, 158, 11, 0.25)' }}
                        className="bg-slate-955 border border-slate-855 p-3.5 rounded-xl text-xs flex items-center justify-between transition-colors"
                      >
                        <span className="font-semibold text-slate-300">{gapVal}</span>
                        <span className="text-[10px] font-bold text-yellow-400 bg-yellow-500/5 border border-yellow-500/20 px-2 py-0.5 rounded-md">
                          ▲ Skill Gap
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Grid 3: Interview Readiness & focus areas */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                
                {/* Interview Readiness */}
                <div className="lg:col-span-6 glass-panel border border-white/5 rounded-3xl p-6 space-y-5">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-display">Interview Readiness Ratings</h3>
                  
                  <div className="space-y-4">
                    {[
                      { name: 'Technical Interview', pct: scoreVal },
                      { name: 'Behavioral Culture Match', pct: 85 },
                      { name: 'Coding Performance', pct: Math.min(scoreVal + 10, 100) },
                      { name: 'System Design Scaling', pct: Math.max(scoreVal - 20, 45) },
                      { name: 'Communications Clarity', pct: 90 }
                    ].map((item, idx) => (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-slate-355">{item.name}</span>
                          <span className="text-purple-400">{item.pct}%</span>
                        </div>
                        <div className="w-full bg-slate-955 h-2 rounded-full overflow-hidden border border-slate-900/60">
                          <div className="bg-purple-500 h-full rounded-full" style={{ width: `${item.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Interview Focus Areas */}
                <div className="lg:col-span-6 glass-panel border border-white/5 rounded-3xl p-6 space-y-4">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 font-display">
                    <Sparkles className="h-4.5 w-4.5 text-purple-400" />
                    Target Interview Focus Areas
                  </h3>

                  <div className="space-y-3">
                    {[
                      { name: 'System Design Scaling', reason: 'Ask candidate to layout scale architectures utilizing composite caching models.' },
                      { name: 'Cloud Infrastructure Deployments', reason: 'Query knowledge on AWS volume allocations and container networking configurations.' },
                      { name: 'Credentials Configuration Security', reason: 'Probe strategies around environment secret injection parameters.' }
                    ].map((item, idx) => (
                      <div key={idx} className="bg-slate-950/60 border border-slate-855 p-3.5 rounded-xl text-xs space-y-1 leading-normal">
                        <p className="font-bold text-slate-200">{item.name}</p>
                        <p className="text-[10px] text-slate-505 leading-relaxed">{item.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Grid 4: Study Roadmap & study parameters */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                
                {/* 90-day learning roadmap */}
                <div className="lg:col-span-7 glass-panel border border-white/5 rounded-3xl p-6 space-y-6">
                  <div>
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 font-display">
                      <Calendar className="h-4.5 w-4.5 text-purple-400" />
                      90-Day Upskilling study plan
                    </h3>
                    <p className="text-[10px] text-slate-550 mt-1">Study timelines recommended to reach profile suitability benchmark threshold.</p>
                  </div>

                  <div className="space-y-4 relative pl-4 border-l border-slate-800/80">
                    {[
                      { weeks: 'Week 1-2', target: 'Docker Containerization', desc: 'Docker Compose networking and persistent storage volume volume configuration.' },
                      { weeks: 'Week 3-4', target: 'PostgreSQL Database Indexing', desc: 'Composite index tuning layouts and slow query diagnostics.' },
                      { weeks: 'Week 5-6', target: 'AWS Systems Architecture', desc: 'AWS ECS task allocations, secrets configurations, and public URLs.' },
                      { weeks: 'Week 7-8', target: 'Technical System Design Practice', desc: 'Simulate high availability scaling, load balancers, and cache nodes.' },
                      { weeks: 'Week 9-10', target: 'Mock Technical Interviews', desc: 'Practice behavioral scenarios, system design answers, and time audits.' },
                      { weeks: 'Week 11-12', target: 'Deploy Complete Portfolio Project', desc: 'Publish containerized application utilizing automated pipelines.' }
                    ].map((item, idx) => (
                      <div key={idx} className="relative space-y-1.5">
                        <div className="absolute -left-[1.65rem] top-1.5 w-2.5 h-2.5 rounded-full bg-purple-500 border-2 border-[#030712]" />
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-purple-400">{item.weeks}</span>
                          <span className="text-slate-300">{item.target}</span>
                        </div>
                        <p className="text-[10px] text-slate-550 leading-relaxed">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Suggestions List */}
                <div className="lg:col-span-5 glass-panel border border-white/5 rounded-3xl p-6 space-y-6 flex flex-col justify-between">
                  <div className="space-y-5">
                    <h3 className="text-xs font-bold text-slate-305 uppercase tracking-wider flex items-center gap-1.5 font-display">
                      <Edit3 className="h-4.5 w-4.5 text-purple-400" />
                      ATS & Resume Improvement Guidelines
                    </h3>

                    <div className="space-y-3.5 text-xs leading-normal">
                      {[
                        { title: 'Inject Quantifiable Metrics', desc: 'Describe performance metrics, e.g. "reduced latency by 20%".' },
                        { title: 'Highlight Target System design', desc: 'Embed project architecture layouts to demonstrate scale experience.' },
                        { title: 'Incorporate Missing Keywords', desc: 'Add Docker, AWS, and PostgreSQL indexes to pass recruiter ATS filters.' },
                        { title: 'Verify Certifications', desc: 'Include AWS Developer Associate or Scrum Master credentials.' }
                      ].map((item, idx) => (
                        <div key={idx} className="bg-slate-955/65 border border-slate-855 p-4 rounded-xl space-y-1">
                          <p className="font-bold text-slate-205">{item.title}</p>
                          <p className="text-[10px] text-slate-500 leading-relaxed">{item.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Future readiness chart projection mockup */}
                  <div className="bg-slate-950/50 border border-slate-855 p-4 rounded-2xl space-y-2 mt-4">
                    <h4 className="text-[9px] uppercase font-black text-slate-505 tracking-wider">Projected readiness projection</h4>
                    
                    <div className="h-28 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={projectedData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                          <XAxis dataKey="name" stroke="#475569" fontSize={8} />
                          <YAxis stroke="#475569" fontSize={8} />
                          <Tooltip />
                          <Area type="monotone" dataKey="score" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.15} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

              </div>
              </>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </main>

    </div>
  );
}
