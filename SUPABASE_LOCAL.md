# Configuración de Supabase Local/Cloud

Este proyecto está configurado para trabajar tanto con Supabase cloud como con una instancia local de Supabase.

## Alternar entre Supabase Local y Cloud

Para cambiar entre los entornos local y cloud, simplemente modifica la variable de entorno `VITE_USE_LOCAL_SUPABASE` en tu archivo `.env.local`:

```
# true = usar Supabase local, false = usar Supabase cloud
VITE_USE_LOCAL_SUPABASE=true
```

## Configuración de Supabase Local

### Requisitos previos
1. Docker Desktop instalado y en ejecución
2. Supabase CLI instalado (`npm install -g supabase`)

### Iniciar Supabase Local

```bash
# Iniciar Supabase local
supabase start
```

Esto iniciará todos los servicios de Supabase en contenedores Docker y mostrará las URLs y credenciales necesarias.

### Detener Supabase Local

```bash
# Detener Supabase local
supabase stop
```

## Migraciones entre Local y Cloud

### Exportar esquema de Cloud a Local

```bash
# Obtener el esquema actual de la base de datos cloud
supabase db dump -f schema.sql --db-url "postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres"

# Aplicar el esquema a la instancia local
supabase db reset
```

### Crear y aplicar migraciones

Las migraciones se almacenan en la carpeta `supabase/migrations` del proyecto.

```bash
# Crear una nueva migración
supabase migration new nombre_de_la_migracion

# Aplicar migraciones a la instancia local
supabase migration up

# Aplicar migraciones a la instancia cloud
supabase db push --db-url "postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres"

# Listar migraciones existentes
supabase migration list
```

## Solución de problemas

- Si encuentras errores de conexión con Supabase local, asegúrate de que Docker Desktop esté en ejecución.
- Para problemas con las migraciones, revisa los logs con `supabase logs`.
- Si necesitas reiniciar completamente la instancia local: `supabase db reset`.