'use client';

import { motion, useScroll, useTransform, AnimatePresence, hover } from "framer-motion";
import { ArrowRight, CheckCircle, Zap, BarChart3, Shield, Users, FileText, Award, Bell, ChevronLeft, ChevronRight, BookOpen, Briefcase, Eye, Heart, Brain, CheckIcon, Clock, Sparkles, Menu, X, Calendar, ChevronDown, ChevronUp, Clock as ClockIcon, MapPin, ExternalLink, Search, Filter } from "lucide-react";
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import { ThemeToggle } from '@/app/components/theme-toggle';

const HomePage = () => {
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0.3]);
  const router = useRouter();
  const [currentAnnouncementIndex, setCurrentAnnouncementIndex] = useState(0);
  const [currentServiceIndex, setCurrentServiceIndex] = useState(0);
  const [autoPlayAnnouncements, setAutoPlayAnnouncements] = useState(true);
  const [autoPlayServices, setAutoPlayServices] = useState(true);
  const [showAnnouncementBar, setShowAnnouncementBar] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showEventsModal, setShowEventsModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMonth, setFilterMonth] = useState<string | null>(null);
  const [isAnnouncementBarExpanded, setIsAnnouncementBarExpanded] = useState(false);
 const heroRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const announcementBarRef = useRef<HTMLDivElement>(null);
const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const handleLoginRedirect = () => {
    router.push('/login');
    setIsMobileMenuOpen(false);
  };

  /* ────────────────────── AIS IMPORTANT DATES ────────────────────── */
  const announcements = [
    { 
      "id": "0", 
      "title": "National Civil Service Day", 
      "date": "April 21", 
      "icon": "🎖️",
      "description": "Honoring the Steel Frame of India",
      "month": "April",
      "day": 21
    },
    { 
      "id": "1", 
      "title": "Police Commemoration Day", 
      "date": "October 21", 
      "icon": "🛡️",
      "description": "Remembering our brave police personnel",
      "month": "October",
      "day": 21
    },
    { 
      "id": "2", 
      "title": "National Forest Martyrs Day", 
      "date": "September 11", 
      "icon": "🌿",
      "description": "Honoring forest service heroes",
      "month": "September",
      "day": 11
    },
    { 
      "id": "3", 
      "title": "Administrative Professionals Day", 
      "date": "April 26", 
      "icon": "📋",
      "description": "Celebrating administrative excellence",
      "month": "April",
      "day": 26
    },
    { 
      "id": "4", 
      "title": "Republic Day Celebrations", 
      "date": "January 26", 
      "icon": "🇮🇳",
      "description": "AIS officers parade participation",
      "month": "January",
      "day": 26
    },
    { 
      "id": "5", 
      "title": "IAS Day / Civil Services Day", 
      "date": "April 21", 
      "icon": "👨‍💼",
      "description": "Commemorating Civil Service contributions to nation-building",
      "month": "April",
      "day": 21
    },
    { 
      "id": "6", 
      "title": "All India Services Foundation Day", 
      "date": "October 21", 
      "icon": "🏛️",
      "description": "Celebrating the establishment of AIS",
      "month": "October",
      "day": 21
    },
    { 
      "id": "7", 
      "title": "Lal Bahadur Shastri Memorial Day", 
      "date": "January 11", 
      "icon": "🎗️",
      "description": "Remembering former PM & civil servant",
      "month": "January",
      "day": 11
    },
    { 
      "id": "8", 
      "title": "Sardar Vallabhbhai Patel Birth Anniversary", 
      "date": "October 31", 
      "icon": "🗿",
      "description": "The 'Iron Man' who unified India - AIS inspiration",
      "month": "October",
      "day": 31
    },
    { 
      "id": "9", 
      "title": "National Voters' Day", 
      "date": "January 25", 
      "icon": "🗳️",
      "description": "AIS officers lead electoral awareness campaigns",
      "month": "January",
      "day": 25
    },
    { 
      "id": "10", 
      "title": "LBSNAA Foundation Day", 
      "date": "April 13", 
      "icon": "🎓",
      "description": "Lal Bahadur Shastri National Academy of Administration",
      "month": "April",
      "day": 13
    },
    { 
      "id": "11", 
      "title": "Mussoorie Foundation Day", 
      "date": "December 1", 
      "icon": "⛰️",
      "description": "Establishment of LBSNAA in Mussoorie",
      "month": "December",
      "day": 1
    },
    { 
      "id": "12", 
      "title": "Annual DGPs/IGPs Conference", 
      "date": "January (variable)", 
      "icon": "👮",
      "description": "IPS leadership conference",
      "month": "January",
      "day": 15
    },
    { 
      "id": "13", 
      "title": "Chief Secretaries Conference", 
      "date": "December (variable)", 
      "icon": "📊",
      "description": "National level administrative planning",
      "month": "December",
      "day": 10
    },
    { 
      "id": "14", 
      "title": "Indian Forest Service Foundation Day", 
      "date": "July 1", 
      "icon": "🌳",
      "description": "Establishment of IFS in 1966",
      "month": "July",
      "day": 1
    },
    { 
      "id": "15", 
      "title": "IPS Foundation Day", 
      "date": "October 21", 
      "icon": "🚔",
      "description": "Indian Police Service establishment",
      "month": "October",
      "day": 21
    },
    { 
      "id": "16", 
      "title": "IAS Foundation Day", 
      "date": "October 21", 
      "icon": "📜",
      "description": "Indian Administrative Service establishment",
      "month": "October",
      "day": 21
    },
    { 
      "id": "17", 
      "title": "National Unity Day (Rashtriya Ekta Diwas)", 
      "date": "October 31", 
      "icon": "🇮🇳",
      "description": "AIS officers participate in unity runs and events",
      "month": "October",
      "day": 31
    },
    { 
      "id": "18", 
      "title": "Kargil Vijay Diwas", 
      "date": "July 26", 
      "icon": "🎖️",
      "description": "Civil services pay tribute to armed forces",
      "month": "July",
      "day": 26
    },
    { 
      "id": "19", 
      "title": "Martyr's Day (Shaheed Diwas)", 
      "date": "March 23", 
      "icon": "🕊️",
      "description": "Remembering Bhagat Singh, Sukhdev, and Rajguru",
      "month": "March",
      "day": 23
    },
    { 
      "id": "20", 
      "title": "IPS Martyrs' Day", 
      "date": "October 21", 
      "icon": "🕯️",
      "description": "Honoring police personnel who died in line of duty",
      "month": "October",
      "day": 21
    },
    { 
      "id": "21", 
      "title": "Good Governance Day", 
      "date": "December 25", 
      "icon": "⚖️",
      "description": "Birth anniversary of Atal Bihari Vajpayee",
      "month": "December",
      "day": 25
    },
    { 
      "id": "22", 
      "title": "National Panchayati Raj Day", 
      "date": "April 24", 
      "icon": "🏘️",
      "description": "AIS officers engage with local governance bodies",
      "month": "April",
      "day": 24
    },
    { 
      "id": "23", 
      "title": "RTI (Right to Information) Day", 
      "date": "October 12", 
      "icon": "📄",
      "description": "Promoting transparency in administration",
      "month": "October",
      "day": 12
    },
    { 
      "id": "24", 
      "title": "District Collector's Conference", 
      "date": "Quarterly (variable)", 
      "icon": "🗓️",
      "description": "State-level administrative review",
      "month": "March",
      "day": 15
    },
    { 
      "id": "25", 
      "title": "Swachh Bharat Mission Anniversary", 
      "date": "October 2", 
      "icon": "🧹",
      "description": "AIS officers lead cleanliness drives",
      "month": "October",
      "day": 2
    },
    { 
      "id": "26", 
      "title": "Digital India Week", 
      "date": "July 1-7", 
      "icon": "💻",
      "description": "Promoting digital governance initiatives",
      "month": "July",
      "day": 1
    },
    { 
      "id": "27", 
      "title": "National Nutrition Month", 
      "date": "September", 
      "icon": "🍎",
      "description": "Poshan Abhiyan - AIS implementation focus",
      "month": "September",
      "day": 1
    },
    { 
      "id": "28", 
      "title": "Antyodaya Diwas", 
      "date": "September 25", 
      "icon": "🤝",
      "description": "Birth anniversary of Pandit Deendayal Upadhyaya",
      "month": "September",
      "day": 25
    },
    { 
      "id": "29", 
      "title": "UPSC Civil Services Results Declaration", 
      "date": "May/June (variable)", 
      "icon": "📋",
      "description": "Announcement of new AIS officers",
      "month": "May",
      "day": 20
    },
    { 
      "id": "30", 
      "title": "Foundation Course Commencement", 
      "date": "September 1", 
      "icon": "🎯",
      "description": "New AIS officer trainees begin at LBSNAA",
      "month": "September",
      "day": 1
    },
    { 
      "id": "31", 
      "title": "Independence Day Celebrations", 
      "date": "August 15", 
      "icon": "🇮🇳",
      "description": "AIS officers participate in flag hoisting ceremonies nationwide",
      "month": "August",
      "day": 15
    },
    { 
      "id": "32", 
      "title": "Gandhi Jayanti", 
      "date": "October 2", 
      "icon": "🕊️",
      "description": "AIS officers lead community service initiatives",
      "month": "October",
      "day": 2
    },
    { 
      "id": "33", 
      "title": "National Lok Adalat Day", 
      "date": "Second Saturday (Monthly)", 
      "icon": "⚖️",
      "description": "IAS officers oversee dispute resolution mechanisms",
      "month": "Current Month",
      "day": 8
    },
    { 
      "id": "34", 
      "title": "Civil Services Examination (Prelims)", 
      "date": "May/June (variable)", 
      "icon": "📝",
      "description": "UPSC Civil Services Preliminary Examination",
      "month": "May",
      "day": 28
    },
    { 
      "id": "35", 
      "title": "Civil Services Examination (Mains)", 
      "date": "September (variable)", 
      "icon": "📚",
      "description": "UPSC Civil Services Main Examination",
      "month": "September",
      "day": 16
    },
    { 
      "id": "36", 
      "title": "Civil Services Personality Test", 
      "date": "February-April (variable)", 
      "icon": "🎤",
      "description": "UPSC Interview for selected candidates",
      "month": "February",
      "day": 15
    },
    { 
      "id": "37", 
      "title": "National Women's Day", 
      "date": "February 13", 
      "icon": "👩‍💼",
      "description": "Birth anniversary of Sarojini Naidu - Celebrating women in civil services",
      "month": "February",
      "day": 13
    },
    { 
      "id": "38", 
      "title": "World Environment Day", 
      "date": "June 5", 
      "icon": "🌍",
      "description": "IFS officers lead environmental conservation programs",
      "month": "June",
      "day": 5
    },
    { 
      "id": "39", 
      "title": "International Day of Forests", 
      "date": "March 21", 
      "icon": "🌲",
      "description": "IFS officers organize awareness campaigns",
      "month": "March",
      "day": 21
    },
    { 
      "id": "40", 
      "title": "National Safety Day", 
      "date": "March 4", 
      "icon": "🛡️",
      "description": "IPS officers conduct safety awareness programs",
      "month": "March",
      "day": 4
    },
    { 
      "id": "41", 
      "title": "Anti-Corruption Day", 
      "date": "December 9", 
      "icon": "🚫",
      "description": "AIS officers promote integrity in public service",
      "month": "December",
      "day": 9
    },
    { 
      "id": "42", 
      "title": "National Youth Day", 
      "date": "January 12", 
      "icon": "👥",
      "description": "Birth anniversary of Swami Vivekananda - Youth engagement initiatives",
      "month": "January",
      "day": 12
    },
    { 
      "id": "43", 
      "title": "National Education Day", 
      "date": "November 11", 
      "icon": "📖",
      "description": "Birth anniversary of Maulana Abul Kalam Azad - Education initiatives",
      "month": "November",
      "day": 11
    },
    { 
      "id": "44", 
      "title": "National Tourism Day", 
      "date": "January 25", 
      "icon": "🏞️",
      "description": "AIS officers promote tourism in their districts",
      "month": "January",
      "day": 25
    },
    { 
      "id": "45", 
      "title": "International Customs Day", 
      "date": "January 26", 
      "icon": "🛃",
      "description": "Celebrating customs and border protection services",
      "month": "January",
      "day": 26
    },
    { 
      "id": "46", 
      "title": "Central Armed Police Forces Day", 
      "date": "December 19", 
      "icon": "🪖",
      "description": "Honoring paramilitary forces under IPS leadership",
      "month": "December",
      "day": 19
    },
    { 
      "id": "47", 
      "title": "National Productivity Day", 
      "date": "February 12", 
      "icon": "📈",
      "description": "Focus on administrative efficiency and productivity",
      "month": "February",
      "day": 12
    },
    { 
      "id": "48", 
      "title": "World Hindi Day", 
      "date": "January 10", 
      "icon": "🈂️",
      "description": "Promoting official language in administration",
      "month": "January",
      "day": 10
    },
    { 
      "id": "49", 
      "title": "National Science Day", 
      "date": "February 28", 
      "icon": "🔬",
      "description": "AIS officers promote scientific temper in governance",
      "month": "February",
      "day": 28
    }
  ];

  // Function to get month number from month name
  const getMonthNumber = (monthName: string) => {
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    return months.indexOf(monthName) + 1;
  };

  // Get current date
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1; // 1-12
  const currentDay = currentDate.getDate();

  // Sort announcements by proximity to current date (nearest first)
  const sortedAnnouncements = useMemo(() => {
    return [...announcements].sort((a, b) => {
      const aMonth = getMonthNumber(a.month);
      const bMonth = getMonthNumber(b.month);
      
      // Create date objects for this year
      const aDateThisYear = new Date(currentDate.getFullYear(), aMonth - 1, a.day);
      const bDateThisYear = new Date(currentDate.getFullYear(), bMonth - 1, b.day);
      
      // If date has passed this year, use next year
      const aDate = aDateThisYear < currentDate ? 
        new Date(currentDate.getFullYear() + 1, aMonth - 1, a.day) : aDateThisYear;
      const bDate = bDateThisYear < currentDate ? 
        new Date(currentDate.getFullYear() + 1, bMonth - 1, b.day) : bDateThisYear;
      
      // Calculate difference in days
      const aDiff = Math.abs(aDate.getTime() - currentDate.getTime());
      const bDiff = Math.abs(bDate.getTime() - currentDate.getTime());
      
      return aDiff - bDiff;
    });
  }, [announcements, currentDate]);

  // Get next 3 upcoming events (nearest to current date)
  const upcomingEventsForBar = sortedAnnouncements.slice(0, 3);

  // Get unique months for filter (excluding "Current Month")
  const uniqueMonths = useMemo(() => {
    const months = announcements
      .map(a => a.month)
      .filter(month => month !== "Current Month" && month !== "Variable" && month !== "Monthly");
    return Array.from(new Set(months)).sort((a, b) => 
      getMonthNumber(a) - getMonthNumber(b)
    );
  }, [announcements]);

  // Filter events for modal (sorted chronologically within months)
  const filteredEvents = useMemo(() => {
    let filtered = announcements;
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(event => 
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply month filter
    if (filterMonth) {
      filtered = filtered.filter(event => event.month === filterMonth);
    }
    
    // Sort chronologically: by month, then by day
    return filtered.sort((a, b) => {
      const aMonth = getMonthNumber(a.month);
      const bMonth = getMonthNumber(b.month);
      
      if (aMonth !== bMonth) return aMonth - bMonth;
      return a.day - b.day;
    });
  }, [announcements, searchTerm, filterMonth]);

  /* ────────────────────── SERVICE LOGOS CAROUSEL ────────────────────── */
  const serviceLogos = [
    {
      name: "IAS",
      label: "Indian Administrative Service",
      subLabel: "Civil Administration & Governance",
      borderColor: "border-indigo-200 dark:border-indigo-600",
      borderHover:"hover:border-indigo-300 dark:hover:border-indigo-700",
      bgColor: "bg-gradient-to-br from-indigo-50 to-indigo-100 ",
      bgHover: "hover:bg-gradient-to-br hover:from-indigo-100 hover:to-indigo-50",
      logo: "/ias-logo.png",
      logoDark: "/ias-logo.png"
    },
    {
      name: "IPS",
      label: "Indian Police Service",
      subLabel: "Law & Order Management",
      borderColor: "border-amber-200 dark:border-gray-600",
      borderHover: "hover:border-amber-300 dark:hover:border-amber-700",
      bgColor: "bg-gradient-to-br from-amber-50 to-gray-100 ",
      bgHover: "hover:bg-gradient-to-br hover:from-gray-100 hover:to-amber-50",
      logo: "/ips-logo.png",
      logoDark: "/ips-logo.png"
    },
    {
      name: "IFS",
      label: "Indian Forest Service",
      subLabel: "Environmental Management",
      borderColor: "border-emerald-200 dark:border-emerald-600",
      borderHover: "hover:border-emerald-300 dark:hover:border-amber-700",
      bgColor: "bg-gradient-to-br from-emerald-50 to-emerald-100 ",
      bgHover: "hover:bg-gradient-to-br hover:from-emerald-100 hover:to-emerald-50",
      logo: "/ifs-logo.png",
      logoDark: "/ifs-logo.png"
    },
  ];

  /* ────────────────────── Stats with proper icons ────────────────────── */
  const stats = [
    { icon: Users, value: '500+', label: 'Active AIS Officers' },
    { icon: FileText, value: '1000+', label: 'Service Requests Processed' },
    { icon: Award, value: '99%', label: 'Satisfaction Rate' },
    { icon: Clock, value: '24/7', label: 'Platform Availability' }
  ];

  /* ────────────────────── Improved Scroll event to show/hide announcement bar ────────────────────── */
  useEffect(() => {
    const handleScroll = () => {
      if (heroRef.current && footerRef.current) {
        const footerTop = footerRef.current.getBoundingClientRect().top;
        const viewportHeight = window.innerHeight;
        
        const scrollPosition = window.scrollY;
        const heroHeight = heroRef.current.offsetHeight;
        const shouldShow = scrollPosition > heroHeight * 0.6;
        
        const nearFooter = footerTop < viewportHeight - 200;
        
        setShowAnnouncementBar(shouldShow && !nearFooter);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  /* ────────────────────── Close mobile menu on click outside ────────────────────── */
   useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMobileMenuOpen && 
          !(event.target as Element).closest('.mobile-menu') && 
          !(event.target as Element).closest('.mobile-menu-button')) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isMobileMenuOpen]);

  /* ────────────────────── Close modal on click outside ────────────────────── */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showEventsModal && modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setShowEventsModal(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEventsModal]);

  /* ────────────────────── Smooth Carousel Transitions ────────────────────── */
  useEffect(() => {
    if (!autoPlayServices) return;
    const interval = setInterval(() => {
      setCurrentServiceIndex((prev) => (prev + 1) % serviceLogos.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [autoPlayServices, serviceLogos.length]);

  useEffect(() => {
    if (!autoPlayAnnouncements) return;
    const interval = setInterval(() => {
      setCurrentAnnouncementIndex((prev) => (prev + 1) % sortedAnnouncements.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [autoPlayAnnouncements, sortedAnnouncements.length]);

   const nextAnnouncement = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAutoPlayAnnouncements(false);
    setTimeout(() => setAutoPlayAnnouncements(true), 10000);
    setCurrentAnnouncementIndex((prev) => (prev + 1) % sortedAnnouncements.length);
  };

  const prevAnnouncement = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAutoPlayAnnouncements(false);
    setTimeout(() => setAutoPlayAnnouncements(true), 10000);
    setCurrentAnnouncementIndex((prev) => (prev - 1 + sortedAnnouncements.length) % sortedAnnouncements.length);
  };

  const nextService = () => {
    setAutoPlayServices(false);
    setTimeout(() => setAutoPlayServices(true), 10000);
    setCurrentServiceIndex((prev) => (prev + 1) % serviceLogos.length);
  };

  const prevService = () => {
    setAutoPlayServices(false);
    setTimeout(() => setAutoPlayServices(true), 10000);
    setCurrentServiceIndex((prev) => (prev - 1 + serviceLogos.length) % serviceLogos.length);
  };

  /* ────────────────────── FEATURES ────────────────────── */
  const features = [
    { icon: CheckCircle, title: 'Resource Management', desc: 'Centralized resource allocation and tracking' },
    { icon: Zap, title: 'Service Interface', desc: 'Streamlined service request processing' },
    { icon: BarChart3, title: 'Dashboard Analytics', desc: 'Real‑time insights and reporting' },
    { icon: Shield, title: 'Secure Access', desc: 'Role‑based secure authentication' },
  ];

  const services = [
    {
      icon: Award,
      title: 'Administrative Excellence',
      description: 'Setting benchmarks for professional governance and administrative reforms across the nation'
    },
    {
      icon: BookOpen,
      title: 'Policy Framework',
      description: 'Creating transformative policies that shape the future of India and improve citizen welfare'
    },
    {
      icon: Briefcase,
      title: 'Leadership',
      description: 'Guiding organizations and departments with vision, integrity, and accountability'
    },
    {
      icon: Eye,
      title: 'Transparency',
      description: 'Ensuring open governance and public accountability in all administrative functions'
    }
  ];

  const values = [
    {
      icon: Shield,
      title: 'Integrity',
      description: 'Unwavering commitment to ethical conduct and transparency in all governance matters'
    },
    {
      icon: Users,
      title: 'Public Service',
      description: 'Dedicated to serving citizens and putting nation-building before personal interests'
    },
    {
      icon: Brain,
      title: 'Excellence',
      description: 'Pursuit of highest standards in administration and decision-making'
    },
    {
      icon: Heart,
      title: 'Compassion',
      description: 'Empathy and concern for the welfare of all citizens and communities'
    },
    {
      icon: Sparkles,
      title: 'Innovation',
      description: 'Modern approaches to solve contemporary challenges faced by the nation'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-indigo-50/30 dark:from-gray-900 dark:to-indigo-950/20 overflow-x-hidden">
      {/* ==================== NAVBAR ==================== */}

      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="fixed top-0 w-full z-50 border-b border-indigo-200/40 dark:border-indigo-800/40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-sm"
      >
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 overflow-hidden"
              >
                <Image
                  src="/Government_of_Kerala_Logo.png"
                  alt="Government of Kerala"
                  width={56}
                  height={56}
                  className="h-full w-full object-contain dark:invert-0"
                  priority
                />
              </motion.div>
              <div className="flex flex-col justify-center leading-tight">
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Government of Kerala
                </div>
                <div className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  General Administration (AIS) Dept
                </div>
                <div className="text-sm font-bold text-indigo-700 dark:text-indigo-400">
                  KARMASRI PORTAL
                </div>
              </div>
            </div>

            {/* Desktop Menu */}       
            {/* -------------------HIDDEN---------------- */}
            <div className="hidden md:flex items-center gap-6 lg:gap-8">
              <a
                href="#services"
                className="relative text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 after:absolute after:left-0 after:-bottom-1 after:h-0.5 after:w-0 after:bg-indigo-600 after:transition-all after:duration-200 hover:after:w-full"
              >
                Services
              </a>

              <a
                href="#features"
                className="relative text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 after:absolute after:left-0 after:-bottom-1 after:h-0.5 after:w-0 after:bg-indigo-600 after:transition-all after:duration-200 hover:after:w-full"
              >
                Features
              </a>

               {/* -------------------HIDDEN---------------- */} 
              <a
                href="#stats"
                className="relative text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 after:absolute after:left-0 after:-bottom-1 after:h-0.5 after:w-0 after:bg-indigo-600 after:transition-all after:duration-200 hover:after:w-full hidden"
              >
                Impact
              </a>
              
              <div className="flex items-center gap-4">
                <ThemeToggle />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleLoginRedirect}
                  className="bg-gradient-to-r from-indigo-600 to-indigo-600 hover:from-indigo-700 hover:to-indigo-700 text-white px-5 lg:px-6 py-2.5 rounded-lg font-semibold text-sm tracking-wide transition-all shadow-sm border border-indigo-500/50 dark:border-indigo-600"
                >
                  Officer Portal
                </motion.button>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex items-center gap-3 md:hidden">
              <ThemeToggle />
              <motion.button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="mobile-menu-button text-slate-700 dark:text-slate-300 p-2"
                whileTap={{ scale: 0.9 }}
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </motion.button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mobile-menu md:hidden border-t border-indigo-200/40 dark:border-indigo-800/40 bg-white dark:bg-gray-900"
            >
              <div className="px-4 py-3 space-y-3">
                <a
                  href="#services"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 py-2"
                >
                  Services
                </a>
                <a
                  href="#features"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 py-2"
                >
                  Features
                </a>

                      {/* -------------------HIDDEN---------------- */}
                <a
                  href="#stats"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 py-2 hidden"
                >
                  Impact
                </a>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleLoginRedirect}
                  className="w-full bg-gradient-to-r from-indigo-600 to-indigo-600 hover:from-indigo-700 hover:to-indigo-700 text-white px-4 py-3 rounded-lg font-semibold text-sm tracking-wide transition-all shadow-sm border border-indigo-500/50 dark:border-indigo-600"
                >
                  Officer Portal
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* ==================== HERO SECTION ==================== */}
      <section ref={heroRef} className="relative w-full min-h-screen flex items-center justify-center overflow-hidden pt-16 md:pt-20">
        {/* Background Image + Overlay */}
        <motion.div style={{ opacity }} className="absolute inset-0 z-0">
          <Image
            src="/images/secratariate.jpg"
            alt="Kerala Secretariat"
            fill
            className="object-cover"
            priority
            quality={100}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/90 via-indigo-800/85 to-indigo-900/90 dark:from-gray-950/90 dark:via-indigo-900/85 dark:to-gray-950/90 z-10" />
        </motion.div>

        {/* Hero Content */}
        <div className="relative z-20 px-4 sm:px-6 lg:px-8 w-full max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="text-left space-y-6 lg:space-y-8 flex-1 max-w-2xl"
            >
              {/* Hero Title */}
              <div className="space-y-3">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="relative inline-block"
                >
                  <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tighter relative">
                    <span className="absolute -top-2 -left-2 sm:-top-3 sm:-left-3 text-indigo-900/80 dark:text-indigo-950 blur-[4px]">KARMASRI</span>
                    <span className="absolute -top-1 -left-1 sm:-top-2 sm:-left-2 text-indigo-800/90 dark:text-indigo-900 blur-[3px]">KARMASRI</span>
                    <span className="relative text-white drop-shadow-[0_2px_4px rgba(0,0,0,0.5)] shadow-indigo-800/50">
                      KARMASRI
                    </span>
                  </h1>
                </motion.div>

                {/* Full Form */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                  className="text-sm sm:text-base md:text-lg font-semibold text-white/95 tracking-wide"
                >
                  <div className="flex flex-wrap items-center gap-0 mb-1">
                    <span className="text-white/95 drop-shadow-[0_1px_2px rgba(0,0,0,0.7)]">K</span>
                    <span className="text-white/95">erala Cadre</span>
                    <span className="text-white/95 drop-shadow-[0_1px_2px rgba(0,0,0,0.7)] ml-1 sm:ml-2">A</span>
                    <span className="text-white/95">IS Officers&apos;</span>
                    <span className="text-white/95 drop-shadow-[0_1px_2px rgba(0,0,0,0.7)] ml-1 sm:ml-2">R</span>
                    <span className="text-white/95">esource</span>
                    <span className="text-white/95 drop-shadow-[0_1px_2px rgba(0,0,0,0.7)] ml-1 sm:ml-2">M</span>
                    <span className="text-white/95">anagement</span>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-0">
                    <span className="text-white/95 drop-shadow-[0_1px_2px rgba(0,0,0,0.7)]">A</span>
                    <span className="text-white/95">nd</span>
                    <span className="text-white/95 drop-shadow-[0_1px_2px rgba(0,0,0,0.7)] ml-1 sm:ml-2">S</span>
                    <span className="text-white/95">ervice</span>
                    <span className="text-white/95 drop-shadow-[0_1px_2px rgba(0,0,0,0.7)] ml-1 sm:ml-2">R</span>
                    <span className="text-white/95">elated</span>
                    <span className="text-white/95 drop-shadow-[0_1px_2px rgba(0,0,0,0.7)] ml-1 sm:ml-2">I</span>
                    <span className="text-white/95">nterface</span>
                  </div>
                </motion.div>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.7 }}
                  className="text-sm sm:text-base md:text-lg text-white/80 max-w-xl leading-relaxed pt-3 sm:pt-4"
                >
                  Streamlining administrative excellence for Kerala cadre All India Services officers through unified resource management and service interface.
                </motion.p>
              </div>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.9 }}
                className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-3 sm:pt-4"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleLoginRedirect}
                  className="bg-white text-indigo-700 hover:bg-indigo-50 px-4 sm:px-5 md:px-7 py-2.5 sm:py-3 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 shadow-lg border border-indigo-300 text-sm sm:text-base"
                >
                  <span>Access Portal</span>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </motion.button>

                {/* -------------------HIDDEN---------------- */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  className="border-2 border-white text-white hover:bg-white/10 px-4 sm:px-5 md:px-7 py-2.5 sm:py-3 rounded-lg font-semibold transition-all duration-300 backdrop-blur border-opacity-40 text-sm sm:text-base hidden"
                >
                  Learn More
                </motion.button>
              </motion.div>
            </motion.div>

            {/* Right Side - SERVICE CAROUSEL - Responsive */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, delay: 0.4 }}
              className="w-full lg:w-auto mt-6 sm:mt-8 lg:mt-0 lg:max-w-md"
            >
              <div className="relative h-[320px] sm:h-[380px] md:h-[420px] w-full rounded-xl sm:rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md border border-white/30 shadow-xl sm:shadow-2xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-indigo-500/10"></div>
                
                <div className="relative z-10 p-4 sm:p-6 h-full flex flex-col">
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-white text-center mb-4 sm:mb-6 flex items-center justify-center gap-2">
                   {/* HIDDEN */} <CheckIcon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-indigo-300 hidden" />
                    Serving All India Services
                  </h3>
                  
                  {/* Carousel Container */}
                  <div className="relative flex-1 flex items-center justify-center">
                    <AnimatePresence mode="wait">
                      {serviceLogos.map((service, index) => 
                        index === currentServiceIndex && (
                          <motion.div
                            key={service.name}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.5 }}
                            className={`absolute w-full h-full flex flex-col items-center justify-center p-4 sm:p-6 rounded-lg sm:rounded-xl ${service.bgColor} border-2 ${service.borderColor} shadow-lg sm:shadow-xl`}
                          >
                            {/* Logo Container */}
                            <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 p-2 sm:p-3 mb-3 sm:mb-4 flex items-center justify-center ">
                              <div className="relative w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20">
                                <Image
                                  src={service.logo}
                                  alt={`${service.name} Logo`}
                                  fill
                                  className="object-contain dark:filter dark:brightness-125"
                                  sizes="(max-width: 640px) 56px, (max-width: 768px) 64px, 80px"
                                />
                              </div>
                            </div>
                            
                            <h4 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 text-center mb-1 sm:mb-2">
                              {service.name}
                            </h4>
                            
                            <p className="text-xs sm:text-sm font-semibold text-gray-700 text-center mb-1 sm:mb-2 px-2">
                              {service.label}
                            </p>
                            
                            <p className="text-xs text-gray-600 text-center px-2 leading-tight">
                              {service.subLabel}
                            </p>
                          </motion.div>
                        )
                      )}
                    </AnimatePresence>
                  </div>
                  
                  {/* Navigation Controls */}
                  <div className="flex justify-between items-center mt-3 sm:mt-4">
                    <motion.button
                      onClick={prevService}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-1.5 sm:p-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-white/30 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </motion.button>
                    
                    {/* Navigation Dots */}
                    <div className="flex gap-1.5 sm:gap-2">
                      {serviceLogos.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setAutoPlayServices(false);
                            setTimeout(() => setAutoPlayServices(true), 10000);
                            setCurrentServiceIndex(index);
                          }}
                          className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all duration-300 ${
                            index === currentServiceIndex
                              ? 'bg-white w-3 sm:w-4'
                              : 'bg-white/50'
                          }`}
                        />
                      ))}
                    </div>
                    
                    <motion.button
                      onClick={nextService}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-1.5 sm:p-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-white/30 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ==================== COMPACT ANNOUNCEMENTS BAR (Clickable - Fixed) ==================== */}
            {/* -------------------HIDDEN---------------- */}
      <AnimatePresence>
        {showAnnouncementBar && (
          <motion.div
            ref={announcementBarRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-4 left-0 right-0 z-40 px-3 hidden"
          >
            <div className="max-w-2xl mx-auto hidden">
              {/* Main Clickable Bar - White with Indigo indigo Theme */}
              <motion.div
                onClick={() => setShowEventsModal(true)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-indigo-200 dark:border-indigo-700 overflow-hidden cursor-pointer group"
              >
                <div className="px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    {/* Left Side - Bell Icon and Label */}
                    <div 
                      className="flex items-center gap-3 flex-shrink-0"
                      onClick={(e) => e.stopPropagation()} // Prevent modal open when clicking icon area
                    >
                      <div className="relative">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700 flex items-center justify-center">
                          <Bell className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        {/* Pulsing animation */}
                        <div className="absolute inset-0 rounded-full bg-indigo-200/50 dark:bg-indigo-700/50 animate-ping opacity-75"></div>
                      </div>
                      <div className="flex flex-col hidden">
                        <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 tracking-wider uppercase">
                          Upcoming Events
                        </span>
                        <span className="text-[9px] text-gray-500 dark:text-gray-400">
                          Click bar to view all
                        </span>
                      </div>
                    </div>

                    {/* Middle - Current Event (NEAREST to current date) */}
                    <div className="flex-1 overflow-hidden min-w-0">
                      <div className="relative h-7 flex items-center">
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={currentAnnouncementIndex}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.2 }}
                            className="absolute w-full"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-bold text-white bg-gradient-to-r from-indigo-600 to-indigo-600 px-2 py-1 rounded border border-indigo-500 whitespace-nowrap">
                                {sortedAnnouncements[currentAnnouncementIndex]?.date}
                              </span>
                              <div className="min-w-0">
                                <h3 className="text-[12px] font-semibold text-gray-900 dark:text-white truncate">
                                  {sortedAnnouncements[currentAnnouncementIndex]?.title}
                                </h3>
                                <p className="text-[10px] text-gray-600 dark:text-gray-400 truncate">
                                  {sortedAnnouncements[currentAnnouncementIndex]?.description}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        </AnimatePresence>
                      </div>
                    </div>

                    {/* Right Side - Navigation and Expand (WITH PROPER CLICK HANDLING) */}
                    <div 
                      className="flex items-center gap-1.5 flex-shrink-0"
                      onClick={(e) => e.stopPropagation()} // Prevent modal open when clicking controls
                    >
                      <motion.button
                        onClick={prevAnnouncement}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-1.5 rounded bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:hover:bg-indigo-800/50 border border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-400 transition"
                      >
                        <ChevronLeft className="w-3 h-3" />
                      </motion.button>
                      
                      {/* Navigation Dots */}
                      <div className="flex gap-1">
                        {[0, 1, 2].map((index) => (
                          <button
                            key={index}
                            onClick={() => {
                              setAutoPlayAnnouncements(false);
                              setTimeout(() => setAutoPlayAnnouncements(true), 10000);
                              setCurrentAnnouncementIndex(index);
                            }}
                            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                              index === currentAnnouncementIndex % 3
                                ? 'bg-indigo-600 dark:bg-indigo-400'
                                : 'bg-indigo-200 dark:bg-indigo-700'
                            }`}
                          />
                        ))}
                      </div>
                      
                      <motion.button
                        onClick={nextAnnouncement}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-1.5 rounded bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:hover:bg-indigo-800/50 border border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-400 transition"
                      >
                        <ChevronRight className="w-3 h-3" />
                      </motion.button>
                      
                      <motion.button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsAnnouncementBarExpanded(!isAnnouncementBarExpanded);
                        }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-1.5 rounded bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:hover:bg-indigo-800/50 border border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-400 transition"
                      >
                        {isAnnouncementBarExpanded ? (
                          <ChevronDown className="w-3 h-3" />
                        ) : (
                          <ChevronUp className="w-3 h-3" />
                        )}
                      </motion.button>
                    </div>
                  </div>

                  {/* Expanded View with Next 3 Events (NEAREST to current date) */}
                  <AnimatePresence>
                    {isAnnouncementBarExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700"
                        onClick={(e) => e.stopPropagation()} // Prevent modal open when clicking expanded content
                      >
                        <div className="space-y-2">
                          <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Next 3 upcoming events (nearest first):
                          </p>
                          {upcomingEventsForBar.map((event, index) => (
                            <div
                              key={event.id}
                              className="flex items-center gap-2 p-2 rounded bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-700">
                                {event.date}
                              </span>
                              <span className="text-[11px] text-gray-800 dark:text-gray-200 truncate">
                                {event.title}
                              </span>
                              <span className="text-[9px] text-gray-500 dark:text-gray-400 ml-auto">
                                {event.month}
                              </span>
                            </div>
                          ))}
                          <div className="text-center pt-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowEventsModal(true);
                              }}
                              className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium underline underline-offset-2"
                            >
                              View All {announcements.length} Events →
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================== SERVICE FLAGS ==================== */}
      <section id="services" className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-indigo-50/50 to-white dark:from-gray-900 dark:to-gray-950">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true, margin: "-50px" }}
            className="text-center mb-8 sm:mb-12"
          >
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-300 dark:border-indigo-700 text-xs font-semibold tracking-widest uppercase text-indigo-700 dark:text-indigo-400 mb-2 sm:mb-3">
              Serving
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-indigo-600 dark:from-indigo-400 dark:to-indigo-400">
                All India Services
              </span>
            </h2>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-2xl mx-auto px-2">
              Supporting Kerala cadre officers across all three major service streams with unified platform access
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {serviceLogos.map((service, index) => (
              <motion.div
                key={service.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                viewport={{ once: true, margin: "-50px" }}
                whileHover={{ y: -5 }}
                className={`group relative rounded-xl sm:rounded-2xl overflow-hidden p-4 sm:p-6 border-2 ${service.borderColor} ${service.borderHover}  ${service.bgColor} ${service.bgHover} transition-all duration-300 hover:shadow-lg`}
              >
                <div className="w-full h-36 sm:h-44 md:h-48 rounded-lg sm:rounded-xl overflow-hidden mb-3 sm:mb-4 flex items-center justify-center p-3 sm:p-4 ">
                  <div className="relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32">
                    <Image
                      src={service.logo}
                      alt={`${service.name} Logo`}
                      fill
                      className="object-contain group-hover:scale-105 transition-transform duration-300 dark:filter dark:brightness-125"
                      sizes="(max-width: 640px) 96px, (max-width: 768px) 112px, 128px"
                    />
                  </div>
                </div>
                <div className="text-center">
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
                    {service.name}
                  </h3>
                  <p className="text-xs sm:text-sm font-semibold text-gray-700 mb-1 line-clamp-2">
                    {service.label}
                  </p>
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {service.subLabel}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== FEATURES ==================== */}
      <section id="features" className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-indigo-50/30 dark:from-gray-900 dark:to-indigo-950/10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true, margin: "-50px" }}
            className="text-center mb-8 sm:mb-12"
          >
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-300 dark:border-indigo-700 text-xs font-semibold tracking-widest uppercase text-indigo-700 dark:text-indigo-400 mb-2 sm:mb-3">
              Key Capabilities
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3">
              Platform <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-indigo-600 dark:from-indigo-400 dark:to-indigo-400">Features</span>
            </h2>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-2xl mx-auto px-2">
              Purpose-built digital modules to support efficient administration for Kerala cadre AIS officers.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1, duration: 0.5 }}
                  viewport={{ once: true, margin: "-50px" }}
                  whileHover={{ y: -3 }}
                  className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-white dark:bg-gray-800 border border-indigo-300 dark:border-indigo-700 p-4 sm:p-6 transition-all duration-300 group shadow-lg hover:shadow-xl"
                >
                  <div className="mb-3 sm:mb-4">
                    <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-600 text-white shadow-md sm:shadow-lg">
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                  </div>

                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {feature.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    {feature.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ==================== SERVICES ==================== */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-indigo-50/30 dark:from-gray-900 dark:to-gray-950">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true, margin: "-50px" }}
            className="text-center mb-8 sm:mb-12"
          >
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-indigo-100 to-indigo-100 dark:from-indigo-900/30 dark:to-indigo-900/30 border border-indigo-300 dark:border-indigo-700 text-xs font-semibold tracking-widest uppercase text-indigo-700 dark:text-indigo-400 mb-2 sm:mb-3">
              Excellence
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-indigo-600 dark:from-indigo-400 dark:to-indigo-400">
                Areas of Excellence
              </span>
            </h2>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-2xl mx-auto px-2">
              How Indian Civil Service Officers contribute to national development
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {services.map((service, index) => {
              const Icon = service.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  viewport={{ once: true, margin: "-50px" }}
                  whileHover={{ y: -3 }}
                  className="bg-gradient-to-br from-indigo-50/80 to-indigo-50/80 dark:from-gray-800 dark:to-gray-700 border border-indigo-300 dark:border-indigo-700 rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-600 to-indigo-600 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        {service.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {service.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ==================== VALUES ==================== */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true, margin: "-50px" }}
            className="text-center mb-8 sm:mb-12"
          >
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-300 dark:border-indigo-700 text-xs font-semibold tracking-widest uppercase text-indigo-700 dark:text-indigo-400 mb-2 sm:mb-3">
              Principles
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-indigo-600 dark:from-indigo-400 dark:to-indigo-400">
                Core Values
              </span>
            </h2>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-2xl mx-auto px-2">
              The principles that guide every Indian Civil Service Officer
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  viewport={{ once: true, margin: "-50px" }}
                  whileHover={{ y: -3 }}
                  className="bg-white dark:bg-gray-800 border border-indigo-300 dark:border-indigo-700 rounded-xl p-3 sm:p-4 hover:shadow-lg transition-all duration-300"
                >
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-indigo-100 to-indigo-100 dark:from-indigo-900/30 dark:to-indigo-900/30 rounded-lg flex items-center justify-center mb-2 sm:mb-3">
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">
                    {value.title}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {value.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ==================== CIVIL SERVICE OBSERVANCE ==================== */}
            {/* -------------------HIDDEN---------------- */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 bg-gradient-to-br from-indigo-50 to-indigo-50 dark:from-gray-900 dark:via-indigo-900/20 dark:to-gray-900 hidden">
        <div className="relative max-w-3xl mx-auto text-center">
          <div className="text-xs font-bold tracking-widest uppercase text-indigo-700 dark:text-indigo-400 mb-3 sm:mb-4 flex items-center justify-center gap-2">
            <Award className="w-4 h-4" />
            April 21 — National Civil Service Day
          </div>

          <div className="flex justify-center gap-1.5 sm:gap-2 mb-4 sm:mb-6">
            <span className="h-1 w-8 sm:w-12 rounded-full bg-[#FF9933]" />
            <span className="h-1 w-8 sm:w-12 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700" />
            <span className="h-1 w-8 sm:w-12 rounded-full bg-green-600" />
          </div>

          <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 font-medium px-2">
            It was on this day in 1947 that 
            <span className="font-semibold text-indigo-700 dark:text-indigo-400 px-1"> Sardar Vallabhbhai Patel</span>, 
            the great &quot;Iron Man of India&quot;, honoured civil servants by calling them the
            <span className="px-2 py-1 mx-1 sm:mx-2 rounded-md bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-semibold italic border border-indigo-300 dark:border-indigo-700">
              &quot;Steel Frame of India&quot;
            </span>
            — the resolute force that executes the policies of the government and
            strengthens the wheel of governance that propels the nation forward.
          </p>
        </div>
      </section>

      {/* ==================== STATS ==================== */}
            {/* -------------------HIDDEN---------------- */}
      <motion.section
        id="stats"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true, margin: "-50px" }}
        className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-indigo-900 via-indigo-700 to-indigo-900 hidden"
      >
        <div className="max-w-7xl mx-auto hidden">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true, margin: "-50px" }}
            className="text-center mb-8 sm:mb-12"
          >
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-xs font-semibold tracking-widest uppercase text-white mb-2 sm:mb-3">
              Impact Metrics
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 sm:mb-3">
              KARMASRI by the Numbers
            </h2>
            <p className="text-sm sm:text-base text-white/90 max-w-2xl mx-auto px-2">
              Exceptional service delivery for Kerala cadre officers
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ scale: 0.8, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  viewport={{ once: true, margin: "-50px" }}
                  whileHover={{ scale: 1.03 }}
                  className="text-center bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/20 hover:bg-white/15 transition-all duration-300"
                >
                  {Icon && (
                    <Icon className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 mx-auto mb-2 sm:mb-3 opacity-90 text-white" />
                  )}
                  <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-1 sm:mb-2">
                    {stat.value}
                  </div>
                  <p className="text-xs sm:text-sm md:text-base text-white/90 font-semibold">
                    {stat.label}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.section>

      {/* ==================== CTA ==================== */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true, margin: "-50px" }}
        className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-indigo-50/30 dark:from-gray-900 dark:to-gray-950"
      >
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-xl sm:rounded-2xl p-6 sm:p-8 md:p-10 text-center shadow-xl border border-indigo-500">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="inline-flex items-center px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-xs font-semibold tracking-widest uppercase text-white mb-2 sm:mb-3"
          >
            Get Started
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2 sm:mb-3"
          >
            Ready to Access Your Portal?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-sm sm:text-base text-white/90 mb-4 sm:mb-6 max-w-2xl mx-auto"
          >
            Join fellow AIS officers in experiencing streamlined administrative services and resource management through KARMASRI.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleLoginRedirect}
              className="bg-white text-indigo-700 px-5 sm:px-6 md:px-8 py-2.5 sm:py-3 rounded-full hover:bg-indigo-50 transition font-bold text-sm border border-indigo-300 shadow-lg"
            >
              Officer Login
            </motion.button>

            {/* -------------------HIDDEN---------------- */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className="border-2 border-white text-white px-5 sm:px-6 md:px-8 py-2.5 sm:py-3 rounded-full hover:bg-white/10 transition font-bold text-sm backdrop-blur hidden"
            >
              Request Access
            </motion.button>
          </motion.div>
        </div>
      </motion.section>

      {/* ==================== FOOTER ==================== */}
      <footer ref={footerRef} className="bg-gradient-to-r from-indigo-900 to-indigo-950 text-white py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
          {/* Tricolour accent */}
          <div className="flex justify-center gap-1">
            <span className="h-1 w-6 sm:w-8 rounded-full bg-[#FF9933]" />
            <span className="h-1 w-6 sm:w-8 rounded-full bg-white" />
            <span className="h-1 w-6 sm:w-8 rounded-full bg-green-600" />
          </div>

          {/* MAIN ROW */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* LEFT SIDE */}
            <div>
              <h3 className="font-bold text-lg tracking-wide mb-1 flex items-center gap-1">
                    {/* -------------------HIDDEN---------------- */}  <CheckIcon className="w-4 h-4 text-indigo-300 hidden" />
                KARMASRI
              </h3>
              <p className="text-indigo-100 max-w-sm text-xs sm:text-sm">
                Streamlining administrative excellence for Kerala cadre All India Services officers.
              </p>
            </div>

            {/* RIGHT SIDE */}
            <div className="flex flex-col lg:items-end gap-3 sm:gap-4">
              {/* OWNERSHIP */}
              <div className="text-left lg:text-right">
                <p className="font-semibold text-sm">Owned By</p>
                <p className="text-indigo-100/80 text-xs sm:text-sm">
                  General Administration Department (AIS),<br />
                  Government of Kerala.
                </p>
              </div>

              {/* CDIPD + DUK */}
              <div className="flex items-center gap-3 lg:justify-end">
                <div className="text-left lg:text-right text-xs sm:text-sm leading-tight text-indigo-100/80">
                  <p className="font-semibold text-white">
                    Designed &amp; Developed by CDIPD
                  </p>
                  <p className="text-indigo-100/75">
                    Digital University Kerala
                  </p>
                </div>
                <div className="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center rounded-lg p-1 bg-white/10 backdrop-blur-sm border border-white/20">
                  <div className="relative w-full h-full">
                    <Image
                      src="/duk_logo_white.png"
                      alt="Digital University Kerala"
                      fill
                      className="object-contain"
                      sizes="(max-width: 640px) 48px, 64px"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* BOTTOM ROW */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-indigo-700">
            <p className="text-xs text-indigo-100/75 text-center sm:text-left">
              © 2025 KARMASRI Portal, Government of Kerala.
            </p>

                {/* -------------------HIDDEN---------------- */}
            <div className="flex gap-3 sm:gap-4 text-xs text-indigo-100/85 hidden">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Accessibility</a>
            </div>
          </div>
        </div>
      </footer>

{/* ==================== EVENTS MODAL (Optimized for AIS Officers) ==================== */}
  {/* ------------------------HIDDEN--------------------------- */}
<AnimatePresence>
  {showEventsModal && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-2 bg-black/50 backdrop-blur-sm hidden"
    >
      <motion.div
        ref={modalRef}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.2, type: "tween" }}
        className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl border border-indigo-200 dark:border-indigo-800"
      >
        {/* Modal Header - Ultra Compact */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-indigo-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 p-3 border-b border-indigo-200 dark:border-indigo-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-indigo-600 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 dark:text-white text-sm">
                  AIS Important Dates
                </h2>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Kerala Cadre Officers • {currentDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-2 py-1 rounded text-xs font-medium transition-all ${viewMode === 'calendar' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
              >
                Month
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-2 py-1 rounded text-xs font-medium transition-all ${viewMode === 'list' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
              >
                List
              </button>
              <motion.button
                onClick={() => setShowEventsModal(false)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-7 h-7 rounded-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 flex items-center justify-center"
              >
                <X className="w-3 h-3 text-gray-700 dark:text-gray-300" />
              </motion.button>
            </div>
          </div>

          {/* Quick Filter Bar */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-7 pr-3 py-1.5 rounded-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400"
              />
            </div>
            <select
              value={filterMonth || ""}
              onChange={(e) => setFilterMonth(e.target.value || null)}
              className="px-2 py-1.5 rounded-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400 text-xs min-w-[100px]"
            >
              <option value="">All Months</option>
              {uniqueMonths.map(month => (
                <option key={month} value={month}>{month.substring(0, 3)}</option>
              ))}
            </select>
            {(searchTerm || filterMonth) && (
              <button
                onClick={() => { setSearchTerm(""); setFilterMonth(null); }}
                className="px-2 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Modal Content - Space Optimized */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          {viewMode === 'calendar' ? (
            // CALENDAR VIEW - Month Cards
            <div className="p-3">
              {Object.entries(
                filteredEvents.reduce((acc, event) => {
                  if (!acc[event.month]) {
                    acc[event.month] = [];
                  }
                  acc[event.month].push(event);
                  return acc;
                }, {} as Record<string, typeof announcements>)
              )
              .sort(([monthA], [monthB]) => getMonthNumber(monthA) - getMonthNumber(monthB))
              .map(([month, events]) => {
                const monthNum = getMonthNumber(month);
                const isCurrentMonth = monthNum === currentMonth;
                const eventsThisMonth = events.sort((a, b) => a.day - b.day);
                
                return (
                  <div key={month} className="mb-4 last:mb-0">
                    {/* Month Header - Compact */}
                    <div className={`sticky top-0 z-5 flex items-center justify-between mb-2 p-2 rounded-lg ${
                      isCurrentMonth 
                        ? 'bg-gradient-to-r from-indigo-100 to-indigo-100 dark:from-indigo-900/40 dark:to-indigo-900/40 border border-indigo-300 dark:border-indigo-700' 
                        : 'bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700'
                    }`}>
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded flex items-center justify-center ${
                          isCurrentMonth 
                            ? 'bg-indigo-600 text-white' 
                            : 'bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}>
                          <span className="text-xs font-bold">{month.substring(0, 1)}</span>
                        </div>
                        <h3 className={`font-bold text-sm ${
                          isCurrentMonth 
                            ? 'text-indigo-700 dark:text-indigo-300' 
                            : 'text-gray-800 dark:text-gray-300'
                        }`}>
                          {month}
                        </h3>
                        {isCurrentMonth && (
                          <span className="px-1.5 py-0.5 bg-indigo-600 text-white text-[10px] rounded-full">
                            CURRENT
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {events.length} event{events.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    
                    {/* Events Grid - Dense Layout */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {eventsThisMonth.map((event) => {
                        const eventDate = new Date(currentDate.getFullYear(), monthNum - 1, event.day);
                        const isUpcoming = eventDate >= currentDate;
                        const isToday = eventDate.getDate() === currentDate.getDate() && monthNum === currentMonth;
                        
                        return (
                          <div
                            key={event.id}
                            className={`group relative p-2 rounded-lg border transition-all duration-150 cursor-pointer hover:shadow-sm ${
                              isToday
                                ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-300 dark:border-green-700'
                                : isCurrentMonth && isUpcoming
                                ? 'bg-gradient-to-r from-indigo-50 to-indigo-50 dark:from-indigo-900/20 dark:to-indigo-900/20 border-indigo-200 dark:border-indigo-800'
                                : isUpcoming
                                ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                                : 'bg-gray-50/50 dark:bg-gray-800/30 border-gray-150 dark:border-gray-700'
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              {/* Date Badge - Compact */}
                              <div className={`flex-shrink-0 w-10 h-10 rounded flex flex-col items-center justify-center ${
                                isToday
                                  ? 'bg-gradient-to-br from-green-500 to-emerald-500 text-white'
                                  : isCurrentMonth && isUpcoming
                                  ? 'bg-gradient-to-br from-indigo-500 to-indigo-500 text-white'
                                  : isUpcoming
                                  ? 'bg-gradient-to-br from-indigo-400 to-indigo-400 text-white'
                                  : 'bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                              }`}>
                                <div className="text-sm font-bold leading-none">{event.day}</div>
                                <div className="text-[9px] leading-none mt-0.5 opacity-90">
                                  {event.month.substring(0, 3)}
                                </div>
                              </div>
                              
                              {/* Event Details - Tight */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between mb-0.5">
                                  <h4 className={`font-semibold text-xs line-clamp-1 ${
                                    isToday
                                      ? 'text-green-800 dark:text-green-300'
                                      : isCurrentMonth && isUpcoming
                                      ? 'text-indigo-800 dark:text-indigo-300'
                                      : 'text-gray-900 dark:text-gray-300'
                                  }`}>
                                    {event.title}
                                  </h4>
                                  <span className="text-sm ml-1 flex-shrink-0">{event.icon}</span>
                                </div>
                                
                                <p className="text-[11px] text-gray-600 dark:text-gray-400 line-clamp-2 mb-1">
                                  {event.description}
                                </p>
                                
                                {/* Service Tags - Tiny */}
                                <div className="flex flex-wrap gap-1">
                                  {event.title.includes('IAS') || event.description.includes('IAS') || event.title.includes('Civil Service') ? (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/30 text-[10px] font-medium text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-700">
                                      IAS
                                    </span>
                                  ) : null}
                                  {event.title.includes('IPS') || event.description.includes('IPS') || event.title.includes('Police') ? (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/30 text-[10px] font-medium text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-700">
                                      IPS
                                    </span>
                                  ) : null}
                                  {event.title.includes('IFS') || event.description.includes('IFS') || event.title.includes('Forest') ? (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-[10px] font-medium text-green-700 dark:text-green-400 border border-green-200 dark:border-green-700">
                                      IFS
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                            
                            {/* Today Indicator */}
                            {isToday && (
                              <div className="absolute top-1 right-1">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // LIST VIEW - Ultra Compact Timeline
            <div className="p-3">
              {filteredEvents.length > 0 ? (
                <div className="space-y-1.5">
                  {filteredEvents.map((event, index) => {
                    const monthNum = getMonthNumber(event.month);
                    const eventDate = new Date(currentDate.getFullYear(), monthNum - 1, event.day);
                    const isUpcoming = eventDate >= currentDate;
                    const isCurrentMonth = monthNum === currentMonth;
                    const isToday = eventDate.getDate() === currentDate.getDate() && monthNum === currentMonth;
                    
                    return (
                      <div
                        key={event.id}
                        className={`group flex items-center gap-2 p-2 rounded-lg border transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                          isToday
                            ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-700'
                            : isCurrentMonth && isUpcoming
                            ? 'bg-gradient-to-r from-indigo-50/50 to-indigo-50/50 dark:from-indigo-900/10 dark:to-indigo-900/10 border-indigo-150 dark:border-indigo-800'
                            : 'border-gray-150 dark:border-gray-700'
                        }`}
                      >
                        {/* Date Column - Minimal */}
                        <div className={`flex-shrink-0 w-9 h-9 rounded flex flex-col items-center justify-center ${
                          isToday
                            ? 'bg-gradient-to-br from-green-500 to-emerald-500'
                            : isCurrentMonth && isUpcoming
                            ? 'bg-gradient-to-br from-indigo-500 to-indigo-500'
                            : isUpcoming
                            ? 'bg-gradient-to-br from-indigo-400 to-indigo-400'
                            : 'bg-gray-300 dark:bg-gray-700'
                        } text-white`}>
                          <div className="text-xs font-bold leading-none">{event.day}</div>
                          <div className="text-[9px] leading-none mt-0.5 opacity-90">
                            {event.month.substring(0, 3)}
                          </div>
                        </div>
                        
                        {/* Content - Tight */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <h4 className={`font-semibold text-xs truncate ${
                              isToday
                                ? 'text-green-800 dark:text-green-300'
                                : isCurrentMonth && isUpcoming
                                ? 'text-indigo-800 dark:text-indigo-300'
                                : 'text-gray-900 dark:text-gray-300'
                            }`}>
                              {event.title}
                            </h4>
                            <span className="text-sm ml-1 flex-shrink-0">{event.icon}</span>
                          </div>
                          
                          <p className="text-[11px] text-gray-600 dark:text-gray-400 truncate">
                            {event.description}
                          </p>
                          
                          {/* Status & Service Indicators */}
                          <div className="flex items-center gap-1.5 mt-1">
                            {isToday && (
                              <span className="inline-flex items-center px-1 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-[10px] font-medium text-green-700 dark:text-green-400">
                                Today
                              </span>
                            )}
                            {isCurrentMonth && isUpcoming && !isToday && (
                              <span className="inline-flex items-center px-1 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-[10px] font-medium text-indigo-700 dark:text-indigo-400">
                                This Month
                              </span>
                            )}
                            <span className="text-[10px] text-gray-500 dark:text-gray-500">
                              •
                            </span>
                            {event.title.includes('IAS') || event.description.includes('IAS') ? (
                              <span className="text-[10px] font-medium text-indigo-600 dark:text-indigo-400">
                                IAS
                              </span>
                            ) : null}
                            {event.title.includes('IPS') || event.description.includes('IPS') ? (
                              <span className="text-[10px] font-medium text-indigo-600 dark:text-indigo-400">
                                IPS
                              </span>
                            ) : null}
                            {event.title.includes('IFS') || event.description.includes('IFS') ? (
                              <span className="text-[10px] font-medium text-green-600 dark:text-green-400">
                                IFS
                              </span>
                            ) : null}
                          </div>
                        </div>
                        
                        {/* Quick Status Icon */}
                        {isUpcoming ? (
                          <Clock className="w-3 h-3 text-indigo-500 dark:text-indigo-400 flex-shrink-0" />
                        ) : (
                          <CheckCircle className="w-3 h-3 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-10 h-10 mx-auto text-gray-400 dark:text-gray-500 mb-2" />
                  <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">
                    No events found
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    Adjust your search or clear filters
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer - Minimal */}
        <div className="sticky bottom-0 border-t border-indigo-200 dark:border-indigo-800 bg-white dark:bg-gray-900 p-2">
          <div className="flex items-center justify-between text-xs">
            <div className="text-gray-600 dark:text-gray-400">
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">{filteredEvents.length}</span> events
              {filterMonth && (
                <span className="ml-1">• Filter: <span className="font-medium">{filterMonth}</span></span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                <span className="text-gray-600 dark:text-gray-400">Current</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-gray-600 dark:text-gray-400">Today</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
    )}
  </AnimatePresence>
      </div>
    );
  };

export default HomePage;