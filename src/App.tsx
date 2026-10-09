import { HashRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { Header } from "@/components/Header";
import Clientes from "@/pages/Clientes";
import ClienteDetalhe from "@/pages/ClienteDetalhe";
import Relatorio from "@/pages/Relatorio";

function Layout() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="px-4 py-6 md:px-8 md:py-8">
        <Outlet />
      </main>
    </div>
  );
}

// HashRouter: funciona em qualquer hospedagem estática sem configuração extra.
export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/clientes/:id" element={<ClienteDetalhe />} />
        </Route>
        <Route path="/clientes/:id/relatorio" element={<Relatorio />} />
        <Route path="*" element={<Navigate to="/clientes" replace />} />
      </Routes>
    </HashRouter>
  );
}
