const LogoKnowBloom = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <circle
      cx="32"
      cy="32"
      r="28"
      stroke="#fff"
      strokeWidth="4"
      opacity="0.25"
    />
    <path
      d="M32 4
        a28 28 0 0 1 0 56"
      stroke="#fff"
      strokeWidth="4"
      strokeLinecap="round"
      style={{ animation: "spin 1.2s linear infinite" }}
    />
    <rect x="20" y="28" width="6" height="16" rx="2" fill="#fff" />
    <rect x="29" y="20" width="6" height="24" rx="2" fill="#fff" />
    <rect x="38" y="34" width="6" height="10" rx="2" fill="#fff" />
    <style>{`
      @keyframes spin {
        100% { transform: rotate(360deg); transform-origin: 32px 32px; }
      }
    `}</style>
  </svg>
);

export default LogoKnowBloom;
