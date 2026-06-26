-- Crear la base de datos
CREATE DATABASE TicketsSACMAG;
GO

-- Verificar que se creó
SELECT name FROM SYS.DATABASES WHERE name = 'TicketsSACMAG';
GO

USE TicketsSACMAG;

-- Crear usuario para Login de la BD
CREATE LOGIN UsuarioTicketDesarrollo WITH PASSWORD = 'Rev$1597!';

-- Darle acceso a la base de datos
USE TicketsSACMAG;
CREATE USER UsuarioTicketDesarrollo FOR LOGIN UsuarioTicketDesarrollo;
ALTER ROLE db_owner ADD MEMBER UsuarioTicketDesarrollo;

-- Departamentos (áreas)
CREATE TABLE Departamentos (
    ID_Departamentos BIGINT IDENTITY(1,1) PRIMARY KEY,
    Nombre VARCHAR(100) NOT NULL UNIQUE,
    Descripcion VARCHAR(255) NULL,
    Activo BIT NOT NULL DEFAULT 1
);

-- Datos iniciales
INSERT INTO Departamentos (Nombre) VALUES ('Desarrollo (Contabilidad)'), ('Recursos Humanos'), ('Administración'), ('Soporte TI'), ('Dirección');

CREATE TABLE Usuarios (
    ID_Usuario BIGINT IDENTITY(1,1) PRIMARY KEY,
    NombreUsuario NVARCHAR(100) NOT NULL,
    CorreoUsuario NVARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    ROL VARCHAR(20)  NOT NULL DEFAULT 'EMPLEADO', -- EMPLEADO, ADMIN, SOPORTE
    DepartamentoID BIGINT NULL,
    Activo BIT NOT NULL DEFAULT 1,
    FechaCreacion DATETIME2 DEFAULT SYSDATETIME(),
	FOREIGN KEY (DepartamentoID) REFERENCES Departamentos(ID_Departamentos)
);

CREATE TABLE Tickets (
    ID_Ticket BIGINT IDENTITY(1,1) PRIMARY KEY,
    Folio VARCHAR(20)  NOT NULL UNIQUE,
    Aplicacion NVARCHAR(100) NOT NULL,
    Prioridad VARCHAR(20)  NOT NULL, -- BAJA, MEDIA, ALTA, CRITICA
    EstadoTicket VARCHAR(20)  NOT NULL DEFAULT 'ABIERTO', -- ABIERTO, EN_PROCESO, RESUELTO, CERRADO
    ProblemaDetectado NVARCHAR(2000) NOT NULL, 
    RutaImagen VARCHAR(500) NULL,
	RutaImagenSolucion VARCHAR(500),
    UsuarioID BIGINT NOT NULL, -- quien reportó
    AsignadoID BIGINT NULL, -- quien lo atiende (soporte/admin)
    FechaCreacion DATETIME2 DEFAULT SYSDATETIME(),
    FechaActualizacion DATETIME2 NULL,
    FechaCierre DATETIME2 NULL,
    FOREIGN KEY (UsuarioID) REFERENCES Usuarios(ID_Usuario),
    FOREIGN KEY (AsignadoID) REFERENCES Usuarios(ID_Usuario)
);

CREATE TABLE ComentariosTickets (
    ID_ComentariosTickets BIGINT IDENTITY(1,1) PRIMARY KEY,
    TicketID BIGINT NOT NULL,
    UsuarioID BIGINT NOT NULL,
    Comentario NVARCHAR(2000) NOT NULL,
	TipoComentario VARCHAR(20) NOT NULL DEFAULT 'SEGUIMIENTO',
	RutaImagen VARCHAR(500) NULL,
    Fecha DATETIME2 DEFAULT SYSDATETIME(),
    FOREIGN KEY (TicketID)  REFERENCES Tickets(ID_Ticket),
    FOREIGN KEY (UsuarioID) REFERENCES Usuarios(ID_Usuario)
);

CREATE TABLE HistorialTickets (
    ID_HistorialTickets BIGINT IDENTITY(1,1) PRIMARY KEY,
    TicketID BIGINT NOT NULL,
    UsuarioID BIGINT NOT NULL,
    Campo VARCHAR(50)  NOT NULL,
    ValorAnterior VARCHAR(100) NULL,
    ValorNuevo VARCHAR(100) NULL,
    Fecha DATETIME2 DEFAULT SYSDATETIME(),
    FOREIGN KEY (TicketID)  REFERENCES Tickets(ID_Ticket),
    FOREIGN KEY (UsuarioID) REFERENCES Usuarios(ID_Usuario)
);

-- Catálogo dinámico (ESCALABLE)
CREATE TABLE AplicacionesSACMAG (
    ID_AplicacionesSACMAG BIGINT IDENTITY(1,1) PRIMARY KEY,
    Nombre NVARCHAR(100) NOT NULL UNIQUE,
    Descripcion NVARCHAR(255) NULL,
    Activa BIT NOT NULL DEFAULT 1,
    FechaCreacion DATETIME2 DEFAULT SYSDATETIME()
);

-- Aplicaciones iniciales para Catálogo
INSERT INTO AplicacionesSACMAG (Nombre) VALUES ('Proveedores'), ('Nómina'), ('Auxiliares'), ('Captura'), ('Acumulados'), ('Costos'), ('Libro V'), ('Clientes Avances');
INSERT INTO AplicacionesSACMAG (Nombre) VALUES ('Sistema Tickets (PRUEBA)');

-- Índices para consultas frecuentes
CREATE INDEX IX_Tickets_UsuarioID  ON Tickets(UsuarioID);
CREATE INDEX IX_Tickets_Estado     ON Tickets(EstadoTicket);
CREATE INDEX IX_Comentarios_Ticket ON ComentariosTickets(TicketID);
CREATE INDEX IX_Historial_Ticket   ON HistorialTickets(TicketID);

-- Debe aparecer 0 para continuar con la implementación de la BD
SELECT name, is_disabled FROM sys.sql_logins WHERE name = 'UsuarioTicketDesarrollo';

SELECT * FROM Usuarios;
SELECT * FROM Tickets;
SELECT * FROM ComentariosTickets;