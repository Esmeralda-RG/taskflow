# TaskFlow

Sistema de gestión de proyectos tipo Kanban desarrollado para ProTask Solutions.

## Tecnologías Principales
- **Frontend**: React 18 + Vite + TailwindCSS
- **Backend**: Node.js 20 + Express + Prisma
- **Base de Datos**: PostgreSQL 16
- **Contenedores**: Docker + Docker Compose
- **Autenticación**: JWT + bcrypt

## Requisitos
- Docker y Docker Compose instalados

## Instalación y Ejecución (Desarrollo)

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/TU_USUARIO/taskflow.git
   cd taskflow

2. **Configurar variables de entorno**
   ```bash
   cp .env.example .env

3. **Levantar el entorno completo**
   ```bash
   docker-compose up --build

4. **Acceder a la aplicación**
   - **Frontend**: http://localhost:5173
   - **Backend API**: http://localhost:3000
   - **Base de datos**: localhost:5432

## Comando útiles

   ```bash
   # Levantar en segundo plano
   docker-compose up -d --build

   # Ver logs
   docker-compose logs -f backend
   docker-compose logs -f frontend

   #Detener todo
   docker-compose down

   #Reconstruir todo 
   docker-compose up --build --force-recreate
   ```


## Estructura del proyecto 

   ```text
   taskflow/
   |--- backend/
   |--- frontend/
   |--- docs/
   |--- docker-compose.yml
   |--- .env.example
   |___ README.md
