import LogoKnowBloom from "./LogoKnowBloom.jsx";

const KnowBloomLoader = () => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
      background: "#0a0f1b",
    }}
  >
    <LogoKnowBloom size={56} />
    <span
      style={{
        color: "#fff",
        fontWeight: "bold",
        fontSize: 32,
        marginLeft: 18,
        letterSpacing: 2,
      }}
    >
      KnowBloom
    </span>
  </div>
);

export default KnowBloomLoader;
