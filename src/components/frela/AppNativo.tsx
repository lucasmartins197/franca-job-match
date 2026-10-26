import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { App as CapApp } from "@capacitor/app";
import { StatusBar, Style } from "@capacitor/status-bar";

/**
 * Ajustes quando roda dentro do app nativo (Capacitor). No navegador não faz nada.
 *  • Android: botão "voltar" do aparelho volta uma tela (e só sai do app na tela inicial).
 *  • Barra de status na cor da marca.
 */
const AppNativo = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    StatusBar.setStyle({ style: Style.Dark }).catch(() => undefined);
    if (Capacitor.getPlatform() === "android") {
      StatusBar.setBackgroundColor({ color: "#126f66" }).catch(() => undefined);
    }
    const sub = CapApp.addListener("backButton", ({ canGoBack }) => {
      const inicio = ["/", "/dashboard", "/auth"].includes(window.location.pathname);
      if (canGoBack && !inicio) navigate(-1);
      else CapApp.exitApp();
    });
    return () => {
      void sub.then((s) => s.remove());
    };
  }, [navigate]);

  return null;
};

export default AppNativo;
