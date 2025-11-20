# Imagen base oficial de Node.js
FROM node:22

# Crear y establecer el directorio de trabajo
WORKDIR /app

# Copiar archivos de configuración
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el resto del código
COPY . .

# Exponer el puerto
EXPOSE 3000

# Comando para iniciar el servidor
CMD ["npm", "start"]