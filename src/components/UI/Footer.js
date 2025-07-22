import React from "react";

export default function Footer() {
  return (
    <footer className="bg-gray-100 border-t text-sm text-gray-600 py-4 text-center mt-auto">
      © {new Date().getFullYear()} JANDOCHAT. Todos los derechos reservados.
    </footer>
  );
}
