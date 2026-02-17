/* global chrome */
import React, { useState, useEffect, useCallback, useRef } from "react";
import { siteAnalyzerLogic } from "./logic/analyzer";
import { useTranslation } from "./hooks/useTranslation";

// --- کامپوننت‌های کمکی (حفظ ظاهر نسخه ۲.۶) ---

const GooglePreview = ({ t, title, desc, url, lang }) => (
  <div className="space-y-2 group mt-4">
    <h3 className="text-[10px] font-black opacity-50 uppercase px-1 tracking-wider">
      {t.serpTitle}
    </h3>
    <div
      className="bg-white p-3 rounded-xl shadow-sm border border-gray-200 transition-all hover:border-primary/30"
      dir={lang === "fa" ? "rtl" : "ltr"}
    >
      <div className="flex items-center gap-2 mb-1 overflow-hidden">
        <div className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center text-[8px]">
          🌐
        </div>
        <span className="text-[10px] text-[#202124] truncate">
          {url || "example.com"}
        </span>
      </div>
      <div className="text-[#1a0dab] text-sm font-medium hover:underline cursor-pointer mb-1 line-clamp-1">
        {title || "No Title Found"}
      </div>
      <div className="text-[#4d5156] text-[11px] leading-snug line-clamp-2">
        {desc || "Please add a meta description to see the preview here..."}
      </div>
    </div>
  </div>
);

const TechnicalCard = ({ t, details, lang }) => (
  <div className="card bg-neutral text-neutral-content shadow-xl text-[11px]">
    <div className="card-body p-4 gap-2">
      <h3 className="font-bold border-b border-white/10 pb-2 text-primary uppercase">
        {t.reportTitle}
      </h3>

      {/* ردیف‌های اصلی نسخه ۲.۶ */}
      <div className="flex justify-between items-center opacity-80">
        <span>{t.readTime}</span>
        <span className="font-bold text-secondary">
          {details?.readTime} min
        </span>
      </div>

      {/* اضافه شدن دیتای نسخه ۲.۷ به استایل ۲.۶ */}
      <div className="flex justify-between items-center opacity-80">
        <span>{lang === "fa" ? "حجم صفحه:" : "Page Size:"}</span>
        <span className="font-bold text-accent">{details?.pageSize} KB</span>
      </div>

      <div className="flex justify-between items-center opacity-80">
        <span>{lang === "fa" ? "سرعت لود:" : "Load Speed:"}</span>
        <span className="font-bold text-accent font-mono">
          {details?.loadTime}ms
        </span>
      </div>
      
      {/* ردیف SSL - جایگزین Security Headers */}
      <div className="flex justify-between items-center opacity-80">
        <span>{lang === "fa" ? "گواهی SSL:" : "SSL Certificate:"}</span>
        <div className="flex items-center gap-1">
          <span
            className={`font-bold ${details?.isHttps ? "text-success" : "text-error"}`}
          >
            {details?.isHttps
              ? lang === "fa"
                ? "فعال"
                : "Secure"
              : lang === "fa"
                ? "نامنظم/غیرفعال"
                : "Insecure"}
          </span>
          <span>{details?.isHttps ? "🔒" : "⚠️"}</span>
        </div>
      </div>

      <div className="mt-2 border-t border-white/5 pt-2">
        <div className="flex flex-wrap gap-1">
          {details?.topKeywords?.map((k, i) => (
            <span
              key={i}
              className="bg-white/10 px-1.5 py-0.5 rounded text-[9px]"
            >
              {k}
            </span>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// --- کامپوننت اصلی ---

function App() {
  const { t, lang, toggleLang } = useTranslation();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUrl, setCurrentUrl] = useState("");
  const hasInitialScanRun = useRef(false);

  const performAnalysis = useCallback(async () => {
    setError(null);
    setLoading(true);

    if (typeof chrome === "undefined" || !chrome.tabs) {
      setTimeout(() => {
        setResult({
          score: 85,
          issues: [
            {
              id: 1,
              msg: "Meta Title too long",
              impact: "medium",
              solution: "Shorten title.",
            },
          ],
          details: {
            pageTitle: "Test Page",
            metaDesc: "Sample desc",
            isHttps: true,
            readTime: 3,
            topKeywords: ["web", "seo"],
            hasCSP: false,
            pageSize: 45,
            loadTime: 400,
          },
        });
        setLoading(false);
      }, 800);
      return;
    }

    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (tab?.url) setCurrentUrl(tab.url);
      chrome.scripting.executeScript(
        { target: { tabId: tab.id }, func: siteAnalyzerLogic },
        (results) => {
          if (results?.[0]?.result) setResult(results[0].result);
          setLoading(false);
        },
      );
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }, [lang]);

  useEffect(() => {
    if (!hasInitialScanRun.current) {
      const timer = setTimeout(() => {
        performAnalysis();
        hasInitialScanRun.current = true;
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [performAnalysis]);

  return (
    <div
      className="w-96 p-4 bg-base-100 font-sans min-h-[600px] mb-2"
      dir={t.dir}
    >
      <header className="flex justify-between items-center mb-6 border-b pb-3 border-base-300">
        <div className="flex flex-col">
          <h1 className="text-xl font-black italic text-primary tracking-tighter leading-none">
            Tishra Analayzer
          </h1>
        </div>
        <button
          onClick={toggleLang}
          className="btn btn-xs btn-outline btn-secondary rounded-full font-mono"
        >
          {t.langName}
        </button>
      </header>

      {loading ? (
        <div className="flex flex-col items-center py-20 gap-4">
          <span className="loading loading-infinity loading-lg text-primary"></span>
        </div>
      ) : (
        result && (
          <main className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col items-center py-6 bg-base-200 rounded-[2rem] shadow-inner border border-base-300/30">
              <div
                className={`radial-progress ${result.score > 70 ? "text-success" : "text-warning"}`}
                style={{
                  "--value": result.score,
                  "--size": "8rem",
                  "--thickness": "8px",
                }}
              >
                <span className="text-3xl font-black text-base-content">
                  {result.score}
                </span>
              </div>
            </div>

            <GooglePreview
              t={t}
              title={result.details?.pageTitle}
              desc={result.details?.metaDesc}
              url={currentUrl}
              lang={lang}
            />
            <TechnicalCard t={t} details={result.details} lang={lang} />

            <div className="space-y-2">
              <h3 className="text-[10px] font-black opacity-50 uppercase px-1 tracking-wider">
                {t.issuesTitle}
              </h3>
              {result.issues.map((issue, idx) => (
                <div
                  key={idx}
                  className="collapse collapse-arrow bg-base-200 rounded-xl border-l-4 border-error shadow-sm"
                >
                  <input type="radio" name="issues-accordion" />
                  <div className="collapse-title text-[11px] font-bold flex items-center gap-2 pr-10">
                    <span className="w-1.5 h-1.5 bg-error rounded-full shrink-0"></span>{" "}
                    {issue.msg}
                  </div>
                  <div className="collapse-content text-[10px] opacity-80 border-t border-base-300/50 pt-3">
                    <p className="font-black text-primary mb-1 uppercase tracking-tighter">
                      💡 Solution:
                    </p>
                    <p className="leading-relaxed">{issue.solution}</p>
                  </div>
                </div>
              ))}
            </div>

            <button
              className="btn btn-primary btn-block rounded-2xl font-black shadow-lg"
              onClick={performAnalysis}
            >
              {t.scanBtn}
            </button>
          </main>
        )
      )}
    </div>
  );
}

export default App;
