FROM node:18-alpine

# Instalar dependencias de compilación requeridas por sqlite3 en Alpine
RUN apk add --no-cache python3 make g++ sqlite

# Configurar el directorio de trabajo
WORKDIR /app

# Copiar package.json del backend e instalar dependencias
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm install --production

# Volver a /app y copiar el código fuente
WORKDIR /app
# Copiamos todo el backend
COPY backend/ ./backend/
# Copiamos todo el frontend (incluyendo la carpeta 'dist' ya compilada)
COPY frontend/ ./frontend/

# Exponer el puerto donde corre el backend
EXPOSE 5000

# Iniciar la aplicación
WORKDIR /app/backend
CMD ["node", "index.js"]
