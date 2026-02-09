import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Camera, 
  History, 
  Settings, 
  Share2, 
  Copy, 
  Image as ImageIcon, 
  Trash2, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle,
  X,
  Palette,
  Bell,
  Wifi,
  Lock,
  Globe,
  Type,
  User,
  Phone,
  Mail
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import jsQR from 'jsqr';

// --- Types ---
interface ScanRecord {
  id: string;
  data: string;
  type: string;
  timestamp: number;
}

interface AppSettings {
  primaryColor: string;
  glowEnabled: boolean;
  theme: 'dark' | 'light' | 'auto';
}

// --- Constants ---
const TG_CHANNEL_URL = "https://t.me/cvh48";
const APP_NAME = "Glow Scanner";

const COLORS = [
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Rose', value: '#f43f5e' },
  { name: 'Amber', value: '#f59e0b' },
];

// --- Utility Functions ---
const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    return false;
  }
};

const formatDate = (ts: number) => {
  return new Intl.DateTimeFormat('ar-EG', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(ts));
};

// --- Smart Result Analyzer Component ---
const SmartResult = ({ data, onCopy, primaryColor }: { data: string, onCopy: (txt: string, msg: string) => void, primaryColor: string }) => {
  // WiFi Detection
  if (data.startsWith('WIFI:')) {
    const ssid = data.match(/S:([^;]+);/)?.[1] || "غير معروف";
    const password = data.match(/P:([^;]+);/)?.[1] || "";
    const encryption = data.match(/T:([^;]+);/)?.[1] || "WPA";

    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 p-4 glass rounded-2xl border border-white/10" style={{ borderRight: `4px solid ${primaryColor}` }}>
          <Wifi style={{ color: primaryColor }} size={20} />
          <div className="flex-1">
            <p className="text-xs text-slate-400">اسم الشبكة (SSID)</p>
            <p className="font-bold text-lg">{ssid}</p>
          </div>
          <button onClick={() => onCopy(ssid, "تم نسخ اسم الشبكة")} className="p-2 hover:bg-white/10 rounded-lg">
            <Copy size={16} />
          </button>
        </div>

        {password && (
          <div className="flex items-center gap-3 p-4 glass rounded-2xl border border-white/10" style={{ borderRight: `4px solid #10b981` }}>
            <Lock className="text-emerald-400" size={20} />
            <div className="flex-1">
              <p className="text-xs text-slate-400">كلمة السر</p>
              <p className="font-mono font-bold text-lg">{password}</p>
            </div>
            <button onClick={() => onCopy(password, "تم نسخ كلمة السر")} className="p-2 hover:bg-white/10 rounded-lg">
              <Copy size={16} />
            </button>
          </div>
        )}

        <div className="flex items-center gap-3 p-4 glass rounded-2xl border border-white/5">
          <Settings className="text-slate-400" size={20} />
          <div className="flex-1">
            <p className="text-xs text-slate-400">نوع التشفير</p>
            <p className="font-semibold">{encryption}</p>
          </div>
        </div>
      </div>
    );
  }

  // URL Detection
  if (data.startsWith('http')) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 p-5 glass rounded-2xl border border-white/10" style={{ borderRight: `4px solid ${primaryColor}` }}>
          <Globe style={{ color: primaryColor }} size={24} />
          <div className="flex-1 overflow-hidden">
            <p className="text-xs text-slate-400">رابط موقع إلكتروني</p>
            <p className="font-semibold truncate" style={{ color: primaryColor }}>{data}</p>
          </div>
        </div>
      </div>
    );
  }

  // Default Text
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-3 p-5 glass rounded-2xl border border-white/10">
        <Type className="text-slate-400 mt-1" size={24} />
        <div className="flex-1">
          <p className="text-xs text-slate-400 mb-1">المحتوى</p>
          <p className="font-medium leading-relaxed">{data}</p>
        </div>
      </div>
    </div>
  );
};

// --- Core UI Components ---

const Button = ({ children, onClick, className = "", variant = "primary", glow = true }: any) => {
  const base = "px-6 py-3 rounded-2xl font-semibold transition-all duration-300 active:scale-95 flex items-center justify-center gap-2";
  const variants: any = {
    primary: "bg-app-primary hover:opacity-90 text-white",
    secondary: "glass text-white border border-white/20 hover:bg-white/10",
    danger: "bg-rose-600/20 text-rose-400 border border-rose-500/30 hover:bg-rose-600/30",
  };

  return (
    <button 
      onClick={onClick} 
      className={`${base} ${variants[variant]} ${glow && variant === 'primary' ? 'glow-primary' : ''} ${className}`}
    >
      {children}
    </button>
  );
};

const Modal = ({ isOpen, onClose, title, children }: any) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-lg glass p-6 rounded-3xl shadow-2xl border border-white/10"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white glow-text">{title}</h3>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors">
              <X size={24} className="text-white/60" />
            </button>
          </div>
          {children}
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

const App = () => {
  const [activeTab, setActiveTab] = useState<'scan' | 'history' | 'settings'>('scan');
  const [history, setHistory] = useState<ScanRecord[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    primaryColor: '#a855f7', // تم التغيير إلى اللون البنفسجي كافتراضي
    glowEnabled: true,
    theme: 'dark'
  });
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const requestRef = useRef<number>();

  // Initialize
  useEffect(() => {
    const savedHistory = localStorage.getItem('scan_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));

    const savedSettings = localStorage.getItem('app_settings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      setSettings(parsed);
      updateAppTheme(parsed.primaryColor);
    } else {
      // إذا لم يكن هناك إعدادات محفوظة، نستخدم البنفسجي كافتراضي
      updateAppTheme('#a855f7');
    }

    const hasSeenWelcome = localStorage.getItem('seen_welcome');
    if (!hasSeenWelcome) {
      setShowWelcome(true);
      localStorage.setItem('seen_welcome', 'true');
    }
  }, []);

  // Save History
  useEffect(() => {
    localStorage.setItem('scan_history', JSON.stringify(history));
  }, [history]);

  // Handle color change in DOM
  const updateAppTheme = (color: string) => {
    document.documentElement.style.setProperty('--primary-color', color);
    // Create a glow color with opacity
    const glowColor = color + '80'; // adds 50% opacity in hex
    document.documentElement.style.setProperty('--primary-glow', glowColor);
  };

  useEffect(() => {
    localStorage.setItem('app_settings', JSON.stringify(settings));
    updateAppTheme(settings.primaryColor);
  }, [settings]);

  // Toast handler
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Camera Logic
  const startCamera = async () => {
    setIsScanning(true);
    setScanResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        requestRef.current = requestAnimationFrame(scanFrame);
      }
    } catch (err: any) {
      console.error(err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        showToast("يرجى منح صلاحية الكاميرا للمتابعة", "error");
      } else {
        showToast("عذراً، فشل الوصول للكاميرا", "error");
      }
      setIsScanning(false);
    }
  };

  const stopCamera = () => {
    setIsScanning(false);
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
  };

  const scanFrame = () => {
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.height = videoRef.current.videoHeight;
          canvas.width = videoRef.current.videoWidth;
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          });

          if (code) {
            handleScanSuccess(code.data);
            return;
          }
        }
      }
    }
    requestRef.current = requestAnimationFrame(scanFrame);
  };

  const handleScanSuccess = (data: string) => {
    stopCamera();
    setScanResult(data);
    const newRecord: ScanRecord = {
      id: Math.random().toString(36).substr(2, 9),
      data: data,
      type: data.startsWith('WIFI:') ? 'واي فاي' : data.startsWith('http') ? 'رابط' : 'نص',
      timestamp: Date.now()
    };
    setHistory(prev => [newRecord, ...prev]);
    showToast("تم المسح بنجاح!");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code) {
            handleScanSuccess(code.data);
          } else {
            showToast("لم يتم العثور على باركود في الصورة", "error");
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const deleteHistoryItem = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
    showToast("تم حذف السجل");
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0f172a] text-slate-100 pb-24 transition-colors duration-300">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 20 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3 glass border ${toast.type === 'success' ? 'border-emerald-500/30' : 'border-rose-500/30'}`}
          >
            {toast.type === 'success' ? <CheckCircle2 className="text-emerald-400" /> : <AlertCircle className="text-rose-400" />}
            <span className="font-semibold text-white">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="p-6 pt-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-app-primary rounded-2xl flex items-center justify-center glow-primary text-white transition-all duration-300">
            <Camera size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight glow-text">{APP_NAME}</h1>
            <p className="text-slate-400 text-xs mt-0.5">الماسح الذكي والأنيق</p>
          </div>
        </div>
        <button 
          onClick={() => setActiveTab('settings')}
          className="w-12 h-12 glass rounded-2xl flex items-center justify-center hover:bg-white/10 transition-all border border-white/10"
        >
          <Settings size={22} className="text-slate-300" />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-6 mt-4">
        {activeTab === 'scan' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-6"
          >
            {!isScanning && !scanResult && (
              <div className="flex flex-col items-center justify-center gap-8 py-20 glass rounded-[2.5rem] border border-white/10">
                <div className="relative">
                  <div className="absolute inset-0 blur-[60px] opacity-20 animate-pulse bg-app-primary"></div>
                  <div className="relative w-32 h-32 glass rounded-[2.5rem] flex items-center justify-center border border-white/20">
                    <Camera size={64} className="text-app-primary transition-colors duration-300" />
                  </div>
                </div>
                <div className="text-center px-6">
                  <h2 className="text-2xl font-bold mb-2">ابدأ المسح الآن</h2>
                  <p className="text-slate-400 max-w-[280px]">قم بتوجيه الكاميرا نحو الباركود أو اختر صورة من جهازك</p>
                </div>
                <div className="flex flex-col w-full px-8 gap-4">
                  <Button onClick={startCamera} className="w-full h-16 text-lg">
                    <Camera size={24} />
                    فتح الكاميرا
                  </Button>
                  <Button 
                    variant="secondary" 
                    className="w-full h-16 text-lg"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <ImageIcon size={24} />
                    اختيار من الاستوديو
                  </Button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleFileUpload}
                  />
                </div>
              </div>
            )}

            {isScanning && (
              <div className="relative aspect-square w-full glass rounded-[2.5rem] overflow-hidden border border-white/20 shadow-2xl">
                <video ref={videoRef} className="w-full h-full object-cover" playsInline />
                <canvas ref={canvasRef} className="hidden" />
                <div className="absolute inset-0 pointer-events-none border-[3px] border-white/10 m-12 rounded-3xl">
                  {/* Scanner Borders */}
                  <div className="absolute -top-1 -left-1 w-8 h-8 border-t-[6px] border-l-[6px] rounded-tl-xl border-app-primary"></div>
                  <div className="absolute -top-1 -right-1 w-8 h-8 border-t-[6px] border-r-[6px] rounded-tr-xl border-app-primary"></div>
                  <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-[6px] border-l-[6px] rounded-bl-xl border-app-primary"></div>
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-[6px] border-r-[6px] rounded-br-xl border-app-primary"></div>
                  
                  <motion.div 
                    animate={{ y: [0, 200, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="absolute top-0 left-0 right-0 h-[2px] blur-[2px] bg-app-primary"
                  />
                </div>
                <div className="absolute bottom-8 left-0 right-0 flex justify-center">
                   <Button variant="danger" onClick={stopCamera} className="rounded-full px-8">
                     إلغاء المسح
                   </Button>
                </div>
              </div>
            )}

            {scanResult && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass rounded-[2.5rem] p-8 border border-white/20 flex flex-col gap-6 mb-10"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-emerald-500/20 rounded-2xl flex items-center justify-center border border-emerald-500/30">
                    <CheckCircle2 size={30} className="text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl">تحليل النتيجة</h3>
                    <p className="text-slate-400 text-sm">{formatDate(Date.now())}</p>
                  </div>
                </div>

                <SmartResult 
                  data={scanResult} 
                  primaryColor={settings.primaryColor}
                  onCopy={(text, msg) => {
                    copyToClipboard(text);
                    showToast(msg);
                  }}
                />

                <div className="grid grid-cols-2 gap-4 mt-2">
                  <Button 
                    className="w-full" 
                    onClick={() => {
                      copyToClipboard(scanResult);
                      showToast("تم نسخ المحتوى بالكامل");
                    }}
                  >
                    <Copy size={20} />
                    نسخ الكل
                  </Button>
                  {scanResult.startsWith('http') && (
                    <Button 
                      variant="secondary" 
                      className="w-full"
                      onClick={() => window.open(scanResult, '_blank')}
                    >
                      <ExternalLink size={20} />
                      فتح الرابط
                    </Button>
                  )}
                  {scanResult.startsWith('WIFI:') && (
                    <Button 
                      variant="secondary" 
                      className="w-full"
                      onClick={() => showToast("يرجى الاتصال يدوياً باستخدام كلمة السر", "success")}
                    >
                      <Wifi size={20} />
                      اتصال
                    </Button>
                  )}
                  <Button 
                    variant="secondary" 
                    className="w-full col-span-2"
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({ title: 'نتائج المسح من Glow Scanner', text: scanResult });
                      } else {
                        showToast("المشاركة غير مدعومة في متصفحك", "error");
                      }
                    }}
                  >
                    <Share2 size={20} />
                    مشاركة النتيجة
                  </Button>
                </div>

                <Button variant="danger" onClick={() => setScanResult(null)} className="w-full">
                  مسح جديد
                </Button>
              </motion.div>
            )}
          </motion.div>
        )}

        {activeTab === 'history' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col gap-4"
          >
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold">سجل المسح</h2>
              <button 
                onClick={() => {
                  if (confirm('هل أنت متأكد من مسح جميع السجلات؟')) {
                    setHistory([]);
                    showToast("تم مسح السجل بالكامل");
                  }
                }}
                className="text-rose-400 text-sm flex items-center gap-1 p-2"
              >
                <Trash2 size={16} />
                مسح الكل
              </button>
            </div>

            {history.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center gap-4 text-slate-500 glass rounded-[2.5rem] border border-white/5">
                <History size={64} strokeWidth={1} />
                <p>لا يوجد سجلات حتى الآن</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {history.map((item) => (
                  <motion.div 
                    layout
                    key={item.id}
                    className="glass rounded-3xl p-5 border border-white/10 flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-4 overflow-hidden">
                      <div className="w-12 h-12 glass rounded-xl flex items-center justify-center flex-shrink-0 border border-white/10">
                        {item.type === 'رابط' ? <Globe size={20} className="text-app-primary" /> : item.type === 'واي فاي' ? <Wifi size={20} className="text-app-primary" /> : <Copy size={20} className="text-app-primary" />}
                      </div>
                      <div className="overflow-hidden">
                        <p className="font-semibold truncate text-slate-100">{item.data}</p>
                        <p className="text-xs text-slate-500 mt-1">{formatDate(item.timestamp)} • {item.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => {
                          setScanResult(item.data);
                          setActiveTab('scan');
                        }}
                        className="p-3 glass rounded-xl hover:bg-white/10 transition-colors"
                      >
                        <ExternalLink size={18} className="text-app-primary" />
                      </button>
                      <button 
                        onClick={() => deleteHistoryItem(item.id)}
                        className="p-3 glass rounded-xl hover:bg-rose-500/20 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'settings' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col gap-6"
          >
            <h2 className="text-2xl font-bold">الإعدادات</h2>
            
            <div className="glass rounded-[2rem] p-6 border border-white/10 flex flex-col gap-8">
              {/* Color Theme */}
              <div>
                <label className="text-sm text-slate-400 mb-4 block flex items-center gap-2">
                  <Palette size={16} /> لون التطبيق (Glow)
                </label>
                <div className="flex items-center gap-4 flex-wrap">
                  {COLORS.map(color => (
                    <button
                      key={color.value}
                      onClick={() => setSettings(prev => ({ ...prev, primaryColor: color.value }))}
                      className={`w-12 h-12 rounded-full border-4 transition-all ${settings.primaryColor === color.value ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-60'}`}
                      style={{ 
                        backgroundColor: color.value, 
                        boxShadow: settings.primaryColor === color.value ? `0 0 15px ${color.value}` : '' 
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Notification Toggles */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell size={20} className="text-app-primary transition-colors" />
                  <div>
                    <p className="font-semibold">تأثيرات التوهج (Glow)</p>
                    <p className="text-xs text-slate-500">تفعيل الإضاءة الزجاجية في الأزرار</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSettings(prev => ({ ...prev, glowEnabled: !prev.glowEnabled }))}
                  className={`w-14 h-8 rounded-full transition-colors relative ${settings.glowEnabled ? 'bg-app-primary' : 'bg-slate-700'}`}
                >
                  <motion.div 
                    animate={{ x: settings.glowEnabled ? 28 : 4 }}
                    className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg"
                  />
                </button>
              </div>

              {/* Support */}
              <div className="pt-4 border-t border-white/5">
                <Button 
                  variant="secondary" 
                  className="w-full py-4 border-white/10"
                  onClick={() => window.open(TG_CHANNEL_URL, '_blank')}
                >
                  <ExternalLink size={18} className="text-app-primary" />
                  انضم إلى قناة التيليجرام
                </Button>
              </div>
            </div>

            <div className="text-center text-slate-600 text-xs mt-4">
              <p>{APP_NAME} v1.2.0</p>
              <p>تصميم متجاوب بالكامل</p>
            </div>
          </motion.div>
        )}
      </main>

      {/* Welcome Modal */}
      <Modal 
        isOpen={showWelcome} 
        onClose={() => setShowWelcome(false)}
        title="مرحباً بك في Glow Scanner! 🌟"
      >
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="w-24 h-24 bg-app-primary rounded-[2rem] flex items-center justify-center glow-primary mb-2 text-white">
            <Camera size={48} />
          </div>
          <p className="text-slate-300 leading-relaxed">
            استمتع بتجربة مسح باركود احترافية مع تصميم زجاجي أنيق وسرعة فائقة.
            <br />
            لتجربة كاملة ومميزات إضافية، اشترك في قناة التطبيق الرسمية الآن:
          </p>
          <div className="w-full flex flex-col gap-3">
            <Button 
              className="w-full py-4"
              onClick={() => {
                window.open(TG_CHANNEL_URL, '_blank');
                setShowWelcome(false);
              }}
            >
              <ExternalLink size={20} />
              الاشتراك في قناة التيليجرام
            </Button>
            <Button 
              variant="secondary" 
              className="w-full"
              onClick={() => setShowWelcome(false)}
            >
              تخطي، سأقوم بذلك لاحقاً
            </Button>
          </div>
        </div>
      </Modal>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 h-24 glass border-t border-white/10 z-40 px-6 flex items-center justify-between pb-4">
        <NavButton 
          active={activeTab === 'history'} 
          onClick={() => setActiveTab('history')} 
          icon={<History size={24} />} 
          label="السجل" 
          primaryColor={settings.primaryColor}
        />
        <div className="relative -top-8">
          <button 
            onClick={() => {
              setActiveTab('scan');
              setScanResult(null);
              setIsScanning(false);
            }}
            className={`w-20 h-20 rounded-3xl flex items-center justify-center transition-all duration-500 shadow-2xl ${activeTab === 'scan' ? 'bg-app-primary glow-primary scale-110 text-white' : 'glass text-slate-400 border border-white/10'}`}
          >
            <Camera size={36} />
          </button>
        </div>
        <NavButton 
          active={activeTab === 'settings'} 
          onClick={() => setActiveTab('settings')} 
          icon={<Palette size={24} />} 
          label="المظهر" 
          primaryColor={settings.primaryColor}
        />
      </nav>
    </div>
  );
};

const NavButton = ({ active, onClick, icon, label, primaryColor }: any) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-1.5 transition-all duration-300`}
    style={{ color: active ? primaryColor : '#64748b' }}
  >
    <div className={`p-2 rounded-xl transition-all`} style={{ backgroundColor: active ? `${primaryColor}15` : 'transparent' }}>
      {icon}
    </div>
    <span className="text-[11px] font-bold uppercase tracking-wider">{label}</span>
  </button>
);

const root = createRoot(document.getElementById('root')!);
root.render(<App />);