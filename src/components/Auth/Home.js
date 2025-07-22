import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="flex h-screen bg-gradient-to-r from-red-600 via-pink-600 to-red-700 text-white">
      <div className="container mx-auto px-4 flex flex-col justify-center items-center text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold mb-10 drop-shadow-lg">
          Bienvenidos a <span className="text-yellow-300">JANDOCHAT</span>
        </h1>

        <div className="flex flex-col sm:flex-row gap-6">
          <Link
            to="/login"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out"
          >
            Iniciar Sesión
          </Link>

          <Link
            to="/register"
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out"
          >
            Registrarse
          </Link>
        </div>
      </div>
    </div>
  );
}
