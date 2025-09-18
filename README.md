# AFPets - Landing/Tienda Headless

Una landing page moderna y tienda e-commerce para AFPets, funcionando como frontend headless conectado a WordPress + WooCommerce.

## Características

- 🎯 Landing page optimizada para conversión
- 🛒 Tienda e-commerce completa
- 📱 Diseño 100% responsive
- 🔗 Integración headless con WordPress/WooCommerce
- 🎨 Diseño moderno y confiable
- ⚡ Rendimiento optimizado con Vite + React

## Tecnologías

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Backend**: WordPress + WooCommerce (headless)
- **Deployment**: Compatible con Vercel, Netlify, etc.

## Instalación y Desarrollo

1. **Clonar e instalar dependencias**:
```bash
npm install
```

2. **Configurar variables de entorno**:
```bash
cp .env.example .env.local
```
Editar `.env.local` con las URLs y credenciales de tu WordPress.

3. **Desarrollo local**:
```bash
npm run dev
```

4. **Build para producción**:
```bash
npm run build
```

## Estructura del Proyecto

```
src/
├── components/        # Componentes organizados por módulos
│   ├── ui/           # Componentes de interfaz reutilizables
│   ├── layout/       # Componentes de layout (Header, Footer, etc.)
│   ├── auth/         # Componentes de autenticación
│   ├── companies/    # Módulo de gestión de comercios
│   ├── qr/           # Módulo de gestión de QRs
│   ├── pets/         # Módulo de gestión de mascotas
│   ├── admin/        # Componentes de administración
│   ├── dashboard/    # Componentes de dashboard
│   └── forms/        # Componentes de formularios reutilizables
├── pages/            # Páginas principales
├── hooks/            # Custom React hooks organizados por módulo
├── services/         # Integración con APIs
├── types/            # Definiciones TypeScript
└── utils/            # Utilidades y helpers
```

## Rutas

- `/` - Landing principal
- `/tienda` - Catálogo de productos
- `/producto/:slug` - Detalle de producto
- `/carrito` - Carrito de compras
- `/checkout` - Proceso de compra
- `/mi-cuenta` - Cuenta del usuario
- `/whatsapp` - Redirección a WhatsApp
- `/roadmap` - Hoja de ruta del producto

## Deploy

El sitio puede desplegarse en cualquier provider que soporte sitios estáticos (Vercel, Netlify, etc.).

### Despliegue con Docker

El proyecto incluye un Dockerfile para facilitar el despliegue en entornos containerizados:

```bash
# Construir la imagen
docker build -t afpets-frontend .

# Ejecutar el contenedor
docker run -p 80:80 afpets-frontend
```

### Despliegue en Easypanel

1. En Easypanel, crea un nuevo servicio
2. Selecciona la opción de despliegue desde GitHub
3. Proporciona la URL del repositorio: `https://github.com/afpets-ar/upets-bolt`
4. Selecciona la opción de Dockerfile cuando aparezca en la pantalla de configuración
5. Configura las variables de entorno necesarias (ver `.env.example`)
6. Inicia el despliegue

Ver `INTEGRACION_WORDPRESS.md` para configurar la conexión con WordPress.