-- ============================================================
-- TrazaSinie · esquema de base de datos (PostgreSQL)
-- Multi-tenant: cada fila lleva tenant_id y todas las consultas
-- filtran por el tenant del token (nunca solo por lógica de la app)
-- Se puede ejecutar varias veces: solo crea lo que falta.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Empresas (organizaciones) que usan la aplicación
CREATE TABLE IF NOT EXISTS tenants (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        VARCHAR(60)  NOT NULL UNIQUE, -- identificador para iniciar sesión
  name        VARCHAR(120) NOT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Usuarios: empleados de una empresa (siempre pertenecen a exactamente una)
CREATE TABLE IF NOT EXISTS users (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email               VARCHAR(255) NOT NULL,
  password_hash       VARCHAR(255) NOT NULL,
  role                VARCHAR(20)  NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  reset_token         VARCHAR(64),
  reset_token_expira  TIMESTAMP,
  created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, email)  -- el mismo email puede existir en empresas distintas
);

-- Partes de accidente
CREATE TABLE IF NOT EXISTS submissions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES users(id) ON DELETE SET NULL,  -- empleado que lo registra (si se borra el usuario, el parte se conserva)
  -- Paso 1: dónde y cuándo
  lugar           VARCHAR(200) NOT NULL,
  hora_accidente  VARCHAR(20)  NOT NULL,
  -- Paso 3: croquis
  croquis         JSONB,  -- modelo de la escena: { ancho, alto, elementos: [...] }
  croquis_png     TEXT,   -- imagen PNG (data URL) generada al guardar
  created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Paso 2: conductores implicados (A, B, C, D), como en el parte amistoso.
-- La letra enlaza cada conductor con su vehículo en el croquis.
CREATE TABLE IF NOT EXISTS conductores (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id  UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  tenant_id      UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  letra          CHAR(1)      NOT NULL CHECK (letra IN ('A', 'B', 'C', 'D')),
  nombre         VARCHAR(150) NOT NULL,
  apellidos      VARCHAR(150) NOT NULL,
  matricula      VARCHAR(15)  NOT NULL,
  vehiculo       VARCHAR(20)  NOT NULL CHECK (vehiculo IN ('coche', 'moto', 'camion', 'furgoneta')),
  aseguradora    VARCHAR(120),
  UNIQUE (submission_id, letra)
);

-- Índices para que las consultas filtradas por empresa sean rápidas
CREATE INDEX IF NOT EXISTS idx_users_tenant         ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_submissions_tenant   ON submissions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_submissions_user     ON submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_conductores_parte    ON conductores(submission_id);
CREATE INDEX IF NOT EXISTS idx_conductores_tenant   ON conductores(tenant_id);

-- ------------------------------------------------------------
-- Heridos, daños, testigos y descripción (como en el parte amistoso)
-- Con ADD COLUMN IF NOT EXISTS una base de datos ya creada se
-- actualiza sin perder datos al ejecutar de nuevo: npm run db:crear
-- ------------------------------------------------------------
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS heridos                BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS num_heridos            SMALLINT CHECK (num_heridos BETWEEN 1 AND 99);
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS heridos_detalle        VARCHAR(500);
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS danos_terceros         BOOLEAN NOT NULL DEFAULT FALSE;  -- daños a bienes distintos de los vehículos A-D
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS danos_terceros_detalle VARCHAR(500);
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS testigos               VARCHAR(500);
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS descripcion            VARCHAR(2000);                   -- qué ocurrió, en palabras

ALTER TABLE conductores ADD COLUMN IF NOT EXISTS danos VARCHAR(300);  -- daños visibles del vehículo

-- ------------------------------------------------------------
-- Estado del parte e historial de cambios (auditoría)
-- ------------------------------------------------------------
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS estado VARCHAR(20) NOT NULL DEFAULT 'abierto'
  CHECK (estado IN ('abierto', 'en_revision', 'cerrado'));
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;

-- Cada alta, edición o cambio de estado queda registrado: quién, cuándo y qué cambió.
-- No se borra al editar: es el rastro de auditoría del parte.
CREATE TABLE IF NOT EXISTS parte_historial (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id  UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  tenant_id      UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id        UUID REFERENCES users(id) ON DELETE SET NULL,  -- si se borra el usuario, el registro se conserva
  user_email     VARCHAR(255) NOT NULL,                         -- copia del email para que siga legible
  accion         VARCHAR(20) NOT NULL CHECK (accion IN ('creado', 'editado', 'estado')),
  cambios        JSONB NOT NULL DEFAULT '[]',                   -- [{ campo, antes, despues }]
  created_at     TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_historial_parte ON parte_historial(submission_id, created_at);

-- ------------------------------------------------------------
-- Al borrar un usuario, sus partes se conservan (antes se borraban en cascada).
-- Para bases de datos ya creadas: se quita el NOT NULL y se cambia la clave
-- foránea a ON DELETE SET NULL. El autor sigue visible gracias al historial.
-- ------------------------------------------------------------
ALTER TABLE submissions ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE submissions DROP CONSTRAINT IF EXISTS submissions_user_id_fkey;
ALTER TABLE submissions ADD CONSTRAINT submissions_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
