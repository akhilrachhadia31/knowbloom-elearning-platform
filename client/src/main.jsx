import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./App.jsx";
import { Provider } from "react-redux";
import { appStore } from "./app/store";
import { Toaster } from "react-hot-toast";
import { useLoadUserQuery } from "./features/api/authApi";
import LoadingSpinner from "./components/LoadingSpinner";
import { ThemeProvider } from "./components/ThemeProvider";
import { UserContext } from "./context/UserContext";
import Logo from "./components/Logo";
import LoadingScreen from "./loadingscreen";


const GOOGLE_CLIENT_ID =
  "93973601927-1oac2m22301vqafe54qkck61l9h19l9j.apps.googleusercontent.com";

const Custom = ({ children }) => {
  const { isLoading, data } = useLoadUserQuery();
  return (
    <>
      {isLoading ? (
        <LoadingScreen />
      ) : (
        <UserContext.Provider value={{ user: data?.user }}>
          {children}
        </UserContext.Provider>
      )}
    </>
  );
};

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <Provider store={appStore}>
          <Custom>
            <App />
            <Toaster />
          </Custom>
        </Provider>
      </GoogleOAuthProvider>
    </ThemeProvider>
  </StrictMode>
);
