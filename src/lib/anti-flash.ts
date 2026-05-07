export const antiFlashScript = `
(function () {
  try {
    var theme = localStorage.getItem('victa-theme');
    if (theme === 'dark' || (theme !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  } catch (e) {}
})();
`;
