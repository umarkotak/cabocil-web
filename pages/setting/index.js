import { useEffect, useState, useCallback } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

// Mock Utils for demo - replace with your actual Utils import
const Utils = {
  GetRandomNumber: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
};

// Configuration keys
const QUIZ_CONFIG_KEYS = {
  QUIZ_ENABLE: "CABOCIL:QUIZ:ENABLE",
  SHOW_ANSWER: "CABOCIL:QUIZ:SHOW_ANSWER",
  ALLOW_DISMISS: "CABOCIL:QUIZ:ALLOW_DISMISS",
  CHANGE_QUESTION_ON_WRONG: "CABOCIL:QUIZ:CHANGE_QUESTION_ON_WRONG"
};

const GENERAL_CONFIG_KEYS = {
  DARK_MODE: "CABOCIL:GENERAL:DARK_MODE",
  NOTIFICATIONS: "CABOCIL:GENERAL:NOTIFICATIONS",
  AUTO_SAVE: "CABOCIL:GENERAL:AUTO_SAVE",
  SOUND_EFFECTS: "CABOCIL:GENERAL:SOUND_EFFECTS"
};

// Quiz settings configuration
const QUIZ_SETTINGS = [
  {
    key: QUIZ_CONFIG_KEYS.QUIZ_ENABLE,
    label: "Aktifkan quiz?",
    description: "Mengaktifkan atau menonaktifkan fitur quiz"
  },
  {
    key: QUIZ_CONFIG_KEYS.SHOW_ANSWER,
    label: "Tampilkan jawaban setelah diklik 2x?",
    description: "Menampilkan jawaban setelah pengguna salah dua kali"
  },
  {
    key: QUIZ_CONFIG_KEYS.ALLOW_DISMISS,
    label: "Tampilkan tombol tutup quiz?",
    description: "Memungkinkan pengguna untuk menutup quiz"
  },
  {
    key: QUIZ_CONFIG_KEYS.CHANGE_QUESTION_ON_WRONG,
    label: "Ganti soal quiz ketika salah jawab 2x?",
    description: "Mengganti pertanyaan ketika pengguna salah dua kali"
  }
];

// General settings configuration
const GENERAL_SETTINGS = [
  {
    key: GENERAL_CONFIG_KEYS.DARK_MODE,
    label: "Mode gelap",
    description: "Mengaktifkan tampilan mode gelap untuk aplikasi"
  },
  {
    key: GENERAL_CONFIG_KEYS.NOTIFICATIONS,
    label: "Notifikasi",
    description: "Menerima notifikasi dari aplikasi"
  },
  {
    key: GENERAL_CONFIG_KEYS.AUTO_SAVE,
    label: "Simpan otomatis",
    description: "Menyimpan progress secara otomatis"
  },
  {
    key: GENERAL_CONFIG_KEYS.SOUND_EFFECTS,
    label: "Efek suara",
    description: "Memainkan efek suara saat interaksi"
  }
];

// Tab configuration
const TABS = [
  {
    id: "quiz",
    label: "Quiz",
    icon: "❓",
    settings: QUIZ_SETTINGS
  },
  {
    id: "general",
    label: "Umum",
    icon: "⚙️",
    settings: GENERAL_SETTINGS
  }
];

// Custom hook for in-memory config management (localStorage alternative)
function useConfigState() {
  const [config, setConfig] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadConfig = () => {
      const newConfig = {};
      const allKeys = { ...QUIZ_CONFIG_KEYS, ...GENERAL_CONFIG_KEYS };
      Object.values(allKeys).forEach(key => {
        newConfig[key] = "on"; // Default value
      });
      setConfig(newConfig);
      setIsLoading(false);
    };

    loadConfig();
  }, []);

  const updateConfig = useCallback((key, value) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  return { config, updateConfig, isLoading };
}

// Setting Item Component with Switch
function SettingItem({ setting, value, onChange, disabled }) {
  const isOn = value === "on";

  const handleSwitchChange = (checked) => {
    onChange(checked ? "on" : "off");
  };

  return (
    <div className="flex items-center justify-between py-3 px-1">
      <div className="flex-1 min-w-0 pr-3">
        <Label
          htmlFor={setting.key}
          className="text-sm sm:text-base font-medium leading-tight block cursor-pointer"
        >
          {setting.label}
        </Label>
        <p className="text-xs sm:text-sm mt-1 leading-tight">
          {setting.description}
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-xs hidden sm:inline">
          {isOn ? "On" : "Off"}
        </span>
        <Switch
          id={setting.key}
          checked={isOn}
          onCheckedChange={handleSwitchChange}
          disabled={disabled}
          className="scale-90 sm:scale-100"
        />
      </div>
    </div>
  );
}

// Tab Button Component
function TabButton({ tab, isActive, onClick }) {
  return (
    <button
      onClick={() => onClick(tab.id)}
      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${isActive
          ? "bg-blue-100 text-blue-700 border border-blue-200 shadow-sm"
          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 border border-transparent"
        }`}
    >
      <span className="text-base">{tab.icon}</span>
      <span className="hidden sm:inline">{tab.label}</span>
    </button>
  );
}

// Compact Math Challenge Component
function MathChallenge({ onUnlock }) {
  const [val1, setVal1] = useState(0);
  const [val2, setVal2] = useState(0);
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    generateNewProblem();
  }, []);

  const generateNewProblem = useCallback(() => {
    setVal1(Utils.GetRandomNumber(1, 10));
    setVal2(Utils.GetRandomNumber(1, 10));
    setAnswer("");
    setError("");
  }, []);

  const handleSubmit = useCallback(async (e) => {
    if (e) e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const correctAnswer = val1 + val2;
      const userAnswer = parseInt(answer, 10);

      if (isNaN(userAnswer)) {
        setError("Harap masukkan angka yang valid");
        return;
      }

      if (userAnswer === correctAnswer) {
        onUnlock();
      } else {
        setError("Jawaban salah. Coba lagi!");
        generateNewProblem();
      }
    } catch (err) {
      setError("Terjadi kesalahan. Coba lagi!");
    } finally {
      setIsLoading(false);
    }
  }, [val1, val2, answer, onUnlock, generateNewProblem]);

  return (
    <div className="border border-blue-200 rounded-lg p-4 mb-4">
      <h2 className="text-lg sm:text-xl font-semibold mb-2 text-blue-800">
        🔐 Verifikasi Akses
      </h2>
      <p className="text-sm text-blue-700 mb-4">
        Selesaikan perhitungan untuk mengakses pengaturan:
      </p>

      <div className="space-y-3">
        <div className="flex items-center justify-center gap-2 text-lg font-mono rounded-lg p-3 border">
          <span className="px-2 py-1 rounded text-center min-w-[2rem]">
            {val1}
          </span>
          <span>+</span>
          <span className="px-2 py-1 rounded text-center min-w-[2rem]">
            {val2}
          </span>
          <span>=</span>
          <input
            type="number"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSubmit(e);
              }
            }}
            className="w-16 px-2 py-1 border rounded-md text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="?"
            disabled={isLoading}
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={isLoading || !answer.trim()}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
        >
          {isLoading ? "⏳ Memproses..." : "🔓 Buka Pengaturan"}
        </button>

        {error && (
          <div className="text-sm text-red-700 bg-red-50 px-3 py-2 rounded border border-red-200 text-center">
            ❌ {error}
          </div>
        )}
      </div>
    </div>
  );
}

// Settings Content Component
function SettingsContent({ activeTab, config, onConfigChange, isUnlocked }) {
  const currentTab = TABS.find(tab => tab.id === activeTab);

  if (!currentTab) return null;

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <h2 className="text-lg sm:text-xl font-semibold mb-1 flex items-center gap-2">
          <span>{currentTab.icon}</span>
          <span className="hidden sm:inline">Pengaturan</span> {currentTab.label}
        </h2>
        <p className="text-xs sm:text-sm">
          {activeTab === 'quiz'
            ? "Kelola konfigurasi quiz dan fitur-fitur terkait"
            : "Kelola pengaturan umum aplikasi"
          }
        </p>
      </div>

      <div className="divide-y divide-gray-100">
        {currentTab.settings.map((setting) => (
          <SettingItem
            key={setting.key}
            setting={setting}
            value={config[setting.key] || "on"}
            onChange={(value) => onConfigChange(setting.key, value)}
            disabled={!isUnlocked}
          />
        ))}
      </div>
    </div>
  );
}

// Main Settings Component
export default function Settings() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [activeTab, setActiveTab] = useState("quiz");
  const { config, updateConfig, isLoading } = useConfigState();

  const handleUnlock = useCallback(() => {
    setIsUnlocked(true);
  }, []);

  const handleConfigChange = useCallback((key, value) => {
    updateConfig(key, value);
  }, [updateConfig]);

  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
  }, []);

  if (isLoading) {
    return (
      <div className="p-4 max-w-4xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-2/3"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 max-w-4xl mx-auto min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl sm:text-3xl font-bold mb-2 flex items-center gap-2">
          <span className="text-lg sm:text-2xl">⚙️</span>
          <span className="hidden sm:inline">Pengaturan Aplikasi</span>
          <span className="sm:hidden">Pengaturan</span>
        </h1>
        <p className="text-xs sm:text-sm">
          Kelola semua pengaturan dan konfigurasi aplikasi
        </p>
      </div>

      {/* Math Challenge */}
      {!isUnlocked && <MathChallenge onUnlock={handleUnlock} />}

      {/* Main Content */}
      <div className={`transition-all duration-300 ${!isUnlocked ? "opacity-50 pointer-events-none" : "opacity-100"
        }`}>

        {/* Mobile Tabs - Horizontal scroll */}
        <div className="mb-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {TABS.map((tab) => (
              <TabButton
                key={tab.id}
                tab={tab}
                isActive={activeTab === tab.id}
                onClick={handleTabChange}
              />
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="border border-gray-200 rounded-lg p-4 sm:p-6 shadow-sm">
          <SettingsContent
            activeTab={activeTab}
            config={config}
            onConfigChange={handleConfigChange}
            isUnlocked={isUnlocked}
          />
        </div>

        {/* Success Status */}
        {isUnlocked && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse flex-shrink-0"></div>
              <span className="text-green-700 text-xs sm:text-sm font-medium">
                ✅ Pengaturan siap digunakan
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}