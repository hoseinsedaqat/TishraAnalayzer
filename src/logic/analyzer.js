export const siteAnalyzerLogic = () => {
  let score = 100;
  const issues = [];

  // ۱. اطلاعات پایه و متاتگ‌ها
  const pageTitle = document.title || "No Title Found";
  const metaDesc = document.querySelector('meta[name="description"]')?.content || "";
  const isHttps = window.location.protocol === 'https:';
  const imgCount = document.querySelectorAll('img').length;
  const links = document.querySelectorAll('a').length;

  // ۲. تحلیل محتوا و کلمات کلیدی
  const allText = document.body.innerText || "";
  const words = allText.trim().split(/\s+/).filter(w => w.length > 3);
  const readTime = Math.ceil(words.length / 200);

  // ۳. استخراج ۵ کلمه برتر
  const wordFreq = {};
  words.slice(0, 1000).forEach(w => {
    const word = w.toLowerCase();
    wordFreq[word] = (wordFreq[word] || 0) + 1;
  });
  const topKeywords = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5).map(item => item[0]);

  // ۴. بررسی هدرهای امنیتی (ویژگی متمایز جدید)
  // نکته: بررسی هدرهای واقعی از سمت کلاینت محدودیت دارد، 
  // اما ما وجود تگ‌های امنیتی معادل را چک می‌کنیم
  const hasCSP = !!document.querySelector('meta[http-equiv="Content-Security-Policy"]');
  const h1Count = document.querySelectorAll('h1').length;

  // حجم
  const htmlContent = document.documentElement.innerHTML;
  const pageSizeKB = Math.round(htmlContent.length / 1024);

  // ۵. منطق امتیازدهی و راهکارهای هوشمند (Smart Solutions)
  if (!isHttps) { 
    score -= 25; 
    issues.push({ id: 1, msg: "No HTTPS", impact: "high", solution: "Install an SSL certificate via Cloudflare or your host." }); 
  }
  if (h1Count !== 1) { 
    score -= 15; 
    issues.push({ id: 2, msg: "H1 Tag Issue", impact: "medium", solution: "Ensure each page has exactly one <h1> tag for SEO hierarchy." }); 
  }
  if (metaDesc.length < 50) { 
    score -= 10; 
    issues.push({ id: 3, msg: "Short Meta Description", impact: "medium", solution: "Write a description between 150-160 characters." }); 
  }
  if (!hasCSP) {
    issues.push({ id: 4, msg: "Security Header Missing", impact: "low", solution: "Add Content-Security-Policy to protect against XSS." });
  }
  if (pageSizeKB > 200) {
    score -= 5;
    issues.push({ msg: "Perf: Large HTML size", impact: "low", solution: "Optimize your code and remove unnecessary scripts." });
  }

  return {
    score: Math.max(5, score),
    issues,
    details: {
      pageTitle, metaDesc, isHttps, imgCount, links,
      readTime, topKeywords, h1Count, hasCSP,
      pageSize: pageSizeKB,
      loadTime: window.performance.timing.domContentLoadedEventEnd - window.performance.timing.navigationStart,
    }
  };
};