# JandoChat Frontend

Aplicación cliente de JandoChat - interfaz de usuario moderna para chat en tiempo real.

## 🌐 Servidor

El frontend se conecta a: **https://jandochat-backend.onrender.com**

## 🚀 Características

- **Chat en tiempo real**: Socket.io
- **Estados/Historias**: Crear, ver y eliminar historias (texto, imagen, video)
- **Editor de video**: Cortar videos a 20 segundos para historias
- **Publicaciones**: Posts con multimedia, reacciones y comentarios
- **Reacciones**: 8 tipos de reacciones personalizables
- **Navegación con teclado**: Flechas y Escape en historias y galería de imágenes
- **Sonidos de notificación**: Personalizables por el usuario
- **Diseño responsive**: Mobile-first con Tailwind CSS

## 🛠️ Tech Stack

- React 19 + React Router
- Tailwind CSS
- Socket.io-client
- Axios
- Lucide React (íconos)
- React Toastify

## 📂 Estructura

```
jandochat_frontend/
├── public/
│   ├── sounds/           # Archivos de sonido para notificaciones
│   └── assets/           # Imágenes estáticas
└── src/
    ├── api/              # Configuración API
    ├── components/       # Componentes UI
    │   ├── Chat/        # Componentes de chat
    │   ├── Usuarios/    # Componentes de posts/perfil
    │   ├── perfil/      # Página de perfil
    │   └── UI/          # Componentes genéricos
    ├── context/          # Contextos React (Auth, Notificaciones, Modal)
    ├── hooks/           # Hooks personalizados
    ├── socket/          # Configuración Socket.io
    └── utils/           # Utilidades (sonidos, etc.)
```

## ⚙️ Configuración

El archivo `.env` debe tener:

```env
REACT_APP_API_BACKEND=http://localhost:8000
```

## 🚀 Ejecución

```bash
# Instalar dependencias
npm install

# Desarrollo
npm start

# Producción
npm run build
```

## ⌨️ Atajos de teclado

### Historias
- `Escape` - Cerrar visor
- `Flecha izquierda/arriba` - Historia anterior
- `Flecha derecha/abajo` - Siguiente historia

### Galería de publicaciones
- `Escape` - Cerrar modal
- `Flechas` - Cambiar imagen

## 🎨 Funcionalidades

### Historias
- Texto, imagen o video
- Videos mayores a 20s se pueden cortar con el editor integrado
- Eliminación de propias historias
- Ver quién vio cada historia

### Publicaciones
- Multimedia (imágenes, videos)
- 8 tipos de reacciones
- Comentarios y respuestas
- Compartir/repost
- Modal de pantalla completa para imágenes

### Notificaciones
- Sonidos personalizables
- Configuración en perfil del usuario

## 📱 Diseño

- Diseño móvil primero
- Tema rojo/white con Tailwind CSS
- Animaciones suaves
- Tipografía custom (font-black uppercase)

## 🖥️ CLI de Terminal

También puedes usar JANDOCHAT desde la terminal con nuestro CLI oficial.

Ver documentación completa en: **[CLI](../CLI/README.md)**

## 📞 Video Llamadas
